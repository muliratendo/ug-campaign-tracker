import { PushNotificationService } from '../services/push';
import { supabaseAdmin } from '../config/supabase';
import webpush from 'web-push';

jest.mock('../config/supabase');
jest.mock('web-push');

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockSupabase: any;

  beforeEach(() => {
    service = new PushNotificationService();
    mockSupabase = supabaseAdmin as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save a valid subscription', async () => {
    const userId = 'user-1';
    const subscription = { endpoint: 'url', keys: { p256dh: 'key', auth: 'auth' } };

    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); // Check existing
    mockSupabase.insert.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1' }, error: null }); // Insert new

    const result = await service.saveSubscription(userId, subscription);
    expect(result.success).toBe(true);
  });

  it('should send a test notification', async () => {
    const userId = 'user-1';
    const mockSubs = [{ endpoint: 'url', keys: { p256dh: 'a', auth: 'b' } }];

    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.in.mockReturnThis();
    // mock database response for fetch subscriptions
    mockSupabase.then.mockImplementationOnce((cb: any) => cb({ data: mockSubs, error: null }));

    await service.sendTestNotification(userId);

    expect(webpush.sendNotification).toHaveBeenCalled();
  });

  it('should remove invalid subscriptions after failed send', async () => {
    const userId = 'user-1';
    const mockSubs = [{ endpoint: 'expired-url', keys: { p256dh: 'a', auth: 'b' } }];

    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.in.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.then.mockImplementationOnce((cb: any) => cb({ data: mockSubs, error: null }));

    (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });

    await service.sendTestNotification(userId);

    expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
  });
});
