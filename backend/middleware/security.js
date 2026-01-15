const db = require('../config/database');

// Check if IP is from local network
function isPrivateIP(ip) {
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');

  // Localhost
  if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP === '::1') {
    return true;
  }

  // Private IP ranges
  const parts = cleanIP.split('.');
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);

  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;

  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;

  return false;
}

// Middleware to restrict to LAN only
function requireLAN(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;

  if (!isPrivateIP(ip)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This action is only available on the local network'
    });
  }

  next();
}

// Rate limiting middleware
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5, // max requests
    keyGenerator = (req) => req.ip
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = new Date();

    try {
      // Clean up old entries
      db.prepare(`
        DELETE FROM rate_limits
        WHERE reset_at < ?
      `).run(now.toISOString());

      // Get or create rate limit entry
      let entry = db.prepare(`
        SELECT * FROM rate_limits WHERE key = ?
      `).get(key);

      if (!entry) {
        const resetAt = new Date(now.getTime() + windowMs);
        db.prepare(`
          INSERT INTO rate_limits (key, attempts, reset_at)
          VALUES (?, 1, ?)
        `).run(key, resetAt.toISOString());
        return next();
      }

      // Check if limit exceeded
      if (entry.attempts >= max) {
        const resetAt = new Date(entry.reset_at);
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter
        });
      }

      // Increment attempts
      db.prepare(`
        UPDATE rate_limits
        SET attempts = attempts + 1
        WHERE key = ?
      `).run(key);

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Fail open
    }
  };
}

// Audit logging
function auditLog(action, resourceType = null) {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      const success = res.statusCode < 400;

      try {
        db.prepare(`
          INSERT INTO audit_log (
            user_id, action, resource_type, resource_id,
            ip_address, user_agent, details, success
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.user?.id || null,
          action,
          resourceType,
          data?.id || null,
          req.ip || req.connection.remoteAddress,
          req.get('user-agent') || null,
          JSON.stringify({ body: req.body, query: req.query }),
          success ? 1 : 0
        );
      } catch (error) {
        console.error('Audit log error:', error);
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

// Get device name from user agent
function getDeviceName(userAgent) {
  if (!userAgent) return 'Unknown Device';

  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Macintosh')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';

  return 'Unknown Device';
}

module.exports = {
  isPrivateIP,
  requireLAN,
  rateLimit,
  auditLog,
  getDeviceName
};
