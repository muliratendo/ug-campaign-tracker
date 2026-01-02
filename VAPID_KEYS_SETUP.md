# VAPID Keys Configuration

## Generated Keys (Development)

These keys were generated on 2026-01-02 and should be used for development only.

**⚠️ IMPORTANT**: Generate new keys for production environments!

---

## Backend Configuration

Create `backend/.env` file with:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
NODE_ENV=development
PORT=3001
TOMTOM_API_KEY=your-tomtom-key
GEOCODING_API_KEY=your-geocoding-key

# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=BKWLoD7fDugXwY2jU44H2P9DOjXTKvwFIi2kPX-QR5eayhYYE0wKVolB4pDZQ_kLqqbGy5w61jrmiOzqZ_0fjqc
VAPID_PRIVATE_KEY=XNRYYYl22PHO7P5glxwe-6tiwxMOQd0jbeFm41FHERs
VAPID_SUBJECT=mailto:admin@ug-campaign-tracker.com
```

---

## Frontend Configuration

Create `frontend/.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKWLoD7fDugXwY2jU44H2P9DOjXTKvwFIi2kPX-QR5eayhYYE0wKVolB4pDZQ_kLqqbGy5w61jrmiOzqZ_0fjqc
```

---

## Quick Setup Commands

```bash
# Backend
cd backend
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
NODE_ENV=development
PORT=3001
TOMTOM_API_KEY=your-tomtom-key
GEOCODING_API_KEY=your-geocoding-key

VAPID_PUBLIC_KEY=BKWLoD7fDugXwY2jU44H2P9DOjXTKvwFIi2kPX-QR5eayhYYE0wKVolB4pDZQ_kLqqbGy5w61jrmiOzqZ_0fjqc
VAPID_PRIVATE_KEY=XNRYYYl22PHO7P5glxwe-6tiwxMOQd0jbeFm41FHERs
VAPID_SUBJECT=mailto:admin@ug-campaign-tracker.com
EOF

# Frontend
cd ../frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKWLoD7fDugXwY2jU44H2P9DOjXTKvwFIi2kPX-QR5eayhYYE0wKVolB4pDZQ_kLqqbGy5w61jrmiOzqZ_0fjqc
EOF
```

---

## Generating Production Keys

For production, generate new keys:

```bash
npx web-push generate-vapid-keys
```

Then update your environment variables in:

- Vercel project settings (frontend)
- Vercel environment variables (backend)
- Or your deployment platform's secret management

---

## Verification

After setting up the .env files:

1. **Restart both servers**:

   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Check backend console** - should see:

   ```
   ✅ Web Push VAPID configured
   ```

3. **Test in browser**:
   - Navigate to `/profile`
   - Click "Enable Notifications"
   - Grant permission when prompted
   - Click "Send Test" to verify

---

## Security Notes

- ✅ .env files are gitignored
- ✅ Never commit VAPID keys to version control
- ✅ Use different keys for dev/staging/production
- Rotate keys periodically (requires re-subscription)

---

## Troubleshooting

**"VAPID keys not found" warning**:

- Ensure .env file exists in backend/
- Verify keys are exactly as shown above
- Restart backend server

**Frontend can't subscribe**:

- Ensure VAPID_PUBLIC_KEY is in frontend/.env.local
- Verify it matches backend's VAPID_PUBLIC_KEY
- Restart frontend dev server
- Clear browser cache and service workers

**Subscription fails**:

- Check browser console for errors
- Verify API_URL is correct (`http://localhost:3001/api`)
- Ensure backend is running
- Check browser notification permissions
