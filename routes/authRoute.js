const express = require('express');
const router = express.Router();
const {register, login, requestOtp, resetPassword} = require('../controller/authController');
const {userValidation} = require('../validation/userValidator');
const { authenticateToken } = require('../security/userSecurity');

router.post('/register',authenticateToken ,userValidation,register);
router.post('/login',login);
router.post('/request-otp', requestOtp);
router.post('/reset-password', resetPassword);

module.exports = router;