const express = require('express');
const router = express.Router();
const { findAllUser, findById, deleteById, update } = require('../controller/userController');
const { authenticateToken } = require('../security/userSecurity');

// User Routes
router.get('/user', findAllUser, (req, res) => {
    res.send('User route is working!');
});
router.delete("/:id", authenticateToken, deleteById);
router.get("/:id", findById);
router.put("/:id",update);

module.exports = router;
