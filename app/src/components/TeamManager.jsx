import React from 'react';

/**
 * TeamManager component
 *
 * This component manages teams and their players for a game. It is designed to be mobile-first, touch-friendly,
 * and accessible, using TailwindCSS and DaisyUI for styling. All state and logic are passed via props for reusability.
 *
 * Why: Teams are a core part of the Skorbord app, supporting both individual and team-based games. This component
 * allows users to create, edit, and manage teams and their players before a game begins, with real-time updates.
 *
 * Props:
 *   teams: Array<{ id: number, name: string, color?: string, players: Array<{ id: number, name: string }> }>
 *     - The current list of teams, each with a unique id, name, optional color, and list of players.
 *   availablePlayers: Array<{ id: number, name: string }>
 *     - Players not currently assigned to any team, available to be added.
 *   onAddTeam: function()
 *     - Called when the user requests to add a new team.
 *   onRemoveTeam: function(teamId)
 *     - Called when the user requests to remove a team.
 *   onAddPlayerToTeam: function(teamId, playerId)
 *     - Called when the user adds a player to a team.
 *   onRemovePlayerFromTeam: function(teamId, playerId)
 *     - Called when the user removes a player from a team.
 *   onEditTeamName: function(teamId, newName)
 *     - Called when the user edits a team's name.
 *   onEditPlayerName: function(playerId, newName)
 *     - Called when the user edits a player's name.
 *   disabled?: boolean
 *     - If true, disables all controls (e.g., when game is in progress).
 *
 * All UI controls are optimized for touch and accessibility. Font sizes use vw units for mobile scaling.
 *
 * This component is stateless and can be reused in any context where team management is needed.
 */
export default function TeamManager({
  teams = [],
  availablePlayers = [],
  onAddTeam,
  onRemoveTeam,
  onAddPlayerToTeam,
  onRemovePlayerFromTeam,
  onEditTeamName,
  onEditPlayerName,
  disabled = false
}) {
  return (
    <div className="w-full max-w-2xl mx-auto p-2 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {teams.map(team => (
          <div key={team.id} className="bg-base-200 rounded-box p-3 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2">
              <input
                className="input input-bordered input-sm flex-1 bg-base-100"
                style={{ fontSize: '3vw' }}
                value={team.name}
                onChange={e => onEditTeamName && onEditTeamName(team.id, e.target.value)}
                disabled={disabled}
                aria-label="Edit team name"
              />
              <button
                className="btn btn-error btn-xs"
                style={{ fontSize: '2vw' }}
                onClick={() => onRemoveTeam && onRemoveTeam(team.id)}
                disabled={disabled}
                aria-label="Remove team"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {team.players.map(player => (
                <div key={player.id} className="badge badge-primary gap-1 px-3 py-2 flex items-center" style={{ fontSize: '2.5vw' }}>
                  <input
                    className="input input-xs bg-base-100 w-20 mr-1"
                    style={{ fontSize: '2.5vw' }}
                    value={player.name}
                    onChange={e => onEditPlayerName && onEditPlayerName(player.id, e.target.value)}
                    disabled={disabled}
                    aria-label="Edit player name"
                  />
                  <button
                    className="btn btn-xs btn-circle btn-ghost"
                    style={{ fontSize: '2vw' }}
                    onClick={() => onRemovePlayerFromTeam && onRemovePlayerFromTeam(team.id, player.id)}
                    disabled={disabled}
                    aria-label="Remove player from team"
                  >
                    -
                  </button>
                </div>
              ))}
              <select
                className="select select-xs bg-base-100"
                style={{ fontSize: '2.5vw' }}
                onChange={e => {
                  const playerId = Number(e.target.value);
                  if (playerId && onAddPlayerToTeam) onAddPlayerToTeam(team.id, playerId);
                  e.target.value = '';
                }}
                disabled={disabled || availablePlayers.length === 0}
                aria-label="Add player to team"
                defaultValue=""
              >
                <option value="" disabled>Add player</option>
                {availablePlayers.map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn btn-accent w-full"
        style={{ fontSize: '3vw' }}
        onClick={() => onAddTeam && onAddTeam()}
        disabled={disabled}
      >
        + Add Team
      </button>
    </div>
  );
}
