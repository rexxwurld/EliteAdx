const request = require('supertest');
const app = require('../src/app');

describe('API root', () => {
  it('returns 404 with a JSON message for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
