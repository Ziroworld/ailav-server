const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
// const userRoutes = require('./router/userRoutes'); 
// app.use('/user', userRoutes);

// Default Route
app.get("/", (req, res) => {
    res.send('Hello Rohan');
});

module.exports = app;