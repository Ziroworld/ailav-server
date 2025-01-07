const mongoose = require('mongooes');
const productModel = require('./productModel');

const CategorySchema = new Schema({
    name : {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Data,
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