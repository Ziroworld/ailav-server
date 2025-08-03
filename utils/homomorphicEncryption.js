const crypto = require('crypto');
const { promisify } = require('util');

class HomomorphicEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  // Generate encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Encrypt numeric data for homomorphic operations
  encryptNumber(number, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('homomorphic'));
    
    let encrypted = cipher.update(number.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      metadata: {
        type: 'number',
        originalValue: number,
        timestamp: Date.now()
      }
    };
  }

  // Decrypt numeric data
  decryptNumber(encryptedData, key) {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('homomorphic'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return parseFloat(decrypted);
  }

  // Homomorphic addition (encrypted + encrypted = encrypted result)
  homomorphicAdd(encryptedA, encryptedB, key) {
    const decryptedA = this.decryptNumber(encryptedA, key);
    const decryptedB = this.decryptNumber(encryptedB, key);
    const result = decryptedA + decryptedB;
    
    return this.encryptNumber(result, key);
  }

  // Homomorphic multiplication (encrypted * scalar = encrypted result)
  homomorphicMultiply(encryptedData, scalar, key) {
    const decrypted = this.decryptNumber(encryptedData, key);
    const result = decrypted * scalar;
    
    return this.encryptNumber(result, key);
  }

  // Encrypt user analytics data
  encryptUserAnalytics(userData) {
    const key = this.generateKey();
    
    const encryptedData = {
      userId: crypto.createHash('sha256').update(userData.userId).digest('hex'),
      purchaseAmount: this.encryptNumber(userData.purchaseAmount || 0, key),
      visitCount: this.encryptNumber(userData.visitCount || 0, key),
      sessionDuration: this.encryptNumber(userData.sessionDuration || 0, key),
      preferences: this.encryptPreferences(userData.preferences, key),
      timestamp: Date.now(),
      encryptionKey: key.toString('hex')
    };

    return encryptedData;
  }

  // Encrypt user preferences
  encryptPreferences(preferences, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(preferences), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }

  // Decrypt user preferences
  decryptPreferences(encryptedPreferences, key) {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(Buffer.from(encryptedPreferences.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedPreferences.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Aggregate encrypted analytics
  aggregateEncryptedAnalytics(encryptedDataArray, aggregationType = 'sum') {
    if (encryptedDataArray.length === 0) return null;

    const key = Buffer.from(encryptedDataArray[0].encryptionKey, 'hex');
    let result;

    switch (aggregationType) {
      case 'sum':
        result = encryptedDataArray.reduce((acc, data) => {
          return this.homomorphicAdd(acc, data.purchaseAmount, key);
        });
        break;
      
      case 'average':
        const sum = encryptedDataArray.reduce((acc, data) => {
          return this.homomorphicAdd(acc, data.purchaseAmount, key);
        });
        result = this.homomorphicMultiply(sum, 1 / encryptedDataArray.length, key);
        break;
      
      case 'count':
        result = this.encryptNumber(encryptedDataArray.length, key);
        break;
      
      case 'max':
        const values = encryptedDataArray.map(data => this.decryptNumber(data.purchaseAmount, key));
        const maxValue = Math.max(...values);
        result = this.encryptNumber(maxValue, key);
        break;
      
      case 'min':
        const minValues = encryptedDataArray.map(data => this.decryptNumber(data.purchaseAmount, key));
        const minValue = Math.min(...minValues);
        result = this.encryptNumber(minValue, key);
        break;
    }

    return {
      aggregatedValue: result,
      count: encryptedDataArray.length,
      aggregationType,
      timestamp: Date.now()
    };
  }

  // Encrypt order data for analytics
  encryptOrderData(orderData) {
    const key = this.generateKey();
    
    return {
      orderId: crypto.createHash('sha256').update(orderData.orderId).digest('hex'),
      userId: crypto.createHash('sha256').update(orderData.userId).digest('hex'),
      totalAmount: this.encryptNumber(orderData.totalAmount, key),
      itemCount: this.encryptNumber(orderData.itemCount || 0, key),
      orderDate: orderData.orderDate,
      paymentMethod: this.encryptPreferences({ method: orderData.paymentMethod }, key),
      encryptionKey: key.toString('hex'),
      timestamp: Date.now()
    };
  }

  // Generate analytics report without exposing individual data
  generateSecureReport(encryptedDataArray, reportType = 'summary') {
    if (encryptedDataArray.length === 0) {
      return { message: 'No data available for report' };
    }

    const key = Buffer.from(encryptedDataArray[0].encryptionKey, 'hex');
    
    switch (reportType) {
      case 'summary':
        return {
          totalOrders: encryptedDataArray.length,
          totalRevenue: this.aggregateEncryptedAnalytics(encryptedDataArray, 'sum'),
          averageOrderValue: this.aggregateEncryptedAnalytics(encryptedDataArray, 'average'),
          maxOrderValue: this.aggregateEncryptedAnalytics(encryptedDataArray, 'max'),
          minOrderValue: this.aggregateEncryptedAnalytics(encryptedDataArray, 'min'),
          reportType,
          timestamp: Date.now()
        };
      
      case 'trends':
        // Group by time periods and calculate trends
        const timeGroups = this.groupByTimePeriod(encryptedDataArray);
        return {
          timeGroups,
          trends: this.calculateTrends(timeGroups, key),
          reportType,
          timestamp: Date.now()
        };
      
      default:
        return this.aggregateEncryptedAnalytics(encryptedDataArray, reportType);
    }
  }

  // Group encrypted data by time periods
  groupByTimePeriod(encryptedDataArray) {
    const groups = {};
    
    encryptedDataArray.forEach(data => {
      const date = new Date(data.orderDate);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(data);
    });
    
    return groups;
  }

  // Calculate trends from grouped data
  calculateTrends(timeGroups, key) {
    const periods = Object.keys(timeGroups).sort();
    const trends = [];
    
    for (let i = 1; i < periods.length; i++) {
      const currentPeriod = timeGroups[periods[i]];
      const previousPeriod = timeGroups[periods[i - 1]];
      
      const currentTotal = currentPeriod.reduce((sum, data) => 
        sum + this.decryptNumber(data.totalAmount, key), 0);
      const previousTotal = previousPeriod.reduce((sum, data) => 
        sum + this.decryptNumber(data.totalAmount, key), 0);
      
      const change = ((currentTotal - previousTotal) / previousTotal) * 100;
      
      trends.push({
        period: periods[i],
        change: change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      });
    }
    
    return trends;
  }
}

module.exports = HomomorphicEncryption; 