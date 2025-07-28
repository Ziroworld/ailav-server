const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, updateAddress, deleteAddress } = require('../controller/addressController');
const { authenticateAccessToken } = require('../security/userSecurity');

// Add a new address
router.post('/add', authenticateAccessToken, addAddress);

// Get all addresses for a user
router.get('/:userId', authenticateAccessToken, getAddresses);

// Update an address
router.put('/update/:id', authenticateAccessToken, updateAddress);

// Delete an address
router.delete('/delete/:id', authenticateAccessToken, deleteAddress);

module.exports = router;
