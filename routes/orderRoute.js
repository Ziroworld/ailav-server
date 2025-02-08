const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
} = require('../controller/orderController');

// Create a new order
router.post('/create', createOrder);

// Get all orders for a user
router.get('/user/:userId', getUserOrders);

// Get order details by order ID
router.get('/:id', getOrderById);

// Update order status
router.put('/update/:id', updateOrderStatus);

// Delete an order
router.delete('/delete/:id', deleteOrder);

module.exports = router;
