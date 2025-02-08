const express = require('express');
const router = express.Router();
const {register, login, requestOtp, resetPassword, uploadImage, getCurrentUser} = require('../controller/authController');
const {userValidation} = require('../validation/userValidator');
const upload = require('../utils/uploads');
const { authenticateToken } = require('../security/userSecurity');

router.post("/uploadImage", upload, uploadImage);
router.post('/register', register);
router.post('/login',login);
router.post('/request-otp', requestOtp);
router.post('/reset-password', resetPassword);
router.get("/currentuser", authenticateToken, getCurrentUser);

module.exports = router;