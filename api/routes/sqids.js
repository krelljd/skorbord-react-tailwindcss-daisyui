import express from 'express';
import { 
  validateCreateSquid,
  validateIdParam 
} from '../middleware/validation.js';
import { createResponse, generateShortId, generateUUID } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import db from '../db/database.js';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/:sqid - Get Sqid details
 */
router.get('/', async (req, res, next) => {
  try {
    const { sqidInfo } = req;
    
    // Get additional statistics
    const [playerCount, gameCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM players WHERE sqid_id = ?', [sqidInfo.id]),
      db.get('SELECT COUNT(*) as count FROM games WHERE sqid_id = ?', [sqidInfo.id])
    ]);
    
    const response = {
      ...sqidInfo,
      player_count: playerCount.count,
      game_count: gameCount.count
    };
    
    res.json(createResponse(true, response));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/:sqid - Create new Sqid (if it doesn't exist)
 */
router.post('/', validateCreateSquid, async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { name } = req.body;
    
    // Check if Sqid already exists
    const existingSquid = await db.get(
      'SELECT id FROM sqids WHERE id = ?',
      [sqid]
    );
    
    if (existingSquid) {
      throw new ConflictError('Sqid already exists');
    }
    
    // Create new Sqid
    const sqidName = name || `Game ${sqid}`;
    const sqidData = {
      id: sqid,
      name: sqidName,
      created_at: new Date().toISOString()
    };
    
    await db.run(
      'INSERT INTO sqids (id, name, created_at) VALUES (?, ?, ?)',
      [sqidData.id, sqidData.name, sqidData.created_at]
    );
    
    res.status(201).json(createResponse(true, sqidData));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/players - Get all players in Sqid
 */
router.get('/players', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    
    const players = await db.query(
      'SELECT * FROM players WHERE sqid_id = ? ORDER BY created_at ASC',
      [sqid]
    );
    
    res.json(createResponse(true, players));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/games - Get all games in Sqid
 */
router.get('/games', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const games = await db.query(`
      SELECT 
        g.*,
        gt.name as game_type_name,
        gt.description as game_type_description,
        p.name as winner_name
      FROM games g
      LEFT JOIN game_types gt ON g.game_type_id = gt.id
      LEFT JOIN players p ON g.winner_id = p.id
      WHERE g.sqid_id = ?
      ORDER BY g.started_at DESC
      LIMIT ? OFFSET ?
    `, [sqid, parseInt(limit), parseInt(offset)]);
    
    res.json(createResponse(true, games));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/rivalries - Get all rivalries in Sqid
 */
router.get('/rivalries', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    
    // Get all rivalries for this sqid
    const rivalries = await db.query(`
      SELECT id, created_at
      FROM rivalries
      WHERE sqid_id = ?
      ORDER BY created_at DESC
    `, [sqid]);

    for (const rivalry of rivalries) {
      // Get players in this rivalry
      const players = await db.query(`
        SELECT p.id, p.name
        FROM rivalry_players rp
        JOIN players p ON rp.player_id = p.id
        WHERE rp.rivalry_id = ?
        ORDER BY p.name ASC
      `, [rivalry.id]);
      rivalry.players = players;
      rivalry.player_names = players.map(p => p.name);

      // Get all game types played by this rivalry
      const gameTypes = await db.query(`
        SELECT gt.id, gt.name
        FROM rivalry_game_types rgt
        JOIN game_types gt ON rgt.game_type_id = gt.id
        WHERE rgt.rivalry_id = ?
        ORDER BY gt.name ASC
      `, [rivalry.id]);
      rivalry.game_types = gameTypes;

      // Aggregate stats per game type from rivalry_player_stats
      const stats = await db.query(`
        SELECT 
          gt.id as game_type_id,
          gt.name as game_type_name,
          COUNT(DISTINCT g.id) as total_games,
          AVG(rps.avg_margin) as average_margin,
          MIN(rps.min_win_margin) as min_win_margin,
          MAX(rps.max_win_margin) as max_win_margin,
          MIN(rps.min_loss_margin) as min_loss_margin,
          MAX(rps.max_loss_margin) as max_loss_margin,
          GROUP_CONCAT(rps.last_10_results, '') as last_10_results,
          MAX(rps.updated_at) as updated_at
        FROM game_types gt
        LEFT JOIN games g ON g.game_type_id = gt.id AND g.rivalry_id = ? AND g.finalized = 1
        LEFT JOIN rivalry_player_stats rps ON rps.game_type_id = gt.id AND rps.rivalry_id = ?
        WHERE gt.id IN (SELECT game_type_id FROM rivalry_game_types WHERE rivalry_id = ?)
        GROUP BY gt.id
        ORDER BY updated_at DESC
      `, [rivalry.id, rivalry.id, rivalry.id]);
      // Truncate last_10_results to last 10 chars for each game type
      rivalry.game_type_stats = stats.map(stat => ({
        ...stat,
        last_10_results: stat.last_10_results ? stat.last_10_results.slice(-10) : '',
      }));
    }
    res.json(createResponse(true, rivalries));
  } catch (error) {
    next(error);
  }
});

export default router;

