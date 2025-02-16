const mongoose = require('mongoose');
const Product = require('./productModel');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to cascade delete all products within a category when the category is removed
CategorySchema.pre('remove', async function (next) {
  try {
    const result = await Product.deleteMany({ category: this._id });
    console.log(`Deleted ${result.deletedCount} product(s) in the category "${this.name}".`);
    next();
  } catch (err) {
    console.error("Error cascading delete for Category:", err.message);
    next(err);
  }
});

module.exports = mongoose.model('Category', CategorySchema);
