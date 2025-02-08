const express = require('express');
const router = express.Router();

const { createCategory, deleteCategoryById, getAllCategories, getCategoryById, updateCategoryById} = require('../controller/categoryController');

// Category routes
router.post('/save', createCategory); 
router.get('/findall', getAllCategories); 
router.get('/:id', getCategoryById); 
router.put('/:id', updateCategoryById); 
router.delete('/:id', deleteCategoryById); 

module.exports = router;
