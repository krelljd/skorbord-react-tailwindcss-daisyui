import express from 'express';
import { 
  validateUpdateStats,
  validateGameAccess 
} from '../middleware/validation.js';
import { createResponse, generateUUID, determineWinner } from '../utils/helpers.js';
import { ValidationError, ConflictError } from '../middleware/errorHandler.js';
import db from '../db/database.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/:sqid/games/:gameId/stats - Get stats for a game
 */
router.get('/', validateGameAccess, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    
    const stats = await db.query(`
      SELECT 
        s.*,
        p.name as player_name
      FROM stats s
      JOIN players p ON s.player_id = p.id
      WHERE s.game_id = ?
      ORDER BY s.created_at ASC
    `, [gameId]);
    
    res.json(createResponse(true, stats));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/:sqid/games/:gameId/stats - Add/update player stats
 */
router.post('/', validateGameAccess, validateUpdateStats, async (req, res, next) => {
  try {
    const { sqid, gameId } = req.params;
    const { stats } = req.body;
    const { gameInfo } = req;
    
    if (gameInfo.finalized) {
      throw new ConflictError('Cannot update stats for finalized games');
    }
    
    // Get game type for winner determination
    const gameType = await db.get(
      'SELECT * FROM game_types WHERE id = ?',
      [gameInfo.game_type_id]
    );
    
    // Validate all players belong to this game
    const gamePlayerIds = await db.query(
      'SELECT player_id FROM stats WHERE game_id = ?',
      [gameId]
    );
    
    const validPlayerIds = new Set(gamePlayerIds.map(p => p.player_id));
    
    for (const stat of stats) {
      if (!validPlayerIds.has(stat.player_id)) {
        throw new ValidationError('Player not found in this game');
      }
    }
    
    const result = await db.transaction(async (db) => {
      const updatedStats = [];
      const timestamp = new Date().toISOString();
      
      // Update each player's score
      for (const stat of stats) {
        await db.run(
          'UPDATE stats SET score = ?, updated_at = ? WHERE game_id = ? AND player_id = ?',
          [stat.score, timestamp, gameId, stat.player_id]
        );
        
        const updatedStat = await db.get(
          'SELECT s.*, p.name as player_name FROM stats s JOIN players p ON s.player_id = p.id WHERE s.game_id = ? AND s.player_id = ?',
          [gameId, stat.player_id]
        );
        
        updatedStats.push(updatedStat);
      }
      
      // Check if game should be auto-completed
      const allPlayerScores = await db.query(
        'SELECT player_id, score FROM stats WHERE game_id = ?',
        [gameId]
      );
      
      const winnerId = determineWinner(gameType, allPlayerScores);
      
      if (winnerId && !gameInfo.winner_id) {
        // Auto-update winner if conditions are met
        await db.run(
          'UPDATE games SET winner_id = ? WHERE id = ?',
          [winnerId, gameId]
        );
      }
      
      return { stats: updatedStats, winnerId };
    });
    
    // Broadcast score update
    req.io?.to(`/sqid/${sqid}`).emit('score_update', {
      type: 'score_update',
      gameId: gameId,
      sqidId: sqid,
      stats: result.stats,
      winnerId: result.winnerId,
      timestamp: new Date().toISOString()
    });
    
    res.json(createResponse(true, result.stats));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/:sqid/games/:gameId/stats/:playerId - Update specific player's stat
 */
router.put('/:playerId', validateGameAccess, async (req, res, next) => {
  try {
    const { sqid, gameId, playerId } = req.params;
    const { score } = req.body;
    const { gameInfo } = req;
    
    if (gameInfo.finalized) {
      throw new ConflictError('Cannot update stats for finalized games');
    }
    
    if (!Number.isInteger(score)) {
      throw new ValidationError('Score must be an integer');
    }
    
    const minScore = parseInt(process.env.MIN_SCORE) || -999;
    const maxScore = parseInt(process.env.MAX_SCORE) || 999;
    
    if (score < minScore || score > maxScore) {
      throw new ValidationError(`Score must be between ${minScore} and ${maxScore}`);
    }
    
    // Verify player is in this game
    const existingStat = await db.get(
      'SELECT * FROM stats WHERE game_id = ? AND player_id = ?',
      [gameId, playerId]
    );
    
    if (!existingStat) {
      throw new ValidationError('Player not found in this game');
    }
    
    // Update score
    const timestamp = new Date().toISOString();
    await db.run(
      'UPDATE stats SET score = ?, updated_at = ? WHERE game_id = ? AND player_id = ?',
      [score, timestamp, gameId, playerId]
    );
    
    // Get updated stat with player name
    const updatedStat = await db.get(`
      SELECT 
        s.*,
        p.name as player_name
      FROM stats s
      JOIN players p ON s.player_id = p.id
      WHERE s.game_id = ? AND s.player_id = ?
    `, [gameId, playerId]);
    
    // Check for winner
    const gameType = await db.get(
      'SELECT * FROM game_types WHERE id = ?',
      [gameInfo.game_type_id]
    );
    
    const allPlayerScores = await db.query(
      'SELECT player_id, score FROM stats WHERE game_id = ?',
      [gameId]
    );
    
    const winnerId = determineWinner(gameType, allPlayerScores);
    
    if (winnerId && !gameInfo.winner_id) {
      await db.run(
        'UPDATE games SET winner_id = ? WHERE id = ?',
        [winnerId, gameId]
      );
    }
    
    // Broadcast individual score update
    req.io?.to(`/sqid/${sqid}`).emit('score_update', {
      type: 'score_update',
      gameId: gameId,
      sqidId: sqid,
      playerId: playerId,
      score: score,
      winnerId: winnerId,
      timestamp: timestamp
    });
    
    res.json(createResponse(true, updatedStat));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/games/:gameId/stats/:playerId - Get specific player's stat
 */
router.get('/:playerId', validateGameAccess, async (req, res, next) => {
  try {
    const { gameId, playerId } = req.params;
    
    const stat = await db.get(`
      SELECT 
        s.*,
        p.name as player_name
      FROM stats s
      JOIN players p ON s.player_id = p.id
      WHERE s.game_id = ? AND s.player_id = ?
    `, [gameId, playerId]);
    
    if (!stat) {
      throw new ValidationError('Player not found in this game');
    }
    
    res.json(createResponse(true, stat));
  } catch (error) {
    next(error);
  }
});

export default router;
