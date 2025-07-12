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

      // Aggregate stats per game type
      const stats = await db.query(`
        SELECT 
          rs.game_type_id,
          gt.name as game_type_name,
          rs.total_games,
          rs.avg_margin as average_margin,
          rs.min_win_margin,
          rs.max_win_margin,
          rs.min_loss_margin,
          rs.max_loss_margin,
          rs.last_10_results,
          rs.updated_at
        FROM rivalry_stats rs
        JOIN game_types gt ON rs.game_type_id = gt.id
        WHERE rs.rivalry_id = ?
        ORDER BY rs.updated_at DESC
      `, [rivalry.id]);
      rivalry.game_type_stats = stats;
    }
    res.json(createResponse(true, rivalries));
  } catch (error) {
    next(error);
  }
});

export default router;

