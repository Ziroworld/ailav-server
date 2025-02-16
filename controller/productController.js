const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Description = require('../model/descriptionModel');

const createProduct = async (req, res) => {
  try {
    // Destructure payload from the request body.
    // Note: We now expect categoryId and description (used as longDescription).
    const { name, price, inStock, categoryId, description, additionalInfo, imageUrl } = req.body;
    console.log("Received payload:", req.body);

    // Find the category by ID instead of name.
    const category = await Category.findById(categoryId);
    console.log("Found category:", category);
    if (!category) {
      return res.status(400).json({ message: 'Category not found...1234' });
    }

    // Create the description document.
    const descDoc = new Description({
      longDescription: description,
      additionalInfo,
    });
    const savedDescription = await descDoc.save();
    console.log("Saved description:", savedDescription);

    // Create the product document using the category ID.
    const product = new Product({
      name,
      price,
      stock: inStock,
      category: category._id,
      description: savedDescription._id,
      imageUrl, // image URL from Cloudinary
    });
    const savedProduct = await product.save();
    console.log("Saved product:", savedProduct);

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: error.message });
  }
};


/**
 * Get all products with populated category and description fields.
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name') // Populate only the category name
      .populate('description', 'longDescription additionalInfo'); // Populate only necessary description fields

    // Transform the data to send only the required fields
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category?.name || "Unknown Category", // Send category name directly
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

/**
 * Get a product by ID with populated category and description.
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('description', 'longDescription additionalInfo');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing product and its related fields if provided.
 * Expected req.body may include:
 *   name, price, stock, categoryName, longDescription, additionalInfo, imageUrl
 */
const updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      // Added imageUrl to the destructured fields
      const { name, price, stock, categoryName, longDescription, additionalInfo, imageUrl } = req.body;
  
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      await updateCategory(product, categoryName);
      await updateDescription(product, longDescription, additionalInfo);
      await updateProductFields(product, name, price, stock);
  
      // If a new imageUrl is provided, update the product's imageUrl
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
    if (longDescription || additionalInfo) {
      const description = await Description.findById(product.description);
      if (description) {
        description.longDescription = longDescription || description.longDescription;
        description.additionalInfo = additionalInfo || description.additionalInfo;
        await description.save();
      } else if (longDescription) {
        const newDescription = new Description({ longDescription, additionalInfo });
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
  

/**
 * Delete a product.
 * Note: This does not delete the associated Category or Description.
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Remove the product. If any pre('remove') middleware exists on the product, it will run.
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
