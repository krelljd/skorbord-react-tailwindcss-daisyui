import { useState, useEffect } from 'react'

const RivalryStats = ({ sqid, rivalries, backToSetup }) => {
  const [selectedRivalry, setSelectedRivalry] = useState(null)
  const [rivalryDetails, setRivalryDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRivalryDetails = async (rivalryId) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${__API_URL__}/api/sqids/${sqid}/rivalries/${rivalryId}`)
      if (!response.ok) {
        throw new Error('Failed to load rivalry details')
      }

      const data = await response.json()
      setRivalryDetails(data.data)
    } catch (err) {
      console.error('Failed to load rivalry details:', err)
      setError(err.message || 'Failed to load rivalry details')
    } finally {
      setLoading(false)
    }
  }

  const selectRivalry = (rivalry) => {
    setSelectedRivalry(rivalry)
    loadRivalryDetails(rivalry.id)
  }

  const formatStreak = (streak) => {
    if (!streak) return 'N/A'
    return streak.split('').join(' ')
  }

  const formatMargin = (margin) => {
    if (margin === null || margin === undefined) return 'N/A'
    return margin.toString()
  }

  if (selectedRivalry && rivalryDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSelectedRivalry(null)
              setRivalryDetails(null)
            }}
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold">Rivalry Details</h2>
        </div>

        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="loading-state"></div>
          </div>
        ) : (
          <>
            {/* Rivalry Header */}
            <div className="card bg-base-200 p-4">
              <h3 className="text-lg font-semibold text-center mb-2">
                {rivalryDetails.player_names.join(' vs ')}
              </h3>
              <p className="text-center opacity-75">
                {rivalryDetails.total_games} total games
              </p>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Win Rate</div>
                <div className="stat-value text-2xl">
                  {rivalryDetails.total_games > 0 
                    ? `${Math.round((rivalryDetails.wins / rivalryDetails.total_games) * 100)}%`
                    : '0%'
                  }
                </div>
                <div className="stat-desc">
                  {rivalryDetails.wins}W / {rivalryDetails.losses}L
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title">Avg Margin</div>
                <div className="stat-value text-2xl">
                  {rivalryDetails.average_margin ? 
                    rivalryDetails.average_margin.toFixed(1) : 
                    'N/A'
                  }
                </div>
                <div className="stat-desc">
                  Points per game
                </div>
              </div>
            </div>

            {/* Margins */}
            <div className="card bg-base-200 p-4">
              <h4 className="font-semibold mb-3">Victory Margins</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm opacity-75">Largest Win</p>
                  <p className="text-lg font-bold text-success">
                    {formatMargin(rivalryDetails.max_win_margin)}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Smallest Win</p>
                  <p className="text-lg font-bold text-warning">
                    {formatMargin(rivalryDetails.min_win_margin)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Streak */}
            <div className="card bg-base-200 p-4">
              <h4 className="font-semibold mb-3">Last 10 Games</h4>
              <div className="text-center">
                <div className="text-lg font-mono tracking-wider">
                  {formatStreak(rivalryDetails.last_10_results)}
                </div>
                <p className="text-xs opacity-75 mt-2">
                  W = Win, L = Loss (most recent on right)
                </p>
              </div>
            </div>

            {/* Game Type Breakdown */}
            {rivalryDetails.game_type_stats && rivalryDetails.game_type_stats.length > 0 && (
              <div className="card bg-base-200 p-4">
                <h4 className="font-semibold mb-3">By Game Type</h4>
                <div className="space-y-3">
                  {rivalryDetails.game_type_stats.map(stat => (
                    <div key={stat.game_type_name} className="flex justify-between items-center">
                      <span className="font-medium">{stat.game_type_name}</span>
                      <div className="text-sm">
                        <span className="badge badge-outline">
                          {stat.wins}W / {stat.losses}L
                        </span>
                        {stat.average_margin && (
                          <span className="ml-2 opacity-75">
                            Avg: {stat.average_margin.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Games */}
            {rivalryDetails.recent_games && rivalryDetails.recent_games.length > 0 && (
              <div className="card bg-base-200 p-4">
                <h4 className="font-semibold mb-3">Recent Games</h4>
                <div className="space-y-2">
                  {rivalryDetails.recent_games.slice(0, 5).map(game => (
                    <div key={game.id} className="flex justify-between items-center text-sm">
                      <span>{game.game_type_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${game.is_winner ? 'badge-success' : 'badge-error'}`}>
                          {game.is_winner ? 'W' : 'L'}
                        </span>
                        <span className="opacity-75">
                          {new Date(game.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button 
          className="btn btn-primary w-full"
          onClick={backToSetup}
        >
          Start New Game
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          className="btn btn-ghost btn-sm"
          onClick={backToSetup}
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold">Rivalry Statistics</h2>
      </div>

      {rivalries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-semibold mb-2">No Rivalries Yet</p>
          <p className="opacity-75 mb-6">
            Play some games to start tracking rivalry statistics!
          </p>
          <button 
            className="btn btn-primary"
            onClick={backToSetup}
          >
            Start First Game
          </button>
        </div>
      ) : (
        <>
          <p className="text-center opacity-75 mb-6">
            Select a rivalry to view detailed statistics
          </p>
          
          <div className="space-y-3">
            {rivalries.map(rivalry => (
              <div 
                key={rivalry.id}
                className="card bg-base-200 p-4 cursor-pointer hover:bg-base-300 transition-colors"
                onClick={() => selectRivalry(rivalry)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {rivalry.player_names.join(' vs ')}
                    </h3>
                    <p className="text-sm opacity-75">
                      {rivalry.total_games} games played
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-outline">
                      {rivalry.wins}W / {rivalry.losses}L
                    </div>
                    {rivalry.average_margin && (
                      <p className="text-sm opacity-75 mt-1">
                        Avg margin: {rivalry.average_margin.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default RivalryStats
