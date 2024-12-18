const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/ailavDatabase');
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('Database connection error: ' + err.message);
        process.exit(1); // exit
    }
};

module.exports = connectDB;
