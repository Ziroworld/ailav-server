const express = require('express');
const router = express.Router();
const {createProduct, getAllProducts, getProductById, deleteProduct, updateProduct} = require('../controller/productController');
const { authenticateAccessToken } = require('../security/userSecurity');
const { checkRole } = require('../security/roleSecurity');

// Product routes
router.post('/save', authenticateAccessToken, checkRole('admin'), createProduct);
router.get('/findall', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', authenticateAccessToken, checkRole('admin'), updateProduct);
router.delete('/:id', authenticateAccessToken, checkRole('admin'), deleteProduct);

module.exports = router;
