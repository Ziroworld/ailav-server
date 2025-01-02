const express = require('express');
const router = express.Router();
const {register, login} = require('../controller/authController');
const {userValidation} = require('../validation/userValidator');
const { authenticateToken } = require('../security/userSecurity');

router.post('/register',authenticateToken ,userValidation,register);
router.post('/login',login);

module.exports = router;