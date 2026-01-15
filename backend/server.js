require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is from allowed origins or local network
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const isLocalhost = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/);
    const isLocalNetwork = origin.match(/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)/);

    if (allowedOrigins.includes(origin) || isLocalhost || isLocalNetwork) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/statistics', require('./routes/statistics'));

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
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';

  // Find local network IP
  for (const name of Object.keys(networkInterfaces)) {
    for (const iface of networkInterfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║       🎬 Zeloz Streaming Platform 🎬          ║
║                                                ║
║  Server running on:                           ║
║  • Local:   http://localhost:${PORT}          ║
║  • Network: http://${localIP}:${PORT}         ║
║                                                ║
║  Made with ♥ by Zeloz                         ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
