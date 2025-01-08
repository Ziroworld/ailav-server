const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes =require("./routes/authRoute")
const productRoutes = require('./routes/productRoute');
const categoryRoutes = require('./routes/categoryRoute');

// Middleware
app.use(express.json());

// Default Route
app.get("/", (req, res) => {
    res.send('Hello Rohan');
});

// Routes
app.use('/api/V3/users', userRoutes);
app.use('/api/V3/auth', authRoutes);
app.use('/api/V3/product', productRoutes);
app.use('/api/V3/category', categoryRoutes);

module.exports = app;