const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true, unique: true },
  userAgent: { type: String },      // Browser/device info (optional, good for security)
  ip:        { type: String },      // Store client IP (optional)
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },  // Set refresh token expiry (e.g., 7 days)
  valid:     { type: Boolean, default: true } // Invalidate on logout
});

module.exports = mongoose.model('Session', sessionSchema);
