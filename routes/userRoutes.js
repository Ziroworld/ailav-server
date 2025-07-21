const express = require('express');
const router = express.Router();
const { findAllUser, findById, deleteById, update } = require('../controller/userController');
const { authenticateAccessToken } = require('../security/userSecurity');
const { updateUserValidation } = require('../validation/userValidator');

// You should always protect user-sensitive updates/deletes with auth!
router.get('/user', findAllUser);
router.delete("/:id", authenticateAccessToken, deleteById);
router.get("/:id", findById);
router.put("/:id", authenticateAccessToken, updateUserValidation, update);

module.exports = router;
