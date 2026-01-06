import 'dotenv/config';
import { ScraperService } from '../src/services/scraper';

async function main() {
  console.log('Starting manual scrape...');
  const scraper = new ScraperService();
  await scraper.fetchSchedule();
  console.log('Manual scrape finished.');
}

main().then(() => process.exit(0));
