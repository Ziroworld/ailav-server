const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Description = require('../model/descriptionModel');
const sanitizeHtml = require('../utils/sanitizeHtml'); // <-- Import here

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { name, price, inStock, categoryId, description, additionalInfo, imageUrl } = req.body;
    console.log("Received payload:", req.body);

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Category not found...1234' });
    }

    // 🛡️ SANITIZE: Only allow safe HTML into DB!
    const safeDescription = sanitizeHtml(description);
    const safeAdditionalInfo = sanitizeHtml(additionalInfo);

    const descDoc = new Description({
      longDescription: safeDescription,
      additionalInfo: safeAdditionalInfo,
    });
    const savedDescription = await descDoc.save();

    const product = new Product({
      name,
      price,
      stock: inStock,
      category: category._id,
      description: savedDescription._id,
      imageUrl,
    });
    const savedProduct = await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('description', 'longDescription additionalInfo');

    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category?.name || "Unknown Category",
      longDescription: product.description?.longDescription || "No description available",
      additionalInfo: product.description?.additionalInfo || "No additional information",
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('description', 'longDescription additionalInfo');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const formattedProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category?.name || "Unknown Category",
      longDescription: product.description?.longDescription || "No description available",
      additionalInfo: product.description?.additionalInfo || "No additional information",
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, categoryName, longDescription, additionalInfo, imageUrl } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await updateCategory(product, categoryName);
    await updateDescription(product, longDescription, additionalInfo);
    await updateProductFields(product, name, price, stock);

    if (imageUrl) {
      product.imageUrl = imageUrl;
    }

    await product.save();

    const updatedProduct = await getPopulatedProduct(product._id);

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update helpers (sanitize inputs here too!)
const updateCategory = async (product, categoryName) => {
  if (categoryName) {
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      throw new Error('Category not found');
    }
    product.category = category._id;
  }
};

const updateDescription = async (product, longDescription, additionalInfo) => {
  // SANITIZE here as well
  const safeLongDescription = longDescription ? sanitizeHtml(longDescription) : undefined;
  const safeAdditionalInfo = additionalInfo ? sanitizeHtml(additionalInfo) : undefined;
  if (safeLongDescription || safeAdditionalInfo) {
    const description = await Description.findById(product.description);
    if (description) {
      description.longDescription = safeLongDescription || description.longDescription;
      description.additionalInfo = safeAdditionalInfo || description.additionalInfo;
      await description.save();
    } else if (safeLongDescription) {
      const newDescription = new Description({ longDescription: safeLongDescription, additionalInfo: safeAdditionalInfo });
      await newDescription.save();
      product.description = newDescription._id;
    }
  }
};

const updateProductFields = (product, name, price, stock) => {
  if (name) product.name = name;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  product.updatedAt = Date.now();
};

const getPopulatedProduct = async (productId) => {
  return await Product.findById(productId)
    .populate('category', 'name')
    .populate('description', 'longDescription additionalInfo');
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.remove();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
