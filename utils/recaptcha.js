// utils/recaptcha.js
const axios = require('axios');

/**
 * If client sent `recaptchaToken`, verify it with Google.
 * If valid, set req.captchaVerified = true for the rate-limiter to skip.
 */
async function verifyRecaptcha(req, res, next) {
  const token = req.body.recaptchaToken;
  if (!token) {
  console.log('No recaptcha token provided!');
  return next();
}
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret, response: token } }
    );
    console.log('Recaptcha Google API response:', data);
    if (data.success) {
      req.captchaVerified = true; // <-- This line is critical!
      return next();
    } else {
      return res.status(400).json({ error: 'CAPTCHA verification failed.' });
    }
  } catch (err) {
    console.error('reCAPTCHA error', err);
    return res.status(500).json({ error: 'CAPTCHA verification error.' });
  }
}

module.exports = verifyRecaptcha;
