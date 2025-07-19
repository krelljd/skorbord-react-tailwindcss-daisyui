import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

// Auth0 JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10 minutes
})

/**
 * Get signing key from Auth0 JWKS
 */
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Failed to get signing key:', err)
      return callback(err)
    }
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

/**
 * Verify Auth0 JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} - Decoded token payload
 */
export const verifyAuth0Token = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error('No token provided'))
    }

    jwt.verify(token, getKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message)
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}

/**
 * WebSocket authentication middleware for Auth0
 * @param {object} socket - Socket.IO socket instance
 * @param {function} next - Next middleware function
 */
export const authenticateSocket = async (socket, next) => {
  try {
    const { token, sqid, userId } = socket.handshake.auth
    
    console.log('🔐 WebSocket auth attempt:', { 
      sqid, 
      userId, 
      hasToken: !!token,
      socketId: socket.id 
    })

    if (!token) {
      console.error('❌ No token provided for WebSocket connection')
      return next(new Error('Authentication required'))
    }

    if (!sqid) {
      console.error('❌ No sqid provided for WebSocket connection')
      return next(new Error('Sqid required'))
    }

    // Verify Auth0 JWT token
    const decoded = await verifyAuth0Token(token)
    
    // Extract user info from token
    socket.userId = decoded.sub
    socket.email = decoded.email
    socket.name = decoded.name || decoded.nickname
    socket.sqid = sqid
    
    // Verify user has access to this sqid (optional business logic)
    const hasAccess = await checkUserAccessToSquid(decoded.sub, sqid)
    if (!hasAccess) {
      console.error('❌ User access denied to sqid:', { userId: decoded.sub, sqid })
      return next(new Error('Access denied to this game'))
    }
    
    console.log('✅ WebSocket authenticated successfully:', { 
      email: decoded.email, 
      sqid, 
      socketId: socket.id 
    })
    
    next()
  } catch (error) {
    console.error('❌ WebSocket authentication failed:', error.message)
    next(new Error('Authentication failed'))
  }
}

/**
 * Business logic to check if user can access a sqid
 * For now, allow access to all sqids for authenticated users
 * Later: implement sqid permissions, private sqids, etc.
 * 
 * @param {string} userId - Auth0 user ID
 * @param {string} sqid - Sqid to check access for
 * @returns {Promise<boolean>} - True if user has access
 */
const checkUserAccessToSquid = async (userId, sqid) => {
  try {
    // TODO: Implement sqid access control logic
    // For now, allow all authenticated users to access any sqid
    // Future enhancements:
    // - Check if sqid is private
    // - Check if user is owner/member of sqid
    // - Check if user has been invited to sqid
    
    console.log('🔍 Checking sqid access:', { userId, sqid })
    return true
  } catch (error) {
    console.error('Error checking sqid access:', error)
    return false
  }
}

/**
 * Middleware to create Auth0 JWT verification for API routes
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
export const authenticateApiRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAuth0Token(token)
    
    // Add user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.nickname
    }
    
    next()
  } catch (error) {
    console.error('API authentication failed:', error.message)
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
}

/**
 * Optional middleware to verify user has access to specific sqid in API routes
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
export const verifySquidAccess = async (req, res, next) => {
  try {
    const { sqid } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
    }

    const hasAccess = await checkUserAccessToSquid(userId, sqid)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this sqid'
      })
    }

    next()
  } catch (error) {
    console.error('Sqid access verification failed:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to verify sqid access'
    })
  }
}
