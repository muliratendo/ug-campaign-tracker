import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * - 100 requests per 15 minutes per IP
 * - Applied to all /api/* routes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for admin/intensive endpoints
 * - 5 requests per hour per IP
 * - Applied to /api/trigger-scrape and similar
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: 'Too many admin requests from this IP, please wait before retrying.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter
 * - 10 requests per 15 minutes per IP
 * - Applied to login/signup endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});
