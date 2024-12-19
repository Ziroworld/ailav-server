const express = require('express');
const router = express.Router();
const { findAllUser, createUser } = require('../controller/userController');
const { userValidation } = require('../validation/userValidator');
// const { generateToken , authenticateToken } = require('../security/userSecurity');

// User Routes
router.get('/user', findAllUser, (req, res) => {
    res.send('User route is working!');
});
router.post("/save", userValidation,createUser);


module.exports = router;
