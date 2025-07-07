import { useState, useEffect, useRef } from 'react'
import { useConnection } from '../contexts/ConnectionContext.jsx'
import PlayerCard from './PlayerCard.jsx'

const GamePlay = ({ 
  // ...existing code...
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
  // Remove modal state, use winner state to control finalize button
  
  // Score tallies for mini-sessions (3 second fade)
  const [scoreTallies, setScoreTallies] = useState({}) // playerId -> { total, timeoutId }
  const tallyTimeouts = useRef({})

  // Load game stats on mount
  useEffect(() => {
    if (game?.id) {
      loadGameStats()
    }
  }, [game?.id])

  // Reevaluate winner whenever gameStats changes
  useEffect(() => {
    if (gameStats && gameStats.length > 0) {
      checkForWinner(gameStats)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStats])

  // Socket listeners for real-time score updates
  useEffect(() => {
    if (socket && game?.id) {
      socket.on('score_update', handleScoreUpdate)
      socket.on('game-completed', handleGameCompleted)
      
      return () => {
        socket.off('score_update', handleScoreUpdate)
        socket.off('game-completed', handleGameCompleted)
      }
    }
  }, [socket, game?.id])

  const loadGameStats = async () => {
    try {
      const response = await fetch(`${__API_URL__}/api/${sqid}/games/${game.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setGameStats(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load game stats:', err)
      setError('Failed to load game data')
    }
  }

  const handleScoreUpdate = (data) => {
    if (data.game_id === game.id) {
      setGameStats(data.stats)
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
      // If any player meets or exceeds the loss condition, the winner is the player with the lowest score
      const anyLoser = stats.some(stat => stat.score >= winCondition)
      if (anyLoser) {
        // Winner is the player with the lowest score (among all players)
        gameWinner = stats.reduce((min, current) =>
          current.score < min.score ? current : min
        )
      }
    }

    if (gameWinner && !winner) {
      setWinner(gameWinner)
    }
  }

  // Update a player's score by sending only the delta to the backend
  const updateScore = async (playerId, change) => {
    setLoading(true)
    setError('')

    // Update tally locally for immediate feedback
    if (change !== 0) {
      if (tallyTimeouts.current[playerId]) {
        clearTimeout(tallyTimeouts.current[playerId])
      }
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
      tallyTimeouts.current[playerId] = setTimeout(() => {
        setScoreTallies(prev => {
          const updated = { ...prev }
          delete updated[playerId]
          return updated
        })
        delete tallyTimeouts.current[playerId]
      }, 3000)
    }

    try {
      const response = await fetch(`${__API_URL__}/api/${sqid}/games/${game.id}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stats: [
            { player_id: playerId, score: change } // score is the delta
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update score')
      }

      const result = await response.json()
      // Update local state with backend's authoritative stats
      setGameStats(result.data || [])

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
    if (!window.confirm('Are you sure you want to finalize this game? This action cannot be undone.')) {
      return;
    }
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${__API_URL__}/api/${sqid}/games/${game.id}/finalize`, {
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
    <div className="space-y-6 pb-24">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{game.game_type_name || <span className="text-error">[No game_type_name]</span>}</h2>
        <p className="text-sm opacity-75">
          {(game.win_condition_type === 'win' ? 'First to' : game.win_condition_type === 'lose' ? 'Lose at' : '[No win_condition_type]')}
          {typeof game.win_condition_value !== 'undefined' ? ` ${game.win_condition_value}` : ' [No win_condition_value]'}
        </p>
        {winner && (
          <div className="badge badge-success badge-lg mt-2">
            🏆 {winner.player_name} Wins!
          </div>
        )}
        {/* Debug: Show game object in development, collapsible */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs opacity-70 select-none">Show game object (dev only)</summary>
            <pre className="text-xs text-left bg-base-200 p-2 mt-2 rounded max-w-full overflow-x-auto">
              {JSON.stringify(game, null, 2)}
            </pre>
          </details>
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
            disabled={loading || game.status === 'completed'}
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

      {/* Finalize Game Button (appears at bottom when winner is determined) */}
      {/* Derived state: are there unsaved score changes? */}
      {(() => {
        const hasUnsavedScores = Object.values(scoreTallies).some(tally => tally && tally.total !== 0)
        return winner && (
          <div className="fixed bottom-0 left-0 w-full bg-base-200 bg-opacity-95 z-50 flex flex-col justify-center items-center py-4 shadow-lg">
            <button
              className="btn btn-primary btn-lg w-11/12 max-w-md text-lg"
              onClick={finalizeGame}
              disabled={loading || hasUnsavedScores}
              style={{ fontSize: '5vw', minHeight: '3rem' }}
              title={hasUnsavedScores ? 'Waiting for score changes to be saved' : ''}
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
            {hasUnsavedScores && (
              <div className="text-warning text-xs mt-2 text-center" style={{ fontSize: '3.5vw' }}>
                Please wait for all score changes to be saved before finalizing.
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

export default GamePlay
