// Basic tests for games REST API
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Games API', () => {
  beforeAll(done => {
    db.run('DELETE FROM games', done);
  });

  let gameId;

  it('should create a game', async () => {
    const res = await request(app)
      .post('/api/games')
      .send({ name: 'Test Game', game_type: 'type1' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    gameId = res.body.id;
  });

  it('should get all games', async () => {
    const res = await request(app).get('/api/games');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a game by id', async () => {
    const res = await request(app).get(`/api/games/${gameId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', gameId);
  });

  it('should update a game', async () => {
    const res = await request(app)
      .put(`/api/games/${gameId}`)
      .send({ name: 'Updated Game', game_type: 'type2' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Game');
    expect(res.body).toHaveProperty('game_type', 'type2');
  });

  it('should delete a game', async () => {
    const res = await request(app).delete(`/api/games/${gameId}`);
    expect(res.statusCode).toBe(204);
  });
});
