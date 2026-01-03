# Security Hardening Implementation Guide

## Overview

Comprehensive security improvements including Row Level Security (RLS) policies and input validation for all API endpoints.

---

## Row Level Security (RLS) Policies

### Files Created

**`backend/supabase/rls_policies.sql`** - Enhanced RLS policies

### What Was Implemented

#### 1. Profile Management

- ✅ Users can insert their own profile (auto-created on signup)
- ✅ Users can view/update/delete only their own profile
- ✅ Auto-create profile trigger when user signs up

#### 2. Subscription Management

- ✅ Split "all" policy into specific CRUD operations
- ✅ Users can only manage their own subscriptions
- ✅ Prevents cross-user subscription access

#### 3. Admin-Only Write Access

- ✅ Only admins can insert/update/delete rallies
- ✅ Only admins can manage candidates
- ✅ Only admins can manage districts
- ✅ Only admins can manage traffic predictions
- ✅ Public read access remains for all users

### How to Apply RLS Policies

**Option 1: Via Supabase Dashboard**

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy content from `backend/supabase/rls_policies.sql`
4. Execute the SQL

**Option 2: Via Supabase CLI**

```bash
cd backend/supabase
supabase db push
```

### Verify RLS Policies

```sql
-- Check all active policies
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check profile auto-creation trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Input Validation

### Files Created

**`backend/src/middleware/validators.ts`** - Validation middleware

### What Was Implemented

#### Validation Functions

- `handleValidationErrors` - Error handler middleware
- `validators.uuid()` - UUID validation
- `validators.email()` - Email validation
- `validators.requiredString()` - Required string with length limits
- `validators.optionalString()` - Optional string validation
- `validators.boolean()` - Boolean validation
- `validators.integer()` - Integer with min/max
- `validators.url()` - URL validation
- `validators.subscription()` - Push subscription object validation

#### Applied to Routes

- ✅ `POST /api/subscribe` - ValidateSubscribe
- ✅ `DELETE /api/unsubscribe` - ValidateUnsubscribe
- ✅ `POST /api/test-notification` - ValidateTestNotification
- ✅ `POST /api/notify-rally` - ValidateNotifyRally

### Validation Response Format

**Success**: Proceeds to route handler

**Failure** (HTTP 400):

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "userId",
      "message": "userId must be a valid UUID"
    },
    {
      "field": "subscription.endpoint",
      "message": "subscription.endpoint must be a valid URL"
    }
  ]
}
```

---

## Testing

### Test Invalid Inputs

**Invalid UUID**:

```bash
curl -X POST http://localhost:3001/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "not-a-uuid",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/...",
      "keys": {"auth": "abc", "p256dh": "def"}
    }
  }'

# Expected: 400 with validation error
```

**Missing Fields**:

```bash
curl -X POST http://localhost:3001/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 - userId is required
```

**Invalid Subscription**:

```bash
curl -X POST http://localhost:3001/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "valid-uuid-here",
    "subscription": {
      "endpoint": "not-a-url"
    }
  }'

# Expected: 400 - subscription.keys is required
```

### Test RLS Policies

**Attempt to Access Another User's Subscription** (via Supabase client):

```javascript
// As User A
const { data, error } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", "user-b-id"); // Different user

// Expected: Empty array (RLS blocks access)
```

**Attempt to Insert Rally as Non-Admin**:

```javascript
// As regular user
const { data, error } = await supabase
  .from('rallies')
  .insert({ title: 'Test Rally', ... });

// Expected: Error - policy violation
```

---

## Security Best Practices Implemented

### 1. Input Validation

- ✅ All user inputs validated before processing
- ✅ UUID format validation prevents SQL injection
- ✅ URL validation ensures valid endpoints
- ✅ String length limits prevent buffer overflows

### 2. Authentication & Authorization

- ✅ RLS policies enforce user-level data isolation
- ✅ Admin role required for sensitive operations
- ✅ Profile auto-creation prevents orphaned subscriptions

### 3. Rate Limiting

- ✅ IP-based rate limiting (already implemented)
- ✅ Strict limits on admin endpoints

### 4. Error Handling

- ✅ Validation errors return descriptive messages
- ✅ 500 errors don't expose stack traces (in production)
- ✅ Consistent error response format

---

## Adding Validation to New Endpoints

### Example: Add validation to a new endpoint

```typescript
// 1. Create validator in validators.ts
export const validateCreateRally = [
  validators.requiredString("title", 5, 200),
  validators.requiredString("venue_name", 3, 200),
  validators.uuid("candidate_id"),
  validators.uuid("district_id"),
  handleValidationErrors,
];

// 2. Apply to route in api.ts
router.post("/rallies", validateCreateRally, async (req, res) => {
  // Validated data is guaranteed to be correct
  const { title, venue_name, candidate_id, district_id } = req.body;
  // ... implementation
});
```

---

## Next Steps

### Recommended Additional Security

1. **API Authentication**:
   - Add JWT tokens or API keys for admin endpoints
   - Implement refresh token rotation
2. **CORS Configuration**:

   - Restrict origins to production domains
   - Update `backend/src/index.ts` CORS settings

3. **HTTPS Only**:

   - Enforce HTTPS in production
   - Add HSTS headers via Helmet

4. **SQL Injection Prevention**:

   - Already handled by Supabase parameterized queries
   - Continue using Supabase client (not raw SQL)

5. **XSS Prevention**:

   - Sanitize user inputs on frontend
   - Use React's built-in XSS protection

6. **GDPR Compliance**:
   - Add data export functionality
   - Implement account deletion flow
   - Add cookie consent banner

---

## Verification Checklist

- ✅ RLS policies applied to all tables
- ✅ Input validation on all POST/PUT/DELETE endpoints
- ✅ Rate limiting configured
- ✅ VAPID keys secured in environment variables
- ✅ Error handling middleware active
- ✅ TypeScript lint passing
- ✅ Build successful

---

## Monitoring & Maintenance

### Log Validation Failures

Monitor validation errors to detect:

- Malicious input attempts
- Buggy clients
- API misuse

### Review RLS Policies Regularly

As features evolve:

- Update policies for new tables
- Audit policy effectiveness
- Check for policy conflicts

---

## Security Incident Response

If a security issue is discovered:

1. **Assess Impact**: Determine affected users/data
2. **Patch Immediately**: Deploy fix to production
3. **Notify Users**: If data breach, follow disclosure laws
4. **Review Logs**: Identify how breach occurred
5. **Strengthen Defenses**: Add tests to prevent recurrence

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Express Validator Docs](https://express-validator.github.io/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Status**: Security hardening Phase 5 complete! 🔒
