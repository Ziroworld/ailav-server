const express = require('express');
const router = express.Router();
const {createProduct, getAllProducts, getProductById, deleteProduct, updateProduct} = require('../controller/productController');
const { authenticateAccessToken } = require('../security/userSecurity');
// Product routes
router.post('/save', createProduct);
router.get('/findall', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', authenticateAccessToken, deleteProduct);

module.exports = router;
