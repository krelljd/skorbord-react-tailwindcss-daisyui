import React, { useState } from 'react';

/**
 * Professional ScoreControls component
 * Props:
 *   value: number
 *   onChange: function(newValue)
 *   min?: number
 *   max?: number
 *   teamColor?: string
 */
export default function ScoreControls({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  teamColor = 'team-blue',
  disabled = false
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleChange = (newValue) => {
    if (disabled) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={`professional-card p-4 ${teamColor}`}>
      <div className="flex items-center justify-between">
        {/* Decrease Button */}
        <button
          className="touch-control bg-black/20 hover:bg-black/30 border-2 border-white/30 text-white font-bold transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleChange(Math.max(min, value - 1))}
          aria-label="Decrease score"
          disabled={disabled || value <= min}
        >
          −
        </button>

        {/* Score Display */}
        <div
          className={`score-display text-center px-4 ${isAnimating ? 'score-animate' : ''}`}
        >
          {value}
        </div>

        {/* Increase Button */}
        <button
          className="touch-control bg-black/20 hover:bg-black/30 border-2 border-white/30 text-white font-bold transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleChange(Math.min(max, value + 1))}
          aria-label="Increase score"
          disabled={disabled || value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
