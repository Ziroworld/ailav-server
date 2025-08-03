const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class SecurityMonitor extends EventEmitter {
  constructor() {
    super();
    this.incidents = [];
    this.alertThreshold = 5;
    this.incidentWindow = 5 * 60 * 1000; // 5 minutes
    this.logDir = path.join(__dirname, '../logs');
  }

  async logIncident(incident) {
    const timestamp = new Date();
    const incidentData = {
      ...incident,
      timestamp,
      id: this.generateIncidentId()
    };

    this.incidents.push(incidentData);
    
    // Clean old incidents
    this.incidents = this.incidents.filter(
      incident => timestamp - incident.timestamp < this.incidentWindow
    );

    // Check for alert threshold
    const recentIncidents = this.incidents.filter(
      incident => timestamp - incident.timestamp < 60 * 1000 // Last minute
    );

    if (recentIncidents.length >= this.alertThreshold) {
      await this.triggerAlert(recentIncidents);
    }

    // Log to file
    await this.writeToLog(incidentData);
  }

  async triggerAlert(incidents) {
    const alert = {
      type: 'SECURITY_ALERT',
      severity: 'HIGH',
      message: `Multiple security incidents detected: ${incidents.length} in the last minute`,
      incidents: incidents.map(i => ({
        type: i.type,
        ip: i.ip,
        timestamp: i.timestamp,
        score: i.analysis?.score || 0
      })),
      timestamp: new Date()
    };

    this.emit('securityAlert', alert);
    
    // Send to external monitoring service
    await this.sendToMonitoringService(alert);
  }

  async writeToLog(incident) {
    const logEntry = JSON.stringify(incident) + '\n';
    
    // Ensure logs directory exists
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
    
    const logPath = path.join(this.logDir, 'security.log');
    
    try {
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  async sendToMonitoringService(alert) {
    // Integration with external monitoring (Sentry, DataDog, etc.)
    try {
      if (process.env.SECURITY_WEBHOOK_URL) {
        const response = await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
        
        if (!response.ok) {
          console.error('Failed to send alert to monitoring service:', response.status);
        }
      }
    } catch (error) {
      console.error('Failed to send alert to monitoring service:', error);
    }
  }

  generateIncidentId() {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getIncidentStats() {
    const now = new Date();
    const lastHour = this.incidents.filter(
      incident => now - incident.timestamp < 60 * 60 * 1000
    );
    
    const lastDay = this.incidents.filter(
      incident => now - incident.timestamp < 24 * 60 * 60 * 1000
    );

    return {
      total: this.incidents.length,
      lastHour: lastHour.length,
      lastDay: lastDay.length,
      averageScore: this.incidents.length > 0 
        ? this.incidents.reduce((sum, inc) => sum + (inc.analysis?.score || 0), 0) / this.incidents.length 
        : 0
    };
  }
}

module.exports = SecurityMonitor; 