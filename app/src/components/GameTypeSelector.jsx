import React from 'react';

/**
 * GameTypeSelector component
 * Props:
 *   gameTypes: Array<{ id: number, name: string, description?: string }>
 *   value: number | null
 *   onChange: function(gameTypeId)
 *   favorites?: Array<number> // list of favorited gameType ids
 *   onToggleFavorite?: function(gameTypeId)
 */
export default function GameTypeSelector({ gameTypes = [], value, onChange, favorites = [], onToggleFavorite }) {
  return (
    <div className="form-control w-full max-w-md">
      <label className="label">
        <span className="label-text text-lg" style={{ fontSize: '3vw' }}>Game Type</span>
      </label>
      <div className="relative">
        <select
          className="select select-bordered w-full pr-12"
          style={{ fontSize: '3vw' }}
          value={value || ''}
          onChange={e => onChange && onChange(Number(e.target.value))}
        >
          <option value="" disabled>Select a game type</option>
          {gameTypes.map(gt => (
            <option key={gt.id} value={gt.id}>
              {gt.name}
            </option>
          ))}
        </select>
        {/* Favorite star overlay for selected game type */}
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-xs btn-ghost"
            style={{ fontSize: '3vw' }}
            aria-label={favorites.includes(value) ? 'Unfavorite' : 'Favorite'}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFavorite && onToggleFavorite(value);
            }}
          >
            {favorites.includes(value) ? '★' : '☆'}
          </button>
        )}
      </div>
      {value && gameTypes.find(gt => gt.id === value)?.description && (
        <div className="mt-2 text-xs opacity-70" style={{ fontSize: '2vw' }}>
          {gameTypes.find(gt => gt.id === value).description}
        </div>
      )}
    </div>
  );
}
