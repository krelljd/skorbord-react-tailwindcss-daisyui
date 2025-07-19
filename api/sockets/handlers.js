import { isValidId, isValidScore } from '../utils/helpers.js';
import db from '../db/database.js';

// Simple rate limit stub (replace with real if needed)
const scoreUpdateRateLimit = (fn) => fn;

/**
 * Handle new socket connection with Auth0 authentication
 */
export function handleConnection(io, socket) {
  const { userId, email, name, sqid } = socket
  
  console.log(`🔌 Authenticated user connected:`, { 
    email, 
    sqid, 
    socketId: socket.id 
  })

  // Automatically join the sqid room (sqid is already validated in auth middleware)
  socket.join(`/sqid/${sqid}`)
  
  // Notify client of successful connection
  socket.emit('connected', {
    sqid,
    userId,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  })

  // Notify others in the sqid that user has joined
  socket.to(`/sqid/${sqid}`).emit('user_joined', {
    type: 'user_joined',
    userId,
    email,
    name,
    sqidId: sqid,
    timestamp: new Date().toISOString()
  })

  // Handle legacy join-sqid event for backward compatibility
  socket.on('join-sqid', (requestedSquid) => {
    if (requestedSquid !== sqid) {
      socket.emit('error', { 
        error: 'Sqid mismatch. You can only join the sqid you authenticated for.' 
      })
      return
    }
    
    // Already joined in auth, just confirm
    socket.emit('sqid_joined', {
      sqid: requestedSquid,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    })
    console.log(`🔌 User confirmed sqid join: ${sqid} (${socket.id})`)
  })

  // Broadcast score updates to sqid room (with user context)
  socket.on('update_score', async (data) => {
    if (!socket.sqid) return
    
    // Add user context to score update
    const enrichedData = {
      ...data,
      updatedBy: {
        userId: socket.userId,
        email: socket.email,
        name: socket.name
      },
      timestamp: new Date().toISOString()
    }
    
    io.to(`/sqid/${socket.sqid}`).emit('score_update', enrichedData)
    console.log(`📊 Score update by ${socket.email} in ${socket.sqid}:`, data)
  })

  // Broadcast player activity to sqid room (with user context)
  socket.on('player_activity', (data) => {
    if (!socket.sqid) return
    
    // Add user context to activity
    const enrichedData = {
      ...data,
      fromUser: {
        userId: socket.userId,
        email: socket.email,
        name: socket.name
      },
      timestamp: new Date().toISOString()
    }
    
    io.to(`/sqid/${socket.sqid}`).emit('player_activity', enrichedData)
  })

  // Handle game events with authentication context
  socket.on('game_event', (data) => {
    if (!socket.sqid) return
    
    const enrichedData = {
      ...data,
      triggeredBy: {
        userId: socket.userId,
        email: socket.email,
        name: socket.name
      },
      timestamp: new Date().toISOString()
    }
    
    io.to(`/sqid/${socket.sqid}`).emit('game_event', enrichedData)
    console.log(`🎮 Game event by ${socket.email} in ${socket.sqid}:`, data.type)
  })

  // Clean up on disconnect
  socket.on('disconnect', (reason) => {
    if (socket.sqid) {
      console.log(`🔌 User disconnected: ${socket.email} from ${socket.sqid} (${socket.id}) - Reason: ${reason}`)
      
      // Notify others in sqid that user has left
      io.to(`/sqid/${socket.sqid}`).emit('user_left', {
        type: 'user_left',
        userId: socket.userId,
        email: socket.email,
        name: socket.name,
        sqidId: socket.sqid,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      })
    }
  })
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
