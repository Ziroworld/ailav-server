const express = require('express');
const router = express.Router();
const {
  trackUserAnalytics,
  trackOrderAnalytics,
  getAggregatedAnalytics,
  getUserAnalytics,
  getAnalyticsTrends,
  getAnalyticsSummary
} = require('../controller/analyticsController');
const { authenticateAccessToken } = require('../security/userSecurity');
const { checkRole } = require('../security/roleSecurity');

// Track user behavior (authenticated users only)
router.post('/track/user', authenticateAccessToken, trackUserAnalytics);

// Track order analytics (authenticated users only)
router.post('/track/order', authenticateAccessToken, trackOrderAnalytics);

// Get aggregated analytics (admin only)
router.get('/aggregated', authenticateAccessToken, checkRole('admin'), getAggregatedAnalytics);

// Get user-specific analytics (user can only access their own data)
router.get('/user/:userId', authenticateAccessToken, getUserAnalytics);

// Get analytics trends (admin only)
router.get('/trends', authenticateAccessToken, checkRole('admin'), getAnalyticsTrends);

// Get analytics summary for dashboard (admin only)
router.get('/summary', authenticateAccessToken, checkRole('admin'), getAnalyticsSummary);

module.exports = router; 