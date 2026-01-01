import axios from 'axios';

export class TomTomService {
  private apiKey: string;
  private baseUrl: string = 'https://api.tomtom.com/traffic/services/4';

  constructor() {
    this.apiKey = process.env.TOMTOM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TOMTOM_API_KEY is not set.');
    }
  }

  async getTrafficFlow(lat: number, lon: number) {
    // Implementation to call flowSegmentData
    // https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key={key}&point={lat},{lon}
    if (!this.apiKey) return null;
    
    try {
      const url = `${this.baseUrl}/flowSegmentData/absolute/10/json?key=${this.apiKey}&point=${lat},${lon}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('TomTom API Error:', error);
      return null;
    }
  }
}
