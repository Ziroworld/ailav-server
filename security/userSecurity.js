require('dotenv').config();
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;


if (!ACCESS_TOKEN_SECRET) {
    throw new Error('Token secrets not defined. Check your .env file.');
}


function authenticateAccessToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired access token." });
    }
}


module.exports = {
    authenticateAccessToken,
};
