const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, clearCart } = require('../controller/cartController');
const { authenticateAccessToken } = require('../security/userSecurity');

// Routes
router.post('/add', authenticateAccessToken, addToCart);
router.get('/:userId', authenticateAccessToken, getCart);
router.post('/remove', authenticateAccessToken, removeFromCart);
router.post('/clear', authenticateAccessToken, clearCart);

module.exports = router;
