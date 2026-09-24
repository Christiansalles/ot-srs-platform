const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('responde 200 com status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
