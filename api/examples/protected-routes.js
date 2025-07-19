// Example of how to apply Auth0 authentication to routes
// This file demonstrates the pattern - individual route files can be updated as needed

import express from 'express'
import { requireAuth, requireSquidAccess } from '../middleware/auth.js'
import { validateSquid } from '../middleware/validation.js'

const router = express.Router()

// Example: Public route (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// Example: Protected route requiring authentication
router.get('/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user // Auth0 user info from middleware
  })
})

// Example: Protected sqid route requiring auth + sqid access
router.get('/:sqid/protected-data', 
  requireAuth,           // First authenticate user
  validateSquid,         // Then validate sqid exists
  requireSquidAccess,    // Then check user has access to sqid
  (req, res) => {
    res.json({
      success: true,
      data: 'This is protected sqid-specific data',
      user: req.user,
      sqid: req.params.sqid
    })
  }
)

// Example: Game creation with authentication
router.post('/:sqid/games',
  requireAuth,
  validateSquid,
  requireSquidAccess,
  // ... existing validation middleware
  async (req, res, next) => {
    try {
      // Game creation logic with user context
      const gameData = {
        ...req.body,
        created_by: req.user.id, // Track who created the game
        creator_email: req.user.email
      }
      
      // Existing game creation logic...
      res.json({ success: true, game: gameData })
    } catch (error) {
      next(error)
    }
  }
)

export default router
