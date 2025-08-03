const crypto = require('crypto');
const { EventEmitter } = require('events');

class RASPMonitor extends EventEmitter {
  constructor() {
    super();
    this.threatScore = new Map();
    this.blockedIPs = new Set();
    this.suspiciousPatterns = {
      sqlInjection: [
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
        /(\b(union|select).*from)/i,
        /(\b(exec|execute|xp_cmdshell)\b)/i,
        /(\b(union|select).*where)/i,
        /(\b(union|select).*order\s+by)/i
      ],
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<link[^>]*>/gi,
        /<meta[^>]*>/gi
      ],
      pathTraversal: [
        /\.\.\//g,
        /\.\.\\/g,
        /%2e%2e%2f/gi,
        /%2e%2e%5c/gi,
        /\.\.%2f/gi,
        /\.\.%5c/gi
      ],
      commandInjection: [
        /(\b(cat|ls|pwd|whoami|id|uname)\b)/i,
        /(\b(rm|del|mkdir|touch)\b)/i,
        /(\b(netcat|nc|telnet|ssh)\b)/i,
        /(\b(wget|curl|ftp)\b)/i,
        /(\b(ping|nslookup|dig)\b)/i,
        /(\b(ps|top|kill)\b)/i
      ],
      noSqlInjection: [
        /(\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin)/i,
        /(\$where|\$regex|\$text)/i,
        /(\$or|\$and|\$not)/i,
        /(\$exists|\$type|\$mod)/i
      ],
      ldapInjection: [
        /(\*|\||&|!|\(|\))/g,
        /(\b(uid|cn|ou|dc)\b)/i,
        /(\b(ldap|ldaps)\b)/i
      ]
    };
  }

  analyzeRequest(req) {
    const threatIndicators = [];
    const requestData = {
      url: req.url,
      method: req.method,
      body: JSON.stringify(req.body),
      headers: JSON.stringify(req.headers),
      query: JSON.stringify(req.query),
      params: JSON.stringify(req.params),
      ip: req.ip
    };

    // Check for suspicious patterns
    Object.entries(this.suspiciousPatterns).forEach(([threatType, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(requestData.url) || 
            pattern.test(requestData.body) || 
            pattern.test(requestData.query) ||
            pattern.test(requestData.params)) {
          threatIndicators.push({
            type: threatType,
            pattern: pattern.source,
            severity: this.getThreatSeverity(threatType),
            matched: pattern.exec(requestData.url || requestData.body || requestData.query || requestData.params)?.[0]
          });
        }
      });
    });

    // Rate limiting analysis
    const ip = req.ip;
    const currentScore = this.threatScore.get(ip) || 0;
    const newScore = currentScore + threatIndicators.length * 10;

    // Block IP if score exceeds threshold
    if (newScore > 50) {
      this.blockedIPs.add(ip);
      this.emit('threatDetected', {
        type: 'RATE_LIMIT_EXCEEDED',
        ip,
        score: newScore,
        request: requestData,
        timestamp: new Date()
      });
    }

    this.threatScore.set(ip, newScore);

    return {
      isThreat: threatIndicators.length > 0,
      indicators: threatIndicators,
      score: newScore,
      isBlocked: this.blockedIPs.has(ip)
    };
  }

  getThreatSeverity(threatType) {
    const severityMap = {
      sqlInjection: 'CRITICAL',
      commandInjection: 'CRITICAL',
      noSqlInjection: 'CRITICAL',
      xss: 'HIGH',
      pathTraversal: 'HIGH',
      ldapInjection: 'HIGH'
    };
    return severityMap[threatType] || 'MEDIUM';
  }

  resetScore(ip) {
    this.threatScore.delete(ip);
    this.blockedIPs.delete(ip);
  }

  getThreatStats() {
    return {
      totalThreats: this.threatScore.size,
      blockedIPs: this.blockedIPs.size,
      averageScore: Array.from(this.threatScore.values()).reduce((a, b) => a + b, 0) / this.threatScore.size || 0
    };
  }
}

const raspMonitor = new RASPMonitor();

// RASP Middleware
const raspMiddleware = (req, res, next) => {
  const analysis = raspMonitor.analyzeRequest(req);

  if (analysis.isBlocked) {
    return res.status(403).json({
      error: 'Access denied due to suspicious activity',
      code: 'RASP_BLOCKED',
      timestamp: new Date().toISOString()
    });
  }

  if (analysis.isThreat) {
    // Log threat for analysis
    console.error('🚨 RASP Threat Detected:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      indicators: analysis.indicators,
      score: analysis.score,
      timestamp: new Date().toISOString()
    });

    // Emit event for external monitoring
    raspMonitor.emit('threatDetected', {
      ip: req.ip,
      analysis,
      request: {
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers,
        query: req.query,
        params: req.params
      },
      timestamp: new Date()
    });

    // Add security headers
    res.setHeader('X-Security-Score', analysis.score);
    res.setHeader('X-Threat-Detected', 'true');
    res.setHeader('X-Threat-Count', analysis.indicators.length);
  }

  // Add request fingerprint
  const fingerprint = crypto.createHash('sha256')
    .update(`${req.ip}-${req.headers['user-agent']}-${req.url}-${Date.now()}`)
    .digest('hex');
  
  req.securityFingerprint = fingerprint;
  req.threatScore = analysis.score;

  next();
};

module.exports = { raspMiddleware, raspMonitor }; 