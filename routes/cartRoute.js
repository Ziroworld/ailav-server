const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, clearCart } = require('../controller/cartController');

// Routes
router.post('/add', addToCart);
router.get('/:userId', getCart);
router.post('/remove', removeFromCart);
router.post('/clear', clearCart);

module.exports = router;
