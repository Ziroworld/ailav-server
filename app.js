const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(express.json());

// Default Route
app.get("/", (req, res) => {
    res.send('Hello Rohan');
});

// Routes
app.use("/api/", userRoutes);

module.exports = app;