const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
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

// Login
router.post('/login', async (req, res) => {
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

module.exports = router;
