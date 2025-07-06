import { jest } from '@jest/globals';
import { Client } from 'socket.io-client';
import app from '../../index.js';
import { initializeDatabase, getDatabase } from '../../db/database.js';

describe('Socket.IO Events', () => {
  let server;
  let clientSocket;
  let serverSocket;
  let port;

  beforeAll(async () => {
    await initializeDatabase();
    server = app.listen(0);
    port = server.address().port;

    // Wait for server to be ready
    await new Promise(resolve => {
      server.on('listening', resolve);
    });
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

  beforeEach((done) => {
    // Create client socket
    clientSocket = new Client(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket']
    });

    // Get server socket reference when client connects
    app.get('socketio').on('connection', (socket) => {
      serverSocket = socket;
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection', () => {
    test('Should connect successfully', () => {
      expect(clientSocket.connected).toBe(true);
    });

    test('Should handle disconnect', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
      clientSocket.disconnect();
    });
  });

  describe('Game Events', () => {
    let testGameId;
    let testPlayerIds = [];

    beforeEach(async () => {
      // Create test players and game
      const player1 = await fetch(`http://localhost:${port}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Player 1', avatar_color: '#FF0000' })
      }).then(r => r.json());

      const player2 = await fetch(`http://localhost:${port}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Player 2', avatar_color: '#00FF00' })
      }).then(r => r.json());

      testPlayerIds = [player1.id, player2.id];

      const gameTypes = await fetch(`http://localhost:${port}/api/game-types`)
        .then(r => r.json());

      const game = await fetch(`http://localhost:${port}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type_id: gameTypes[0].id,
          player_ids: testPlayerIds,
          settings: { target_score: 500 }
        })
      }).then(r => r.json());

      testGameId = game.id;
    });

    test('Should join game room', (done) => {
      clientSocket.emit('join-game', testGameId);
      
      clientSocket.on('game-joined', (data) => {
        expect(data.gameId).toBe(testGameId);
        expect(data.success).toBe(true);
        done();
      });
    });

    test('Should handle join game errors', (done) => {
      clientSocket.emit('join-game', 'invalid-game-id');
      
      clientSocket.on('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
    });

    test('Should broadcast score updates', (done) => {
      // Create second client to test broadcasting
      const client2 = new Client(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      client2.on('connect', () => {
        // Both clients join the game
        clientSocket.emit('join-game', testGameId);
        client2.emit('join-game', testGameId);

        // Listen for score update on second client
        client2.on('score-updated', (data) => {
          expect(data.gameId).toBe(testGameId);
          expect(data.round).toBeDefined();
          expect(data.scores).toBeDefined();
          client2.disconnect();
          done();
        });

        // First client updates score
        setTimeout(() => {
          clientSocket.emit('update-score', {
            gameId: testGameId,
            round: 1,
            scores: [
              { player_id: testPlayerIds[0], points: 50 },
              { player_id: testPlayerIds[1], points: 30 }
            ]
          });
        }, 100);
      });
    });

    test('Should broadcast game status changes', (done) => {
      const client2 = new Client(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      client2.on('connect', () => {
        clientSocket.emit('join-game', testGameId);
        client2.emit('join-game', testGameId);

        client2.on('game-status-changed', (data) => {
          expect(data.gameId).toBe(testGameId);
          expect(data.status).toBe('completed');
          client2.disconnect();
          done();
        });

        setTimeout(() => {
          clientSocket.emit('update-game-status', {
            gameId: testGameId,
            status: 'completed'
          });
        }, 100);
      });
    });

    test('Should handle invalid score update', (done) => {
      clientSocket.emit('join-game', testGameId);
      
      clientSocket.on('game-joined', () => {
        clientSocket.emit('update-score', {
          gameId: testGameId,
          // Missing required fields
        });

        clientSocket.on('error', (error) => {
          expect(error.message).toBeDefined();
          done();
        });
      });
    });
  });

  describe('Player Events', () => {
    test('Should broadcast player updates', (done) => {
      const client2 = new Client(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      client2.on('connect', () => {
        client2.on('player-updated', (data) => {
          expect(data.player).toBeDefined();
          expect(data.player.name).toBe('New Player');
          client2.disconnect();
          done();
        });

        setTimeout(() => {
          clientSocket.emit('player-update', {
            name: 'New Player',
            avatar_color: '#FF5733'
          });
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle malformed events', (done) => {
      clientSocket.emit('invalid-event', 'malformed-data');
      
      clientSocket.on('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
    });

    test('Should validate event data', (done) => {
      clientSocket.emit('join-game'); // Missing game ID
      
      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Game ID');
        done();
      });
    });
  });

  describe('Authentication', () => {
    test('Should handle authenticated events', (done) => {
      // This test would be more relevant if we had authentication
      // For now, just test that events work without auth
      clientSocket.emit('join-game', 'test-game-id');
      
      clientSocket.on('error', () => {
        // Expected since game doesn't exist
        done();
      });
    });
  });
});
