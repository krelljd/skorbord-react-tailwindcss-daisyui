import express from 'express';
import { 
  validateCreateGame,
  validateUpdateGame,
  validateGameAccess 
} from '../middleware/validation.js';
import { createResponse, generateUUID, determineWinner, calculateRivalryStats } from '../utils/helpers.js';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler.js';
import db from '../db/database.js';



const router = express.Router({ mergeParams: true });

/**
 * GET /api/:sqid/games/active - Get active (non-finalized) game for Sqid
 */
router.get('/active', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    // Join game_types and players for richer game info
    const game = await db.get(`
      SELECT 
        g.*, 
        gt.name as game_type_name,
        gt.description as game_type_description,
        gt.is_win_condition,
        gt.win_condition,
        gt.loss_condition,
        p.name as winner_name
      FROM games g
      LEFT JOIN game_types gt ON g.game_type_id = gt.id
      LEFT JOIN players p ON g.winner_id = p.id
      WHERE g.sqid_id = ? AND g.finalized = false
      ORDER BY g.started_at DESC LIMIT 1
    `, [sqid]);
    if (!game) {
      return res.status(404).json(createResponse(false, null, 'No active game found'));
    }
    // Add computed win_condition_type and win_condition_value for frontend compatibility
    game.win_condition_type = game.is_win_condition ? 'win' : 'lose';
    game.win_condition_value = game.is_win_condition ? game.win_condition : game.loss_condition;
    res.json(createResponse(true, game));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/games - Get all games in Sqid
 */
router.get('/', async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { limit = 50, offset = 0, finalized } = req.query;
    
    let query = `
      SELECT 
        g.*,
        gt.name as game_type_name,
        gt.description as game_type_description,
        gt.is_win_condition,
        gt.win_condition,
        gt.loss_condition,
        p.name as winner_name
      FROM games g
      LEFT JOIN game_types gt ON g.game_type_id = gt.id
      LEFT JOIN players p ON g.winner_id = p.id
      WHERE g.sqid_id = ?
    `;
    
    const params = [sqid];
    
    if (finalized !== undefined) {
      query += ' AND g.finalized = ?';
      params.push(finalized === 'true');
    }
    
    query += ' ORDER BY g.started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const games = await db.query(query, params);
    
    // Get players for each game
    for (const game of games) {
      const players = await db.query(`
        SELECT 
          p.id,
          p.name,
          s.score,
          s.created_at as score_updated_at
        FROM stats s
        JOIN players p ON s.player_id = p.id
        WHERE s.game_id = ?
        ORDER BY s.created_at ASC
      `, [game.id]);
      
      game.players = players;
    }
    
    res.json(createResponse(true, games));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/:sqid/games - Create new game
 */
router.post('/', validateCreateGame, async (req, res, next) => {
  try {
    const { sqid } = req.params;
    const { game_type_id, player_ids, player_names } = req.body;

    // Validate game type exists
    const gameType = await db.get(
      'SELECT * FROM game_types WHERE id = ?',
      [game_type_id]
    );
    if (!gameType) {
      throw new ValidationError('Game type not found');
    }

    let finalPlayerIds = [];
    if (Array.isArray(player_ids)) {
      finalPlayerIds = player_ids;
    } else if (Array.isArray(player_names)) {
      // For each name, look up or create player in this sqid
      for (const name of player_names) {
        const trimmed = typeof name === 'string' ? name.trim() : '';
        // Allow empty names (will create unnamed player)
        let player;
        if (trimmed) {
          player = await db.get('SELECT id FROM players WHERE sqid_id = ? AND name = ?', [sqid, trimmed]);
        }
        if (!player) {
          // Create new player (empty name allowed)
          const playerId = generateUUID();
          await db.run('INSERT INTO players (id, sqid_id, name, created_at) VALUES (?, ?, ?, ?)', [playerId, sqid, trimmed, new Date().toISOString()]);
          finalPlayerIds.push(playerId);
        } else {
          finalPlayerIds.push(player.id);
        }
      }
    } else {
      throw new ValidationError('player_ids or player_names required');
    }

    // Validate all players exist in this sqid (should always be true now)
    const playerPlaceholders = finalPlayerIds.map(() => '?').join(',');
    const players = await db.query(
      `SELECT id FROM players WHERE sqid_id = ? AND id IN (${playerPlaceholders})`,
      [sqid, ...finalPlayerIds]
    );
    if (players.length !== finalPlayerIds.length) {
      throw new ValidationError('One or more players not found in this Sqid');
    }

    // Create game within a transaction
    const result = await db.transaction(async (db) => {
      const gameId = generateUUID();
      const gameData = {
        id: gameId,
        sqid_id: sqid,
        game_type_id: game_type_id,
        started_at: new Date().toISOString(),
        finalized: false
      };

      // Insert game
      await db.run(
        'INSERT INTO games (id, sqid_id, game_type_id, started_at, finalized) VALUES (?, ?, ?, ?, ?)',
        [gameData.id, gameData.sqid_id, gameData.game_type_id, gameData.started_at, gameData.finalized]
      );

      // Insert initial stats for each player (score 0)
      for (const playerId of finalPlayerIds) {
        const statId = generateUUID();
        await db.run(
          'INSERT INTO stats (id, game_id, player_id, score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [statId, gameId, playerId, 0, gameData.started_at, gameData.started_at]
        );
      }

      // Create or update rivalry
      await createOrUpdateRivalry(db, sqid, game_type_id, finalPlayerIds);

      return gameData;
    });

    // Broadcast game created event
    req.io?.to(`/sqid/${sqid}`).emit('game_started', {
      type: 'game_started',
      gameId: result.id,
      sqidId: sqid,
      timestamp: result.started_at
    });

    res.status(201).json(createResponse(true, result));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/:sqid/games/:gameId - Get game details
 */
router.get('/:gameId', validateGameAccess, async (req, res, next) => {
  try {
    const { gameInfo } = req;

    // Get game with game type info
    const game = await db.get(`
      SELECT 
        g.*,
        gt.name as game_type_name,
        gt.description as game_type_description,
        gt.is_win_condition,
        gt.win_condition,
        gt.loss_condition,
        p.name as winner_name
      FROM games g
      LEFT JOIN game_types gt ON g.game_type_id = gt.id
      LEFT JOIN players p ON g.winner_id = p.id
      WHERE g.id = ?
    `, [gameInfo.id]);

    // Add computed win_condition_type and win_condition_value for frontend compatibility
    if (game) {
      game.win_condition_type = game.is_win_condition ? 'win' : 'lose';
      game.win_condition_value = game.is_win_condition ? game.win_condition : game.loss_condition;
    }

    // Get players and their scores
    const players = await db.query(`
      SELECT 
        p.id,
        p.name,
        s.score,
        s.created_at as score_created_at,
        s.updated_at as score_updated_at
      FROM stats s
      JOIN players p ON s.player_id = p.id
      WHERE s.game_id = ?
      ORDER BY s.created_at ASC
    `, [gameInfo.id]);

    game.players = players;

    res.json(createResponse(true, game));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/:sqid/games/:gameId - Update game (end, finalize, etc)
 */
router.put('/:gameId', validateGameAccess, validateUpdateGame, async (req, res, next) => {
  try {
    const { gameInfo } = req;
    const { ended_at, finalized, winner_id } = req.body;
    
    if (gameInfo.finalized && finalized === false) {
      throw new ConflictError('Cannot un-finalize a game');
    }
    
    const updates = {};
    const params = [];
    
    if (ended_at !== undefined) {
      updates.ended_at = '?';
      params.push(ended_at);
    }
    
    if (finalized !== undefined) {
      updates.finalized = '?';
      params.push(finalized);
    }
    
    if (winner_id !== undefined) {
      // Validate winner is in the game
      const playerInGame = await db.get(
        'SELECT id FROM stats WHERE game_id = ? AND player_id = ?',
        [gameInfo.id, winner_id]
      );
      
      if (!playerInGame) {
        throw new ValidationError('Winner must be a player in this game');
      }
      
      updates.winner_id = '?';
      params.push(winner_id);
    }
    
    if (Object.keys(updates).length === 0) {
      return res.json(createResponse(true, gameInfo));
    }
    
    // Update game
    const setClause = Object.keys(updates).map(key => `${key} = ${updates[key]}`).join(', ');
    params.push(gameInfo.id);
    
    await db.run(
      `UPDATE games SET ${setClause} WHERE id = ?`,
      params
    );
    
    // If finalizing, update rivalry stats
    if (finalized && !gameInfo.finalized) {
      await updateRivalryStats(gameInfo.sqid_id, gameInfo.game_type_id, gameInfo.id);
    }
    
    const updatedGame = await db.get(
      'SELECT * FROM games WHERE id = ?',
      [gameInfo.id]
    );
    
    // Broadcast game updated event
    req.io?.to(`/sqid/${gameInfo.sqid_id}`).emit('game_updated', {
      type: 'game_updated',
      gameId: gameInfo.id,
      sqidId: gameInfo.sqid_id,
      finalized: updatedGame.finalized,
      timestamp: new Date().toISOString()
    });
    
    res.json(createResponse(true, updatedGame));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/:sqid/games/:gameId - Delete game (only if not finalized)
 */
router.delete('/:gameId', validateGameAccess, async (req, res, next) => {
  try {
    const { gameInfo } = req;
    
    if (gameInfo.finalized) {
      throw new ConflictError('Cannot delete finalized games');
    }
    
    // Delete game (cascade will handle stats)
    await db.run('DELETE FROM games WHERE id = ?', [gameInfo.id]);
    
    res.json(createResponse(true, { message: 'Game deleted successfully' }));
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to create or update rivalry
 */
async function createOrUpdateRivalry(db, sqidId, gameTypeId, playerIds) {
  // Sort player IDs for consistent rivalry identification
  const sortedPlayerIds = [...playerIds].sort();
  
  // Check if rivalry exists
  let rivalry = await db.get(`
    SELECT r.id 
    FROM rivalries r
    JOIN rivalry_players rp1 ON r.id = rp1.rivalry_id AND rp1.player_id = ?
    JOIN rivalry_players rp2 ON r.id = rp2.rivalry_id AND rp2.player_id = ?
    WHERE r.sqid_id = ? AND r.game_type_id = ?
    AND (SELECT COUNT(*) FROM rivalry_players WHERE rivalry_id = r.id) = ?
  `, [sortedPlayerIds[0], sortedPlayerIds[1], sqidId, gameTypeId, playerIds.length]);
  
  if (!rivalry) {
    // Create new rivalry
    const rivalryId = generateUUID();
    await db.run(
      'INSERT INTO rivalries (id, sqid_id, game_type_id, created_at) VALUES (?, ?, ?, ?)',
      [rivalryId, sqidId, gameTypeId, new Date().toISOString()]
    );
    
    // Add players to rivalry
    for (const playerId of playerIds) {
      await db.run(
        'INSERT INTO rivalry_players (rivalry_id, player_id) VALUES (?, ?)',
        [rivalryId, playerId]
      );
    }
    
    // Initialize rivalry stats
    const statsId = generateUUID();
    await db.run(
      'INSERT INTO rivalry_stats (id, rivalry_id, avg_margin, last_10_results, total_games, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [statsId, rivalryId, 0, '', 0, new Date().toISOString()]
    );
  }
}

/**
 * Helper function to update rivalry statistics
 */
async function updateRivalryStats(sqidId, gameTypeId, gameId) {
  // Get rivalry for this game type and players
  const rivalry = await db.get(`
    SELECT DISTINCT r.id
    FROM rivalries r
    JOIN rivalry_players rp ON r.id = rp.rivalry_id
    JOIN stats s ON rp.player_id = s.player_id
    WHERE r.sqid_id = ? AND r.game_type_id = ? AND s.game_id = ?
  `, [sqidId, gameTypeId, gameId]);
  
  if (!rivalry) return;
  
  // Get all finalized games for this rivalry
  const games = await db.query(`
    SELECT 
      g.id,
      g.winner_id,
      MAX(s.score) - MIN(s.score) as score_difference
    FROM games g
    JOIN stats s ON g.id = s.game_id
    JOIN rivalry_players rp ON s.player_id = rp.player_id
    WHERE rp.rivalry_id = ? AND g.finalized = true
    GROUP BY g.id, g.winner_id
    ORDER BY g.started_at ASC
  `, [rivalry.id]);
  
  const stats = calculateRivalryStats(games);
  
  // Update rivalry stats
  await db.run(`
    UPDATE rivalry_stats 
    SET avg_margin = ?, last_10_results = ?, min_win_margin = ?, max_win_margin = ?, 
        min_loss_margin = ?, max_loss_margin = ?, total_games = ?, updated_at = ?
    WHERE rivalry_id = ?
  `, [
    stats.avg_margin,
    stats.last_10_results,
    stats.min_win_margin,
    stats.max_win_margin,
    stats.min_loss_margin,
    stats.max_loss_margin,
    stats.total_games,
    new Date().toISOString(),
    rivalry.id
  ]);
}

export default router;
