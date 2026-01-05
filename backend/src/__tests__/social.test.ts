import { SocialService } from '../services/social';
import { supabaseAdmin } from '../config/supabase';

jest.mock('../config/supabase');

describe('SocialService', () => {
  let service: SocialService;

  beforeEach(() => {
    service = new SocialService();
  });

  it('should fetch candidate hashtags', async () => {
    const mockHashtags = [{ candidate_id: '1', hashtag: '#test' }];
    
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockImplementation(() => ({
        then: (cb: any) => cb({ data: mockHashtags, error: null })
      }))
    });

    const result = await (service as any).getCandidateHashtags();
    expect(result).toEqual(mockHashtags);
  });

  it('should handle missing hashtags gracefully', async () => {
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockImplementation(() => ({
        then: (cb: any) => cb({ data: null, error: new Error('DB Error') })
      }))
    });

    const result = await (service as any).getCandidateHashtags();
    expect(result).toEqual([]);
  });
});
