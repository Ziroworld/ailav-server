const express = require('express');
const cors = require('cors');
const app = express();

const userRoutes = require('../routes/userRoutes');
const authRoutes = require("../routes/authRoute");
const productRoutes = require('../routes/productRoute');
const categoryRoutes = require('../routes/categoryRoute');
const cartRoutes = require('../routes/cartRoute');
const addressRoutes = require('../routes/addressRoute');
const paymentRoutes = require('../routes/paymentRoute');
const orderRoutes = require('../routes/orderRoute');

// --- CORS middleware (put this before routes!)
app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true
}));

// For parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get("/", (req, res) => {
    res.send('Hello Rohan');
});

// Routes
app.use('/api/V3/users', userRoutes);
app.use('/api/V3/auth', authRoutes);
app.use('/api/V3/product', productRoutes);
app.use('/api/V3/category', categoryRoutes);
app.use('/api/V3/cart', cartRoutes);
app.use('/api/V3/address', addressRoutes);
app.use('/api/V3/payment', paymentRoutes);
app.use('/api/V3/order', orderRoutes);

module.exports = app;
