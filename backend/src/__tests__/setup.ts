// Mock Supabase to prevent connection errors during tests
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  // Final methods that return promises
  then: jest.fn().mockImplementation(function(onFulfilled) {
    return Promise.resolve({ data: [], error: null }).then(onFulfilled);
  }),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(() => Promise.resolve({ statusCode: 201 })),
}));

process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = 'mock-key';
process.env.VAPID_PUBLIC_KEY = 'mock-vapid-public';
process.env.VAPID_PRIVATE_KEY = 'mock-vapid-private';
process.env.TOMTOM_API_KEY = 'mock-tomtom-key';
