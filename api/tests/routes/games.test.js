import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';
import { getDatabase, initializeDatabase } from '../../db/database.js';

describe('Games API', () => {
  let server;
  let testPlayerIds = [];
  let testGameTypeId;

  beforeAll(async () => {
    await initializeDatabase();
    server = app.listen(0);

    // Create test players
    const player1Response = await request(app)
      .post('/api/players')
      .send({ name: 'Player 1', avatar_color: '#FF0000' });
    const player2Response = await request(app)
      .post('/api/players')
      .send({ name: 'Player 2', avatar_color: '#00FF00' });
    
    testPlayerIds = [player1Response.body.id, player2Response.body.id];

    // Get a game type
    const gameTypesResponse = await request(app).get('/api/game-types');
    testGameTypeId = gameTypesResponse.body[0].id;
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

  describe('POST /api/games', () => {
    test('Should create a new game successfully', async () => {
      const gameData = {
        game_type_id: testGameTypeId,
        player_ids: testPlayerIds,
        settings: {
          target_score: 500,
          rounds: 10
        }
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        short_id: expect.any(String),
        game_type_id: testGameTypeId,
        status: 'active',
        settings: gameData.settings,
        created_at: expect.any(String),
        players: expect.arrayContaining([
          expect.objectContaining({
            player_id: testPlayerIds[0],
            name: 'Player 1'
          }),
          expect.objectContaining({
            player_id: testPlayerIds[1],
            name: 'Player 2'
          })
        ])
      });
    });

    test('Should validate required fields', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('Should validate minimum players', async () => {
      const gameData = {
        game_type_id: testGameTypeId,
        player_ids: [testPlayerIds[0]], // Only one player
        settings: {}
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.error).toContain('minimum');
    });

    test('Should validate player existence', async () => {
      const gameData = {
        game_type_id: testGameTypeId,
        player_ids: ['invalid-player-id', testPlayerIds[0]],
        settings: {}
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/games/:id', () => {
    let testGameId;

    beforeEach(async () => {
      const gameResponse = await request(app)
        .post('/api/games')
        .send({
          game_type_id: testGameTypeId,
          player_ids: testPlayerIds,
          settings: { target_score: 500 }
        });
      testGameId = gameResponse.body.id;
    });

    test('Should retrieve game by ID', async () => {
      const response = await request(app)
        .get(`/api/games/${testGameId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testGameId,
        status: 'active',
        players: expect.any(Array),
        scores: expect.any(Array),
        rounds: expect.any(Array)
      });
    });

    test('Should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/games/invalid-id')
        .expect(404);

      expect(response.body.error).toBe('Game not found');
    });
  });

  describe('POST /api/games/:id/scores', () => {
    let testGameId;

    beforeEach(async () => {
      const gameResponse = await request(app)
        .post('/api/games')
        .send({
          game_type_id: testGameTypeId,
          player_ids: testPlayerIds,
          settings: { target_score: 500 }
        });
      testGameId = gameResponse.body.id;
    });

    test('Should add scores successfully', async () => {
      const scoreData = {
        round_number: 1,
        scores: [
          { player_id: testPlayerIds[0], points: 50 },
          { player_id: testPlayerIds[1], points: 30 }
        ]
      };

      const response = await request(app)
        .post(`/api/games/${testGameId}/scores`)
        .send(scoreData)
        .expect(201);

      expect(response.body).toMatchObject({
        round_number: 1,
        scores: expect.arrayContaining([
          expect.objectContaining({
            player_id: testPlayerIds[0],
            points: 50
          }),
          expect.objectContaining({
            player_id: testPlayerIds[1],
            points: 30
          })
        ])
      });
    });

    test('Should validate score data', async () => {
      const response = await request(app)
        .post(`/api/games/${testGameId}/scores`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('Should not allow duplicate rounds', async () => {
      // Add first round
      await request(app)
        .post(`/api/games/${testGameId}/scores`)
        .send({
          round_number: 1,
          scores: [
            { player_id: testPlayerIds[0], points: 50 },
            { player_id: testPlayerIds[1], points: 30 }
          ]
        });

      // Try to add same round again
      const response = await request(app)
        .post(`/api/games/${testGameId}/scores`)
        .send({
          round_number: 1,
          scores: [
            { player_id: testPlayerIds[0], points: 60 },
            { player_id: testPlayerIds[1], points: 40 }
          ]
        })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/games/:id/status', () => {
    let testGameId;

    beforeEach(async () => {
      const gameResponse = await request(app)
        .post('/api/games')
        .send({
          game_type_id: testGameTypeId,
          player_ids: testPlayerIds,
          settings: { target_score: 500 }
        });
      testGameId = gameResponse.body.id;
    });

    test('Should complete game successfully', async () => {
      const response = await request(app)
        .put(`/api/games/${testGameId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.completed_at).toBeDefined();
    });

    test('Should validate status values', async () => {
      const response = await request(app)
        .put(`/api/games/${testGameId}/status`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
