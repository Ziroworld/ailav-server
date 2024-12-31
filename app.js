const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes =require("./routes/authRoute")

// Middleware
app.use(express.json());

// Default Route
app.get("/", (req, res) => {
    res.send('Hello Rohan');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;