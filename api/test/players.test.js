// Basic tests for players REST API
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Players API', () => {
  beforeAll(done => {
    db.run('DELETE FROM players', done);
  });

  let playerId;

  it('should create a player', async () => {
    const res = await request(app)
      .post('/api/players')
      .send({ name: 'Test Player' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    playerId = res.body.id;
  });

  it('should get all players', async () => {
    const res = await request(app).get('/api/players');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a player by id', async () => {
    const res = await request(app).get(`/api/players/${playerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', playerId);
  });

  it('should update a player', async () => {
    const res = await request(app)
      .put(`/api/players/${playerId}`)
      .send({ name: 'Updated Player' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Player');
  });

  it('should delete a player', async () => {
    const res = await request(app).delete(`/api/players/${playerId}`);
    expect(res.statusCode).toBe(204);
  });
});
