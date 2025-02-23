const mongoose = require("mongoose");
const Order = require('../model/orderModel');
const Cart = require('../model/cartModel');
const Address = require('../model/addressModel');

const createOrder = async (req, res) => {
    try {
      // Read flattened address fields along with userId and payment
      const { userId, payment, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
  
      console.log("Received Order Data:", req.body);
  
      // Verify required fields exist
      if (!userId || !payment || !addressLine1 || !city || !state || !postalCode || !country) {
        return res.status(400).json({ message: "Missing required fields." });
      }
  
      // Fetch the cart for the user (assuming one cart per user)
      const cartDoc = await Cart.findOne({ userId });
      if (!cartDoc || !cartDoc.items || cartDoc.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
  
      const cartItems = cartDoc.items;
      console.log("Cart items found:", cartItems.length);
  
      // Calculate total price
      const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
      if (isNaN(totalPrice)) {
          return res.status(400).json({ message: "Invalid cart item data." });
      }
  
      // Create the address in the database using the provided fields
      const newAddress = await Address.create({
          userId,
          addressLine1,
          addressLine2, // optional
          city,
          state,
          postalCode,
          country
      });
  
      console.log("Address Created:", newAddress);
  
      // Create the order with the newly created address ID and the cart items
      const order = await Order.create({
          userId,
          cartItems,
          addressId: newAddress._id,
          payment,
          totalPrice,
      });
  
      console.log("Order Created Successfully:", order);
  
      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: error.message });
    }
};
  

// Get all orders for a user and combine address data for clarity
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ userId })
            .populate("cartItems.productId", "name price")
            .populate("addressId");

        // Map orders to include a top-level 'address' property
        const combinedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                ...orderObj,
                address: orderObj.addressId, // Renaming for clarity
            };
        });

        res.status(200).json({ orders: combinedOrders });
    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders (instead of a single order by ID) and return them as an array
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("cartItems.productId", "name price")
            .populate("addressId");

        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update order status remains unchanged
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

// Delete an order remains unchanged
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
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
};
