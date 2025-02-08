const Payment = require('../model/paymentModel');

// Add a new payment
const addPayment = async (req, res) => {
    try {
        const { userId, paymentMethod, amount, transactionId } = req.body;

        const payment = await Payment.create({
            userId,
            paymentMethod,
            amount,
            transactionId,
        });

        res.status(201).json({ message: 'Payment added successfully', payment });
    } catch (error) {
        console.error('Error adding payment:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all payments for a user
const getPayments = async (req, res) => {
    try {
        const { userId } = req.params;

        const payments = await Payment.find({ userId });
        res.status(200).json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        const payment = await Payment.findByIdAndUpdate(id, { paymentStatus }, { new: true });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.status(200).json({ message: 'Payment status updated successfully', payment });
    } catch (error) {
        console.error('Error updating payment status:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addPayment,
    getPayments,
    updatePaymentStatus,
};
