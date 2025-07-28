const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const User = require('../model/userModel');
const logActivity = require("../utils/logActivity"); // <-- Import logging utility
const sanitizeHtml = require('../utils/sanitizeHtml'); // <--- Import

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if cart exists for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity; // Update quantity
    } else {
      // Sanitize defensively
      cart.items.push({
        productId,
        productName: sanitizeHtml(product.name),         // <--- Here
        productImage: sanitizeHtml(product.imageUrl),    // <--- Here
        quantity,
        price: product.price,
      });
    }

    await cart.save();

    await logActivity(req, "Added Product to Cart", {
      userId,
      productId,
      quantity,
      cartId: cart._id,
    });

    res.status(200).json({ message: 'Product added to cart', cart: cart.items });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ message: error.message });
  }
};
// Get cart items
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price imageUrl');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Activity log
    await logActivity(req, "Viewed Cart", {
      userId,
      cartId: cart._id,
    });

    res.status(200).json({ cart: cart.items });
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const originalCount = cart.items.length;
    cart.items = cart.items.filter((item) => {
      const matchesProductId = item.productId.toString() === productId;
      const matchesItemId = item._id.toString() === productId;
      return !(matchesProductId || matchesItemId);
    });

    const removedCount = originalCount - cart.items.length;

    await cart.save();

    // Activity log (only if an item was actually removed)
    if (removedCount > 0) {
      await logActivity(req, "Removed Product from Cart", {
        userId,
        productId,
        cartId: cart._id,
        removedCount,
      });
    }

    res.status(200).json({ message: 'Product removed from cart', cart: cart.items });
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Clear the cart
const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = []; // Clear all items
    await cart.save();

    // Activity log
    await logActivity(req, "Cleared Cart", {
      userId,
      cartId: cart._id,
    });

    res.status(200).json({ message: 'Cart cleared successfully', cart: [] });
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
};
