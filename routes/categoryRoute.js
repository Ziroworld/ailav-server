const express = require('express');
const router = express.Router();

const { createCategory, deleteCategoryById, getAllCategories, getCategoryById, updateCategoryById} = require('../controller/categoryController');
const { authenticateAccessToken } = require('../security/userSecurity');
const { checkRole } = require('../security/roleSecurity');



// For categories: Only allow admin to create/delete/update!
router.post('/save', authenticateAccessToken, checkRole('admin'), createCategory);
router.put('/:id', authenticateAccessToken, checkRole('admin'), updateCategoryById);
router.delete('/:id', authenticateAccessToken, checkRole('admin'), deleteCategoryById);
// For public browse, no auth needed
router.get('/findall', getAllCategories);
router.get('/:id', getCategoryById);
module.exports = router;
