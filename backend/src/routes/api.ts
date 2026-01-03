import { Router, Request, Response } from 'express';
import { ScraperService } from '../services/scraper';
import { supabaseAdmin } from '../config/supabase';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();
const scraperService = new ScraperService();

// Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ug-campaign-tracker-api' });
});

// GET /rallies - Public endpoint to fetch rallies
router.get('/rallies', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rallies')
      .select('*, district:districts(*), candidate:candidates(*)')
      .order('start_time', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /traffic - fetch traffic predictions
router.get('/traffic', async (req: Request, res: Response) => {
  try {
     const { data, error } = await supabaseAdmin
       .from('traffic_predictions')
       .select('*, rally:rallies(title, start_time, venue_name, location)')
       .order('created_at', { ascending: false });
     
     if (error) throw error;
     res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /trigger-scrape - Dev/Admin endpoint to manually trigger logic
// STRICT rate limiting: 5 requests per hour
router.post('/trigger-scrape', strictLimiter, async (req: Request, res: Response) => {
  try {
    // In production, protect this with a secret key or auth middleware
    await scraperService.fetchSchedule();
    res.json({ message: 'Scrape triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ============================================
// PUSH NOTIFICATION ENDPOINTS
// ============================================

import { PushNotificationService } from '../services/push';
import { validateSubscribe, validateUnsubscribe, validateTestNotification, validateNotifyRally } from '../middleware/validators';
const pushService = new PushNotificationService();

// POST /subscribe - Save push notification subscription
router.post('/subscribe', validateSubscribe, async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;

    const result = await pushService.saveSubscription(userId, subscription);
    res.json({ 
      message: 'Subscription saved successfully', 
      data: result 
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /unsubscribe - Remove push notification subscription
router.delete('/unsubscribe', validateUnsubscribe, async (req: Request, res: Response) => {
  try {
    const { userId, endpoint } = req.body;

    const result = await pushService.removeSubscription(userId, endpoint);
    res.json({ 
      message: 'Subscription removed successfully', 
      data: result 
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /test-notification - Send test notification to user (dev/testing)
router.post('/test-notification', validateTestNotification, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    await pushService.sendTestNotification(userId);
    res.json({ message: 'Test notification sent successfully' });
  } catch (err) {
    console.error('Test notification error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /notify-rally - Send rally alert to all subscribers (admin only)
router.post('/notify-rally', strictLimiter, validateNotifyRally, async (req: Request, res: Response) => {
  try {
    const { rallyId } = req.body;

    await pushService.notifyRallyAlert(rallyId);
    res.json({ message: 'Rally notification sent successfully' });
  } catch (err) {
    console.error('Rally notification error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

import { TomTomService } from '../services/tomtom';
const tomtomService = new TomTomService();

// GET /routing - Proxy for TomTom Routing API
router.get('/routing/:locations', async (req: Request, res: Response) => {
  try {
    const { locations } = req.params;
    const data = await tomtomService.calculateRoute(locations);
    
    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch route from TomTom' });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
