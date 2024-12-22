const express = require('express');
const router = express.Router();
const { findAllUser, createUser, findById, deleteById, update } = require('../controller/userController');
const { userValidation } = require('../validation/userValidator');
// const { generateToken , authenticateToken } = require('../security/userSecurity');

// User Routes
router.get('/user', findAllUser, (req, res) => {
    res.send('User route is working!');
});
router.post("/save", userValidation,createUser);
router.delete("/:id", deleteById);
router.get("/:id", findById);
router.put("/:id",update);

module.exports = router;
