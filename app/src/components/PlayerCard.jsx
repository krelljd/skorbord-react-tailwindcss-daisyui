import { useState } from 'react'

const PlayerCard = ({ 
  playerId, 
  playerName, 
  score, 
  onScoreChange, 
  disabled, 
  scoreTally,
  isWinner 
}) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleScoreChange = async (change) => {
    if (disabled || isUpdating) return
    
    setIsUpdating(true)
    try {
      await onScoreChange(playerId, change)
    } finally {
      // Small delay to prevent rapid-fire clicks
      setTimeout(() => setIsUpdating(false), 200)
    }
  }


  // Format tally as +# or -#, bold, colored, superscript
  const formatScoreTally = (tally) => {
    if (!tally) return ''
    const sign = tally.total > 0 ? '+' : tally.total < 0 ? '' : ''
    return `${sign}${tally.total}`
  }

  return (
    <div className={`player-card relative ${isWinner ? 'ring-4 ring-success' : ''}`}>
      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute -top-2 -left-2 badge badge-success">
          🏆 Winner
        </div>
      )}

      {/* Player Name */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{playerName}</h3>
      </div>

      {/* Score Display with Tally Superscript */}
      <div className="score-display relative flex items-center justify-center">
        {score}
        {scoreTally && scoreTally.total !== 0 && (
          <sup
            className={`absolute -top-2 -right-3 text-base font-bold transition-opacity duration-500
              ${scoreTally.total > 0 ? 'text-green-400' : 'text-red-400'}
              bg-base-200 px-1 py-0.5 rounded shadow-lg
              animate-fade-in
            `}
            style={{
              fontSize: '1.1em',
              zIndex: 10,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            aria-live="polite"
          >
            {formatScoreTally(scoreTally)}
          </sup>
        )}
      </div>

      {/* Score Control Buttons */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {/* -10 Button */}
        <button
          className="score-btn btn-error"
          onClick={() => handleScoreChange(-10)}
          disabled={disabled || isUpdating}
        >
          -10
        </button>

        {/* -1 Button */}
        <button
          className="score-btn btn-warning"
          onClick={() => handleScoreChange(-1)}
          disabled={disabled || isUpdating}
        >
          -1
        </button>

        {/* +1 Button */}
        <button
          className="score-btn btn-success"
          onClick={() => handleScoreChange(1)}
          disabled={disabled || isUpdating}
        >
          +1
        </button>

        {/* +10 Button */}
        <button
          className="score-btn btn-info"
          onClick={() => handleScoreChange(10)}
          disabled={disabled || isUpdating}
        >
          +10
        </button>
      </div>

      {/* Loading Indicator */}
      {isUpdating && (
        <div className="absolute inset-0 bg-base-300 bg-opacity-50 flex items-center justify-center rounded-lg">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}
    </div>
  )
}

export default PlayerCard
