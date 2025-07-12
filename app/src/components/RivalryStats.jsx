import { useState, useEffect, useRef } from 'react'

const RivalryStats = ({ sqid, rivalries, backToSetup }) => {
  const [selectedRivalry, setSelectedRivalry] = useState(null)
  const [rivalryDetails, setRivalryDetails] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  // Charting-related state/hooks removed

  // Only declare these once at the top level so they're always available
  const playerStats = rivalryDetails?.player_stats || {};
  const players = Array.isArray(rivalryDetails?.players) ? rivalryDetails.players : [];
  // Use game_type_stats for stats table, fallback to game_types for listing
  const gameTypes = Array.isArray(rivalryDetails?.game_type_stats) && rivalryDetails.game_type_stats.length > 0
    ? rivalryDetails.game_type_stats.map(gt => ({
        id: gt.game_type_id,
        name: gt.game_type_name,
        ...gt
      }))
    : (Array.isArray(rivalryDetails?.game_types) ? rivalryDetails.game_types : []);
  const statFields = [
    { key: 'win_rate', label: 'Win Rate (%)', className: 'text-primary' },
    { key: 'average_margin', label: 'Avg Margin', className: 'text-info' },
    { key: 'max_win_margin', label: 'Largest Win', className: 'text-success' },
    { key: 'min_win_margin', label: 'Smallest Win', className: 'text-warning' },
    { key: 'max_loss_margin', label: 'Largest Loss', className: 'text-error' },
    { key: 'min_loss_margin', label: 'Smallest Loss', className: 'text-warning' },
    { key: 'last_10_results', label: 'Last 10', className: 'font-mono' },
  ];

  // Function to handle rivalry selection
  const selectRivalry = async (rivalry) => {
    setSelectedRivalry(rivalry);
    setLoading(true);
    setError(null);
    try {
      // Fetch rivalry details from API
      const res = await fetch(`/api/demo/rivalries/${rivalry.id}`);
      if (!res.ok) throw new Error('Failed to fetch rivalry details');
      const data = await res.json();
      if (!data.success || !data.data) throw new Error('Invalid API response');
      setRivalryDetails(data.data);
    } catch (err) {
      setError(err.message || 'Error fetching rivalry details');
      setRivalryDetails(null);
    } finally {
      setLoading(false);
    }
  }
  if (selectedRivalry && rivalryDetails) {
    // Fallback logic for player names in details view
    const detailPlayerNames = Array.isArray(rivalryDetails.player_names) && rivalryDetails.player_names.length > 0
      ? rivalryDetails.player_names
      : (Array.isArray(players) && players.length > 0
        ? players.map(p => p.name)
        : ['Unknown Players']);
    // Robust fallback for missing/empty data
    if (!players.length || !gameTypes.length) {
      return (
        <div className="space-y-6">
          <div className="alert alert-warning">
            <span>No player or game type data available for this rivalry.</span>
          </div>
        </div>
      );
    }
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

              {/* Stats Per Game Type Per Player - DaisyUI Table */}
              <div className="space-y-8">
                {gameTypes.map(gt => (
                  <div key={gt.id || gt.name} className="card bg-base-200 p-4">
                    <h4 className="font-semibold mb-3 text-center">{gt.name}</h4>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full text-xs md:text-sm">
                        <thead>
                          <tr>
                            <th className="bg-base-300">Stat</th>
                            {players.map(player => (
                              <th key={player.id} className="bg-base-300 text-center">{player.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {statFields.map(field => (
                              <tr key={field.key}>
                                <td className="font-semibold">{field.label}</td>
                                {players.map(player => {
                                  let stats = null;
                                  // Use game_type_id for lookup
                                  if (playerStats[player.id] && playerStats[player.id][gt.id]) {
                                    stats = playerStats[player.id][gt.id];
                                  } else if (playerStats[player.id] && playerStats[player.id][gt.game_type_id]) {
                                    stats = playerStats[player.id][gt.game_type_id];
                                  } else if (playerStats[player.name] && playerStats[player.name][gt.id]) {
                                    stats = playerStats[player.name][gt.id];
                                  } else if (playerStats[player.name] && playerStats[player.name][gt.game_type_id]) {
                                    stats = playerStats[player.name][gt.game_type_id];
                                  } else {
                                    stats = {};
                                  }
                                  let value = stats[field.key];
                                  // Fix for avg_margin key
                                  if (field.key === 'average_margin' && (value === undefined || value === null)) {
                                    value = stats['avg_margin'];
                                  }
                                  if (field.key === 'win_rate') {
                                    value = stats.total_games > 0 && stats.wins !== undefined ? `${Math.round((stats.wins / stats.total_games) * 100)}%` : '0%';
                                  } else if (field.key === 'average_margin') {
                                    value = value !== undefined && value !== null ? Number(value).toFixed(1) : 'N/A';
                                  } else if (field.key === 'last_10_results') {
                                    value = value ? value.split('').join(' ') : 'N/A';
                                  } else if (value === undefined || value === null) {
                                    value = 'N/A';
                                  }
                                  return (
                                    <td key={player.id} className={`text-center ${field.className}`}>{value}</td>
                                  );
                                })}
                              </tr>
                          ))}
                        </tbody>
                      </table>
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

              {/* Charting component removed as requested */}

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
    );

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

              {/* Stats Per Game Type Per Player - DaisyUI Table */}
              <div className="space-y-8">
                {gameTypes.map(gt => (
                  <div key={gt.id || gt.name} className="card bg-base-200 p-4">
                    <h4 className="font-semibold mb-3 text-center">{gt.name}</h4>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full text-xs md:text-sm">
                        <thead>
                          <tr>
                            <th className="bg-base-300">Stat</th>
                            {players.map(player => (
                              <th key={player.id} className="bg-base-300 text-center">{player.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {statFields.map(field => (
                            <tr key={field.key}>
                              <td className="font-semibold">{field.label}</td>
                              {players.map(player => {
                                // Robustly get stats for this player/gameType
                                let stats = null;
                                // Try id, then name fallback if needed
                                if (playerStats[player.id] && playerStats[player.id][gt.id]) {
                                  stats = playerStats[player.id][gt.id];
                                } else if (playerStats[player.id] && playerStats[player.id][gt.name]) {
                                  stats = playerStats[player.id][gt.name];
                                } else if (playerStats[player.name] && playerStats[player.name][gt.id]) {
                                  stats = playerStats[player.name][gt.id];
                                } else if (playerStats[player.name] && playerStats[player.name][gt.name]) {
                                  stats = playerStats[player.name][gt.name];
                                } else {
                                  stats = {};
                                }
                                let value = stats[field.key];
                                if (field.key === 'win_rate') {
                                  value = stats.total_games > 0 && stats.wins !== undefined ? `${Math.round((stats.wins / stats.total_games) * 100)}%` : '0%';
                                } else if (field.key === 'average_margin') {
                                  value = value !== undefined && value !== null ? Number(value).toFixed(1) : 'N/A';
                                } else if (field.key === 'last_10_results') {
                                  value = value ? value.split('').join(' ') : 'N/A';
                                } else if (value === undefined || value === null) {
                                  value = 'N/A';
                                }
                                return (
                                  <td key={player.id} className={`text-center ${field.className}`}>{value}</td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
