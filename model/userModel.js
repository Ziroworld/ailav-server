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
    // WebAuthn credentials for passwordless authentication
    webauthnCredentials: [{
        credentialID: {
            type: String,
            required: true
        },
        credentialPublicKey: {
            type: String,
            required: true
        },
        counter: {
            type: Number,
            default: 0
        },
        transports: [{
            type: String,
            enum: ['usb', 'ble', 'nfc', 'internal']
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // WebAuthn registration status
    webauthnEnabled: {
        type: Boolean,
        default: false
    }
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
