// utils/rate-limit.js

const rateLimit = require('express-rate-limit');

// Skips the rate limiter if recaptcha was already solved
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 free tries, after that must use CAPTCHA
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Bypass rate limit if CAPTCHA solved on this request
    return req.captchaVerified === true;
  },
  handler: (req, res) => {
    // Log suspicious activity
    if (req.ip) {
      const logActivity = require('./logActivity');
      logActivity(req, 'Rate Limit Exceeded', { ip: req.ip, path: req.originalUrl });
    }
    res.status(429).json({
      error: 'Too many attempts. Please solve the CAPTCHA and retry.'
    });
  }
});

module.exports = { authLimiter };
