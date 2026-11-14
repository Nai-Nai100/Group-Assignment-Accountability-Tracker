const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('unknown /api route returns 404', async () => {
    const res = await request(createApp()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
