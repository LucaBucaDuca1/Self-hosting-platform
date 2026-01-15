const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get overall statistics (admin only)
router.get('/overview', authenticate, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      totalProfiles: db.prepare('SELECT COUNT(*) as count FROM profiles').get().count,
      totalMedia: db.prepare('SELECT COUNT(*) as count FROM media').get().count,
      totalMovies: db.prepare('SELECT COUNT(*) as count FROM media WHERE type = "movie"').get().count,
      totalSeries: db.prepare('SELECT COUNT(*) as count FROM media WHERE type = "series" OR type = "episode"').get().count,
      totalWatchTime: db.prepare('SELECT SUM(progress) as total FROM watch_history').get().total || 0,
      totalViews: db.prepare('SELECT COUNT(*) as count FROM watch_history').get().count,
      activeUsers: db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM sessions
        WHERE last_active > datetime('now', '-7 days')
      `).get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get most watched content (admin only)
router.get('/most-watched', authenticate, requireAdmin, (req, res) => {
  try {
    const mostWatched = db.prepare(`
      SELECT m.*, COUNT(wh.id) as view_count, SUM(wh.progress) as total_watch_time
      FROM media m
      LEFT JOIN watch_history wh ON m.id = wh.media_id
      GROUP BY m.id
      ORDER BY view_count DESC, total_watch_time DESC
      LIMIT 20
    `).all();

    res.json(mostWatched);
  } catch (error) {
    console.error('Most watched error:', error);
    res.status(500).json({ error: 'Failed to fetch most watched' });
  }
});

// Get watch activity over time (admin only)
router.get('/activity', authenticate, requireAdmin, (req, res) => {
  try {
    const { days = 30 } = req.query;

    const activity = db.prepare(`
      SELECT
        DATE(last_watched) as date,
        COUNT(*) as views,
        COUNT(DISTINCT profile_id) as unique_viewers
      FROM watch_history
      WHERE last_watched > datetime('now', '-${parseInt(days)} days')
      GROUP BY DATE(last_watched)
      ORDER BY date ASC
    `).all();

    res.json(activity);
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get genre popularity (admin only)
router.get('/genres', authenticate, requireAdmin, (req, res) => {
  try {
    const allMedia = db.prepare(`
      SELECT m.genres, COUNT(wh.id) as view_count
      FROM media m
      LEFT JOIN watch_history wh ON m.id = wh.media_id
      WHERE m.genres IS NOT NULL
      GROUP BY m.id
    `).all();

    const genreStats = {};

    allMedia.forEach(item => {
      if (item.genres) {
        const genres = item.genres.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (!genreStats[genre]) {
            genreStats[genre] = { genre, views: 0, titles: 0 };
          }
          genreStats[genre].views += item.view_count;
          genreStats[genre].titles += 1;
        });
      }
    });

    const sortedGenres = Object.values(genreStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    res.json(sortedGenres);
  } catch (error) {
    console.error('Genre stats error:', error);
    res.status(500).json({ error: 'Failed to fetch genre statistics' });
  }
});

// Get user engagement (admin only)
router.get('/engagement', authenticate, requireAdmin, (req, res) => {
  try {
    const engagement = {
      completionRate: db.prepare(`
        SELECT
          ROUND(AVG(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100, 2) as rate
        FROM watch_history
      `).get().rate || 0,

      averageWatchTime: db.prepare(`
        SELECT AVG(progress) as avg_time
        FROM watch_history
        WHERE progress > 0
      `).get().avg_time || 0,

      activeViewers: db.prepare(`
        SELECT COUNT(DISTINCT profile_id) as count
        FROM watch_history
        WHERE last_watched > datetime('now', '-7 days')
      `).get().count,

      totalSessions: db.prepare(`
        SELECT COUNT(*) as count
        FROM sessions
        WHERE last_active > datetime('now', '-30 days')
      `).get().count
    };

    res.json(engagement);
  } catch (error) {
    console.error('Engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement statistics' });
  }
});

module.exports = router;
