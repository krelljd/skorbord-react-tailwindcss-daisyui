import express from 'express';
import { 
  validateCreatePlayer,
  validatePlayerAccess 
} from '../middleware/validation.js';
import { createResponse, generateUUID } from '../utils/helpers.js';
import { ConflictError } from '../middleware/errorHandler.js';
import db from '../db/database.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/:sqid/players - Get all players in Sqid
 */
router.get('/', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    
    const players = await db.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT g.id) as games_played,
        AVG(s.score) as avg_score
      FROM players p
      LEFT JOIN stats s ON p.id = s.player_id
      LEFT JOIN games g ON s.game_id = g.id AND g.finalized = true
      WHERE p.sqid_id = ?
      GROUP BY p.id, p.name, p.created_at
      ORDER BY p.created_at ASC
    `, [sqid]);
    
    res.json(createResponse(true, players));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/:sqid/players - Add player to Sqid
 */
router.post('/', validateCreatePlayer, async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { name } = req.body;
    
    // Check if player name already exists in this Sqid
    const existingPlayer = await db.get(
      'SELECT id FROM players WHERE sqid_id = ? AND name = ?',
      [sqid, name]
    );
    
    if (existingPlayer) {
      throw new ConflictError('Player name already exists in this Sqid');
    }
    
    // Create new player
    const playerId = generateUUID();
    const playerData = {
      id: playerId,
      sqid_id: sqid,
      name: name,
      created_at: new Date().toISOString()
    };
    
    await db.run(
      'INSERT INTO players (id, sqid_id, name, created_at) VALUES (?, ?, ?, ?)',
      [playerData.id, playerData.sqid_id, playerData.name, playerData.created_at]
    );
    
    res.status(201).json(createResponse(true, playerData));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/players/:playerId - Get player details
 */
router.get('/:playerId', validatePlayerAccess, async (req, res, next) => {
  try {
    const { playerId } = req.params;
    
    // Get player with statistics
    const player = await db.get(`
      SELECT 
        p.*,
        COUNT(DISTINCT g.id) as games_played,
        COUNT(DISTINCT CASE WHEN g.winner_id = p.id THEN g.id END) as games_won,
        AVG(s.score) as avg_score,
        MAX(s.score) as highest_score,
        MIN(s.score) as lowest_score
      FROM players p
      LEFT JOIN stats s ON p.id = s.player_id
      LEFT JOIN games g ON s.game_id = g.id AND g.finalized = true
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.created_at
    `, [playerId]);
    
    // Get recent games
    const recentGames = await db.query(`
      SELECT 
        g.id,
        g.started_at,
        g.ended_at,
        g.finalized,
        gt.name as game_type_name,
        s.score,
        CASE WHEN g.winner_id = ? THEN true ELSE false END as won
      FROM games g
      JOIN game_types gt ON g.game_type_id = gt.id
      JOIN stats s ON g.id = s.game_id AND s.player_id = ?
      WHERE g.sqid_id = (SELECT sqid_id FROM players WHERE id = ?)
      ORDER BY g.started_at DESC
      LIMIT 10
    `, [playerId, playerId, playerId]);
    
    player.recent_games = recentGames;
    
    res.json(createResponse(true, player));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/:sqid/players/:playerId - Remove player from Sqid
 */
router.delete('/:playerId', validatePlayerAccess, async (req, res, next) => {
  try {
    const { playerId } = req.params;
    
    // Check if player has any finalized games
    const finalizedGames = await db.get(
      'SELECT COUNT(*) as count FROM stats s JOIN games g ON s.game_id = g.id WHERE s.player_id = ? AND g.finalized = true',
      [playerId]
    );
    
    if (finalizedGames.count > 0) {
      throw new ConflictError('Cannot delete player with finalized game history');
    }
    
    // Delete player (cascade will handle related records)
    await db.run('DELETE FROM players WHERE id = ?', [playerId]);
    
    res.json(createResponse(true, { message: 'Player deleted successfully' }));
  } catch (error) {
    next(error);
  }
});

export default router;
