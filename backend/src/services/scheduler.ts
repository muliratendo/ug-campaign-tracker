import cron from 'node-cron';
import { ScraperService } from './scraper';
import { SocialService } from './social';
import { TrafficService } from './traffic';

export class SchedulerService {
  private scraperService: ScraperService;
  private socialService: SocialService;
  private trafficService: TrafficService;

  constructor() {
    this.scraperService = new ScraperService();
    this.socialService = new SocialService();
    this.trafficService = new TrafficService();
  }

  start() {
    console.log('Starting scheduler...');

    // Rule: Run every day at midnight (00:00)
    // For testing: '*/5 * * * * *' (every 5 seconds)
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily jobs...');
      
      // 1. Scrape EC Website
      try {
        await this.scraperService.fetchSchedule();
      } catch (error) {
        console.error('Scraper job failed:', error);
      }

      // 2. Check Social Updates
      try {
        await this.socialService.checkUpdates();
      } catch (error) {
        console.error('Social job failed:', error);
      }

      // 3. Run Traffic Analysis
      try {
        await this.trafficService.generatePredictions();
      } catch (error) {
        console.error('Traffic analysis failed:', error);
      }
    });

    console.log('Scheduler is active. Jobs will run at configured times.');
  }
}
