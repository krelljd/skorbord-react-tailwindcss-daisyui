import { useState, useEffect, useRef } from 'react'
import { useConnection } from '../contexts/ConnectionContext.jsx'
import PlayerCard from './PlayerCard.jsx'

const GamePlay = ({ 
  sqid, 
  game, 
  setCurrentGame, 
  setCurrentView, 
  onGameComplete,
  backToSetup 
}) => {
  const { socket } = useConnection()
  
  // Game state
  const [gameStats, setGameStats] = useState([])
  const [winner, setWinner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  
  // Score tallies for mini-sessions (3 second fade)
  const [scoreTallies, setScoreTallies] = useState({}) // playerId -> { total, timeoutId }
  const tallyTimeouts = useRef({})

  // Load game stats on mount
  useEffect(() => {
    if (game?.id) {
      loadGameStats()
    }
  }, [game?.id])

  // Socket listeners for real-time score updates
  useEffect(() => {
    if (socket && game?.id) {
      socket.on('score-updated', handleScoreUpdate)
      socket.on('game-completed', handleGameCompleted)
      
      return () => {
        socket.off('score-updated', handleScoreUpdate)
        socket.off('game-completed', handleGameCompleted)
      }
    }
  }, [socket, game?.id])

  const loadGameStats = async () => {
    try {
      const response = await fetch(`${__API_URL__}/api/sqids/${sqid}/games/${game.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setGameStats(data.data || [])
        checkForWinner(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load game stats:', err)
      setError('Failed to load game data')
    }
  }

  const handleScoreUpdate = (data) => {
    if (data.game_id === game.id) {
      setGameStats(data.stats)
      checkForWinner(data.stats)
      
      // Handle score tally mini-session
      const playerId = data.player_id
      const change = data.score_change
      
      if (change !== 0) {
        // Clear existing timeout for this player
        if (tallyTimeouts.current[playerId]) {
          clearTimeout(tallyTimeouts.current[playerId])
        }
        
        // Update tally
        setScoreTallies(prev => {
          const current = prev[playerId]?.total || 0
          return {
            ...prev,
            [playerId]: {
              total: current + change,
              timestamp: Date.now()
            }
          }
        })
        
        // Set timeout to clear tally after 3 seconds
        tallyTimeouts.current[playerId] = setTimeout(() => {
          setScoreTallies(prev => {
            const updated = { ...prev }
            delete updated[playerId]
            return updated
          })
          delete tallyTimeouts.current[playerId]
        }, 3000)
      }
    }
  }

  const handleGameCompleted = (data) => {
    if (data.game_id === game.id) {
      setCurrentGame(data.game)
      setWinner(data.winner)
      onGameComplete()
    }
  }

  const checkForWinner = (stats) => {
    if (game.status === 'completed') return

    const winCondition = game.win_condition_value
    const isWinCondition = game.win_condition_type === 'win'
    
    let gameWinner = null
    
    if (isWinCondition) {
      // First player to reach or exceed the win condition wins
      gameWinner = stats.find(stat => stat.score >= winCondition)
    } else {
      // First player to reach or exceed the lose condition loses (others win)
      const loser = stats.find(stat => stat.score >= winCondition)
      if (loser) {
        // Winner is the player with the lowest score among others
        const others = stats.filter(stat => stat.player_id !== loser.player_id)
        gameWinner = others.reduce((min, current) => 
          current.score < min.score ? current : min
        )
      }
    }
    
    if (gameWinner && !winner) {
      setWinner(gameWinner)
      setShowFinalizeModal(true)
    }
  }

  const updateScore = async (playerId, change) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${__API_URL__}/api/sqids/${sqid}/games/${game.id}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: playerId,
          score_change: change
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update score')
      }

      const result = await response.json()
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('score-update', {
          sqid,
          game_id: game.id,
          player_id: playerId,
          score_change: change,
          stats: result.data
        })
      }

    } catch (err) {
      console.error('Failed to update score:', err)
      setError(err.message || 'Failed to update score')
    } finally {
      setLoading(false)
    }
  }

  const finalizeGame = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${__API_URL__}/api/sqids/${sqid}/games/${game.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to finalize game')
      }

      const result = await response.json()
      setCurrentGame(result.data.game)
      
      // Emit socket event
      if (socket) {
        socket.emit('game-finalized', {
          sqid,
          game: result.data.game,
          winner: result.data.winner,
          rivalry_stats: result.data.rivalry_stats
        })
      }

      setShowFinalizeModal(false)
      onGameComplete()

    } catch (err) {
      console.error('Failed to finalize game:', err)
      setError(err.message || 'Failed to finalize game')
    } finally {
      setLoading(false)
    }
  }

  if (!game) {
    return (
      <div className="text-center">
        <p>No active game found.</p>
        <button className="btn btn-primary mt-4" onClick={backToSetup}>
          Start New Game
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{game.game_type_name}</h2>
        <p className="text-sm opacity-75">
          {game.win_condition_type === 'win' ? 'First to' : 'Lose at'} {game.win_condition_value}
        </p>
        {winner && (
          <div className="badge badge-success badge-lg mt-2">
            🏆 {winner.player_name} Wins!
          </div>
        )}
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {/* Player Cards */}
      <div className="grid gap-4">
        {gameStats.map(stat => (
          <PlayerCard
            key={stat.player_id}
            playerId={stat.player_id}
            playerName={stat.player_name}
            score={stat.score}
            onScoreChange={updateScore}
            disabled={loading || game.status === 'completed' || !!winner}
            scoreTally={scoreTallies[stat.player_id]}
            isWinner={winner?.player_id === stat.player_id}
          />
        ))}
      </div>

      {/* Game Controls */}
      <div className="flex gap-2">
        {game.status === 'active' && !winner && (
          <>
            <button 
              className="btn btn-outline flex-1"
              onClick={backToSetup}
            >
              Abandon Game
            </button>
          </>
        )}
        
        {game.status === 'completed' && (
          <button 
            className="btn btn-primary flex-1"
            onClick={backToSetup}
          >
            New Game
          </button>
        )}
      </div>

      {/* Finalize Game Modal */}
      {showFinalizeModal && (
        <div className="modal modal-open">
          <div className="modal-mobile">
            <h3 className="font-bold text-lg mb-4">Game Complete!</h3>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">🏆</div>
              <p className="text-xl font-semibold">
                {winner?.player_name} Wins!
              </p>
              <p className="text-sm opacity-75 mt-2">
                Score: {winner?.score}
              </p>
            </div>
            
            <p className="mb-4">
              Finalize this game to update rivalry statistics and start a new game.
            </p>
            
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={finalizeGame}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Finalizing...
                  </>
                ) : (
                  'Finalize Game'
                )}
              </button>
              
              <button 
                className="btn btn-outline"
                onClick={() => setShowFinalizeModal(false)}
                disabled={loading}
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePlay
