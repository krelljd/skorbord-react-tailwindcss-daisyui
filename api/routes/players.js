import express from 'express';
import { 
  validateCreatePlayer,
  validatePlayerAccess 
} from '../middleware/validation.js';
import { createResponse, generateUUID } from '../utils/helpers.js';
import { ValidationError, ConflictError } from '../middleware/errorHandler.js';
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
        p.id,
        p.sqid_id,
        p.name,
        p.created_at,
        p.color,
        COUNT(DISTINCT g.id) as games_played,
        AVG(s.score) as avg_score
      FROM players p
      LEFT JOIN stats s ON p.id = s.player_id
      LEFT JOIN games g ON s.game_id = g.id AND g.finalized = true
      WHERE p.sqid_id = ?
      GROUP BY p.id, p.name, p.created_at, p.color
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
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Player name is required');
    }
    // Normalize name: trim and lowercase
    const normalized = name.trim().toLowerCase();
    // Check if player name already exists in this Sqid (case-insensitive)
    const existingPlayer = await db.get(
      'SELECT id FROM players WHERE sqid_id = ? AND LOWER(TRIM(name)) = ?',
      [sqid, normalized]
    );
    if (existingPlayer) {
      throw new ConflictError('Player name already exists in this Sqid');
    }
    // DaisyUI color assignment logic
    // 1. Get all colors already used for this sqid
    const usedColorsRows = await db.query(
      'SELECT color FROM players WHERE sqid_id = ? AND color IS NOT NULL',
      [sqid]
    );
    const usedColors = usedColorsRows.map(row => row.color).filter(Boolean);
    // 2. Get allowed DaisyUI colors
    const PLAYER_COLORS = [
      'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error', 'neutral'
    ];
    // 3. Find unused colors
    const unusedColors = PLAYER_COLORS.filter(c => !usedColors.includes(c));
    // 4. Select a color
    let assignedColor;
    if (unusedColors.length > 0) {
      assignedColor = unusedColors[Math.floor(Math.random() * unusedColors.length)];
    } else {
      assignedColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
    }
    // 5. Create new player with color
    const playerId = generateUUID();
    const playerData = {
      id: playerId,
      sqid_id: sqid,
      name: name.trim(),
      created_at: new Date().toISOString(),
      color: assignedColor
    };
    await db.run(
      'INSERT INTO players (id, sqid_id, name, created_at, color) VALUES (?, ?, ?, ?, ?)',
      [playerData.id, playerData.sqid_id, playerData.name, playerData.created_at, playerData.color]
    );
    // Broadcast player created event
    req.io?.to(`/sqid/${sqid}`).emit('player_updated', {
      type: 'player_created',
      player: playerData,
      sqidId: sqid,
      timestamp: new Date().toISOString()
    });
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
        p.id,
        p.sqid_id,
        p.name,
        p.created_at,
        p.color,
        COUNT(DISTINCT g.id) as games_played,
        COUNT(DISTINCT CASE WHEN g.winner_id = p.id THEN g.id END) as games_won,
        AVG(s.score) as avg_score,
        MAX(s.score) as highest_score,
        MIN(s.score) as lowest_score
      FROM players p
      LEFT JOIN stats s ON p.id = s.player_id
      LEFT JOIN games g ON s.game_id = g.id AND g.finalized = true
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.created_at, p.color
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
 * PUT /api/:sqid/players/:playerId - Update player details
 */
router.put('/:playerId', validatePlayerAccess, async (req, res, next) => {
  try {
    const { playerId, sqid } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Player name is required');
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length > 64) {
      throw new ValidationError('Player name must be 64 characters or less');
    }
    
    // Update player
    await db.run(
      'UPDATE players SET name = ? WHERE id = ?',
      [trimmedName, playerId]
    );
    
    // Get updated player data
    const updatedPlayer = await db.get(
      'SELECT id, sqid_id, name, created_at, color FROM players WHERE id = ?',
      [playerId]
    );
    
    // Broadcast player updated event
    req.io?.to(`/sqid/${sqid}`).emit('player_updated', {
      type: 'player_updated',
      player: updatedPlayer,
      sqidId: sqid,
      timestamp: new Date().toISOString()
    });
    
    res.json(createResponse(true, updatedPlayer));
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
    
    // Broadcast player deleted event
    req.io?.to(`/sqid/${req.params.sqid}`).emit('player_updated', {
      type: 'player_deleted',
      playerId: playerId,
      sqidId: req.params.sqid,
      timestamp: new Date().toISOString()
    });
    
    res.json(createResponse(true, { message: 'Player deleted successfully' }));
  } catch (error) {
    next(error);
  }
});

export default router;
