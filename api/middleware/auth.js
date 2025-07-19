import { authenticateApiRequest, verifySquidAccess } from '../auth/websocket.js'

/**
 * Middleware to protect API routes with Auth0 authentication
 * Apply this to routes that require authentication
 */
export const requireAuth = authenticateApiRequest

/**
 * Middleware to verify authenticated user has access to specific sqid
 * Apply this after requireAuth on sqid-specific routes
 */
export const requireSquidAccess = verifySquidAccess

/**
 * Combined middleware for routes that need both auth and sqid access
 */
export const requireAuthAndSquidAccess = [requireAuth, requireSquidAccess]
