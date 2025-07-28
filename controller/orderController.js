const mongoose = require("mongoose");
const Order = require('../model/orderModel');
const Cart = require('../model/cartModel');
const Address = require('../model/addressModel');
const logActivity = require("../utils/logActivity"); // <-- Logging utility

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, payment, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
        if (!userId || !payment || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const cartDoc = await Cart.findOne({ userId });
        if (!cartDoc || !cartDoc.items || cartDoc.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const cartItems = cartDoc.items;
        const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        if (isNaN(totalPrice)) {
            return res.status(400).json({ message: "Invalid cart item data." });
        }

        const newAddress = await Address.create({
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country
        });

        const order = await Order.create({
            userId,
            cartItems,
            addressId: newAddress._id,
            payment,
            totalPrice,
        });

        // Activity log for order creation
        await logActivity(req, "Created Order", {
            orderId: order._id,
            userId,
            totalPrice,
            cartItems: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            }))
        });

        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ userId })
            .populate("cartItems.productId", "name price")
            .populate("addressId");

        const combinedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                ...orderObj,
                address: orderObj.addressId,
            };
        });

        // Activity log for viewing orders
        await logActivity(req, "Viewed User Orders", { userId });

        res.status(200).json({ orders: combinedOrders });
    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("cartItems.productId", "name price")
            .populate("addressId");

        // Log all orders fetch (could limit to admin)
        await logActivity(req, "Viewed All Orders", { admin: req.user ? req.user._id : null });

        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error.message);
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

        // Activity log for order status update
        await logActivity(req, "Updated Order Status", {
            orderId: id,
            newStatus: status
        });

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

        // Activity log for order deletion
        await logActivity(req, "Deleted Order", { orderId: id });

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
};
