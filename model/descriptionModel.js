
const mongoose = require('mongoose');
const { Schema } = mongoose;
const Product = require('./productModel'); // Import the Product model

const DescriptionSchema = new Schema({
    longDescription: {
        type: String,
        required: true,
    },
    additionalInfo: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to handle cascading update
DescriptionSchema.pre('remove', async function (next) {
    try {
        // Set the description field in related products to null
        await Product.updateMany({ description: this._id }, { $unset: { description: "" } });
        console.log(`Description references removed from products.`);
        next();
    } catch (err) {
        console.error('Error in cascading update for Description:', err.message);
        next(err);
    }
});

module.exports = mongoose.model('Description', DescriptionSchema);
