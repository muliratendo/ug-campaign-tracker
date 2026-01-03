# Vercel Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup

Before deploying, configure these in **Vercel Dashboard → Settings → Environment Variables**:

#### Frontend Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_API_URL=https://[backend-url].vercel.app/api
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[your-vapid-public-key]
```

**Important**: Set these for **Production**, **Preview**, and **Development** environments as needed.

---

### 2. Build Configuration

Vercel should auto-detect Next.js. Verify in **Settings → General**:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or leave empty for auto-detect)
- **Output Directory**: Leave empty (Next.js default: `.next`)
- **Install Command**: `npm install` (or leave empty)

---

### 3. Backend Deployment (Separate Project)

If deploying backend separately:

1. Create new Vercel project for backend
2. Set backend environment variables:

```bash
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_KEY=[your-service-key]
TOMTOM_API_KEY=[your-tomtom-key]
VAPID_PUBLIC_KEY=[your-vapid-public]
VAPID_PRIVATE_KEY=[your-vapid-private]
VAPID_SUBJECT=mailto:admin@yourdomain.com
NODE_ENV=production
```

3. Update frontend's `NEXT_PUBLIC_API_URL` to point to deployed backend

---

## Deployment Process

### Option 1: Git Integration (Recommended)

1. **Connect Repository**:

   - Vercel Dashboard → Add New Project
   - Import Git Repository
   - Select `ug-campaign-tracker`

2. **Configure Root Directory**:

   - Set to `frontend` (or leave for monorepo auto-detect)

3. **Set Environment Variables** (see above)

4. **Deploy**: Vercel auto-deploys on every push to `main`

### Option 2: Vercel CLI

```bash
# Install CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Error: NOT_FOUND (404)

**Causes**:

1. ✅ Missing environment variables
2. ✅ Build failed (check build logs)
3. ✅ Wrong root directory
4. ✅ Framework not detected

**Fix**:

```bash
# Check build logs
Vercel Dashboard → Deployments → [Latest] → View Build Logs

# Look for errors like:
# - "ReferenceError: process is not defined"
# - "Module not found"
# - "Build failed"
```

### Error: Build Failed

**Common Causes**:

```
Error: Cannot find module '@supabase/supabase-js'
→ Fix: Ensure package.json dependencies are correct

Error: NEXT_PUBLIC_API_URL is undefined
→ Fix: Add environment variable in Vercel dashboard

TypeScript errors
→ Fix: Run 'npm run build' locally first to catch errors
```

### Error: Runtime Errors After Deploy

**Check**:

1. Browser Console for client errors
2. Vercel → Functions → [Function Name] → Logs for server errors
3. Ensure API URLs use HTTPS (not HTTP)

---

## Best Practices

### 1. Separate Environment Variables by Environment

| Variable     | Development    | Preview         | Production     |
| ------------ | -------------- | --------------- | -------------- |
| API_URL      | localhost:3001 | staging-api     | production-api |
| SUPABASE_URL | dev-project    | staging-project | prod-project   |

### 2. Use Preview Deployments

- Every PR gets a preview URL
- Test before merging to main
- Share with stakeholders

### 3. Monitor Build Times

```
Typical Next.js build: 1-3 minutes
If > 5 minutes: Check for:
- Large dependencies
- Heavy build-time processing
- Image optimization issues
```

### 4. Enable Vercel Analytics

```
Settings → Analytics → Enable
Benefits:
- Core Web Vitals monitoring
- Real user performance data
- Error tracking
```

---

## Common Pitfalls

### ❌ Don't Do This:

```typescript
// Hardcoded URLs
const API_URL = "http://localhost:3001";

// Sensitive keys in code
const SECRET_KEY = "abc123";

// Mixing localhost and production
fetch("http://localhost:3001/api/rallies");
```

### ✅ Do This Instead:

```typescript
// Use environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validate required variables
if (!API_URL) {
  throw new Error("API_URL not configured");
}

// Dynamic URLs based on environment
fetch(`${API_URL}/rallies`);
```

---

## Post-Deployment Checklist

- [ ] Homepage loads without errors
- [ ] All routes accessible (/auth/login, /profile, etc.)
- [ ] API calls return data (check Network tab)
- [ ] Service worker registered (check Application tab)
- [ ] Push notifications work
- [ ] Map displays correctly
- [ ] Authentication flow works
- [ ] No console errors
- [ ] Mobile responsive

---

## Rollback Procedure

If deployment breaks:

1. **Vercel Dashboard** → Deployments
2. Find last working deployment
3. Click **⋮** → **Promote to Production**
4. Fix issue in code
5. Redeploy

---

## Performance Optimization

### After successful deployment:

1. **Run Lighthouse** (Chrome DevTools):

   ```
   Target scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90
   ```

2. **Check Bundle Size**:

   ```bash
   npm run build
   # Review .next/build-manifest.json
   ```

3. **Enable Vercel Speed Insights**:
   ```bash
   npm install @vercel/speed-insights
   ```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Build Logs](https://vercel.com/docs/deployments/troubleshoot-a-build)

---

## Quick Recovery Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Redeploy
vercel --prod

# Remove  deployment
vercel remove [deployment-name]
```
