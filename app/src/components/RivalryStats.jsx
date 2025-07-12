import { useState, useEffect, useRef } from 'react'

const RivalryStats = ({ sqid, rivalries, backToSetup }) => {
  const [selectedRivalry, setSelectedRivalry] = useState(null)
  const [rivalryDetails, setRivalryDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Move chart hooks to top level to avoid hook order issues
  const [selectedStat, setSelectedStat] = useState('average_margin');
  const chartRef = useRef(null);

  // Prepare line graph data for selected stat (always defined, but may be empty)
  const chartLabels = rivalryDetails && rivalryDetails.game_type_stats ? rivalryDetails.game_type_stats.map(stat => stat.game_type_name) : [];
  const chartData = rivalryDetails && rivalryDetails.game_type_stats ? rivalryDetails.game_type_stats.map(stat => {
    if (selectedStat === 'win_rate') {
      return stat.total_games > 0 && stat.wins !== undefined ? Math.round((stat.wins / stat.total_games) * 100) : 0;
    }
    return stat[selectedStat] !== undefined && stat[selectedStat] !== null ? stat[selectedStat] : 0;
  }) : [];

  useEffect(() => {
    // Only run chart logic if chartRef and rivalryDetails are present
    if (!selectedRivalry || !rivalryDetails || !chartRef.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
      chartRef.current.chartInstance = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: selectedStat === 'win_rate' ? 'Win Rate (%)' : selectedStat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            data: chartData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.2)',
            tension: 0.3,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Game Type Trends', color: '#fff' },
          },
          scales: {
            x: { ticks: { color: '#fff' } },
            y: { ticks: { color: '#fff' } },
          },
        },
      });
    });
  }, [selectedStat, rivalryDetails, selectedRivalry, chartLabels, chartData]);

  const API_URL = import.meta.env.VITE_API_URL
  // Debug: log API_URL to verify it's loaded correctly
  useEffect(() => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('RivalryStats: API_URL =', API_URL)
    }
  }, [API_URL])

  const loadRivalryDetails = async (rivalryId) => {
    setLoading(true)
    setError('')

    if (!API_URL) {
      setError('API URL is not configured. Please set VITE_API_URL in your environment.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/${sqid}/rivalries/${rivalryId}`)
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

  // Always show error if API_URL is missing
  if (!API_URL) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <span>API URL is not configured. Please set VITE_API_URL in your .env file and restart the dev server.</span>
        </div>
      </div>
    )
  }

  if (selectedRivalry && rivalryDetails) {
    // Fallback logic for player names in details view
    const detailPlayerNames = Array.isArray(rivalryDetails.player_names) && rivalryDetails.player_names.length > 0
      ? rivalryDetails.player_names
      : (Array.isArray(rivalryDetails.players) && rivalryDetails.players.length > 0
        ? rivalryDetails.players.map(p => p.name)
        : ['Unknown Players']);

    // ...existing code...
    return (
      <>
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
            <h2 className="text-xl font-bold">Rivalry Stats</h2>
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
                  {detailPlayerNames.join(' vs ')}
                </h3>
                <p className="text-center opacity-75">
                  {rivalryDetails.total_games ? rivalryDetails.total_games : 0} total games
                </p>
              </div>

              {/* Stats Per Game Type - DaisyUI professional display */}
              <div className="space-y-6">
                {rivalryDetails.game_type_stats.map(stat => (
                  <div key={stat.game_type_id || stat.game_type_name} className="card bg-base-200 p-4">
                    <h4 className="font-semibold mb-3 text-center">{stat.game_type_name}</h4>
                    <div className="stats stats-vertical lg:stats-horizontal shadow mb-4">
                      <div className="stat place-items-center">
                        <div className="stat-title">Win Rate</div>
                        <div className="stat-value text-primary">{stat.total_games > 0 && stat.wins !== undefined ? `${Math.round((stat.wins / stat.total_games) * 100)}%` : '0%'}</div>
                        <div className="stat-desc">{stat.wins !== undefined ? stat.wins : 0}W / {stat.losses !== undefined ? stat.losses : 0}L</div>
                      </div>
                      <div className="stat place-items-center">
                        <div className="stat-title">Avg Margin</div>
                        <div className="stat-value text-info">{stat.average_margin !== undefined && stat.average_margin !== null ? stat.average_margin.toFixed(1) : 'N/A'}</div>
                        <div className="stat-desc">Points per game</div>
                      </div>
                      <div className="stat place-items-center">
                        <div className="stat-title">Largest Win</div>
                        <div className="stat-value text-success">{formatMargin(stat.max_win_margin)}</div>
                        <div className="stat-desc">Victory Margin</div>
                      </div>
                      <div className="stat place-items-center">
                        <div className="stat-title">Smallest Win</div>
                        <div className="stat-value text-warning">{formatMargin(stat.min_win_margin)}</div>
                        <div className="stat-desc">Victory Margin</div>
                      </div>
                      <div className="stat place-items-center">
                        <div className="stat-title">Largest Loss</div>
                        <div className="stat-value text-error">{formatMargin(stat.max_loss_margin)}</div>
                        <div className="stat-desc">Loss Margin</div>
                      </div>
                      <div className="stat place-items-center">
                        <div className="stat-title">Smallest Loss</div>
                        <div className="stat-value text-warning">{formatMargin(stat.min_loss_margin)}</div>
                        <div className="stat-desc">Loss Margin</div>
                      </div>
                    </div>
                    <div className="card bg-base-100 p-4 mb-4">
                      <h5 className="font-semibold mb-2 text-sm">Last 10 Games</h5>
                      <div className="text-center">
                        <div className="text-lg font-mono tracking-wider">{formatStreak(stat.last_10_results)}</div>
                        <p className="text-xs opacity-75 mt-2">W = Win, L = Loss (most recent on right)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Recent Games (all types) */}
              {rivalryDetails.recent_games && rivalryDetails.recent_games.length > 0 && (
                <div className="card bg-base-200 p-4">
                  <h4 className="font-semibold mb-3">Recent Games</h4>
                  <div className="space-y-2">
                    {rivalryDetails.recent_games.slice(0, 5).map(game => (
                      <div key={game.id} className="flex justify-between items-center text-sm">
                        <span>{game.game_type_name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${game.is_winner ? 'badge-success' : 'badge-error'}`}>{game.is_winner ? 'W' : 'L'}</span>
                          <span className="opacity-75">{new Date(game.completed_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stat Graph Controls and Chart - moved to bottom */}
              <div className="mt-8">
                <fieldset className="fieldset mb-4">
                  <legend className="fieldset-legend">Statistic Trend</legend>
                  <select className="select select-bordered w-full max-w-xs" value={selectedStat} onChange={e => setSelectedStat(e.target.value)}>
                    <option value="win_rate">Win Rate (%)</option>
                    <option value="average_margin">Average Margin</option>
                    <option value="max_win_margin">Largest Win Margin</option>
                    <option value="min_win_margin">Smallest Win Margin</option>
                    <option value="max_loss_margin">Largest Loss Margin</option>
                    <option value="min_loss_margin">Smallest Loss Margin</option>
                  </select>
                </fieldset>
                <div className="bg-base-100 rounded-lg shadow p-4 mb-6">
                  <canvas ref={chartRef} height={200} />
                </div>
              </div>

              <button 
                className="btn btn-primary w-full"
                onClick={backToSetup}
              >
                Start New Game
              </button>
            </>
          )}
        </div>
      </>
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
        <h2 className="text-xl font-bold">Rivalry Stats</h2>
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
            {rivalries.map(rivalry => {
              // Fallback logic for player names in rivalry list
              const listPlayerNames = Array.isArray(rivalry.player_names) && rivalry.player_names.length > 0
                ? rivalry.player_names
                : (Array.isArray(rivalry.players) && rivalry.players.length > 0
                  ? rivalry.players.map(p => p.name)
                  : ['Unknown Players']);
              return (
                <div 
                  key={rivalry.id}
                  className="card bg-base-200 p-4 cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => selectRivalry(rivalry)}
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg">
                      {listPlayerNames.join(' vs ')}
                    </h3>
                    {/* Show all game types played by this rivalry */}
                    {Array.isArray(rivalry.game_types) && rivalry.game_types.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rivalry.game_types.map(gt => (
                          <span key={gt.id} className="badge badge-outline">
                            {gt.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default RivalryStats
