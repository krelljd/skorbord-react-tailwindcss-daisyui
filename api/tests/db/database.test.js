import { jest } from '@jest/globals';
import { getDatabase, initializeDatabase } from '../../db/database.js';

describe('Database', () => {
  let db;

  beforeAll(async () => {
    await initializeDatabase();
    db = getDatabase();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('Connection', () => {
    test('Should initialize database successfully', () => {
      expect(db).toBeDefined();
    });

    test('Should execute simple query', async () => {
      const result = await db.all('SELECT 1 as test');
      expect(result).toEqual([{ test: 1 }]);
    });
  });

  describe('Schema', () => {
    test('Should have players table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='players'
      `);
      expect(result.length).toBe(1);
    });

    test('Should have games table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='games'
      `);
      expect(result.length).toBe(1);
    });

    test('Should have game_types table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='game_types'
      `);
      expect(result.length).toBe(1);
    });

    test('Should have game_players table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='game_players'
      `);
      expect(result.length).toBe(1);
    });

    test('Should have rounds table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='rounds'
      `);
      expect(result.length).toBe(1);
    });

    test('Should have scores table', async () => {
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='scores'
      `);
      expect(result.length).toBe(1);
    });
  });

  describe('Data Operations', () => {
    test('Should insert and retrieve players', async () => {
      const playerId = 'test-player-' + Date.now();
      
      await db.run(`
        INSERT INTO players (id, name, avatar_color, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, [playerId, 'Test Player', '#FF5733']);

      const result = await db.get(`
        SELECT * FROM players WHERE id = ?
      `, [playerId]);

      expect(result).toMatchObject({
        id: playerId,
        name: 'Test Player',
        avatar_color: '#FF5733'
      });
    });

    test('Should handle foreign key constraints', async () => {
      // Try to insert a game with invalid game_type_id
      const gameId = 'test-game-' + Date.now();
      
      try {
        await db.run(`
          INSERT INTO games (id, short_id, game_type_id, status, settings, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [gameId, 'TEST123', 'invalid-type-id', 'active', '{}']);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('FOREIGN KEY');
      }
    });

    test('Should handle unique constraints', async () => {
      const playerName = 'Unique Player ' + Date.now();
      
      // Insert first player
      await db.run(`
        INSERT INTO players (id, name, avatar_color, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, ['player1-' + Date.now(), playerName, '#FF5733']);

      // Try to insert duplicate name
      try {
        await db.run(`
          INSERT INTO players (id, name, avatar_color, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `, ['player2-' + Date.now(), playerName, '#00FF00']);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('UNIQUE');
      }
    });
  });

  describe('Indexes', () => {
    test('Should have appropriate indexes', async () => {
      const indexes = await db.all(`
        SELECT name, tbl_name FROM sqlite_master 
        WHERE type='index' AND sql IS NOT NULL
      `);

      // Check for important indexes
      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).toContain('idx_games_status');
      expect(indexNames).toContain('idx_games_created_at');
      expect(indexNames).toContain('idx_players_name');
    });
  });

  describe('JSON Handling', () => {
    test('Should handle JSON settings in games', async () => {
      // First, get a valid game type
      const gameTypes = await db.all('SELECT id FROM game_types LIMIT 1');
      if (gameTypes.length === 0) {
        // Skip this test if no game types exist
        return;
      }

      const gameId = 'json-test-' + Date.now();
      const settings = { target_score: 500, rounds: 10 };
      
      await db.run(`
        INSERT INTO games (id, short_id, game_type_id, status, settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [gameId, 'JSON123', gameTypes[0].id, 'active', JSON.stringify(settings)]);

      const result = await db.get(`
        SELECT settings FROM games WHERE id = ?
      `, [gameId]);

      const parsedSettings = JSON.parse(result.settings);
      expect(parsedSettings).toEqual(settings);
    });
  });

  describe('Transactions', () => {
    test('Should handle transaction rollback', async () => {
      const playerId = 'transaction-test-' + Date.now();
      
      try {
        await db.run('BEGIN TRANSACTION');
        
        await db.run(`
          INSERT INTO players (id, name, avatar_color, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `, [playerId, 'Transaction Player', '#FF5733']);

        // Force an error
        await db.run('INSERT INTO invalid_table VALUES (1)');
        
        await db.run('COMMIT');
      } catch (error) {
        await db.run('ROLLBACK');
      }

      // Player should not exist due to rollback
      const result = await db.get(`
        SELECT * FROM players WHERE id = ?
      `, [playerId]);

      expect(result).toBeUndefined();
    });
  });
});
