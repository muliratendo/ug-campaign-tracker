import axios from 'axios';
import * as cheerio from 'cheerio';

export class SocialService {
  // Using a public Nitter instance for RSS feed - liable to rate limiting/uptime issues
  // In production, recommend official Twitter API 
  private nitterUrl: string = 'https://nitter.net/UgandaEC/rss';

  async checkUpdates(): Promise<void> {
    try {
      console.log('Checking Social Media updates (via Nitter RSS)...');
      
      // Attempt to fetch RSS
      const response = await axios.get(this.nitterUrl, {
        timeout: 5000, 
        validateStatus: () => true // Handle 404/429 gracefully
      });
      
      if (response.status !== 200) {
        console.warn(`SocialService: Nitter RSS unavailable (Status ${response.status}). Skipping social check.`);
        return;
      }

      const rssContent = response.data;
      const $ = cheerio.load(rssContent, { xmlMode: true });
      
      $('item').each((_, element) => {
        const title = $(element).find('title').text();
        const link = $(element).find('link').text();
        const date = $(element).find('pubDate').text();
        
        // Simple keyword filter for campaign updates
        if (title.toLowerCase().includes('campaign') || title.toLowerCase().includes('rally') || title.toLowerCase().includes('schedule')) {
          console.log(`Found relevant social update: ${title} (${date}) - ${link}`);
          // TODO: Store this in a 'news_feed' table or trigger a notification
        }
      });
      
    } catch (error) {
       console.error('SocialService Error:', (error as Error).message);
    }
  }
}
