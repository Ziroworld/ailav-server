const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  requestOtp,
  verifyOtp,
  resetPassword,
  uploadImage,
  getCurrentUser
} = require('../controller/authController');
const upload = require('../utils/uploads');
const { authenticateAccessToken } = require('../security/userSecurity');
const { authLimiter } = require('../utils/rate-limit');
const verifyRecaptcha = require('../utils/recaptcha');
const { userValidation, loginValidation, validateEmail } = require('../validation/userValidator');
const csrfProtection = require('../utils/csrf');
const { loginLimiter } = require('../utils/loginLimiter');

// --- Upload Profile Image ---
router.post('/uploadImage', upload, uploadImage);

// --- Register (only POST allowed) ---
router
  .route('/register')
  .post(authLimiter, userValidation, register)
  .get((req, res) => res.status(405).json({ error: 'GET request is not allowed!' }))
  .put((req, res) => res.status(405).json({ error: 'PUT request is not allowed!' }))
  .delete((req, res) => res.status(405).json({ error: 'DELETE request is not allowed!' }));

// --- Login (only POST allowed) ---
router
  .route('/login')
  .post(loginLimiter, verifyRecaptcha, loginValidation, login)
  .get((req, res) => res.status(405).json({ error: 'GET request is not allowed!' }))
  .put((req, res) => res.status(405).json({ error: 'PUT request is not allowed!' }))
  .delete((req, res) => res.status(405).json({ error: 'DELETE request is not allowed!' }));

// --- Refresh Token ---
router.post('/refresh-token', refreshToken);

// --- OTP & Password Reset ---
router.post('/request-otp', validateEmail, requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// --- Current Authenticated User ---
router.get('/currentuser', authenticateAccessToken, getCurrentUser);

// --- CSRF Token ---
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

module.exports = router;
