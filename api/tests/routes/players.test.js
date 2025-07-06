import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';
import { getDatabase, initializeDatabase } from '../../db/database.js';

describe('Players API', () => {
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

  describe('POST /api/players', () => {
    test('Should create player with valid data', async () => {
      const playerData = {
        name: 'John Doe',
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

    test('Should validate required name field', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({ avatar_color: '#FF5733' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name'
          })
        ])
      );
    });

    test('Should validate name length', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({ 
          name: '', // Empty name
          avatar_color: '#FF5733' 
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('Should validate avatar color format', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({
          name: 'Test Player',
          avatar_color: 'invalid-color'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('Should use default avatar color if not provided', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({ name: 'Default Color Player' })
        .expect(201);

      expect(response.body.avatar_color).toBeDefined();
      expect(response.body.avatar_color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('Should prevent duplicate names', async () => {
      const playerData = {
        name: 'Unique Player',
        avatar_color: '#FF5733'
      };

      // Create first player
      await request(app)
        .post('/api/players')
        .send(playerData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/players')
        .send(playerData)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/players', () => {
    beforeEach(async () => {
      // Create some test players
      await request(app)
        .post('/api/players')
        .send({ name: 'Alice', avatar_color: '#FF0000' });
      await request(app)
        .post('/api/players')
        .send({ name: 'Bob', avatar_color: '#00FF00' });
    });

    test('Should return list of players', async () => {
      const response = await request(app)
        .get('/api/players')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const player = response.body[0];
      expect(player).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        avatar_color: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    test('Should support search by name', async () => {
      const response = await request(app)
        .get('/api/players?search=Alice')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Alice');
    });

    test('Should support pagination', async () => {
      const response = await request(app)
        .get('/api/players?limit=1&offset=0')
        .expect(200);

      expect(response.body.length).toBe(1);
    });
  });

  describe('GET /api/players/:id', () => {
    let testPlayerId;

    beforeEach(async () => {
      const playerResponse = await request(app)
        .post('/api/players')
        .send({ name: 'Test Player', avatar_color: '#FF5733' });
      testPlayerId = playerResponse.body.id;
    });

    test('Should retrieve player by ID', async () => {
      const response = await request(app)
        .get(`/api/players/${testPlayerId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPlayerId,
        name: 'Test Player',
        avatar_color: '#FF5733'
      });
    });

    test('Should return 404 for non-existent player', async () => {
      const response = await request(app)
        .get('/api/players/invalid-id')
        .expect(404);

      expect(response.body.error).toBe('Player not found');
    });
  });

  describe('PUT /api/players/:id', () => {
    let testPlayerId;

    beforeEach(async () => {
      const playerResponse = await request(app)
        .post('/api/players')
        .send({ name: 'Original Name', avatar_color: '#FF5733' });
      testPlayerId = playerResponse.body.id;
    });

    test('Should update player successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        avatar_color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/players/${testPlayerId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPlayerId,
        name: updateData.name,
        avatar_color: updateData.avatar_color
      });
    });

    test('Should validate update data', async () => {
      const response = await request(app)
        .put(`/api/players/${testPlayerId}`)
        .send({ name: '' }) // Invalid name
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('Should return 404 for non-existent player', async () => {
      const response = await request(app)
        .put('/api/players/invalid-id')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBe('Player not found');
    });
  });

  describe('DELETE /api/players/:id', () => {
    let testPlayerId;

    beforeEach(async () => {
      const playerResponse = await request(app)
        .post('/api/players')
        .send({ name: 'To Delete', avatar_color: '#FF5733' });
      testPlayerId = playerResponse.body.id;
    });

    test('Should delete player successfully', async () => {
      await request(app)
        .delete(`/api/players/${testPlayerId}`)
        .expect(204);

      // Verify player is deleted
      await request(app)
        .get(`/api/players/${testPlayerId}`)
        .expect(404);
    });

    test('Should return 404 for non-existent player', async () => {
      const response = await request(app)
        .delete('/api/players/invalid-id')
        .expect(404);

      expect(response.body.error).toBe('Player not found');
    });

    test('Should prevent deletion if player has games', async () => {
      // Create a game with this player
      const gameTypesResponse = await request(app).get('/api/game-types');
      const gameTypeId = gameTypesResponse.body[0].id;

      const player2Response = await request(app)
        .post('/api/players')
        .send({ name: 'Player 2', avatar_color: '#00FF00' });

      await request(app)
        .post('/api/games')
        .send({
          game_type_id: gameTypeId,
          player_ids: [testPlayerId, player2Response.body.id],
          settings: {}
        });

      // Try to delete player with games
      const response = await request(app)
        .delete(`/api/players/${testPlayerId}`)
        .expect(400);

      expect(response.body.error).toContain('has games');
    });
  });
});
