# Server Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in the Ailav e-commerce server backend. The server employs multiple layers of security to protect against various attack vectors and ensure data integrity.

## Security Features

### 🔐 Authentication & Authorization

#### JWT-Based Authentication
- **Location**: `server/middleware/auth.js`, `server/security/userSecurity.js`
- **Purpose**: Secure token-based authentication system
- **Implementation**: 
  - Verifies JWT tokens from cookies or Authorization headers
  - Validates user credentials against database
  - Attaches user information to request objects
  - Handles token refresh mechanisms

#### Role-Based Access Control (RBAC)
- **Location**: `server/security/roleSecurity.js`
- **Purpose**: Enforces role-based permissions across API endpoints
- **Implementation**: 
  - Middleware function that checks user roles before route access
  - Prevents unauthorized access to admin-only endpoints
  - Returns 403 Forbidden for insufficient privileges

#### FIDO2/WebAuthn Authentication
- **Location**: `server/controller/authController.js`, `server/model/userModel.js`
- **Purpose**: Passwordless authentication using biometrics and security keys
- **Implementation**:
  - Generates cryptographic challenges for registration and authentication
  - Stores WebAuthn credentials securely in user model
  - Verifies signed assertions server-side
  - Integrates with session management for challenge storage

### 🛡️ Request Protection

#### CSRF Protection
- **Location**: `server/utils/csrf.js`
- **Purpose**: Prevents Cross-Site Request Forgery attacks
- **Implementation**:
  - Uses `csurf` middleware with secure cookie configuration
  - Validates CSRF tokens for state-changing requests (POST, PUT, DELETE)
  - Implements HTTP-only, secure, and same-site cookie policies

#### Rate Limiting
- **Location**: `server/utils/rate-limit.js`, `server/utils/loginLimiter.js`
- **Purpose**: Prevents brute force attacks and API abuse
- **Implementation**:
  - Authentication rate limiter: 3 attempts per 10 minutes
  - Login rate limiter: 15 attempts per 10 minutes with IP+username tracking
  - Integrates with reCAPTCHA for additional protection
  - Logs suspicious activity for monitoring

#### reCAPTCHA Integration
- **Location**: `server/utils/recaptcha.js`
- **Purpose**: Human verification for high-risk operations
- **Implementation**:
  - Verifies Google reCAPTCHA tokens
  - Bypasses rate limiting when CAPTCHA is successfully solved
  - Provides fallback protection for automated attacks

### 🔍 Threat Detection & Prevention

#### RASP (Runtime Application Self-Protection)
- **Location**: `server/middleware/rasp.js`
- **Purpose**: Real-time threat detection and automatic blocking
- **Implementation**:
  - Analyzes incoming requests for malicious patterns
  - Detects SQL injection, XSS, path traversal, and command injection attempts
  - Assigns threat scores to IP addresses
  - Automatically blocks suspicious sources
  - Generates security fingerprints for request tracking

#### Security Monitoring
- **Location**: `server/utils/securityMonitor.js`
- **Purpose**: Centralized security incident logging and alerting
- **Implementation**:
  - Logs all security incidents with timestamps and metadata
  - Triggers alerts when incident threshold is exceeded
  - Integrates with external monitoring services via webhooks
  - Maintains incident statistics and threat analytics

### 🔒 Data Protection

#### Homomorphic Encryption
- **Location**: `server/utils/homomorphicEncryption.js`, `server/controller/analyticsController.js`
- **Purpose**: Enables computation on encrypted data without decryption
- **Implementation**:
  - Uses AES-256-GCM encryption for sensitive analytics data
  - Supports homomorphic addition and scalar multiplication
  - Preserves data privacy during analytics processing
  - Stores encrypted analytics in dedicated database model

#### Input Sanitization
- **Location**: `server/utils/sanitizeHtml.js`
- **Purpose**: Prevents XSS attacks through malicious HTML/JavaScript
- **Implementation**:
  - Uses DOMPurify library for HTML sanitization
  - Removes potentially dangerous HTML tags and attributes
  - Maintains data integrity while allowing safe HTML content

### 🌐 Transport Security

#### HTTPS/SSL Configuration
- **Location**: `server/index.js`, `server/app/app.js`
- **Purpose**: Encrypts all client-server communication
- **Implementation**:
  - Uses self-signed certificates for development
  - Configures secure HTTPS server on port 8080
  - Implements HTTP to HTTPS redirect on port 8081
  - Supports Docker environment certificate paths

#### Security Headers
- **Location**: `server/app/app.js`
- **Purpose**: Protects against common web vulnerabilities
- **Implementation**:
  - Helmet.js for comprehensive security headers
  - Content Security Policy (CSP) for XSS prevention
  - Strict CORS configuration with credentials support
  - Secure session configuration with HTTP-only cookies

### 📊 Activity Logging

#### Comprehensive Logging
- **Location**: `server/utils/logActivity.js`, `server/routes/activityLogRoute.js`
- **Purpose**: Tracks user activities for security auditing
- **Implementation**:
  - Logs authentication attempts, rate limit violations, and suspicious activities
  - Records IP addresses, user agents, and request metadata
  - Provides audit trail for security investigations
  - Integrates with security monitoring system

### 🔧 Session Management

#### Secure Session Configuration
- **Location**: `server/app/app.js`
- **Purpose**: Manages user sessions securely
- **Implementation**:
  - Uses secure, HTTP-only cookies with same-site policy
  - Configures session timeout for WebAuthn challenges
  - Implements session secret rotation
  - Supports secure session storage

## Security Architecture

The server implements a multi-layered security approach:

1. **Transport Layer**: HTTPS encryption and security headers
2. **Application Layer**: Authentication, authorization, and input validation
3. **Runtime Layer**: RASP threat detection and rate limiting
4. **Data Layer**: Encryption and secure storage practices
5. **Monitoring Layer**: Comprehensive logging and alerting

## Environment Variables

The following environment variables are required for security features:

- `ACCESS_TOKEN_SECRET`: JWT signing secret
- `SESSION_SECRET`: Session encryption secret
- `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA verification key
- `SECURITY_WEBHOOK_URL`: External monitoring service webhook (optional)
- `IS_DOCKER`: Docker environment flag for certificate paths

## Security Best Practices

- All sensitive operations require authentication
- Rate limiting prevents brute force attacks
- Input validation and sanitization on all endpoints
- Comprehensive logging for security auditing
- Regular security monitoring and alerting
- Secure session and cookie management
- HTTPS enforcement for all communications 