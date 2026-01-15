const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all collections
router.get('/', authenticate, (req, res) => {
  try {
    const collections = db.prepare(`
      SELECT c.*,
        COUNT(ci.media_id) as item_count
      FROM collections c
      LEFT JOIN collection_items ci ON c.id = ci.collection_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();

    res.json(collections);
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get collection by ID with items
router.get('/:id', authenticate, (req, res) => {
  try {
    const collection = db.prepare(`
      SELECT * FROM collections WHERE id = ?
    `).get(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Get collection items
    const items = db.prepare(`
      SELECT m.*, ci.sort_order
      FROM media m
      INNER JOIN collection_items ci ON m.id = ci.media_id
      WHERE ci.collection_id = ?
      ORDER BY ci.sort_order, m.title
    `).all(req.params.id);

    collection.items = items;

    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create collection (admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, description, posterPath } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = db.prepare(`
      INSERT INTO collections (name, description, poster_path)
      VALUES (?, ?, ?)
    `).run(name, description || null, posterPath || null);

    res.json({
      id: result.lastInsertRowid,
      name,
      description,
      posterPath
    });
  } catch (error) {
    console.error('Collection create error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection (admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, description, posterPath } = req.body;

    db.prepare(`
      UPDATE collections
      SET name = ?, description = ?, poster_path = ?
      WHERE id = ?
    `).run(name, description, posterPath, req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Add item to collection (admin only)
router.post('/:id/items', authenticate, requireAdmin, (req, res) => {
  try {
    const { mediaId, sortOrder } = req.body;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    db.prepare(`
      INSERT INTO collection_items (collection_id, media_id, sort_order)
      VALUES (?, ?, ?)
      ON CONFLICT(collection_id, media_id) DO UPDATE SET sort_order = excluded.sort_order
    `).run(req.params.id, mediaId, sortOrder || 0);

    res.json({ success: true });
  } catch (error) {
    console.error('Add to collection error:', error);
    res.status(500).json({ error: 'Failed to add item to collection' });
  }
});

// Remove item from collection (admin only)
router.delete('/:id/items/:mediaId', authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM collection_items
      WHERE collection_id = ? AND media_id = ?
    `).run(req.params.id, req.params.mediaId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from collection' });
  }
});

module.exports = router;
