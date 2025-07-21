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

// If using multer or similar for image uploads:
router.post('/uploadImage', upload, uploadImage);

// --- Registration ---
router.post('/register', authLimiter, userValidation, register);

// --- Login ---
router.post('/login', verifyRecaptcha, authLimiter, loginValidation, login);

// --- Refresh Token ---
router.post('/refresh-token', refreshToken);

// --- OTP/Reset ---
router.post('/request-otp', validateEmail, requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// --- Current User Profile ---
router.get('/currentuser', authenticateAccessToken, getCurrentUser);

module.exports = router;
