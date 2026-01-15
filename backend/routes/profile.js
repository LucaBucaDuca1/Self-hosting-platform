const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get continue watching for profile
router.get('/:profileId/continue-watching', authenticate, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT m.*, wh.progress, wh.last_watched
      FROM watch_history wh
      JOIN media m ON wh.media_id = m.id
      WHERE wh.profile_id = ? AND wh.completed = 0 AND wh.progress > 0
      ORDER BY wh.last_watched DESC
      LIMIT 20
    `).all(req.params.profileId);

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch continue watching' });
  }
});

// Get my list for profile
router.get('/:profileId/my-list', authenticate, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT m.*, ml.added_at
      FROM my_list ml
      JOIN media m ON ml.media_id = m.id
      WHERE ml.profile_id = ?
      ORDER BY ml.added_at DESC
    `).all(req.params.profileId);

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my list' });
  }
});

// Add to my list
router.post('/:profileId/my-list/:mediaId', authenticate, (req, res) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO my_list (profile_id, media_id)
      VALUES (?, ?)
    `).run(req.params.profileId, req.params.mediaId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to my list' });
  }
});

// Remove from my list
router.delete('/:profileId/my-list/:mediaId', authenticate, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM my_list
      WHERE profile_id = ? AND media_id = ?
    `).run(req.params.profileId, req.params.mediaId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from my list' });
  }
});

// Check if in my list
router.get('/:profileId/my-list/:mediaId/check', authenticate, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT id FROM my_list
      WHERE profile_id = ? AND media_id = ?
    `).get(req.params.profileId, req.params.mediaId);

    res.json({ inList: !!item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check my list' });
  }
});

// Update watch progress
router.post('/:profileId/watch-progress/:mediaId', authenticate, (req, res) => {
  try {
    const { progress, completed } = req.body;

    db.prepare(`
      INSERT INTO watch_history (profile_id, media_id, progress, completed, last_watched)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(profile_id, media_id)
      DO UPDATE SET
        progress = excluded.progress,
        completed = excluded.completed,
        last_watched = CURRENT_TIMESTAMP
    `).run(req.params.profileId, req.params.mediaId, progress || 0, completed || 0);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update watch progress' });
  }
});

// Get watch progress
router.get('/:profileId/watch-progress/:mediaId', authenticate, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT progress, completed, last_watched
      FROM watch_history
      WHERE profile_id = ? AND media_id = ?
    `).get(req.params.profileId, req.params.mediaId);

    res.json(history || { progress: 0, completed: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watch progress' });
  }
});

module.exports = router;
