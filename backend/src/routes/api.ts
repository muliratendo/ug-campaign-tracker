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

// POST /subscribe - Placeholder for push notifications
router.post('/subscribe', (req: Request, res: Response) => {
  // In a real implementation, this would save the subscription to the database
  res.status(501).json({ message: 'Push notification subscription not yet implemented' });
});

export default router;
