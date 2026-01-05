import axios from 'axios';
import { TomTomService } from '../services/tomtom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TomTomService', () => {
  let service: TomTomService;

  beforeEach(() => {
    service = new TomTomService();
    process.env.TOMTOM_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return traffic flow data', async () => {
    const mockData = { flowSegmentData: { currentSpeed: 50 } };
    mockedAxios.get.mockResolvedValue({ data: mockData });

    const result = await service.getTrafficFlow(0.34, 32.58);
    expect(result).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('flowSegmentData'));
  });

  it('should return route data', async () => {
    const mockData = { routes: [] };
    mockedAxios.get.mockResolvedValue({ data: mockData });

    const result = await service.calculateRoute('0.34,32.58:0.35,32.59');
    expect(result).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('calculateRoute'));
  });

  it('should return geocoding data', async () => {
    const mockData = {
      results: [
        {
          position: { lat: 0.34, lon: 32.58 },
          address: { freeformAddress: 'Kampala, Uganda' }
        }
      ]
    };
    mockedAxios.get.mockResolvedValue({ data: mockData });

    const result = await service.geocode('Kampala');
    expect(result).toEqual({
      lat: 0.34,
      lon: 32.58,
      address: 'Kampala, Uganda'
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('geocode'));
  });

  it('should return null if API key is missing', async () => {
    // Force missing API key by temporarily clearing env
    const originalKey = process.env.TOMTOM_API_KEY;
    delete process.env.TOMTOM_API_KEY;
    const serviceNoKey = new TomTomService();
    
    const result = await serviceNoKey.getTrafficFlow(0, 0);
    expect(result).toBeNull();
    
    process.env.TOMTOM_API_KEY = originalKey;
  });

  it('should handle errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Down'));
    const result = await service.geocode('Kampala');
    expect(result).toBeNull();
  });
});
