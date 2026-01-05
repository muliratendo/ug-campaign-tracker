import request from 'supertest';
import { app } from '../index';

describe('API Endpoints', () => {
  it('should return 200 for health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should return 200 for /api/rallies', async () => {
    const res = await request(app).get('/api/rallies');
    // Even if empty, it should be an array and return 200
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 200 for /api/traffic', async () => {
    const res = await request(app).get('/api/traffic');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
