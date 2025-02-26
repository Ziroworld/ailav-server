const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const User = require('../model/userModel');

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
      // Add new item to cart, including the product image URL
      cart.items.push({
        productId,
        productName: product.name,
        productImage: product.imageUrl,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    // Return only the items array
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

    // Return only the items array
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
    console.log(`Removing ${productId} from cart with id ${userId}`);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log(`Cart not found for user ${userId}`);
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Debug: print cart items before removal
    console.log(`Cart items before removal: ${JSON.stringify(cart.items)}`);

    const originalCount = cart.items.length;
    cart.items = cart.items.filter((item) => {
      // Check if the productId matches either the productId or the item id (_id)
      const matchesProductId = item.productId.toString() === productId;
      const matchesItemId = item._id.toString() === productId;
      
      if (matchesProductId || matchesItemId) {
        console.log(`Removing item: ${JSON.stringify(item)}`);
        return false;
      }
      return true;
    });
    const removedCount = originalCount - cart.items.length;
    console.log(`Removed ${removedCount} item(s) from cart`);

    await cart.save();
    
    // Debug: print cart items after removal
    console.log(`Cart items after removal: ${JSON.stringify(cart.items)}`);
    
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
