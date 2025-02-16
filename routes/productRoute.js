const express = require('express');
const router = express.Router();
const {createProduct, getAllProducts, getProductById, deleteProduct, updateProduct} = require('../controller/productController');
const { authenticateToken } = require('../security/userSecurity');
// Product routes
router.post('/save', createProduct);
router.get('/findall', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;
