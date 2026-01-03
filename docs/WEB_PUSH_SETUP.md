# Web Push Notifications - Setup & Integration Guide

## Overview

Complete web-push notification system implemented with backend service, database integration, and frontend client utilities.

---

## Architecture

```
┌─────────────────┐
│  User Browser   │
│  (Frontend)     │
└────────┬────────┘
         │ 1. Request permission
         │ 2. Subscribe to push
         ▼
┌─────────────────┐
│ Service Worker  │
│   (sw.js)       │
└────────┬────────┘
         │ 3. Send subscription to backend
         ▼
┌─────────────────┐
│ Backend API     │
│ /api/subscribe  │
└────────┬────────┘
         │ 4. Save to database
         ▼
┌─────────────────┐
│   Supabase DB   │
│ subscriptions   │
└─────────────────┘

         │ Later: Send notification
         ▼
┌─────────────────┐
│ PushService     │
│ notifyRallyAlert│
└────────┬────────┘
         │ Push to browser
         ▼
┌─────────────────┐
│ Service Worker  │
│ Shows notification│
└─────────────────┘
```

---

## Backend Implementation

### Files Created

1. **`backend/src/services/push.ts`** - Main push notification service

   - VAPID configuration
   - Subscription management (save/remove)
   - Notification sending (single/bulk/rally alerts)
   - Invalid subscription cleanup

2. **`backend/src/routes/api.ts`** - API endpoints added:
   - `POST /api/subscribe` - Save push subscription
   - `DELETE /api/unsubscribe` - Remove subscription
   - `POST /api/test-notification` - Send test notification
   - `POST /api/notify-rally` - Send rally alert (admin, rate-limited)

### Database Schema

Already exists in `backend/supabase/schema.sql`:

```sql
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null, -- { auth, p256dh }
  created_at timestamp with time zone default now()
);
```

**Note**: Compatible with Supabase RLS - users can only manage their own subscriptions.

---

## Setup Instructions

### 1. Generate VAPID Keys

```bash
cd backend
npx web-push generate-vapid-keys
```

Output:

```
=======================================
Public Key:
BEl62i...
Private Key:
bdSiC...
=======================================
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
# Add these lines
VAPID_PUBLIC_KEY=BEl62i...your-public-key...
VAPID_PRIVATE_KEY=bdSiC...your-private-key...
VAPID_SUBJECT=mailto:your-email@domain.com
```

**Frontend** (`frontend/.env.local`):

```bash
# Add these lines
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62i...your-public-key...
```

**IMPORTANT**: Use the SAME public key in both frontend and backend!

### 3. Install Dependencies

Already done:

- ✅ Backend: `web-push`, `@types/web-push`
- Frontend service worker already configured

---

## Frontend Integration

### Usage in React Components

```typescript
import { useAuth } from "@/features/auth/hooks/AuthContext";
import {
  subscribeToPush,
  unsubscribeFromPush,
  requestTestNotification,
} from "@/lib/pushNotifications";

function NotificationSettings() {
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user) return;

    const success = await subscribeToPush(user.id);
    if (success) {
      alert("Subscribed to notifications!");
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    const success = await unsubscribeFromPush(user.id);
    if (success) {
      alert("Unsubscribed from notifications");
    }
  };

  const handleTest = async () => {
    if (!user) return;

    await requestTestNotification(user.id);
  };

  return (
    <div>
      <button onClick={handleSubscribe}>Enable Notifications</button>
      <button onClick={handleUnsubscribe}>Disable Notifications</button>
      <button onClick={handleTest}>Send Test Notification</button>
    </div>
  );
}
```

### Add to Profile Page

Update `frontend/src/app/profile/page.tsx`:

```typescript
import {
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from "@/lib/pushNotifications";

// In your component:
const [isSubscribed, setIsSubscribed] = useState(false);

useEffect(() => {
  isSubscribedToPush().then(setIsSubscribed);
}, []);

// Add button to toggle notifications
<button
  onClick={async () => {
    if (isSubscribed) {
      await unsubscribeFromPush(user.id);
      setIsSubscribed(false);
    } else {
      await subscribeToPush(user.id);
      setIsSubscribed(true);
    }
  }}
>
  {isSubscribed ? "Disable" : "Enable"} Push Notifications
</button>;
```

---

## Testing

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Notification Flow

**A. Subscribe via Browser Console**:

```javascript
// In browser console at http://localhost:3000
const userId = "your-user-id"; // Get from Supabase Auth

// Import and call
import("/lib/pushNotifications.js").then((module) => {
  module.subscribeToPush(userId).then((success) => {
    console.log("Subscribed:", success);
  });
});
```

**B. Send Test Notification via cURL**:

```bash
curl -X POST http://localhost:3001/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id"}'
```

**C. Trigger Rally Alert**:

```bash
# First, create a rally in database, then:
curl -X POST http://localhost:3001/api/notify-rally \
  -H "Content-Type: application/json" \
  -d '{"rallyId": "rally-uuid"}'
```

### 4. Verify in Browser

- Check for notification permission prompt
- Verify notification appears in system tray
- Click notification (should navigate to app)

---

## API Reference

### POST /api/subscribe

**Description**: Save push subscription to database

**Body**:

```json
{
  "userId": "uuid",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "auth": "...",
      "p256dh": "..."
    }
  }
}
```

**Response**:

```json
{
  "message": "Subscription saved successfully",
  "data": { "success": true }
}
```

### DELETE /api/unsubscribe

**Description**: Remove push subscription

**Body**:

```json
{
  "userId": "uuid",
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### POST /api/test-notification

**Description**: Send test notification to user

**Body**:

```json
{
  "userId": "uuid"
}
```

### POST /api/notify-rally

**Description**: Send rally alert to all subscribers (rate-limited: 5/hour)

**Body**:

```json
{
  "rallyId": "uuid"
}
```

---

## Production Considerations

### 1. VAPID Keys Security

- ✅ Store in environment variables (never commit to git)
- ✅ Use different keys for dev/staging/production
- Rotate keys periodically (requires re-subscription)

### 2. Subscription Cleanup

The service automatically removes invalid subscriptions (HTTP 410/404). Monitor logs for cleanup events.

### 3. Rate Limiting

Rally notifications use `strictLimiter` (5 requests/hour). Adjust in `rateLimiter.ts` if needed.

### 4. Notification Preferences

Future enhancement: Filter notifications by:

- User's subscribed districts
- User's subscribed candidates
- Time of day preferences

### 5. Analytics

Track:

- Subscription success/failure rates
- Notification delivery rates
- User engagement (click-through rates)

---

## Troubleshooting

### "Permission denied" errors

- User denied notification permission
- Solution: Instruct user to reset permission in browser settings

### "VAPID public key not configured"

- Missing `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in frontend
- Solution: Add to `.env.local` and restart dev server

### "Invalid subscription" (410 errors)

- Subscription expired or user cleared browser data
- Solution: Service automatically removes invalid subscriptions

### Notifications not appearing

1. Check browser notification settings (not blocked)
2. Verify service worker is registered: `chrome://serviceworker-internals`
3. Check browser console for errors
4. Ensure VAPID keys match between frontend and backend

---

## Next Steps

1. **Add to Profile Page**: Enable/disable notifications toggle
2. **User Preferences**: Filter notifications by district/candidate
3. **Notification History**: Store sent notifications in database
4. **Scheduled Notifications**: Send alerts 1 hour before rally
5. **Rich Notifications**: Add action buttons (View Rally, Dismiss)

---

## Verification

✅ **Backend**:

- PushNotificationService created
- 4 API endpoints implemented
- VAPID configuration in .env.example
- TypeScript types installed

✅ **Frontend**:

- pushNotifications.ts utility created
- Service worker ready for push events
- VAPID public key in .env.example

✅ **Database**:

- Subscriptions table exists
- RLS policies configured

Web push notifications are fully implemented and ready for testing!
