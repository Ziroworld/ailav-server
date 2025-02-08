const express = require('express');
const router = express.Router();
const { addPayment, getPayments, updatePaymentStatus } = require('../controller/paymentController');

// Add a new payment
router.post('/add', addPayment);

// Get all payments for a user
router.get('/:userId', getPayments);

// Update payment status
router.put('/update/:id', updatePaymentStatus);

module.exports = router;
