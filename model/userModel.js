const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
    image : {
        type: String,
        required: false,
    },
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
