require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/media', require('./routes/media'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/stream', require('./routes/stream'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zeloz Streaming Server' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║       🎬 Zeloz Streaming Platform 🎬          ║
║                                                ║
║  Server running on http://localhost:${PORT}     ║
║  Made with ♥ by Zeloz                         ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
