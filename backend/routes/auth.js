const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');
const { rateLimit, getDeviceName } = require('../middleware/security');

const router = express.Router();

// Helper to create session
function createSession(userId, token, req) {
  const deviceName = getDeviceName(req.get('user-agent'));
  const ipAddress = req.ip || req.connection.remoteAddress;

  db.prepare(`
    INSERT INTO sessions (user_id, token, device_name, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, token, deviceName, ipAddress, req.get('user-agent') || null);
}

// Register new user (with rate limiting)
router.post('/register', rateLimit({ max: 3, windowMs: 60 * 60 * 1000 }), async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if first user (will be admin)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const role = userCount.count === 0 ? 'admin' : 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password, username, role)
      VALUES (?, ?, ?, ?)
    `).run(email, hashedPassword, username, role);

    // Create default profile
    db.prepare(`
      INSERT INTO profiles (user_id, name)
      VALUES (?, ?)
    `).run(result.lastInsertRowid, username);

    const user = { id: result.lastInsertRowid, email, username, role };
    const token = generateToken(user);

    // Create session
    createSession(user.id, token, req);

    res.json({
      user: { id: user.id, email, username, role },
      token
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (with rate limiting)
router.post('/login', rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Create session
    createSession(user.id, token, req);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, username, role, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user profiles
router.get('/profiles', authenticate, (req, res) => {
  try {
    const profiles = db.prepare(`
      SELECT id, name, avatar, is_kids
      FROM profiles WHERE user_id = ?
    `).all(req.user.id);

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Create profile
router.post('/profiles', authenticate, (req, res) => {
  try {
    const { name, avatar, is_kids } = req.body;

    const result = db.prepare(`
      INSERT INTO profiles (user_id, name, avatar, is_kids)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, name, avatar || null, is_kids || 0);

    res.json({
      id: result.lastInsertRowid,
      name,
      avatar,
      is_kids
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Get user sessions (logged in devices)
router.get('/sessions', authenticate, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT id, device_name, ip_address, created_at, last_active,
             token = ? as is_current
      FROM sessions
      WHERE user_id = ?
      ORDER BY last_active DESC
    `).all(req.token, req.user.id);

    res.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Logout from specific device
router.delete('/sessions/:id', authenticate, (req, res) => {
  try {
    const sessionId = req.params.id;

    // Ensure user can only delete their own sessions
    const session = db.prepare(`
      SELECT * FROM sessions WHERE id = ? AND user_id = ?
    `).get(sessionId, req.user.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    res.json({ success: true, message: 'Device logged out successfully' });
  } catch (error) {
    console.error('Failed to delete session:', error);
    res.status(500).json({ error: 'Failed to logout device' });
  }
});

// Logout from all devices
router.post('/logout-all', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Failed to logout all:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

module.exports = router;
