// src/middleware/security.js - Enhanced security middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
});

// Trial expiry validation
function validateTrialExpiry(req, res, next) {
  const trialEndDate = new Date('2025-12-31'); // Set your trial end date
  const now = new Date();
  
  if (now > trialEndDate) {
    return res.status(403).json({ 
      error: 'Trial period expired',
      message: 'Contact S2R2 Technologies to activate full version',
      contact: 'sales@s2r2tech.com'
    });
  }
  next();
}

// Prevent footer/branding tampering
function validateRequest(req, res, next) {
  const suspiciousPatterns = [
    /S2R2.*remove/i,
    /branding.*false/i,
    /footer.*hide/i,
    /watermark.*disable/i
  ];

  const bodyStr = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(bodyStr));

  if (hasSuspiciousContent) {
    console.warn(`⚠ Suspicious request detected from IP: ${req.ip}`);
    // Log but don't block - just monitor
  }

  next();
}

// Request size limit to prevent DoS
function requestSizeLimit(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (contentLength > MAX_SIZE) {
    return res.status(413).json({ error: 'Request too large' });
  }
  next();
}

module.exports = {
  apiLimiter,
  authLimiter,
  validateTrialExpiry,
  validateRequest,
  requestSizeLimit,
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
};
