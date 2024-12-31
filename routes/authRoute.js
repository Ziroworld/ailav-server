const express = require('express');
const router = express.Router();
const {register} = require('../controller/authController');
const {userValidation} = require('../validation/userValidator');

router.post('/register',userValidation,register);

module.exports = router;