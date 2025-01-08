const express = require('express');
const router = express.Router();
const {createProduct, getAllProducts, getProductById, deleteProduct, updateProduct} = require('../controller/productController');

// Product routes
router.post('/save', createProduct);
router.get('/findall', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id',deleteProduct);

module.exports = router;
