const request = require('supertest');
const app = require('../src/app');

describe('Section 13: Standard API Response Envelope & Error Handling', () => {
  it('GET /api/v1/health should return standard success envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/v1/non-existent-route should return standard error envelope with ROUTE_NOT_FOUND', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });

  it('POST /api/v1/auth/register with empty body should return VALIDATION_ERROR with field details', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('details');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});
