import axios from 'axios';
import { ScraperService } from '../services/scraper';
import { supabaseAdmin } from '../config/supabase';
import { TomTomService } from '../services/tomtom';

jest.mock('axios');
jest.mock('../config/supabase');
jest.mock('../services/tomtom');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ScraperService', () => {
  let service: ScraperService;
  let mockTomTom: jest.Mocked<TomTomService>;

  beforeEach(() => {
    service = new ScraperService();
    mockTomTom = (service as any).tomtom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the EC page and extract PDF links', async () => {
    const mockHtml = `
      <html>
        <body>
          <a href="/docs/campaign-programme.pdf">Download</a>
        </body>
      </html>
    `;
    mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });
    
    // Mock PDF processing to avoid errors
    const processPdfSpy = jest.spyOn(service as any, 'processPdf').mockResolvedValue(undefined);

    await service.fetchSchedule();

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('presidential-campaign-programme'));
    expect(processPdfSpy).toHaveBeenCalledWith(expect.stringContaining('campaign-programme.pdf'));
  });

  it('should parse text to events correctly', () => {
    const mockText = `
      Date: 12/01/2026
      Candidate: John Doe
      District: Kampala
      Venue: Kololo Airstrip
      Time: 10:00 AM
    `;
    
    // access private method for unit test
    const events = (service as any).parseTextToEvents(mockText);
    
    expect(events).toHaveLength(1);
    expect(events[0].candidate).toBe('John Doe');
    expect(events[0].district).toBe('Kampala');
  });

  it('should save events and geocode venues', async () => {
    const mockEvents = [{
      candidate: 'John Doe',
      district: 'Kampala',
      venue: 'Kololo',
      date: '12/01/2026',
      title: 'Rally',
      description: 'Desc'
    }];

    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'uuid' }, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null })
    });

    mockTomTom.geocode.mockResolvedValue({ lat: 0.34, lon: 32.58, address: 'Kampala' });

    await (service as any).saveEvents(mockEvents, 'http://source.com');

    expect(mockTomTom.geocode).toHaveBeenCalledWith(expect.stringContaining('Kololo'));
    expect(supabaseAdmin.from).toHaveBeenCalledWith('rallies');
  });
});
