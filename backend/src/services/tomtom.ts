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
      console.error('TomTom Traffic API Error:', error);
      return null;
    }
  }

  async calculateRoute(locations: string) {
    // https://api.tomtom.com/routing/1/calculateRoute/{locations}/json?key={key}
    if (!this.apiKey) return null;

    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${this.apiKey}&instructionsType=text&routeRepresentation=polyline`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('TomTom Routing API Error:', error);
      return null;
    }
  }

  async geocode(query: string) {
    // https://api.tomtom.com/search/2/geocode/{query}.json?key={key}&countrySet=UG
    if (!this.apiKey) return null;

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.tomtom.com/search/2/geocode/${encodedQuery}.json?key=${this.apiKey}&countrySet=UG&limit=1`;
      const response = await axios.get(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.position.lat,
          lon: result.position.lon,
          address: result.address.freeformAddress
        };
      }
      return null;
    } catch (error) {
      console.error('TomTom Geocoding Error:', error);
      return null;
    }
  }
}
