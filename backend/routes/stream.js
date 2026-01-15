const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Stream video with range support
router.get('/video/:id', authenticate, (req, res) => {
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

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Streaming failed' });
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

module.exports = router;
