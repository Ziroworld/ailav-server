const jwt = require("jsonwebtoken");
const Credential = require("../model/credentialModel");
const User = require("../model/userModel");

/**
 * Authenticate middleware: Verifies JWT and attaches user info (including latest role) to req.user.
 * Works with token from cookie or Authorization header.
 */
const authenticate = async (req, res, next) => {
  // SAFELY grab token from either cookie or header
  const token =
    (req.cookies && req.cookies.token) ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }

  try {
    // Use your access token secret
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find credentials by userId from the JWT payload
    // (your JWT should have userId: user._id, role, username, email, etc.)
    const cred = await Credential.findOne({ userId: decoded.userId });
    if (!cred) {
      return res.status(401).json({ message: "Invalid token: Credential not found." });
    }

    const user = await User.findById(cred.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token: User not found." });
    }

    // Attach user and role info to request
    req.user = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: cred.role, // Use the latest role from Credential collection!
      username: cred.username,
      // ...add anything else needed
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;
