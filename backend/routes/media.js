const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { extractMetadata, isVideoFile } = require('../utils/fileUtils');

const router = express.Router();

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

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240') // 10GB default
  },
  fileFilter: (req, file, cb) => {
    if (isVideoFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed'));
    }
  }
});

// Upload video (admin only)
router.post('/upload', authenticate, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, type, year, description, genres, season, episode, seriesId } = req.body;

    // Auto-extract metadata from filename if not provided
    const metadata = extractMetadata(req.file.originalname);

    const result = db.prepare(`
      INSERT INTO media (
        title, type, year, description, genres,
        file_path, season, episode, series_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title || metadata.title,
      type || (metadata.season ? 'episode' : 'movie'),
      year || metadata.year,
      description || null,
      genres || null,
      req.file.filename,
      season || metadata.season,
      episode || metadata.episode,
      seriesId || null,
      req.user.id
    );

    res.json({
      id: result.lastInsertRowid,
      title: title || metadata.title,
      type: type || (metadata.season ? 'episode' : 'movie'),
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload poster/background (admin only)
router.post('/upload-image', authenticate, requireAdmin, multer({
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

// Get all media (with filters)
router.get('/', authenticate, (req, res) => {
  try {
    const { type, genre, year, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM media WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (genre) {
      query += ' AND genres LIKE ?';
      params.push(`%${genre}%`);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    if (search) {
      query += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const media = db.prepare(query).all(...params);

    res.json(media);
  } catch (error) {
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
    const media = db.prepare('SELECT file_path, poster_path, background_path FROM media WHERE id = ?').get(req.params.id);

    if (media) {
      // Delete files
      if (media.file_path) {
        const videoPath = path.join(__dirname, '../../storage/videos', media.file_path);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
      if (media.poster_path) {
        const posterPath = path.join(__dirname, '../../storage/posters', media.poster_path);
        if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
      }
      if (media.background_path) {
        const bgPath = path.join(__dirname, '../../storage/backgrounds', media.background_path);
        if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
      }

      db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get recently added
router.get('/featured/recent', authenticate, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT * FROM media
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
      GROUP BY m.id
      ORDER BY watch_count DESC
      LIMIT 20
    `).all();

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending media' });
  }
});

module.exports = router;
