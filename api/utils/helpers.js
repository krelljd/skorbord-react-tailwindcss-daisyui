import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a short, human-friendly unique ID
 * @param {number} length - Length of the ID (default: 8)
 * @returns {string} Short unique ID
 */
export function generateShortId(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  
  return result;
}

/**
 * Generates a UUID
 * @returns {string} UUID
 */
export function generateUUID() {
  return uuidv4();
}

/**
 * Validates if a string is a valid UUID
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates if a string is a valid short ID
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid short ID
 */
export function isValidShortId(id) {
  const shortIdRegex = /^[a-z0-9]{4,36}$/;
  return shortIdRegex.test(id);
}

/**
 * Validates if a string is a valid ID (UUID or short ID)
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ID
 */
export function isValidId(id) {
  return isValidUUID(id) || isValidShortId(id);
}

/**
 * Sanitizes a name string
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().slice(0, 64);
}

/**
 * Validates a score value
 * @param {number} score - Score to validate
 * @returns {boolean} True if valid score
 */
export function isValidScore(score) {
  const minScore = parseInt(process.env.MIN_SCORE) || -999;
  const maxScore = parseInt(process.env.MAX_SCORE) || 999;
  
  return typeof score === 'number' && 
         Number.isInteger(score) && 
         score >= minScore && 
         score <= maxScore;
}

/**
 * Validates player count for a game
 * @param {number} count - Number of players
 * @returns {boolean} True if valid player count
 */
export function isValidPlayerCount(count) {
  const minPlayers = parseInt(process.env.MIN_PLAYERS_PER_GAME) || 2;
  const maxPlayers = parseInt(process.env.MAX_PLAYERS_PER_GAME) || 8;
  
  return typeof count === 'number' && 
         Number.isInteger(count) && 
         count >= minPlayers && 
         count <= maxPlayers;
}

/**
 * Creates a standardized API response
 * @param {boolean} success - Success status
 * @param {any} data - Response data
 * @param {string} error - Error message
 * @returns {object} Standardized response object
 */
export function createResponse(success, data = null, error = null) {
  const response = { success };
  
  if (success && data !== null) {
    response.data = data;
  }
  
  if (!success && error) {
    response.error = error;
  }
  
  return response;
}

/**
 * Calculates rivalry statistics
 * @param {Array} games - Array of game results
 * @returns {object} Calculated statistics
 */
export function calculateRivalryStats(games) {
  if (!games || games.length === 0) {
    return {
      avg_margin: 0,
      last_10_results: '',
      min_win_margin: null,
      max_win_margin: null,
      min_loss_margin: null,
      max_loss_margin: null,
      total_games: 0
    };
  }

  const totalGames = games.length;
  const last10 = games.slice(-10);
  
  let totalMargin = 0;
  let winMargins = [];
  let lossMargins = [];
  let results = '';

  for (const game of games) {
    const margin = Math.abs(game.score_difference || 0);
    totalMargin += margin;
    
    if (game.won) {
      winMargins.push(margin);
      results += 'W';
    } else {
      lossMargins.push(margin);
      results += 'L';
    }
  }

  return {
    avg_margin: totalGames > 0 ? totalMargin / totalGames : 0,
    last_10_results: last10.map(g => g.won ? 'W' : 'L').join(''),
    min_win_margin: winMargins.length > 0 ? Math.min(...winMargins) : null,
    max_win_margin: winMargins.length > 0 ? Math.max(...winMargins) : null,
    min_loss_margin: lossMargins.length > 0 ? Math.min(...lossMargins) : null,
    max_loss_margin: lossMargins.length > 0 ? Math.max(...lossMargins) : null,
    total_games: totalGames
  };
}

/**
 * Determines game winner based on game type and scores
 * @param {object} gameType - Game type configuration
 * @param {Array} playerScores - Array of player scores
 * @returns {string|null} Winner player ID or null
 */
export function determineWinner(gameType, playerScores) {
  if (!gameType || !playerScores || playerScores.length === 0) {
    return null;
  }

  const { is_win_condition, win_condition, loss_condition } = gameType;
  const condition = is_win_condition ? win_condition : loss_condition;

  // Find players who meet the condition
  const qualifiedPlayers = playerScores.filter(player => {
    if (is_win_condition) {
      return player.score >= condition;
    } else {
      return player.score <= condition;
    }
  });

  if (qualifiedPlayers.length === 0) {
    return null;
  }

  // Sort by score and return the best player
  qualifiedPlayers.sort((a, b) => {
    if (is_win_condition) {
      return b.score - a.score; // Highest score wins
    } else {
      return a.score - b.score; // Lowest score wins
    }
  });

  return qualifiedPlayers[0].player_id;
}
