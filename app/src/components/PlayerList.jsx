import React from 'react';

/**
 * PlayerList component
 * Props:
 *   players: Array<{ id: number, name: string }>
 *   onSelect?: function(player)
 */
export default function PlayerList({ players = [], onSelect }) {
  return (
    <ul className="menu bg-base-200 rounded-box w-full max-w-md p-2">
      {players.length === 0 && (
        <li className="text-center opacity-60">No players found.</li>
      )}
      {players.map((player) => (
        <li key={player.id}>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-base-300 transition"
            style={{ fontSize: '3vw' }}
            onClick={() => onSelect && onSelect(player)}
          >
            {player.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
