
// server/penetration_testing.js
const axios = require('axios');
const crypto = require('crypto');
const BASE_URL = 'https://localhost:8080'; // Use your deployed/test URL

// Accept self-signed cert for local testing (REMOVE for production)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Helper for pretty output
function log(sev, msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] [${sev}] ${msg}`);
}

class Pentest {
  constructor() {
    this.results = [];
    this.CRITICAL = "CRITICAL";
    this.HIGH = "HIGH";
    this.MEDIUM = "MEDIUM";
    this.LOW = "LOW";
  }

  async run() {
    log("INFO", "Starting web penetration tests...");
    await this.testNoSQLInjection();
    await this.testXSS();
    await this.testAuthBypass();
    await this.testRateLimit();
    await this.testSensitiveInfo();
    await this.testSessionMgmt();
    await this.testInputValidation();
    this.report();
  }

  addResult({ type, endpoint, payload, severity, message }) {
    this.results.push({ type, endpoint, payload, severity, message });
    log(severity, `${type} | ${endpoint} | ${message}`);
  }

  // === INDIVIDUAL TESTS ===

  async testNoSQLInjection() {
    // Try NoSQL injection on login
    const payloads = [
      { username: { "$ne": null }, password: "whatever" },
      { username: "admin' || '1'=='1", password: "whatever" },
      { username: "admin", password: { "$gt": "" } }
    ];
    for (const payload of payloads) {
      try {
        const res = await axios.post(`${BASE_URL}/api/V3/auth/login`, payload);
        if (res.data && res.data.accessToken) {
          this.addResult({
            type: 'NoSQL Injection',
            endpoint: '/api/V3/auth/login',
            payload,
            severity: this.CRITICAL,
            message: 'Possible NoSQL injection vulnerability! (Access token issued with malicious payload)'
          });
        }
      } catch (e) {
        // Expected: should fail
      }
    }
  }

  async testXSS() {
    // Try to submit an XSS string in product/category creation
    const xssPayload = '<img src=x onerror=alert(1) />';
    // Registration
    try {
      const reg = await axios.post(`${BASE_URL}/api/V3/auth/register`, {
        username: "xss" + crypto.randomBytes(3).toString('hex'),
        name: xssPayload,
        age: 22,
        email: `xss${crypto.randomBytes(4).toString('hex')}@test.com`,
        phone: '9999999999',
        password: 'Test12345!',
        recaptchaToken: 'bypass'
      });
      this.addResult({
        type: 'XSS',
        endpoint: '/api/V3/auth/register',
        payload: xssPayload,
        severity: this.MEDIUM,
        message: 'Submitted XSS payload in registration. Manual review suggested.'
      });
    } catch {}
    // Product creation (needs admin auth, so usually skip unless token known)
  }

  async testAuthBypass() {
    // Try to access a protected route without a token
    const endpoints = [
      { method: 'get', url: '/api/V3/users/user' },
      { method: 'get', url: '/api/activity-logs' },
      { method: 'get', url: '/api/V3/product/findall' }
    ];
    for (const ep of endpoints) {
      try {
        await axios({ method: ep.method, url: `${BASE_URL}${ep.url}` });
        this.addResult({
          type: 'Auth Bypass',
          endpoint: ep.url,
          payload: null,
          severity: this.HIGH,
          message: 'Endpoint accessible without authentication!'
        });
      } catch (err) {
        if (err.response && err.response.status === 401 || err.response.status === 403) {
          // OK, protected as expected
        } else {
          this.addResult({
            type: 'Auth Bypass',
            endpoint: ep.url,
            payload: null,
            severity: this.MEDIUM,
            message: 'Unexpected error/status: ' + (err.response ? err.response.status : err.message)
          });
        }
      }
    }
  }

  async testRateLimit() {
    // Brute-force login
    const payload = { username: 'rateuser', password: 'wrongpass' };
    let blocked = false;
    for (let i = 0; i < 8; i++) {
      try {
        await axios.post(`${BASE_URL}/api/V3/auth/login`, payload);
      } catch (err) {
        if (err.response && /too many/i.test(JSON.stringify(err.response.data))) {
          blocked = true;
          this.addResult({
            type: 'Rate Limiting',
            endpoint: '/api/V3/auth/login',
            payload,
            severity: this.LOW,
            message: 'Rate limiting triggered after several failed attempts.'
          });
          break;
        }
      }
    }
    if (!blocked) {
      this.addResult({
        type: 'Rate Limiting',
        endpoint: '/api/V3/auth/login',
        payload,
        severity: this.HIGH,
        message: 'Rate limiting NOT triggered. Vulnerable to brute force.'
      });
    }
  }

  async testSensitiveInfo() {
    // Try to access server-sensitive files
    const endpoints = ['/../.env', '/config', '/server.js', '/package.json'];
    for (const endpoint of endpoints) {
      try {
        const res = await axios.get(BASE_URL + endpoint);
        if (typeof res.data === 'string' && /(jwt|secret|mongo|password)/i.test(res.data)) {
          this.addResult({
            type: 'Info Disclosure',
            endpoint,
            payload: null,
            severity: this.CRITICAL,
            message: 'Sensitive data disclosed!'
          });
        }
      } catch {
        // Expected: 404 or 403
      }
    }
  }

  async testSessionMgmt() {
    // Use random invalid JWT
    const fakeToken = crypto.randomBytes(32).toString('hex');
    try {
      await axios.get(`${BASE_URL}/api/V3/users/user`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      this.addResult({
        type: 'Session Management',
        endpoint: '/api/V3/users/user',
        payload: fakeToken,
        severity: this.HIGH,
        message: 'Endpoint accessible with invalid token!'
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Expected
      }
    }
  }

  async testInputValidation() {
    // Try to submit invalid/malicious data
    const endpoints = [
      { url: '/api/V3/auth/register', data: { name: '', email: 'notanemail', password: 'short', username: '', age: 0, phone: 'abc', recaptchaToken: 'bypass' } }
    ];
    for (const ep of endpoints) {
      try {
        await axios.post(`${BASE_URL}${ep.url}`, ep.data);
        this.addResult({
          type: 'Input Validation',
          endpoint: ep.url,
          payload: ep.data,
          severity: this.MEDIUM,
          message: 'Accepted invalid input. Input validation missing.'
        });
      } catch {
        // Expected: should reject
      }
    }
  }

  report() {
    log("INFO", "--- Penetration Test Summary ---");
    const counts = { [this.CRITICAL]: 0, [this.HIGH]: 0, [this.MEDIUM]: 0, [this.LOW]: 0 };
    for (const r of this.results) counts[r.severity]++;
    for (const sev of [this.CRITICAL, this.HIGH, this.MEDIUM, this.LOW]) {
      log("INFO", `\n${sev}: ${counts[sev]}`);
      for (const f of this.results.filter(r => r.severity === sev)) {
        log(sev, `${f.type} | ${f.endpoint} | Payload: ${JSON.stringify(f.payload)} | ${f.message}`);
      }
    }
    log("INFO", `Total Findings: ${this.results.length}`);
  }
}

if (require.main === module) {
  (async () => {
    const pt = new Pentest();
    await pt.run();
  })();
}
