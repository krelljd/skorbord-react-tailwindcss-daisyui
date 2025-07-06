import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import { getDatabase, initializeDatabase } from '../db/database.js';

describe('API Server', () => {
  let server;

  beforeAll(async () => {
    await initializeDatabase();
    server = app.listen(0);
  });

  afterAll(async () => {
    const db = getDatabase();
    if (db) {
      await db.close();
    }
    if (server) {
      server.close();
    }
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });
  });

  describe('API Routes', () => {
    test('GET /api/game-types should return game types', async () => {
      const response = await request(app)
        .get('/api/game-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const gameType = response.body[0];
      expect(gameType).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        min_players: expect.any(Number),
        max_players: expect.any(Number),
        supports_teams: expect.any(Boolean)
      });
    });

    test('POST /api/players should create a new player', async () => {
      const playerData = {
        name: 'Test Player',
        avatar_color: '#FF5733'
      };

      const response = await request(app)
        .post('/api/players')
        .send(playerData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: playerData.name,
        avatar_color: playerData.avatar_color,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    test('POST /api/players should validate required fields', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });

    test('GET /api/players should return players list', async () => {
      const response = await request(app)
        .get('/api/players')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found'
      });
    });

    test('Invalid JSON should return 400', async () => {
      const response = await request(app)
        .post('/api/players')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('CORS', () => {
    test('Should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('Should allow reasonable request rates', async () => {
      // Make multiple requests within rate limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/health')
          .expect(200);
      }
    });
  });
});
