const mongoose = require('mongoose');
const productModel = require('./productModel');

const CategorySchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to handle cascading delete
CategorySchema.pre('remove', async function(next){
    try{
        await productModel.deleteMany({ category: this._id});
        console.log(`All products in the category ${this.name}have been removed`);
        next();

    } catch(err){
        console.error("Error in cascadinf the delete for category", err.message);
        next(err);
    }
});

module.exports = mongoose.model('Category',CategorySchema);