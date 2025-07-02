import React from 'react';

/**
 * RivalrySelector component
 * Props:
 *   rivalries: Array<{ id: number, team1_id: number, team2_id: number, team1_name?: string, team2_name?: string }>
 *   value: number | null
 *   onChange: function(rivalryId)
 */
export default function RivalrySelector({ rivalries = [], value, onChange }) {
  return (
    <div className="form-control w-full max-w-md">
      <label className="label">
        <span className="label-text text-lg" style={{ fontSize: '3vw' }}>Rivalry</span>
      </label>
      <select
        className="select select-bordered w-full"
        style={{ fontSize: '3vw' }}
        value={value || ''}
        onChange={e => onChange && onChange(Number(e.target.value))}
      >
        <option value="" disabled>Select a rivalry</option>
        {rivalries.map(r => (
          <option key={r.id} value={r.id}>
            {(r.team1_name || r.team1_id) + ' vs ' + (r.team2_name || r.team2_id)}
          </option>
        ))}
      </select>
    </div>
  );
}
