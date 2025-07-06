import { validateSocketGameAccess, createSocketRateLimit } from '../middleware/socketAuth.js';
import { isValidId, isValidScore } from '../utils/helpers.js';
import db from '../db/database.js';

const scoreUpdateRateLimit = createSocketRateLimit(20, 60000); // 20 score updates per minute

/**
 * Handle new socket connection
 */
export function handleConnection(io, socket) {
  const { sqid } = socket;
  
  console.log(`🔌 Socket connected to Sqid: ${sqid} (${socket.id})`);
  
  // Send connection confirmation
  socket.emit('connected', {
    sqid: sqid,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // Handle score updates
  socket.on('update_score', scoreUpdateRateLimit(async (data, callback) => {
    try {
      const { gameId, playerId, score } = data;
      
      // Validate input
      if (!isValidId(gameId) || !isValidId(playerId) || !isValidScore(score)) {
        return callback({ success: false, error: 'Invalid input data' });
      }
      
      // Validate game access
      const game = await db.get(
        'SELECT * FROM games WHERE id = ? AND sqid_id = ?',
        [gameId, sqid]
      );
      
      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }
      
      if (game.finalized) {
        return callback({ success: false, error: 'Cannot update finalized game' });
      }
      
      // Validate player is in game
      const playerInGame = await db.get(
        'SELECT * FROM stats WHERE game_id = ? AND player_id = ?',
        [gameId, playerId]
      );
      
      if (!playerInGame) {
        return callback({ success: false, error: 'Player not in game' });
      }
      
      // Update score
      const timestamp = new Date().toISOString();
      await db.run(
        'UPDATE stats SET score = ?, updated_at = ? WHERE game_id = ? AND player_id = ?',
        [score, timestamp, gameId, playerId]
      );
      
      // Get updated stat with player name
      const updatedStat = await db.get(`
        SELECT s.*, p.name as player_name 
        FROM stats s 
        JOIN players p ON s.player_id = p.id 
        WHERE s.game_id = ? AND s.player_id = ?
      `, [gameId, playerId]);
      
      // Broadcast score update to all clients in the sqid
      io.to(`/sqid/${sqid}`).emit('score_update', {
        type: 'score_update',
        gameId: gameId,
        sqidId: sqid,
        playerId: playerId,
        score: score,
        playerName: updatedStat.player_name,
        timestamp: timestamp
      });
      
      callback({ success: true, data: updatedStat });
    } catch (error) {
      console.error('❌ Score update error:', error);
      callback({ success: false, error: 'Failed to update score' });
    }
  }));
  
  // Handle joining a specific game room
  socket.on('join_game', async (data, callback) => {
    try {
      const { gameId } = data;
      
      if (!isValidId(gameId)) {
        return callback({ success: false, error: 'Invalid game ID' });
      }
      
      // Validate game exists and belongs to sqid
      const game = await db.get(
        'SELECT id FROM games WHERE id = ? AND sqid_id = ?',
        [gameId, sqid]
      );
      
      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }
      
      // Join game-specific room
      socket.join(`/game/${gameId}`);
      
      callback({ success: true, message: `Joined game ${gameId}` });
    } catch (error) {
      console.error('❌ Join game error:', error);
      callback({ success: false, error: 'Failed to join game' });
    }
  });
  
  // Handle leaving a game room
  socket.on('leave_game', (data, callback) => {
    try {
      const { gameId } = data;
      
      if (!isValidId(gameId)) {
        return callback({ success: false, error: 'Invalid game ID' });
      }
      
      socket.leave(`/game/${gameId}`);
      callback({ success: true, message: `Left game ${gameId}` });
    } catch (error) {
      console.error('❌ Leave game error:', error);
      callback({ success: false, error: 'Failed to leave game' });
    }
  });
  
  // Handle player activity status
  socket.on('player_activity', (data) => {
    try {
      const { playerId, activity } = data;
      
      if (!isValidId(playerId)) {
        return;
      }
      
      // Broadcast player activity to sqid
      socket.to(`/sqid/${sqid}`).emit('player_activity', {
        type: 'player_activity',
        sqidId: sqid,
        playerId: playerId,
        activity: activity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Player activity error:', error);
    }
  });
  
  // Handle game state requests
  socket.on('get_game_state', async (data, callback) => {
    try {
      const { gameId } = data;
      
      if (!isValidId(gameId)) {
        return callback({ success: false, error: 'Invalid game ID' });
      }
      
      // Get game state
      const game = await db.get(`
        SELECT 
          g.*,
          gt.name as game_type_name,
          gt.is_win_condition,
          gt.win_condition,
          gt.loss_condition
        FROM games g
        JOIN game_types gt ON g.game_type_id = gt.id
        WHERE g.id = ? AND g.sqid_id = ?
      `, [gameId, sqid]);
      
      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }
      
      // Get player scores
      const players = await db.query(`
        SELECT 
          p.id,
          p.name,
          s.score,
          s.updated_at as score_updated_at
        FROM stats s
        JOIN players p ON s.player_id = p.id
        WHERE s.game_id = ?
        ORDER BY s.created_at ASC
      `, [gameId]);
      
      game.players = players;
      
      callback({ success: true, data: game });
    } catch (error) {
      console.error('❌ Get game state error:', error);
      callback({ success: false, error: 'Failed to get game state' });
    }
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${sqid}:`, error);
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected from Sqid: ${sqid} (${socket.id}) - ${reason}`);
    
    // Broadcast player left if needed
    socket.to(`/sqid/${sqid}`).emit('player_left', {
      type: 'player_left',
      sqidId: sqid,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat', { timestamp: new Date().toISOString() });
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);
  
  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval);
  });
}

/**
 * Broadcast to specific sqid
 */
export function broadcastToSquid(io, sqid, event, data) {
  io.to(`/sqid/${sqid}`).emit(event, {
    ...data,
    sqidId: sqid,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast to specific game
 */
export function broadcastToGame(io, gameId, event, data) {
  io.to(`/game/${gameId}`).emit(event, {
    ...data,
    gameId: gameId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get connected clients count for a sqid
 */
export async function getSquidClientCount(io, sqid) {
  try {
    const clients = await io.in(`/sqid/${sqid}`).allSockets();
    return clients.size;
  } catch (error) {
    console.error('Error getting client count:', error);
    return 0;
  }
}

/**
 * Send system message to sqid
 */
export function sendSystemMessage(io, sqid, message, type = 'info') {
  broadcastToSquid(io, sqid, 'system_message', {
    type: 'system_message',
    messageType: type,
    message: message
  });
}
