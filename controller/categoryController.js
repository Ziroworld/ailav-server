const Category = require('../model/categoryModel');
const sanitizeHtml = require('../utils/sanitizeHtml'); // <-- Import the sanitizer

// Create a new category
const createCategory = async (req, res) => {
    try {
        let { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Sanitize the category name
        name = sanitizeHtml(name.trim());

        // Disallow empty category after sanitization
        if (!name) {
            return res.status(400).json({ message: 'Invalid category name' });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({ name });
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        console.error('Error creating category:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ category });
    } catch (error) {
        console.error('Error fetching category:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update category by ID
const updateCategoryById = async (req, res) => {
    try {
        let { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Sanitize the category name
        name = sanitizeHtml(name.trim());
        if (!name) {
            return res.status(400).json({ message: 'Invalid category name' });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        console.error('Error updating category:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Delete category by ID
const deleteCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createCategory, 
    getAllCategories, 
    getCategoryById, 
    updateCategoryById, 
    deleteCategoryById, 
};
