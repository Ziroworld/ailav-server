const ActivityLog = require("../model/ActivityLog");

const logActivity = async (req, action, metadata = {}) => {
  try {
    await ActivityLog.create({
      userId: req.user ? req.user._id : null, // req.user injected by auth middleware
      action,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("Activity logging failed:", error.message);
  }
};

module.exports = logActivity;
