const Address = require('../model/addressModel');

// Add a new address
const addAddress = async (req, res) => {
    try {
        // Extract only the required fields:
        const { userId, addressLine1, addressLine2, city, state, postalCode, country } = req.body;

        const address = await Address.create({
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
        });

        res.status(201).json({ message: 'Address added successfully', address });
    } catch (error) {
        console.error('Error adding address:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all addresses for a user
const getAddresses = async (req, res) => {
    try {
        const { userId } = req.params;

        const addresses = await Address.find({ userId });
        res.status(200).json({ addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update an address
const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        // Only update the allowed fields:
        const updatedData = req.body; // Expect only addressLine1, addressLine2, city, state, postalCode, county

        const address = await Address.findByIdAndUpdate(id, updatedData, { new: true });
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address updated successfully', address });
    } catch (error) {
        console.error('Error updating address:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Delete an address
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const address = await Address.findByIdAndDelete(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
};
