import { useState, useEffect, useRef } from 'react'
import { useConnection } from '../contexts/ConnectionContext.jsx'
import { getPlayerBadgeColorClassById } from '../utils/playerColors'
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
  // Remove modal state, use winner state to control finalize button
  
  // Score tallies for mini-sessions (3 second fade)
  const [scoreTallies, setScoreTallies] = useState({}) // playerId -> { total, timeoutId }
  const tallyTimeouts = useRef({})
  const pendingUpdates = useRef(new Set()) // Track pending score updates to avoid double-counting

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
  // Socket listeners for real-time score updates and rivalry stats navigation
  useEffect(() => {
    if (socket && game?.id) {
      socket.on('score_update', handleScoreUpdate)
      socket.on('game_completed', handleGameCompleted)
      // Listen for show_rivalry_stats event to navigate all clients
      socket.on('show_rivalry_stats', (data) => {
        if (data?.sqid === sqid) {
          setCurrentView('rivalry-stats')
        }
      })

      return () => {
        socket.off('score_update', handleScoreUpdate)
        socket.off('game_completed', handleGameCompleted)
        socket.off('show_rivalry_stats')
      }
    }
  }, [socket, game?.id, sqid])

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
      const updateKey = `${playerId}-${change}-${Date.now()}`
      
      // Only update tally if this isn't a pending update from this client
      if (change !== 0 && !pendingUpdates.current.has(`${playerId}-${change}`)) {
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
      
      // Clean up any matching pending updates
      const toRemove = []
      for (const pending of pendingUpdates.current) {
        if (pending.startsWith(`${playerId}-${change}`)) {
          toRemove.push(pending)
        }
      }
      toRemove.forEach(key => pendingUpdates.current.delete(key))
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
    if (game.finalized) return

    const winCondition = game.win_condition_value
    const winConditionType = game.win_condition_type

    let gameWinner = null

    if (winConditionType === 'win') {
      // For win conditions: first player to reach or exceed the win condition wins
      // If multiple players reach it, highest score wins
      const qualifiedPlayers = stats.filter(stat => stat.score >= winCondition)
      if (qualifiedPlayers.length > 0) {
        gameWinner = qualifiedPlayers.reduce((max, current) =>
          current.score > max.score ? current : max
        )
      }
    } else if (winConditionType === 'lose') {
      // For loss conditions: if any player meets or exceeds the loss condition,
      // the winner is the player with the lowest score (among all players)
      const anyLoser = stats.some(stat => stat.score >= winCondition)
      if (anyLoser) {
        gameWinner = stats.reduce((min, current) =>
          current.score < min.score ? current : min
        )
      }
    }

    // Always update winner state to reflect current game state
    // This allows for dynamic winner changes as scores are updated
    setWinner(gameWinner)
  }

  // Update a player's score by sending only the delta to the backend
  const updateScore = async (playerId, change) => {
    setLoading(true)
    setError('')

    // Track this update to prevent double-counting when we receive the WebSocket event
    const updateKey = `${playerId}-${change}`
    pendingUpdates.current.add(updateKey)

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

      // Note: We don't emit socket event here because the backend already broadcasts it
      // The pendingUpdates tracking prevents double-counting the tally

    } catch (err) {
      // Improved error handling: show backend error message or full error object
      let errorMsg = 'Failed to update score';
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMsg = err.message;
        } else if (err.toString) {
          errorMsg = err.toString();
        } else {
          errorMsg = JSON.stringify(err);
        }
      }
      console.error('Failed to update score:', err);
      setError(errorMsg);
      // Remove the pending update on error
      pendingUpdates.current.delete(updateKey)
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
      // Find the winner's player_id if available
      const winnerId = winner?.player_id || null;
      const endedAt = new Date().toISOString();
      const response = await fetch(`${__API_URL__}/api/${sqid}/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ finalized: true, ended_at: endedAt, winner_id: winnerId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to finalize game')
      }

      const result = await response.json()
      setCurrentGame(result.data)

      // Emit socket event to notify all clients to show rivalry stats
      if (socket) {
        socket.emit('show_rivalry_stats', {
          sqid,
          game: result.data,
          winner: winner
        })
      }

      // Locally navigate to rivalry stats screen
      setCurrentView('rivalry-stats')

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
        <button className="btn btn-primary mt-2" onClick={backToSetup}>
          Start New Game
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{game.game_type_name || <span className="text-error">[No game_type_name]</span>}</h2>
        <p className="text-sm opacity-75">
          {(game.win_condition_type === 'win' ? 'First to' : game.win_condition_type === 'lose' ? 'Lose at' : '[No win_condition_type]')}
          {typeof game.win_condition_value !== 'undefined' ? ` ${game.win_condition_value}` : ' [No win_condition_value]'}
        </p>
        {winner && (
          <div className={`badge ${getPlayerBadgeColorClassById(winner.player_id)} badge-lg mt-2`}>
            🏆 {winner.player_name} Wins!
          </div>
        )} 
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {/* Player Cards Container */}
      <div className="mb-8">
        <div className="grid gap-4">
          {gameStats.map(stat => {
            // Construct player object for PlayerCard
            const player = {
              id: stat.player_id,
              name: stat.player_name,
              color: stat.color || 'primary', // Fallback to 'primary' if color is missing
              score: stat.score
            };
            return (
              <PlayerCard
                key={player.id}
                player={player}
                score={stat.score}
                onScoreChange={updateScore}
                disabled={loading || game.finalized}
                scoreTally={scoreTallies[player.id]}
                isWinner={winner?.player_id === player.id}
              />
            );
          })}
        </div>
      </div>

      {/* Finalize Button Container (fixed bottom) */}
      <div className="fixed bottom-0 left-0 w-full bg-base-200 bg-opacity-95 z-50 flex flex-col justify-center items-center py-2 shadow-lg">
        {/* New Game Button (only shown when game is finalized) */}
        {game.finalized ? (
          <div className="flex gap-2 w-11/12 max-w-md mb-2">
            <button 
              className="btn btn-primary flex-1"
              onClick={backToSetup}
            >
              New Game
            </button>
          </div>
        ) : null}
        {/* Finalize Game Button (appears when winner is determined) */}
        {winner && (() => {
          const hasUnsavedScores = Object.values(scoreTallies).some(tally => tally && tally.total !== 0)
          return (
            <>
              <button
                className="btn btn-primary btn-lg w-11/12 max-w-md text-lg"
                onClick={finalizeGame}
                disabled={loading || hasUnsavedScores}
                style={{ fontSize: '5vw', minHeight: '2.5rem' }}
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
                <div className="text-warning text-xs mt-1 text-center" style={{ fontSize: '2vw' }}>
                  Please wait for all score changes to be saved before finalizing.
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default GamePlay
