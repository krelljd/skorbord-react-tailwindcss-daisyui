import { isValidId } from '../utils/helpers.js';

/**
 * Socket.IO authentication middleware
 * Validates that the socket has access to the specified Sqid
 */
export function socketAuthMiddleware(socket, next) {
  try {
    const { sqid } = socket.handshake.auth;
    
    if (!sqid || !isValidId(sqid)) {
      return next(new Error('Invalid or missing Sqid'));
    }
    
    // Store sqid in socket for later use
    socket.sqid = sqid;
    
    // Join the socket to the sqid room for targeted broadcasts
    socket.join(`/sqid/${sqid}`);
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate socket has access to a specific game
 */
export function validateSocketGameAccess(socket, gameId, callback) {
  if (!isValidId(gameId)) {
    return callback(new Error('Invalid game ID'));
  }
  
  // Additional validation can be added here
  // For now, we trust that the socket is already authenticated to the sqid
  callback();
}

/**
 * Rate limiting for socket events
 */
export function createSocketRateLimit(maxEvents = 10, windowMs = 60000) {
  const clients = new Map();
  
  return function(socket, next) {
    const clientId = socket.id;
    const now = Date.now();
    
    if (!clients.has(clientId)) {
      clients.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const client = clients.get(clientId);
    
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      return next();
    }
    
    if (client.count >= maxEvents) {
      return next(new Error('Rate limit exceeded'));
    }
    
    client.count++;
    next();
  };
}
