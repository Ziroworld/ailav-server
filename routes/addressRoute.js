const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, updateAddress, deleteAddress } = require('../controller/addressController');

// Add a new address
router.post('/add', addAddress);

// Get all addresses for a user
router.get('/:userId', getAddresses);

// Update an address
router.put('/update/:id', updateAddress);

// Delete an address
router.delete('/delete/:id', deleteAddress);

module.exports = router;
