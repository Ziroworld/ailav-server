const HomomorphicEncryption = require('../utils/homomorphicEncryption');
const EncryptedAnalytics = require('../model/encryptedAnalyticsModel');
const User = require('../model/userModel');
const crypto = require('crypto');

const he = new HomomorphicEncryption();

// Track user behavior securely
const trackUserAnalytics = async (req, res) => {
  try {
    const { userId, action, data } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash user ID for privacy
    const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');

    // Encrypt analytics data
    const encryptedData = he.encryptUserAnalytics({
      userId,
      action,
      data,
      timestamp: Date.now()
    });

    // Prepare metadata
    const metadata = {
      ipHash: req.ip,
      userAgentHash: req.headers['user-agent'],
      sessionId: req.sessionID,
      deviceType: req.headers['sec-ch-ua-platform'] || 'unknown',
      browserType: req.headers['sec-ch-ua'] || 'unknown'
    };

    // Store encrypted analytics
    await EncryptedAnalytics.create({
      userId: hashedUserId,
      encryptedData: encryptedData,
      action,
      timestamp: Date.now(),
      metadata
    });

    res.status(200).json({ message: 'Analytics tracked securely' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Track order analytics securely
const trackOrderAnalytics = async (req, res) => {
  try {
    const { orderId, userId, totalAmount, itemCount, paymentMethod } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash user ID for privacy
    const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');

    // Encrypt order data
    const encryptedOrderData = he.encryptOrderData({
      orderId,
      userId,
      totalAmount,
      itemCount,
      paymentMethod,
      orderDate: new Date()
    });

    // Store encrypted order analytics
    await EncryptedAnalytics.create({
      userId: hashedUserId,
      encryptedData: encryptedOrderData,
      action: 'order_created',
      timestamp: Date.now(),
      orderData: {
        orderId: encryptedOrderData.orderId,
        totalAmount: encryptedOrderData.totalAmount,
        itemCount: encryptedOrderData.itemCount,
        paymentMethod: encryptedOrderData.paymentMethod,
        orderDate: new Date()
      },
      metadata: {
        ipHash: req.ip,
        userAgentHash: req.headers['user-agent'],
        sessionId: req.sessionID
      }
    });

    res.status(200).json({ message: 'Order analytics tracked securely' });
  } catch (error) {
    console.error('Order analytics tracking error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get aggregated analytics without exposing individual data
const getAggregatedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, aggregationType, reportType } = req.query;
    
    // Query encrypted analytics
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const encryptedAnalytics = await EncryptedAnalytics.find(query);
    
    if (encryptedAnalytics.length === 0) {
      return res.json({ aggregatedData: null, count: 0 });
    }

    // Aggregate encrypted data
    const aggregatedResult = he.aggregateEncryptedAnalytics(
      encryptedAnalytics.map(a => a.encryptedData),
      aggregationType || 'sum'
    );

    // Generate secure report
    const secureReport = he.generateSecureReport(
      encryptedAnalytics.map(a => a.encryptedData),
      reportType || 'summary'
    );

    res.json({
      aggregatedData: aggregatedResult,
      secureReport,
      count: encryptedAnalytics.length,
      timeRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user-specific analytics (decrypted only for the user)
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Ensure user can only access their own data
    if (userId !== requestingUserId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');
    const userAnalytics = await EncryptedAnalytics.find({
      userId: hashedUserId
    }).sort({ timestamp: -1 }).limit(100);

    // Decrypt user's own data
    const decryptedAnalytics = userAnalytics.map(analytics => {
      const key = Buffer.from(analytics.encryptedData.encryptionKey, 'hex');
      return {
        action: analytics.action,
        timestamp: analytics.timestamp,
        data: he.decryptNumber(analytics.encryptedData.purchaseAmount, key)
      };
    });

    res.json({ analytics: decryptedAnalytics });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get analytics trends
const getAnalyticsTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const encryptedAnalytics = await EncryptedAnalytics.find(query);
    
    if (encryptedAnalytics.length === 0) {
      return res.json({ trends: [], message: 'No data available' });
    }

    // Generate trends report
    const trendsReport = he.generateSecureReport(
      encryptedAnalytics.map(a => a.encryptedData),
      'trends'
    );

    res.json({
      trends: trendsReport.trends,
      timeGroups: Object.keys(trendsReport.timeGroups || {}),
      count: encryptedAnalytics.length
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get analytics summary for dashboard
const getAnalyticsSummary = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get analytics for different time periods
    const [monthlyAnalytics, weeklyAnalytics, dailyAnalytics] = await Promise.all([
      EncryptedAnalytics.find({ timestamp: { $gte: lastMonth } }),
      EncryptedAnalytics.find({ timestamp: { $gte: lastWeek } }),
      EncryptedAnalytics.find({ timestamp: { $gte: lastDay } })
    ]);

    // Generate summaries
    const monthlySummary = he.generateSecureReport(
      monthlyAnalytics.map(a => a.encryptedData),
      'summary'
    );

    const weeklySummary = he.generateSecureReport(
      weeklyAnalytics.map(a => a.encryptedData),
      'summary'
    );

    const dailySummary = he.generateSecureReport(
      dailyAnalytics.map(a => a.encryptedData),
      'summary'
    );

    res.json({
      monthly: monthlySummary,
      weekly: weeklySummary,
      daily: dailySummary,
      totalRecords: monthlyAnalytics.length
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  trackUserAnalytics,
  trackOrderAnalytics,
  getAggregatedAnalytics,
  getUserAnalytics,
  getAnalyticsTrends,
  getAnalyticsSummary
}; 