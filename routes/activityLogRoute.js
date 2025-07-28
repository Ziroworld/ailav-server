const express = require("express");
const router = express.Router();
const ActivityLog = require("../model/ActivityLog");
const authenticate = require("../middleware/auth");
const Credential = require("../model/credentialModel");

/**
 * Admin check middleware: Always checks latest role from the DB.
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Fetch latest credential from DB (prevents privilege escalation)
    const cred = await Credential.findOne({ userId: req.user.userId });
    if (!cred || cred.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Optionally update req.user.role to match DB value (consistency)
    req.user.role = cred.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error during admin check" });
  }
};

// Get latest activity logs (admin only)
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
