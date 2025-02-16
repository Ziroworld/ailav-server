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

// Middleware to handle cascading update when a description is removed
DescriptionSchema.pre('remove', async function (next) {
  try {
    // Unset the description field from all products referencing this description
    await Product.updateMany(
      { description: this._id },
      { $unset: { description: "" } }
    );
    console.log(`Removed description references from products.`);
    next();
  } catch (err) {
    console.error('Error during cascading update for Description:', err.message);
    next(err);
  }
});

module.exports = mongoose.model('Description', DescriptionSchema);
