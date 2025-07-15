import React, { useState } from 'react'
import { getPlayerTextColorClass, getPlayerTextColorClassByName } from '../utils/playerColors'

const RivalryStats = ({ sqid, rivalries, players: globalPlayers, backToSetup }) => {
  const [selectedRivalry, setSelectedRivalry] = useState(null)
  const [rivalryDetails, setRivalryDetails] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [localPlayers, setLocalPlayers] = useState([])

  // Load players specifically for color information
  React.useEffect(() => {
    const loadPlayers = async () => {
      try {
        const response = await fetch(`${__API_URL__}/api/${sqid}/players`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            console.log('Loaded localPlayers:', data.data);
            setLocalPlayers(data.data)
          }
        }
      } catch (err) {
        console.error('Failed to load players for colors:', err)
      }
    }
    if (sqid) {
      loadPlayers()
    }
  }, [sqid])

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
      const res = await fetch(`${__API_URL__}/api/${sqid}/rivalries/${rivalry.id}`);
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
                {detailPlayerNames.map((playerName, index) => (
                  <span key={index}>
                    <span className={(() => {
                      const colorClass = getPlayerTextColorClassByName(playerName, localPlayers);
                      console.log(`DEBUG: Player "${playerName}" -> Color class: "${colorClass}"`);
                      return colorClass;
                    })()}>
                      {playerName}
                    </span>
                    {index < detailPlayerNames.length - 1 && ' vs '}
                  </span>
                ))}
              </h3>
              <p className="text-center opacity-75">
                Per-player rivalry statistics
              </p>
            </div>

            {/* Stats Per Game Type Per Player - DaisyUI Stats */}
            <div className="space-y-8">
              {gameTypes.map(gt => (
                <div key={gt.id || gt.name} className="card bg-base-200 p-4">
                  <h4 className="font-semibold mb-6 text-center text-lg">{gt.name}</h4>
                  
                  {/* Player Stats Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
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

                      return (
                        <div key={player.id} className="card bg-base-100 p-4">
                          <h5 className={`font-bold text-center mb-4 ${getPlayerTextColorClassByName(player.name, localPlayers)}`}>{player.name}</h5>
                          
                          <div className="stats stats-vertical shadow w-full">
                            {statFields.map(field => {
                              let value = stats[field.key];
                              let desc = '';
                              
                              if (field.key === 'win_rate') {
                                value = stats.total_games > 0 && stats.wins !== undefined ? `${Math.round((stats.wins / stats.total_games) * 100)}%` : '0%';
                                desc = `${stats.wins || 0}/${stats.total_games || 0} games`;
                              } else if (field.key === 'last_10_results') {
                                value = value ? value.split('').join(' ') : 'N/A';
                                desc = 'Recent form';
                              } else if (field.key === 'max_win_margin') {
                                desc = 'Biggest victory';
                                value = value !== undefined && value !== null ? value : 'N/A';
                              } else if (field.key === 'min_win_margin') {
                                desc = 'Closest victory';
                                value = value !== undefined && value !== null ? value : 'N/A';
                              } else if (field.key === 'max_loss_margin') {
                                desc = 'Worst defeat';
                                value = value !== undefined && value !== null ? value : 'N/A';
                              } else if (field.key === 'min_loss_margin') {
                                desc = 'Closest defeat';
                                value = value !== undefined && value !== null ? value : 'N/A';
                              } else {
                                value = value !== undefined && value !== null ? value : 'N/A';
                              }
                              
                              return (
                                <div key={field.key} className="stat">
                                  <div className="stat-title text-xs">{field.label}</div>
                                  <div className={`stat-value text-lg ${field.className}`}>{value}</div>
                                  {desc && <div className="stat-desc text-xs">{desc}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Games Timeline */}
            {rivalryDetails.recent_games && rivalryDetails.recent_games.length > 0 && (
              <div className="card bg-base-200 p-4">
                <h4 className="font-semibold mb-4">Recent Games</h4>
                <ul className="timeline timeline-vertical">
                  {rivalryDetails.recent_games.slice(0, 5).map((game, index) => {
                    // Determine winner's name (assume game.winner_name exists, fallback to game.winner_id/player mapping if needed)
                    let winnerName = game.winner_name;
                    if (!winnerName && Array.isArray(players)) {
                      const winnerPlayer = players.find(p => p.id === game.winner_id);
                      winnerName = winnerPlayer ? winnerPlayer.name : 'Unknown';
                    }
                    
                    const isEven = index % 2 === 0;
                    const gameDate = new Date(game.completed_at).toLocaleDateString();
                    
                    return (
                      <li key={game.id}>
                        {index > 0 && <hr className="bg-base-300" />}
                        
                        {/* Date on alternating sides */}
                        {isEven ? (
                          <div className="timeline-start text-sm font-mono opacity-75">
                            <span className={getPlayerTextColorClassByName(winnerName, localPlayers)}>{winnerName || 'Unknown'}</span>
                          </div>
                        ) : null}
                        
                        {/* Card icon in the middle */}
                        <div className="timeline-middle">
                          {/* Playing cards SVG icon, 20% smaller */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4 text-success"
                          >
                            <rect x="3" y="5" width="11.2" height="14.4" rx="1.6" fill="#222" stroke="#fff" strokeWidth="1.2" />
                            <rect x="7" y="1" width="11.2" height="14.4" rx="1.6" fill="#444" stroke="#fff" strokeWidth="1.2" />
                            <text x="9" y="11" fontSize="5.6" fill="#fff" fontWeight="bold" fontFamily="monospace">A</text>
                            <text x="13.5" y="6" fontSize="5.6" fill="#fff" fontWeight="bold" fontFamily="monospace">♠</text>
                          </svg>
                        </div>
                        
                        {/* Game info box on alternating sides */}
                        {isEven ? (
                        <div className="timeline-end timeline-box bg-base-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-75">{game.game_type_name}</span>
                            <p className="text-xs opacity-75">{gameDate}</p>
                          </div>
                        </div>
                        ) : (
                          <>
                            <div className="timeline-start timeline-box bg-base-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs opacity-75">{game.game_type_name}</span>
                              </div>
                              <p className="text-xs opacity-75">{gameDate}</p>
                            </div>
                            <div className="timeline-end text-sm font-mono opacity-75">
                              <span className={getPlayerTextColorClassByName(winnerName, localPlayers)}>{winnerName || 'Unknown'}</span>
                            </div>
                          </>
                        )}
                        
                        {index < rivalryDetails.recent_games.slice(0, 5).length - 1 && <hr className="bg-base-300" />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <button 
              className="btn btn-primary w-full"
              onClick={backToSetup}
            >
              Start New Game
            </button>
          </>
        )}
      </div>
    );
  }
  
  // Don't use detailPlayerNames here since we're not in a selected rivalry context
  
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
                      {listPlayerNames.map((playerName, index) => {
                        const colorClass = getPlayerTextColorClassByName(playerName, localPlayers);
                        return (
                          <span key={index}>
                            <span className={colorClass}>
                              {playerName}
                            </span>
                            {index < listPlayerNames.length - 1 && ' vs '}
                          </span>
                        );
                      })}
                    </h3>
                    {/* Show all game types played by this rivalry */}
                    {Array.isArray(rivalry.game_types) && rivalry.game_types.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rivalry.game_types.map(gt => (
                          <span key={gt.id} className="badge badge-outline badge-info">
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
