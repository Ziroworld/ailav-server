require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined. Check your .env file or environment variables.');
}

function generateToken(user) {
    const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
};

function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // ✅ Attach user data
        console.log("Authenticated user:", req.user); // ✅ Debugging
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}


module.exports = {
    generateToken,
    authenticateToken,
};