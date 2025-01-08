const express = require('express');
const router = express.Router();

const { createCategory, deleteCategoryById, getAllCategories, getCategoryById, updateCategoryById} = require('../controller/categoryController');

// Category routes
// Category routes
router.post('/save', createCategory); // Create a new category
router.get('/findall', getAllCategories); // Get all categories
router.get('/:id', getCategoryById); // Get a category by ID
router.put('/:id', updateCategoryById); // Update a category by ID
router.delete('/:id', deleteCategoryById); // Delete a category by ID

module.exports = router;
