require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Middleware - permissive configuration for local network streaming
// Allows access from localhost, local network IPs, and configured domains
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Smart TVs, mobile apps, curl, video players)
    if (!origin) return callback(null, true);

    // In production, check against ALLOWED_ORIGINS environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Allow localhost in all forms (for development)
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);

    // Allow private network ranges (RFC 1918)
    // 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12
    const isLocalNetwork = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i.test(origin);

    if (allowedOrigins.includes(origin) || isLocalhost || isLocalNetwork) {
      callback(null, true);
    } else {
      // In self-hosted scenario, be permissive - allow any origin
      // This is safe for local network use
      callback(null, true);
    }
  },
  credentials: true,
  // Expose additional headers for video streaming
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type', 'ETag', 'Last-Modified']
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
