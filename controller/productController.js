const Product = require('../model/productModel');
const Category = require('../model/categoryModel');
const Description = require('../model/descriptionModel');

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, price, stock, categoryName, longDescription, additionalDetails } = req.body;

        // Find the category by name
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(400).json({ message: 'Category not found' });
        }

        // Create the description
        const description = new Description({
            longDescription,
            additionalDetails,
        });
        await description.save();

        // Create the product
        const product = new Product({
            name,
            price,
            stock,
            category: category._id,
            description: description._id,
        });
        await product.save();

        res.status(201).json({
            message: 'Product created successfully',
            product,
        });
    } catch (error) {
        console.error('Error creating product:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name') // Populate category name
            .populate('description', 'text additionalInfo'); // Populate description details

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get a product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('description', 'text additionalInfo');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update an existing product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock, categoryName, longDescription, additionalDetails } = req.body;

        const product = await findProductById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await updateCategoryIfNecessary(product, categoryName);

        await updateDescriptionIfNecessary(product, longDescription, additionalDetails);

        await updateProductFields(product, name, price, stock);

        await product.save();

        res.status(200).json({
            message: 'Product updated successfully',
            product,
        });
    } catch (error) {
        console.error('Error updating product:', error.message);
        res.status(500).json({ message: error.message });
    }
};

const findProductById = async (id) => {
    return await Product.findById(id);
};

const updateCategoryIfNecessary = async (product, categoryName) => {
    if (categoryName) {
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            throw new Error('Category not found');
        }
        product.category = category._id;
    }
};

const updateDescriptionIfNecessary = async (product, longDescription, additionalDetails) => {
    if (longDescription || additionalDetails) {
        const description = await Description.findById(product.description);
        if (description) {
            description.longDescription = longDescription || description.longDescription;
            description.additionalDetails = additionalDetails || description.additionalDetails;
            await description.save();
        }
    }
};

const updateProductFields = async (product, name, price, stock) => {
    Object.assign(product, {
        ...(name && { name }),
        ...(price && { price }),
        ...(stock && { stock }),
    });
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete the product
        await product.remove();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Export the controllers
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
