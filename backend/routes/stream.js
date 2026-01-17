const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to authenticate via query param or header
const authenticateStream = (req, res, next) => {
  try {
    // Try to get token from query parameter first (for video tag)
    let token = req.query.token;

    // If not in query, try Authorization header
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Handle OPTIONS for CORS preflight
router.options('/video/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// Handle HEAD requests for video metadata (some browsers/players check this first)
router.head('/video/:id', authenticateStream, (req, res) => {
  try {
    const media = db.prepare('SELECT file_path FROM media WHERE id = ?').get(req.params.id);

    if (!media || !media.file_path) {
      return res.status(404).end();
    }

    const videoPath = path.join(__dirname, '../../storage/videos', media.file_path);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).end();
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    const ext = path.extname(media.file_path).toLowerCase();
    const contentType = ext === '.mp4' || ext === '.m4v' ? 'video/mp4' : 'video/mp4';

    const etag = `"${stat.size}-${stat.mtime.getTime()}"`;
    const lastModified = stat.mtime.toUTCString();

    res.set({
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Expose-Headers': 'Content-Length, Accept-Ranges, Content-Type'
    });

    res.status(200).end();
  } catch (error) {
    console.error('HEAD request error:', error);
    res.status(500).end();
  }
});

// Stream video with range support and optimizations
router.get('/video/:id', authenticateStream, (req, res) => {
  try {
    const media = db.prepare('SELECT file_path FROM media WHERE id = ?').get(req.params.id);

    if (!media || !media.file_path) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '../../storage/videos', media.file_path);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Generate ETag based on file stats for caching
    const etag = `"${stat.size}-${stat.mtime.getTime()}"`;
    const lastModified = stat.mtime.toUTCString();

    // Detect MIME type from file extension
    const ext = path.extname(media.file_path).toLowerCase();
    let contentType = 'video/mp4'; // Default to MP4

    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.wmv': 'video/x-ms-wmv'
    };

    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    // Optimal chunk size: 10MB for good balance between memory and performance
    // Modern browsers can handle larger chunks efficiently
    const CHUNK_SIZE = 10 * 1024 * 1024;

    if (range) {
      // Parse range header (RFC 7233)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);

      // If no end specified, use optimal chunk size
      let end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

      // Ensure we don't exceed file size
      end = Math.min(end, fileSize - 1);

      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(videoPath, {
        start,
        end,
        highWaterMark: 256 * 1024 // 256KB buffer for smooth streaming on all networks
      });

      // HTTP 206 Partial Content headers (RFC 7233)
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
        'Last-Modified': lastModified,
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
        // CORS headers for cross-origin requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type'
      };

      res.writeHead(206, head);

      // Handle stream errors
      file.on('error', (err) => {
        console.error('File stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      file.pipe(res);
    } else {
      // No range header - send entire file (HTTP 200)
      // This happens on older browsers or when seeking isn't supported
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
        'Last-Modified': lastModified,
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type'
      };

      res.writeHead(200, head);

      const stream = fs.createReadStream(videoPath, {
        highWaterMark: 256 * 1024 // 256KB buffer for efficient streaming
      });

      stream.on('error', (err) => {
        console.error('File stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      stream.pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed' });
    }
  }
});

// Serve poster image
router.get('/poster/:filename', (req, res) => {
  try {
    const posterPath = path.join(__dirname, '../../storage/posters', req.params.filename);

    if (!fs.existsSync(posterPath)) {
      return res.status(404).json({ error: 'Poster not found' });
    }

    res.sendFile(posterPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve poster' });
  }
});

// Serve background image
router.get('/background/:filename', (req, res) => {
  try {
    const bgPath = path.join(__dirname, '../../storage/backgrounds', req.params.filename);

    if (!fs.existsSync(bgPath)) {
      return res.status(404).json({ error: 'Background not found' });
    }

    res.sendFile(bgPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve background' });
  }
});

// Serve subtitle file
router.get('/subtitle/:filename', (req, res) => {
  try {
    const subtitlePath = path.join(__dirname, '../../storage/subtitles', req.params.filename);

    if (!fs.existsSync(subtitlePath)) {
      return res.status(404).json({ error: 'Subtitle not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(req.params.filename).toLowerCase();
    let contentType = 'text/plain';

    if (ext === '.vtt') {
      contentType = 'text/vtt';
    } else if (ext === '.srt') {
      contentType = 'application/x-subrip';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(subtitlePath);
  } catch (error) {
    console.error('Subtitle serve error:', error);
    res.status(500).json({ error: 'Failed to serve subtitle' });
  }
});

module.exports = router;
