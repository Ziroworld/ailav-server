const Order = require('../model/orderModel');
const Cart = require('../model/cartModel');
const Address = require('../model/addressModel');
const Payment = require('../model/paymentModel');

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, addressId, paymentId } = req.body;

        // Fetch cart items for the user
        const cartItems = await Cart.find({ userId });
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Calculate total price
        const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        // Verify address and payment
        const address = await Address.findById(addressId);
        const payment = await Payment.findById(paymentId);

        if (!address) return res.status(404).json({ message: "Address not found" });
        if (!payment) return res.status(404).json({ message: "Payment method not found" });

        // Create the order
        const order = await Order.create({
            userId,
            cartItems,
            addressId,
            paymentId,
            totalPrice,
        });

        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        console.error("Error creating order:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ userId })
            .populate("cartItems.productId", "name price")
            .populate("addressId")
            .populate("paymentId");

        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get order details by order ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate("cartItems.productId", "name price")
            .populate("addressId")
            .populate("paymentId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error("Error fetching order details:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (error) {
        console.error("Error updating order status:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Delete an order
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
};
