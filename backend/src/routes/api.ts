import { Router, Request, Response, NextFunction } from 'express';
import { ScraperService } from '../services/scraper';
import { supabaseAdmin } from '../config/supabase';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();
const scraperService = new ScraperService();

// Wrapper for async route handlers to catch errors and pass them to the global error handler
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ug-campaign-tracker-api' });
});

// GET /rallies - Public endpoint to fetch rallies
router.get('/rallies', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { data, error } = await supabaseAdmin
    .from('rallies')
    .select('*, district:districts(*), candidate:candidates(*)')
    .order('start_time', { ascending: true })
    .limit(50);

  if (error) throw error;
  res.json(data);
}));

// GET /traffic - fetch traffic predictions
router.get('/traffic', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
   const { data, error } = await supabaseAdmin
     .from('traffic_predictions')
     .select('*, rally:rallies(title, start_time, venue_name, location)')
     .order('created_at', { ascending: false });

   if (error) throw error;
   res.json(data);
}));

// POST /trigger-scrape - Dev/Admin endpoint to manually trigger logic
// STRICT rate limiting: 5 requests per hour
router.post('/trigger-scrape', strictLimiter, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // In production, protect this with a secret key or auth middleware
  await scraperService.fetchSchedule();
  res.json({ message: 'Scrape triggered successfully' });
}));

// ============================================
// PUSH NOTIFICATION ENDPOINTS
// ============================================

import { PushNotificationService } from '../services/push';
import { validateSubscribe, validateUnsubscribe, validateTestNotification, validateNotifyRally } from '../middleware/validators';
const pushService = new PushNotificationService();

// POST /subscribe - Save push notification subscription
router.post('/subscribe', validateSubscribe, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, subscription } = req.body;

  const result = await pushService.saveSubscription(userId, subscription);
  res.json({
    message: 'Subscription saved successfully',
    data: result
  });
}));

// DELETE /unsubscribe - Remove push notification subscription
router.delete('/unsubscribe', validateUnsubscribe, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, endpoint } = req.body;

  const result = await pushService.removeSubscription(userId, endpoint);
  res.json({
    message: 'Subscription removed successfully',
    data: result
  });
}));

// POST /test-notification - Send test notification to user (dev/testing)
router.post('/test-notification', validateTestNotification, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body;

  await pushService.sendTestNotification(userId);
  res.json({ message: 'Test notification sent successfully' });
}));

// POST /notify-rally - Send rally alert to all subscribers (admin only)
router.post('/notify-rally', strictLimiter, validateNotifyRally, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { rallyId } = req.body;

  await pushService.notifyRallyAlert(rallyId);
  res.json({ message: 'Rally notification sent successfully' });
}));

import { TomTomService } from '../services/tomtom';
const tomtomService = new TomTomService();

// GET /routing - Proxy for TomTom Routing API
router.get('/routing/:locations', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { locations } = req.params;
  const data = await tomtomService.calculateRoute(locations);

  if (!data) {
    const err = new Error('Failed to fetch route from TomTom');
    // You might want to add a status code property to the error
    (err as any).statusCode = 500;
    throw err;
  }

  res.json(data);
}));

export default router;
