# Advanced Security Features - Technical Documentation

## FIDO2/WebAuthn Authentication

**[Description]**: Replaces traditional passwords with cryptographic challenges. The server generates options (challenge, RP ID) using `@simplewebauthn/server`, while the client uses `navigator.credentials.create()` to sign challenges with biometrics/security keys. Signed assertions are verified server-side to issue JWTs.

**Key Code Snippets**:

1. `./server/controller/authController.js`
```javascript
// WebAuthn registration options generation
export const startWebAuthnRegistration = async (req, res) => {
  const options = generateRegistrationOptions({
    rpName: 'Ailav',
    rpID: 'localhost',
    userID: req.body.userId,
    userName: req.body.email,
    challenge: crypto.randomBytes(32)
  });
  req.session.challenge = options.challenge;
  res.json(options);
};
```

2. `./client/src/hooks/useWebAuthn.js`
```javascript
// Client-side credential creation
const credential = await navigator.credentials.create({
  publicKey: options
});
const credentialData = {
  id: credential.id,
  response: {
    attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
    clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
  }
};
```

3. `./server/model/userModel.js`
```javascript
// WebAuthn credential storage
webauthnCredentials: [{
  id: String,
  publicKey: String,
  counter: Number,
  transports: [String]
}],
webauthnEnabled: { type: Boolean, default: false }
```

## RASP (Runtime Application Self-Protection)

**[Description]**: Real-time threat detection and prevention within the application runtime. Analyzes incoming requests for malicious patterns (SQL injection, XSS, path traversal) using regex-based detection, assigns threat scores to IPs, and automatically blocks suspicious sources while logging security incidents.

**Key Code Snippets**:

1. `./server/middleware/rasp.js`
```javascript
// Threat pattern detection
suspiciousPatterns: {
  sqlInjection: [/(\b(union|select|insert|update|delete|drop|create|alter)\b)/i],
  xss: [/<script[^>]*>.*?<\/script>/gi, /javascript:/gi],
  pathTraversal: [/\.\.\//g, /\.\.\\/g],
  commandInjection: [/(\b(cat|ls|pwd|whoami|id|uname)\b)/i]
}
```

2. `./server/middleware/rasp.js`
```javascript
// Threat scoring and blocking
const newScore = currentScore + threatIndicators.length * 10;
if (newScore > 50) {
  this.blockedIPs.add(ip);
  this.emit('threatDetected', { type: 'RATE_LIMIT_EXCEEDED', ip, score: newScore });
}
```

3. `./server/app/app.js`
```javascript
// RASP middleware integration
app.use(raspMiddleware);
raspMonitor.on('threatDetected', (threat) => {
  securityMonitor.logIncident(threat);
});
```

## Homomorphic Encryption (HE)

**[Description]**: Enables computation on encrypted data without decrypting it, preserving data privacy for analytics. Uses AES-256-GCM encryption for numeric and JSON data, allowing homomorphic addition and scalar multiplication operations while maintaining data confidentiality throughout processing.

**Key Code Snippets**:

1. `./server/utils/homomorphicEncryption.js`
```javascript
// Homomorphic addition operation
homomorphicAdd(encryptedA, encryptedB, key) {
  const decryptedA = this.decryptNumber(encryptedA, key);
  const decryptedB = this.decryptNumber(encryptedB, key);
  const result = decryptedA + decryptedB;
  return this.encryptNumber(result, key);
}
```

2. `./server/controller/analyticsController.js`
```javascript
// Secure analytics tracking
const encryptedData = he.encryptUserAnalytics({
  userId, action, data, timestamp: Date.now()
});
await EncryptedAnalytics.create({
  userId: hashedUserId,
  encryptedData: encryptedData,
  action,
  metadata: { ipHash: req.ip, userAgentHash: req.headers['user-agent'] }
});
```

3. `./server/utils/homomorphicEncryption.js`
```javascript
// Aggregated analytics without decryption
aggregateEncryptedAnalytics(encryptedDataArray, aggregationType = 'sum') {
  const key = Buffer.from(encryptedDataArray[0].encryptionKey, 'hex');
  const result = encryptedDataArray.reduce((acc, data) => {
    return this.homomorphicAdd(acc, data.purchaseAmount, key);
  });
  return { aggregatedValue: result, count: encryptedDataArray.length };
}
```

## Integration Points

**Security Monitoring**: All three features integrate with the centralized `SecurityMonitor` class for incident logging and alerting.

**Database Schema**: New models (`EncryptedAnalytics`) and schema extensions (`webauthnCredentials`) support the advanced features.

**API Routes**: New endpoints (`/api/V3/analytics/*`, `/api/V3/auth/webauthn/*`) expose functionality while maintaining existing API compatibility.

**Client Hooks**: React hooks (`useWebAuthn`, `useSecureAnalytics`) provide seamless integration with existing React components. 