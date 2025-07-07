import express from 'express';
import { createResponse } from '../utils/helpers.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import db from '../db/database.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/:sqid/rivalries - Get all rivalries in Sqid
 */
router.get('/', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    
    const rivalries = await db.query(`
      SELECT 
        r.*,
        gt.name as game_type_name,
        gt.description as game_type_description,
        rs.avg_margin,
        rs.last_10_results,
        rs.min_win_margin,
        rs.max_win_margin,
        rs.min_loss_margin,
        rs.max_loss_margin,
        rs.total_games
      FROM rivalries r
      LEFT JOIN game_types gt ON r.game_type_id = gt.id
      LEFT JOIN rivalry_stats rs ON r.id = rs.rivalry_id
      WHERE r.sqid_id = ?
      ORDER BY rs.total_games DESC, r.created_at DESC
    `, [sqid]);
    
    // Get players for each rivalry and add player_names array
    for (const rivalry of rivalries) {
      const players = await db.query(`
        SELECT 
          p.id,
          p.name
        FROM rivalry_players rp
        JOIN players p ON rp.player_id = p.id
        WHERE rp.rivalry_id = ?
        ORDER BY p.name ASC
      `, [rivalry.id]);
      rivalry.players = players;
      // Add player_names array for frontend dropdowns
      rivalry.player_names = players.map(player => player.name);
    }
    res.json(createResponse(true, rivalries));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/rivalries/:rivalryId - Get rivalry details
 */
router.get('/:rivalryId', async (req, res, next) => {
  try {
    const { sqid, rivalryId } = req.params;
    
    // Get rivalry with stats
    const rivalry = await db.get(`
      SELECT 
        r.*,
        gt.name as game_type_name,
        gt.description as game_type_description,
        gt.is_win_condition,
        gt.win_condition,
        gt.loss_condition,
        rs.avg_margin,
        rs.last_10_results,
        rs.min_win_margin,
        rs.max_win_margin,
        rs.min_loss_margin,
        rs.max_loss_margin,
        rs.total_games,
        rs.updated_at as stats_updated_at
      FROM rivalries r
      LEFT JOIN game_types gt ON r.game_type_id = gt.id
      LEFT JOIN rivalry_stats rs ON r.id = rs.rivalry_id
      WHERE r.id = ? AND r.sqid_id = ?
    `, [rivalryId, sqid]);
    
    if (!rivalry) {
      throw new NotFoundError('Rivalry not found');
    }
    
    // Get players in this rivalry
    const players = await db.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT g.id) as games_played,
        COUNT(DISTINCT CASE WHEN g.winner_id = p.id THEN g.id END) as games_won,
        AVG(s.score) as avg_score,
        MAX(s.score) as highest_score,
        MIN(s.score) as lowest_score
      FROM rivalry_players rp
      JOIN players p ON rp.player_id = p.id
      LEFT JOIN stats s ON p.id = s.player_id
      LEFT JOIN games g ON s.game_id = g.id AND g.game_type_id = ? AND g.finalized = true
      WHERE rp.rivalry_id = ?
      GROUP BY p.id, p.name
      ORDER BY games_won DESC, p.name ASC
    `, [rivalry.game_type_id, rivalry.id]);
    
    rivalry.players = players;
    
    // Get recent games for this rivalry
    const recentGames = await db.query(`
      SELECT 
        g.id,
        g.started_at,
        g.ended_at,
        g.finalized,
        g.winner_id,
        wp.name as winner_name,
        MAX(s.score) - MIN(s.score) as score_difference
      FROM games g
      JOIN stats s ON g.id = s.game_id
      JOIN rivalry_players rp ON s.player_id = rp.player_id
      LEFT JOIN players wp ON g.winner_id = wp.id
      WHERE rp.rivalry_id = ? AND g.finalized = true
      GROUP BY g.id, g.started_at, g.ended_at, g.finalized, g.winner_id, wp.name
      ORDER BY g.started_at DESC
      LIMIT 10
    `, [rivalry.id]);
    
    // Get player scores for each recent game
    for (const game of recentGames) {
      const gameStats = await db.query(`
        SELECT 
          p.id as player_id,
          p.name as player_name,
          s.score
        FROM stats s
        JOIN players p ON s.player_id = p.id
        JOIN rivalry_players rp ON p.id = rp.player_id
        WHERE s.game_id = ? AND rp.rivalry_id = ?
        ORDER BY s.score DESC
      `, [game.id, rivalry.id]);
      
      game.player_scores = gameStats;
    }
    
    rivalry.recent_games = recentGames;
    
    res.json(createResponse(true, rivalry));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/rivalries/by-players - Get rivalry by player IDs
 */
router.get('/by-players', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { player_ids, game_type_id } = req.query;
    
    if (!player_ids || !game_type_id) {
      throw new ValidationError('player_ids and game_type_id are required');
    }
    
    const playerIdArray = Array.isArray(player_ids) ? player_ids : [player_ids];
    
    if (playerIdArray.length < 2) {
      throw new ValidationError('At least 2 player IDs are required');
    }
    
    // Find rivalry that matches these players and game type
    const rivalry = await db.get(`
      SELECT r.id
      FROM rivalries r
      WHERE r.sqid_id = ? AND r.game_type_id = ?
      AND (
        SELECT COUNT(*)
        FROM rivalry_players rp
        WHERE rp.rivalry_id = r.id AND rp.player_id IN (${playerIdArray.map(() => '?').join(',')})
      ) = ?
      AND (
        SELECT COUNT(*)
        FROM rivalry_players rp
        WHERE rp.rivalry_id = r.id
      ) = ?
    `, [sqid, game_type_id, ...playerIdArray, playerIdArray.length, playerIdArray.length]);
    
    if (!rivalry) {
      return res.json(createResponse(true, null));
    }
    
    // Redirect to the full rivalry endpoint
    req.params.rivalryId = rivalry.id;
    return router.handle(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/rivalries/:rivalryId/games - Get all games for a rivalry
 */
router.get('/:rivalryId/games', async (req, res, next) => {
  try {
    const { sqid, rivalryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Verify rivalry exists and belongs to sqid
    const rivalry = await db.get(
      'SELECT id FROM rivalries WHERE id = ? AND sqid_id = ?',
      [rivalryId, sqid]
    );
    
    if (!rivalry) {
      throw new NotFoundError('Rivalry not found');
    }
    
    // Get all games for this rivalry
    const games = await db.query(`
      SELECT DISTINCT
        g.id,
        g.started_at,
        g.ended_at,
        g.finalized,
        g.winner_id,
        wp.name as winner_name,
        MAX(s.score) - MIN(s.score) as score_difference
      FROM games g
      JOIN stats s ON g.id = s.game_id
      JOIN rivalry_players rp ON s.player_id = rp.player_id
      LEFT JOIN players wp ON g.winner_id = wp.id
      WHERE rp.rivalry_id = ?
      GROUP BY g.id, g.started_at, g.ended_at, g.finalized, g.winner_id, wp.name
      ORDER BY g.started_at DESC
      LIMIT ? OFFSET ?
    `, [rivalryId, parseInt(limit), parseInt(offset)]);
    
    // Get player scores for each game
    for (const game of games) {
      const gameStats = await db.query(`
        SELECT 
          p.id as player_id,
          p.name as player_name,
          s.score
        FROM stats s
        JOIN players p ON s.player_id = p.id
        JOIN rivalry_players rp ON p.id = rp.player_id
        WHERE s.game_id = ? AND rp.rivalry_id = ?
        ORDER BY s.score DESC
      `, [game.id, rivalryId]);
      
      game.player_scores = gameStats;
    }
    
    res.json(createResponse(true, games));
  } catch (error) {
    next(error);
  }
});

export default router;
