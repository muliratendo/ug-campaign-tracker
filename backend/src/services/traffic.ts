import { supabaseAdmin } from '../config/supabase';
import { TomTomService } from './tomtom';

export class TrafficService {
  private tomtom: TomTomService;

  constructor() {
    this.tomtom = new TomTomService();
  }

  /**
   * Analyze upcoming rallies and generate traffic predictions.
   * Logic:
   * 1. Fetch rallies for the next 7 days.
   * 2. For each rally, check if we already have a prediction.
   * 3. If not, call TomTom to get typical flow/congestion at that time/location.
   * 4. Save prediction to DB.
   */
  async generatePredictions() {
    console.log('Starting Traffic Prediction generation...');
    
    // 1. Fetch upcoming rallies
    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: rallies, error } = await supabaseAdmin
      .from('rallies')
      .select('*')
      .gte('start_time', now)
      .lte('start_time', nextWeek);

    if (error) {
      console.error('Failed to fetch rallies for traffic analysis:', error);
      return;
    }

    if (!rallies || rallies.length === 0) {
      console.log('No upcoming rallies found for analysis.');
      return;
    }

    console.log(`Analyzing ${rallies.length} upcoming rallies...`);

    for (const rally of rallies) {
      await this.analyzeRally(rally);
    }
  }

  private async analyzeRally(rally: any) {
    // Check existing prediction
    const { data: existing } = await supabaseAdmin
      .from('traffic_predictions')
      .select('id')
      .eq('rally_id', rally.id)
      .single();

    if (existing) {
      // Skip if already analyzed (or maybe update if old?)
      return;
    }

    // Since we don't have real lat/lon in the mock scraper yet (it defaults to 32.58, -0.31),
    // and storing POINT in DB is binary, we need to extract coords.
    // Ideally we assume rally.location is GeoJSON or we need to parse it if text.
    // For MVP, using fixed point or if available from geocoding.
    
    // Mocking coords for the analysis call check
    const lat = 0.3476; // Kampala approx
    const lon = 32.5825;

    // Call TomTom
    const flowData = await this.tomtom.getTrafficFlow(lat, lon);
    
    // Heuristic: If flow speed < freeFlow speed, it's congested.
    // For Campaign Rallies, we assume EXTRA congestion on top of normal.
    
    let jamLevel = 'moderate';
    let addedDelay = 30; // 30 mins base assumption for rally

    if (flowData && flowData.flowSegmentData) {
        const currentSpeed = flowData.flowSegmentData.currentSpeed;
        const freeFlow = flowData.flowSegmentData.freeFlowSpeed;
        
        // Traffic Logic: Only flag if speed is < 70% of freeflow OR if it's already slow
        const congestionRatio = currentSpeed / freeFlow;

        if (congestionRatio < 0.5) {
          jamLevel = 'critical';
          addedDelay = 60;
        } else if (congestionRatio < 0.75) {
          jamLevel = 'heavy';
          addedDelay = 45;
        } else {
          // even if traffic is normal, rally implies extra load
          jamLevel = 'moderate';
          addedDelay = 30;
        }
        
        console.log(`TomTom Data for ${rally.title}: ${currentSpeed} km/h vs ${freeFlow} km/h (Ratio: ${congestionRatio.toFixed(2)})`);
    }

    // Insert Prediction
    const { error } = await supabaseAdmin
      .from('traffic_predictions')
      .insert({
        rally_id: rally.id,
        predicted_delay_minutes: addedDelay,
        jam_level: jamLevel,
        description: `Expected ${jamLevel} congestion due to campaign rally. Plan for +${addedDelay} mins travel time.`,
        affected_roads: ['Main Road', 'Access Lane'] // logic to find nearest roads needed
      });

    if (error) {
      console.error(`Failed to save prediction for rally ${rally.title}:`, error.message);
    } else {
      console.log(`Generated prediction for: ${rally.title}`);
    }
  }
}
