const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
} = require('../controller/orderController');

// Create a new order
// router.post('/create', createOrder);
router.post('/create', (req, res, next) => {
    console.log("Raw request body:", req.body);
    next();
}, createOrder);

// Get all orders for a user
router.get('/user/:userId', getUserOrders);

// Get order details by order ID
router.get('/', getAllOrders);

// Update order status
router.put('/update/:id', updateOrderStatus);

// Delete an order
router.delete('/delete/:id', deleteOrder);

module.exports = router;
