import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
export const validators = {
  // UUID validation
  uuid: (field: string) =>
    body(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`),

  // Email validation
  email: (field: string = 'email') =>
    body(field)
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),

  // Required string
  requiredString: (field: string, min: number = 1, max: number = 500) =>
    body(field)
      .isString()
      .withMessage(`${field} must be a string`)
      .trim()
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`),

  // Optional string
  optionalString: (field: string, max: number = 500) =>
    body(field)
      .optional()
      .isString()
      .withMessage(`${field} must be a string`)
      .trim()
      .isLength({ max })
      .withMessage(`${field} must be max ${max} characters`),

  // Boolean
  boolean: (field: string) =>
    body(field)
      .optional()
      .isBoolean()
      .withMessage(`${field} must be a boolean`)
      .toBoolean(),

  // Integer
  integer: (field: string, min?: number, max?: number) =>
    body(field)
      .isInt({ min, max })
      .withMessage(`${field} must be an integer${min ? ` >= ${min}` : ''}${max ? ` <= ${max}` : ''}`)
      .toInt(),

  // URL validation
  url: (field: string) =>
    body(field)
      .isURL()
      .withMessage(`${field} must be a valid URL`),

  // Push subscription validation
  subscription: () => [
    body('subscription')
      .exists()
      .withMessage('subscription is required')
      .isObject()
      .withMessage('subscription must be an object'),
    
    body('subscription.endpoint')
      .isString()
      .withMessage('subscription.endpoint must be a string')
      .isURL()
      .withMessage('subscription.endpoint must be a valid URL'),
    
    body('subscription.keys')
      .exists()
      .withMessage('subscription.keys is required')
      .isObject()
      .withMessage('subscription.keys must be an object'),
    
    body('subscription.keys.auth')
      .isString()
      .withMessage('subscription.keys.auth must be a string')
      .notEmpty()
      .withMessage('subscription.keys.auth cannot be empty'),
    
    body('subscription.keys.p256dh')
      .isString()
      .withMessage('subscription.keys.p256dh must be a string')
      .notEmpty()
      .withMessage('subscription.keys.p256dh cannot be empty'),
  ],
};

/**
 * Specific validation sets for routes
 */

// POST /subscribe validation
export const validateSubscribe = [
  validators.uuid('userId'),
  ...validators.subscription(),
  handleValidationErrors,
];

// DELETE /unsubscribe validation
export const validateUnsubscribe = [
  validators.uuid('userId'),
  validators.url('endpoint'),
  handleValidationErrors,
];

// POST /test-notification validation
export const validateTestNotification = [
  validators.uuid('userId'),
  handleValidationErrors,
];

// POST /notify-rally validation
export const validateNotifyRally = [
  validators.uuid('rallyId'),
  handleValidationErrors,
];

// POST /trigger-scrape validation (no body, but could add auth header validation)
export const validateTriggerScrape = [
  // Could add admin token validation here
  handleValidationErrors,
];
