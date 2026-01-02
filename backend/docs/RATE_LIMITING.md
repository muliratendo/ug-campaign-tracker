# Rate Limiting Implementation - Testing Guide

## Overview

IP-based rate limiting has been successfully implemented to protect your backend API from abuse, especially the TomTom proxy endpoints.

---

## Rate Limit Tiers

### 1. General API Limiter (`apiLimiter`)

**Applied to**: All `/api/*` routes

**Limits**:

- 100 requests per 15 minutes per IP
- Applies to: `/api/rallies`, `/api/traffic`, `/api/subscribe`

**Response Headers**:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

**When Exceeded**:

```json
HTTP 429 Too Many Requests
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

### 2. Strict Limiter (`strictLimiter`)

**Applied to**: Admin/intensive endpoints

**Limits**:

- 5 requests per hour per IP
- Applies to: `/api/trigger-scrape`

**When Exceeded**:

```json
HTTP 429 Too Many Requests
{
  "message": "Too many admin requests from this IP, please wait before retrying."
}
```

---

### 3. Auth Limiter (Configured but Not Yet Applied)

**Ready for**: Login/signup endpoints

**Limits**:

- 10 requests per 15 minutes per IP
- `skipSuccessfulRequests: true` - Only failed attempts count

---

## Testing Rate Limits

### Test General API Limit

```bash
# Make 101 requests to the rallies endpoint
for i in {1..101}; do
  echo "Request $i:"
  curl -i http://localhost:3001/api/rallies | head -n 1
  sleep 0.1
done

# Expected:
# - Requests 1-100: HTTP 200 OK
# - Request 101: HTTP 429 Too Many Requests
```

### Test Strict Admin Limit

```bash
# Make 6 trigger-scrape requests
for i in {1..6}; do
  echo "Request $i:"
  curl -i -X POST http://localhost:3001/api/trigger-scrape | head -n 1
  sleep 1
done

# Expected:
# - Requests 1-5: HTTP 200 OK
# - Request 6: HTTP 429 Too Many Requests
```

### Check Rate Limit Headers

```bash
curl -i http://localhost:3001/api/rallies

# Look for headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: <unix_timestamp>
```

---

## Implementation Files

### Created

**`backend/src/middleware/rateLimiter.ts`**

- Exports: `apiLimiter`, `strictLimiter`, `authLimiter`
- Uses `express-rate-limit` package
- Configurable time windows and request limits

### Modified

**`backend/src/index.ts`**

- Imported `apiLimiter`
- Applied to all `/api` routes via: `app.use('/api', apiLimiter)`

**`backend/src/routes/api.ts`**

- Imported `strictLimiter`
- Applied to `/trigger-scrape` endpoint

**`backend/package.json`**

- Added dependency: `express-rate-limit`

---

## Production Considerations

### 1. Behind a Proxy?

If your app runs behind a reverse proxy (Nginx, Vercel, etc.), enable trust proxy:

```typescript
// In index.ts
app.set("trust proxy", 1); // Trust first proxy
```

### 2. Redis Store (Optional)

For distributed servers, use Redis to share rate limit state:

```bash
npm install rate-limit-redis
```

```typescript
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });

export const apiLimiter = rateLimit({
  store: new RedisStore({ client }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### 3. Custom Key Generator

Rate limit by user ID instead of IP for authenticated routes:

```typescript
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip, // Fallback to IP
});
```

### 4. Skip Conditions

Skip rate limiting for internal requests:

```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) =>
    req.ip === "127.0.0.1" ||
    req.headers["x-api-key"] === process.env.INTERNAL_API_KEY,
});
```

---

## Monitoring

### Log Rate Limit Events

```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      message: "Too many requests from this IP, please try again later.",
    });
  },
});
```

### Track in Analytics

Integrate with logging services (e.g., Sentry, LogRocket) to monitor abuse patterns.

---

## Next Steps

1. **Test in Development**: Verify rate limits work as expected
2. **Adjust Limits**: Fine-tune based on expected traffic
3. **Monitor in Production**: Watch for false positives
4. **Add to CI**: Document rate limits in API docs
5. **Consider IP Whitelisting**: For trusted integrations

---

## Verification

✅ **Package Installed**: `express-rate-limit`  
✅ **Middleware Created**: `rateLimiter.ts`  
✅ **Applied to API**: All `/api` routes protected  
✅ **Strict Limits**: Admin endpoints secured  
✅ **TypeScript**: Lint and build passing

Rate limiting is now active and protecting your backend!
