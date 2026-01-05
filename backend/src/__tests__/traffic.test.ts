import { TrafficService } from '../services/traffic';
import { supabaseAdmin } from '../config/supabase';
import { TomTomService } from '../services/tomtom';

jest.mock('../config/supabase');
jest.mock('../services/tomtom');

describe('TrafficService', () => {
  let service: TrafficService;
  let mockTomTom: jest.Mocked<TomTomService>;

  beforeEach(() => {
    service = new TrafficService();
    mockTomTom = (service as any).tomtom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate predictions for upcoming rallies', async () => {
    const mockRallies = [
      { id: '1', title: 'Rally 1', start_time: new Date().toISOString() }
    ];

    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({ data: null, error: null }), // No existing prediction
      then: jest.fn().mockImplementation((cb) => cb({ data: mockRallies, error: null })),
      insert: jest.fn().mockResolvedValue({ error: null })
    });

    mockTomTom.getTrafficFlow.mockResolvedValue({
      flowSegmentData: {
        currentSpeed: 20,
        freeFlowSpeed: 50
      }
    });

    await service.generatePredictions();

    expect(supabaseAdmin.from).toHaveBeenCalledWith('rallies');
    expect(mockTomTom.getTrafficFlow).toHaveBeenCalled();
    expect(supabaseAdmin.from).toHaveBeenCalledWith('traffic_predictions');
  });

  it('should skip if prediction already exists', async () => {
    const mockRallies = [{ id: '1' }];
    
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({ data: { id: 'existing' }, error: null }),
      then: jest.fn().mockImplementation((cb) => cb({ data: mockRallies, error: null })),
    });

    await service.generatePredictions();
    expect(mockTomTom.getTrafficFlow).not.toHaveBeenCalled();
  });
});
