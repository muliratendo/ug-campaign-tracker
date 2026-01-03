import axios from 'axios';
import * as cheerio from 'cheerio';
const pdf = require('pdf-parse');
import { supabaseAdmin } from '../config/supabase';
import { TomTomService } from './tomtom';

interface RallyEvent {
  title: string;
  date: string;
  time: string;
  venue: string;
  district: string;
  candidate: string;
  description?: string;
}

export class ScraperService {
  // EC Data Sources
  private ecPageUrl: string = 'https://www.ec.or.ug/presidential-campaign-programme-2025-2026';
  private ecBaseUrl: string = 'https://www.ec.or.ug';
  private tomtom: TomTomService;

  constructor() {
    this.tomtom = new TomTomService();
  }

  /**
   * Main entry point to fetch and parse the schedule.
   * Now scrapes the landing page to find the latest PDF links dynamically.
   */
  async fetchSchedule(): Promise<void> {
    try {
      console.log(`Checking for updates at ${this.ecPageUrl}...`);
      
      // 1. Fetch the HTML Landing Page
      const { data: html } = await axios.get(this.ecPageUrl);
      const $ = cheerio.load(html);
      
      // 2. Extract PDF Links
      const pdfLinks = new Set<string>();
      $('a[href$=".pdf"]').each((_, element) => {
        let link = $(element).attr('href');
        if (link) {
          // Normalize URL
          if (!link.startsWith('http')) {
            link = this.ecBaseUrl + (link.startsWith('/') ? '' : '/') + link;
          }
          // Filter for relevant campaign docs if possible
          if (link.toLowerCase().includes('campaign') || link.toLowerCase().includes('programme')) {
            pdfLinks.add(link);
          }
        }
      });

      console.log(`Found ${pdfLinks.size} relevant PDF(s):`, [...pdfLinks]);

      // 3. Process each PDF
      for (const pdfUrl of pdfLinks) {
        await this.processPdf(pdfUrl);
      }
      
    } catch (error) {
      console.error('Error in fetchSchedule:', error);
      // Don't throw, just log so scheduler maintains uptime
    }
  }

  private async processPdf(pdfUrl: string) {
    try {
      console.log(`Downloading PDF: ${pdfUrl}`);
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = response.data;

      console.log('Parsing PDF content...');
      const data = await pdf(pdfBuffer);
      const text = data.text;
      
      const events = this.parseTextToEvents(text);
      console.log(`Parsed ${events.length} events from ${pdfUrl.split('/').pop()}`);

      if (events.length > 0) {
        await this.saveEvents(events, pdfUrl);
      }
    } catch (err) {
      console.error(`Failed to process PDF ${pdfUrl}:`, err);
    }
  }

  /**
   * Simple regex-based parser for our mock format.
   */
  private parseTextToEvents(text: string): RallyEvent[] {
    const events: RallyEvent[] = [];
    const blocks = text.split('Date:').slice(1); // crude split by "Date:"

    for (const block of blocks) {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        // This is fragile and assumes strictly formatted mock data
        const dateLine = lines[0]; // e.g. "12/01/2026"
        
        const candidateLine = lines.find(l => l.startsWith('Candidate:'))?.replace('Candidate:', '').trim();
        const districtLine = lines.find(l => l.startsWith('District:'))?.replace('District:', '').trim();
        const venueLine = lines.find(l => l.startsWith('Venue:'))?.replace('Venue:', '').trim();
        const timeLine = lines.find(l => l.startsWith('Time:'))?.replace('Time:', '').trim();

        if (dateLine && candidateLine && districtLine && venueLine) {
          events.push({
            title: `${candidateLine} Rally in ${districtLine}`,
            date: dateLine,
            time: timeLine || '12:00 PM',
            venue: venueLine,
            district: districtLine,
            candidate: candidateLine,
            description: `Official campaign rally for ${candidateLine} at ${venueLine}.`
          });
        }
      } catch (err) {
        console.warn('Failed to parse block', err);
      }
    }
    return events;
  }

  private async saveEvents(events: RallyEvent[], sourceUrl: string) {
    for (const event of events) {
      // 1. Resolve Candidate
      const { data: candidateData } = await supabaseAdmin
        .from('candidates')
        .select('id')
        .eq('name', event.candidate)
        .single();
      
      let candidateId = candidateData?.id;

      if (!candidateId) {
        // Create candidate if not exists (auto-discovery)
        const { data: newCand } = await supabaseAdmin
          .from('candidates')
          .insert({ name: event.candidate, party: 'Independent' }) // Default party
          .select()
          .single();
        if (newCand) candidateId = newCand.id;
      }

      // 2. Resolve District
      const { data: districtData } = await supabaseAdmin
        .from('districts')
        .select('id')
        .eq('name', event.district)
        .single();
      
      let districtId = districtData?.id;
      if (!districtId) {
         const { data: newDist } = await supabaseAdmin
          .from('districts')
          .insert({ name: event.district, region: 'Central' }) // Default region
          .select()
          .single();
         if (newDist) districtId = newDist.id;
      }

      // 3. Insert Rally
      // Convert date+time to ISO timestamp
      try {
        const [day, month, year] = event.date.split('/');
        // Naive parsing: assume 2026 if year missing or use mock
        // Format of dateLine is assumed DD/MM/YYYY
        
        const startTimeISO = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString(); 
        const endTimeISO = new Date(`${year}-${month}-${day}T15:00:00Z`).toISOString(); // assume 3 hours

        // 3. Geocode Venue
        let location = 'POINT(32.5825 0.3476)'; // Default to Kampala
        try {
          const query = `${event.venue}, ${event.district}, Uganda`;
          const geoResult = await this.tomtom.geocode(query);
          if (geoResult) {
            location = `POINT(${geoResult.lon} ${geoResult.lat})`;
            console.log(`Geocoded ${event.venue} to ${geoResult.lat}, ${geoResult.lon}`);
          }
        } catch (geoErr) {
          console.warn(`Geocoding failed for ${event.venue}, using default.`);
        }

        const { error } = await supabaseAdmin
          .from('rallies')
          .upsert({
            title: event.title,
            candidate_id: candidateId,
            district_id: districtId,
            venue_name: event.venue,
            description: event.description,
            start_time: startTimeISO,
            end_time: endTimeISO,
            location: location,
            source_url: sourceUrl
          }, { onConflict: 'title, start_time' }); 
          
        if (error) {
          console.error(`Failed to save rally ${event.title}:`, error.message);
        } else {
          console.log(`Saved: ${event.title}`);
        }
      } catch (dateErr) {
        console.warn(`Skipping event ${event.title} due to date parse error:`, event.date);
      }
    }
  }
}
