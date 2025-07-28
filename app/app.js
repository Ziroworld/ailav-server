const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

const userRoutes = require('../routes/userRoutes');
const authRoutes = require("../routes/authRoute");
const productRoutes = require('../routes/productRoute');
const categoryRoutes = require('../routes/categoryRoute');
const cartRoutes = require('../routes/cartRoute');
const addressRoutes = require('../routes/addressRoute');
const orderRoutes = require('../routes/orderRoute');
const activityLogRoute = require("../routes/activityLogRoute");

// --- CORS middleware (put this before routes!)
app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173'],
  credentials: true
}));
// --- Helmet for HTTP security headers
app.use(helmet());
// Add Content Security Policy (CSP) for XSS protection
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://localhost:8080'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
// --- Placeholder for intrusion detection / alerting ---
// In production, integrate with a service like Sentry, Datadog, or custom alerting for suspicious activity

const cookieParser = require('cookie-parser');
app.use(cookieParser());

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
app.use('/api/V3/order', orderRoutes);
app.use("/api/activity-logs", activityLogRoute);


module.exports = app;
