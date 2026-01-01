import { Router, Request, Response } from 'express';
import { ScraperService } from '../services/scraper';
import { supabaseAdmin } from '../config/supabase';

const router = Router();
const scraperService = new ScraperService();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ug-campaign-tracker-api' });
});

// GET /rallies - Public endpoint to fetch rallies
router.get('/rallies', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rallies')
      .select('*, district:districts(*), candidate:candidates(*)')
      .order('start_time', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /traffic - fetch traffic predictions
router.get('/traffic', async (req, res) => {
  try {
     const { data, error } = await supabaseAdmin
       .from('traffic_predictions')
       .select('*, rally:rallies(title, start_time, venue_name, location)')
       .order('created_at', { ascending: false });
     
     if (error) throw error;
     res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /trigger-scrape - Dev/Admin endpoint to manually trigger logic
router.post('/trigger-scrape', async (req, res) => {
  try {
    // In production, protect this with a secret key or auth middleware
    await scraperService.fetchSchedule();
    res.json({ message: 'Scrape triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
