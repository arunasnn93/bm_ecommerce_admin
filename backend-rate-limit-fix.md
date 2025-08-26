# Backend Rate Limiting Fix

## Current Issue
Backend is enforcing very strict rate limits:
- 100 requests per 15 minutes
- Currently exhausted (0 remaining)
- Reset in 544 seconds

## Backend Rate Limit Headers Analysis
```
ratelimit-limit: 100
ratelimit-policy: 100;w=900 (100 requests per 900 seconds)
ratelimit-remaining: 0
ratelimit-reset: 544
retry-after: 544
```

## Solutions

### 1. Immediate (Wait for Reset)
Wait 9 minutes for rate limit to reset.

### 2. Backend Configuration (Recommended)

If you have access to your backend code, look for rate limiting middleware:

#### Express.js with express-rate-limit:
```javascript
// Current (too restrictive)
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Development fix
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1');
  }
});
```

#### NestJS with @nestjs/throttler:
```typescript
// In app.module.ts
ThrottlerModule.forRoot({
  ttl: 900, // 15 minutes
  limit: process.env.NODE_ENV === 'development' ? 1000 : 100,
})
```

#### FastAPI with slowapi:
```python
# Current
limiter = Limiter(key_func=get_remote_address, default_limits=["100/15minutes"])

# Development fix
dev_limits = "1000/15minutes" if os.getenv("ENV") == "development" else "100/15minutes"
limiter = Limiter(key_func=get_remote_address, default_limits=[dev_limits])
```

### 3. Environment-Based Configuration

Create different rate limits for different environments:

```bash
# .env.development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# .env.production  
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. IP Whitelist for Development

Add localhost to whitelist:
```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const isLocalhost = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientIp);
    return process.env.NODE_ENV === 'development' && isLocalhost;
  }
});
```

## Quick Test Commands

Test current rate limits:
```bash
# Check rate limit status
curl -I http://localhost:3000/auth/admin-login

# Check headers
curl -v http://localhost:3000/health
```

## Rate Limit Best Practices

### Development
- 1000+ requests per 15 minutes
- Whitelist localhost/development IPs
- Lower penalties for failed attempts

### Production
- 100 requests per 15 minutes (current)
- Strict enforcement
- Consider implementing:
  - Progressive delays
  - CAPTCHA after multiple failures
  - Account lockout mechanisms
