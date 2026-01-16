const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requireLAN, rateLimit, auditLog } = require('../middleware/security');
const { extractMetadata, isVideoFile } = require('../utils/fileUtils');

const router = express.Router();
const execPromise = util.promisify(exec);

// Convert video to MP4 with H.264 codec for maximum compatibility
async function convertToMP4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎬 Starting universal MP4 conversion`);
    console.log(`📁 Input: ${path.basename(inputPath)}`);
    console.log(`📁 Output: ${path.basename(outputPath)}`);
    console.log(`🌐 Target: All devices (iPhone, Android, Smart TVs, browsers)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Add progress flag to ffmpeg command
    // Video and audio settings for MAXIMUM UNIVERSAL COMPATIBILITY:
    // Video:
    // - H.264 baseline profile (most compatible, works on ALL devices)
    // - Level 3.0 (supports up to 720p, works on old devices, Smart TVs)
    // - yuv420p pixel format (required for web/mobile compatibility)
    // - CRF 21 for good quality on large TV screens
    // Audio:
    // - AAC codec with 48kHz sample rate (universal standard)
    // - Stereo audio (2 channels)
    // - 192k bitrate for good quality
    // - movflags +faststart for fast web streaming
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -preset medium -crf 21 -c:a aac -strict experimental -ar 48000 -ac 2 -b:a 192k -movflags +faststart -progress pipe:1 "${outputPath}" -y`;

    const ffmpegProcess = exec(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 1800000 // 30 minute timeout
    });

    let lastProgress = '';
    let duration = 0;
    let currentTime = 0;

    // Parse ffmpeg progress output
    ffmpegProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // Extract duration (total video length)
      const durationMatch = output.match(/duration=(\d+)/);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]);
      }

      // Extract current time (progress)
      const timeMatch = output.match(/out_time_ms=(\d+)/);
      if (timeMatch) {
        currentTime = parseInt(timeMatch[1]) / 1000000; // Convert microseconds to seconds

        if (duration > 0) {
          const percent = Math.min(100, Math.round((currentTime / duration) * 100));
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

          // Only log every 10% to avoid spam
          if (percent % 10 === 0 && lastProgress !== `${percent}`) {
            lastProgress = `${percent}`;
            console.log(`⏳ Converting... ${percent}% complete (${elapsed}s elapsed)`);
          }
        }
      }
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();

      // Extract duration from stderr if not found in stdout
      if (!duration) {
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
          console.log(`📊 Video duration: ${hours}h ${minutes}m ${seconds}s`);
        }
      }
    });

    ffmpegProcess.on('close', (code) => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code === 0) {
        console.log(`\n✅ Conversion complete in ${totalTime}s`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        resolve(true);
      } else {
        console.error(`\n❌ Conversion failed with code ${code} after ${totalTime}s`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', (error) => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n❌ Conversion error after ${totalTime}s:`, error.message);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      reject(error);
    });
  });
}

// Check if ffmpeg is installed
async function checkFFmpeg() {
  try {
    await execPromise('ffmpeg -version');
    return true;
  } catch (error) {
    console.error('FFmpeg not found. Please install ffmpeg for video conversion.');
    return false;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../storage/videos');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/avi',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm',
  'video/x-m4v'
];

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240') // 10GB default
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    if (!isVideoFile(file.originalname)) {
      return cb(new Error('Only video files are allowed'));
    }

    // Check MIME type
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid video file type'));
    }

    cb(null, true);
  }
});

// Upload video (admin only, LAN only, rate limited)
router.post(
  '/upload',
  authenticate,
  requireAdmin,
  requireLAN,
  rateLimit({ max: 10, windowMs: 60 * 60 * 1000 }), // 10 uploads per hour
  auditLog('video_upload', 'media'),
  upload.single('video'),
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, type, year, description, genres, season, episode, seriesId, seriesTitle } = req.body;

    // Auto-extract metadata from filename if not provided
    const metadata = extractMetadata(req.file.originalname);

    let finalSeriesId = seriesId;
    let finalType = type || (metadata.season ? 'episode' : 'movie');
    let episodeTitle = title || metadata.title;

    // If this is an episode, handle series creation/lookup
    if (finalType === 'episode' && !finalSeriesId) {
      const showTitle = seriesTitle || episodeTitle; // Use seriesTitle if provided, otherwise use episode title

      // Check if series already exists
      const existingSeries = db.prepare(`
        SELECT id FROM media
        WHERE title = ? AND type = 'series'
        LIMIT 1
      `).get(showTitle);

      if (existingSeries) {
        finalSeriesId = existingSeries.id;
      } else {
        // Create new series entry
        const seriesResult = db.prepare(`
          INSERT INTO media (
            title, type, year, description, genres,
            file_path, uploaded_by
          ) VALUES (?, 'series', ?, ?, ?, 'series-placeholder', ?)
        `).run(
          showTitle,
          year || metadata.year,
          description || null,
          genres || null,
          req.user.id
        );
        finalSeriesId = seriesResult.lastInsertRowid;
      }

      // For episodes, keep the full title (e.g., "Breaking Bad S01E01")
      // Series title is already stored in the series entry
    }

    // Auto-convert to MP4 if not already MP4
    let finalFilename = req.file.filename;
    const fileExt = path.extname(req.file.filename).toLowerCase();

    if (fileExt !== '.mp4' && fileExt !== '.m4v') {
      const hasFFmpeg = await checkFFmpeg();

      if (hasFFmpeg) {
        try {
          const inputPath = path.join(__dirname, '../../storage/videos', req.file.filename);
          const outputFilename = req.file.filename.replace(/\.[^/.]+$/, '.mp4');
          const outputPath = path.join(__dirname, '../../storage/videos', outputFilename);

          // Convert to MP4
          await convertToMP4(inputPath, outputPath);

          // Delete original file after successful conversion
          fs.unlinkSync(inputPath);

          finalFilename = outputFilename;
          console.log(`Video converted and saved as: ${finalFilename}`);
        } catch (conversionError) {
          console.error('Conversion failed, using original file:', conversionError);
          // If conversion fails, use original file
        }
      } else {
        console.warn('FFmpeg not installed, using original file format');
      }
    }

    // Insert the actual media (episode or movie)
    const result = db.prepare(`
      INSERT INTO media (
        title, type, year, description, genres,
        file_path, season, episode, series_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      episodeTitle,
      finalType,
      year || metadata.year,
      description || null,
      genres || null,
      finalFilename,
      season || metadata.season,
      episode || metadata.episode,
      finalSeriesId || null,
      req.user.id
    );

    res.json({
      id: result.lastInsertRowid,
      title: episodeTitle,
      type: finalType,
      series_id: finalSeriesId,
      filename: finalFilename,
      converted: finalFilename !== req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload poster/background (admin only, LAN only)
router.post(
  '/upload-image',
  authenticate,
  requireAdmin,
  requireLAN,
  rateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), // 20 images per hour
  auditLog('image_upload', 'media'),
  multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const type = req.query.type || 'poster';
      const dir = path.join(__dirname, `../../storage/${type}s`);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('image'), (req, res) => {
  try {
    const { mediaId } = req.body;
    const type = req.query.type || 'poster';

    if (mediaId) {
      const field = type === 'poster' ? 'poster_path' : 'background_path';
      db.prepare(`UPDATE media SET ${field} = ? WHERE id = ?`).run(req.file.filename, mediaId);
    }

    res.json({ filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// Upload subtitle (admin only, LAN only)
router.post(
  '/upload-subtitle',
  authenticate,
  requireAdmin,
  requireLAN,
  rateLimit({ max: 30, windowMs: 60 * 60 * 1000 }), // 30 subtitles per hour
  auditLog('subtitle_upload', 'media'),
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../storage/subtitles');
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowedExts = ['.srt', '.vtt', '.ass', '.ssa'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return cb(new Error('Only subtitle files (.srt, .vtt, .ass, .ssa) are allowed'));
      }
      cb(null, true);
    }
  }).single('subtitle'),
  (req, res) => {
    try {
      const { mediaId, language = 'English', label } = req.body;

      if (!mediaId) {
        return res.status(400).json({ error: 'Media ID is required' });
      }

      // Get current subtitles
      const media = db.prepare('SELECT subtitle_tracks FROM media WHERE id = ?').get(mediaId);
      let subtitles = media?.subtitle_tracks ? JSON.parse(media.subtitle_tracks) : [];

      // Add new subtitle
      subtitles.push({
        language,
        label: label || language,
        file: req.file.filename,
        kind: 'subtitles'
      });

      // Update media
      db.prepare('UPDATE media SET subtitle_tracks = ? WHERE id = ?')
        .run(JSON.stringify(subtitles), mediaId);

      res.json({
        success: true,
        filename: req.file.filename,
        language,
        label: label || language
      });
    } catch (error) {
      console.error('Subtitle upload error:', error);
      res.status(500).json({ error: 'Subtitle upload failed' });
    }
  }
);

// Get all media (with filters)
router.get('/', authenticate, (req, res) => {
  try {
    const { type, genre, year, search, sort = 'recent', limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM media WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      // Special handling for TV show browsing
      if (type === 'episode') {
        // When browsing TV shows, show series (not individual episodes)
        query += ' AND type = ?';
        params.push('series');
      } else {
        query += ' AND type = ?';
        params.push(type);
      }
    } else {
      // When no specific type is requested, exclude 'series' placeholders
      // Only show playable content (movies and episodes)
      query += ' AND type != ?';
      params.push('series');
    }

    if (genre && genre !== 'all') {
      query += ' AND genres LIKE ?';
      params.push(`%${genre}%`);
    }

    if (year && year !== 'all') {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR genres LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    switch (sort) {
      case 'title-asc':
        query += ' ORDER BY title ASC';
        break;
      case 'title-desc':
        query += ' ORDER BY title DESC';
        break;
      case 'year-asc':
        query += ' ORDER BY year ASC, title ASC';
        break;
      case 'year-desc':
        query += ' ORDER BY year DESC, title ASC';
        break;
      case 'recent':
      default:
        query += ' ORDER BY created_at DESC';
        break;
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const media = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE 1=1';
    const countParams = [];

    if (type && type !== 'all') {
      // Special handling for TV show browsing
      if (type === 'episode') {
        countQuery += ' AND type = ?';
        countParams.push('series');
      } else {
        countQuery += ' AND type = ?';
        countParams.push(type);
      }
    } else {
      // Exclude series placeholders from count too
      countQuery += ' AND type != ?';
      countParams.push('series');
    }

    if (genre && genre !== 'all') {
      countQuery += ' AND genres LIKE ?';
      countParams.push(`%${genre}%`);
    }

    if (year && year !== 'all') {
      countQuery += ' AND year = ?';
      countParams.push(parseInt(year));
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR genres LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      media,
      total,
      hasMore: offset + media.length < total
    });
  } catch (error) {
    console.error('Media fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Get media by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Get episodes if this is a series
    if (media.type === 'series') {
      const episodes = db.prepare(`
        SELECT * FROM media
        WHERE series_id = ?
        ORDER BY season, episode
      `).all(media.id);
      media.episodes = episodes;
    }

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Update media (admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { title, type, year, description, genres, season, episode } = req.body;

    db.prepare(`
      UPDATE media
      SET title = ?, type = ?, year = ?, description = ?,
          genres = ?, season = ?, episode = ?
      WHERE id = ?
    `).run(title, type, year, description, genres, season, episode, req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete media (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const media = db.prepare('SELECT file_path, poster_path, background_path, subtitle_tracks FROM media WHERE id = ?').get(req.params.id);

    if (media) {
      // Delete video file
      if (media.file_path) {
        const videoPath = path.join(__dirname, '../../storage/videos', media.file_path);
        if (fs.existsSync(videoPath)) {
          try {
            fs.unlinkSync(videoPath);
          } catch (err) {
            console.error('Failed to delete video file:', err);
          }
        }
      }

      // Delete poster
      if (media.poster_path) {
        const posterPath = path.join(__dirname, '../../storage/posters', media.poster_path);
        if (fs.existsSync(posterPath)) {
          try {
            fs.unlinkSync(posterPath);
          } catch (err) {
            console.error('Failed to delete poster:', err);
          }
        }
      }

      // Delete background
      if (media.background_path) {
        const bgPath = path.join(__dirname, '../../storage/backgrounds', media.background_path);
        if (fs.existsSync(bgPath)) {
          try {
            fs.unlinkSync(bgPath);
          } catch (err) {
            console.error('Failed to delete background:', err);
          }
        }
      }

      // Delete subtitle files
      if (media.subtitle_tracks) {
        try {
          const subtitles = JSON.parse(media.subtitle_tracks);
          subtitles.forEach(sub => {
            const subPath = path.join(__dirname, '../../storage/subtitles', sub.file);
            if (fs.existsSync(subPath)) {
              try {
                fs.unlinkSync(subPath);
              } catch (err) {
                console.error('Failed to delete subtitle:', err);
              }
            }
          });
        } catch (err) {
          console.error('Failed to parse/delete subtitles:', err);
        }
      }

      // Delete from database
      db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);

      console.log(`Media ${req.params.id} deleted successfully`);
    } else {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed: ' + error.message });
  }
});

// Get recently added
router.get('/featured/recent', authenticate, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT * FROM media
      WHERE type != 'series'
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent media' });
  }
});

// Get trending (most watched recently)
router.get('/featured/trending', authenticate, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT m.*, COUNT(wh.id) as watch_count
      FROM media m
      LEFT JOIN watch_history wh ON m.id = wh.media_id
      WHERE wh.last_watched > datetime('now', '-7 days')
        AND m.type != 'series'
      GROUP BY m.id
      ORDER BY watch_count DESC
      LIMIT 20
    `).all();

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending media' });
  }
});

// Get recommended content for a profile
router.get('/recommended/:profileId', authenticate, (req, res) => {
  try {
    const { profileId } = req.params;

    // Get user's watch history to understand preferences
    const watchHistory = db.prepare(`
      SELECT m.genres, m.type
      FROM watch_history wh
      JOIN media m ON wh.media_id = m.id
      WHERE wh.profile_id = ?
      ORDER BY wh.last_watched DESC
      LIMIT 20
    `).all(profileId);

    if (watchHistory.length === 0) {
      // If no watch history, return trending content
      const trending = db.prepare(`
        SELECT DISTINCT m.*
        FROM media m
        LEFT JOIN watch_history wh ON m.id = wh.media_id
        WHERE wh.last_watched > datetime('now', '-30 days')
          AND m.type != 'series'
        GROUP BY m.id
        ORDER BY COUNT(wh.id) DESC
        LIMIT 20
      `).all();
      return res.json(trending);
    }

    // Extract genres from watch history
    const genreMap = {};
    const typeMap = {};

    watchHistory.forEach(item => {
      if (item.genres) {
        item.genres.split(',').forEach(genre => {
          const g = genre.trim();
          genreMap[g] = (genreMap[g] || 0) + 1;
        });
      }
      if (item.type) {
        typeMap[item.type] = (typeMap[item.type] || 0) + 1;
      }
    });

    // Get top genres
    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Get preferred type
    const preferredType = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Get already watched media IDs
    const watchedIds = db.prepare(`
      SELECT media_id FROM watch_history WHERE profile_id = ?
    `).all(profileId).map(row => row.media_id);

    // Build recommendation query
    let recommendations = [];

    // First, get content from preferred genres
    if (topGenres.length > 0) {
      const genreConditions = topGenres.map(() => 'genres LIKE ?').join(' OR ');
      const genreParams = topGenres.map(g => `%${g}%`);

      const genreRecommendations = db.prepare(`
        SELECT DISTINCT m.*,
          (SELECT COUNT(*) FROM watch_history WHERE media_id = m.id) as popularity
        FROM media m
        WHERE (${genreConditions})
          AND m.type != 'series'
          ${watchedIds.length > 0 ? `AND m.id NOT IN (${watchedIds.join(',')})` : ''}
        ORDER BY popularity DESC, m.created_at DESC
        LIMIT 15
      `).all(...genreParams);

      recommendations.push(...genreRecommendations);
    }

    // Add some content of preferred type if we need more
    if (recommendations.length < 20 && preferredType) {
      const typeRecommendations = db.prepare(`
        SELECT DISTINCT m.*,
          (SELECT COUNT(*) FROM watch_history WHERE media_id = m.id) as popularity
        FROM media m
        WHERE m.type = ?
          AND m.type != 'series'
          ${watchedIds.length > 0 ? `AND m.id NOT IN (${watchedIds.join(',')})` : ''}
          AND m.id NOT IN (${recommendations.map(r => r.id).join(',') || '0'})
        ORDER BY popularity DESC, m.created_at DESC
        LIMIT ${20 - recommendations.length}
      `).all(preferredType);

      recommendations.push(...typeRecommendations);
    }

    // If still need more, add recently added content
    if (recommendations.length < 20) {
      const recentContent = db.prepare(`
        SELECT m.*
        FROM media m
        WHERE ${watchedIds.length > 0 ? `m.id NOT IN (${watchedIds.join(',')})` : '1=1'}
          AND m.type != 'series'
          AND m.id NOT IN (${recommendations.map(r => r.id).join(',') || '0'})
        ORDER BY m.created_at DESC
        LIMIT ${20 - recommendations.length}
      `).all();

      recommendations.push(...recentContent);
    }

    res.json(recommendations.slice(0, 20));
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
