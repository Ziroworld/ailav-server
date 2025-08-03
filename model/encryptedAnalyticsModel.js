const mongoose = require('mongoose');
const { Schema } = mongoose;

const EncryptedAnalyticsSchema = new Schema({
  userId: {
    type: String, // Hashed user ID
    required: true,
    index: true
  },
  encryptedData: {
    type: Schema.Types.Mixed, // Encrypted analytics data
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['purchase', 'view', 'search', 'cart_add', 'cart_remove', 'login', 'logout', 'order_created']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    ipHash: String, // Hashed IP for privacy
    userAgentHash: String, // Hashed user agent
    sessionId: String,
    deviceType: String,
    browserType: String
  },
  // Order-specific analytics
  orderData: {
    orderId: String, // Hashed order ID
    totalAmount: Schema.Types.Mixed, // Encrypted amount
    itemCount: Schema.Types.Mixed, // Encrypted item count
    paymentMethod: Schema.Types.Mixed, // Encrypted payment method
    orderDate: Date
  },
  // User behavior analytics
  userBehavior: {
    sessionDuration: Schema.Types.Mixed, // Encrypted duration
    pageViews: Schema.Types.Mixed, // Encrypted count
    searchQueries: Schema.Types.Mixed, // Encrypted queries
    preferences: Schema.Types.Mixed // Encrypted preferences
  }
});

// Indexes for efficient querying
EncryptedAnalyticsSchema.index({ userId: 1, timestamp: -1 });
EncryptedAnalyticsSchema.index({ action: 1, timestamp: -1 });
EncryptedAnalyticsSchema.index({ 'orderData.orderDate': 1 });
EncryptedAnalyticsSchema.index({ 'metadata.deviceType': 1 });

// Virtual for date range queries
EncryptedAnalyticsSchema.virtual('dateRange').get(function() {
  const date = new Date(this.timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours()
  };
});

// Pre-save middleware to hash sensitive data
EncryptedAnalyticsSchema.pre('save', function(next) {
  const crypto = require('crypto');
  
  // Hash IP if present
  if (this.metadata && this.metadata.ipHash) {
    this.metadata.ipHash = crypto.createHash('sha256').update(this.metadata.ipHash).digest('hex');
  }
  
  // Hash user agent if present
  if (this.metadata && this.metadata.userAgentHash) {
    this.metadata.userAgentHash = crypto.createHash('sha256').update(this.metadata.userAgentHash).digest('hex');
  }
  
  next();
});

// Static method to get analytics by date range
EncryptedAnalyticsSchema.statics.getByDateRange = function(startDate, endDate, action = null) {
  const query = {
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (action) {
    query.action = action;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get user analytics
EncryptedAnalyticsSchema.statics.getUserAnalytics = function(userId, limit = 100) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get aggregated analytics
EncryptedAnalyticsSchema.statics.getAggregatedAnalytics = function(startDate, endDate, groupBy = 'action') {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: `$${groupBy}`,
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('EncryptedAnalytics', EncryptedAnalyticsSchema); 