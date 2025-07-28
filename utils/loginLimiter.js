const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const username = req.body.username ? req.body.username.toLowerCase() : '';
    return `${req.ip}|${username}`;
  },
  handler: async (req, res) => {
    try {
      const logActivity = require('./logActivity');
      await logActivity(req, 'Login Rate Limit Exceeded', {
        ip: req.ip,
        username: req.body.username || '',
        path: req.originalUrl,
        userAgent: req.headers['user-agent']
      });
    } catch (e) {}
    res.status(429).json({
      error: 'Too many login attempts. Please wait 10 minutes and try again.'
    });
  }
});

module.exports = {
  loginLimiter, // <-- named export (object style)
};
