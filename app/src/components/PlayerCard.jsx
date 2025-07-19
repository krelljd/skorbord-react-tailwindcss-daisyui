import { useState, useRef } from 'react'
import { getPlayerTextColorClass, getPlayerBadgeColorClass, getPlayerRingColorClass } from '../utils/playerColors'

const PlayerCard = ({ 
  player, // expects { id, name, color, ... }
  score, 
  onScoreChange, 
  disabled, 
  scoreTally,
  isWinner 
}) => {
  if (!player) return null;
  const [isUpdating, setIsUpdating] = useState(false)
  const [glowingButton, setGlowingButton] = useState(null) // 'plus' or 'minus'
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)
  const glowTimeoutRef = useRef(null)

  const handleScoreChange = async (change) => {
    if (disabled) return
    // Trigger button glow effect
    const buttonType = change > 0 ? 'plus' : 'minus'
    setGlowingButton(buttonType)
    // Clear any existing glow timeout
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current)
    }
    // Remove glow after brief period
    glowTimeoutRef.current = setTimeout(() => {
      setGlowingButton(null)
    }, 200)
    try {
      await onScoreChange(player.id, change)
    } catch (error) {
      // Handle error silently, onScoreChange should handle error display
    }
  }

  // Handle long press for ±10, tap/click for ±1 (works for both touch and mouse)
  const handlePressStart = (change) => {
    if (disabled) return
    
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      handleScoreChange(change * 10)
    }, 500) // 500ms for long press
  }

  const handlePressEnd = (change) => {
    if (disabled) return
    
    clearTimeout(longPressTimer.current)
    
    // Only execute single increment if it wasn't a long press
    if (!isLongPress.current) {
      handleScoreChange(change)
    }
    
    // Reset the long press flag for next interaction
    isLongPress.current = false
  }

  const handlePressCancel = () => {
    clearTimeout(longPressTimer.current)
    isLongPress.current = false
  }


  // Format tally as +# or -#, bold, colored, superscript
  const formatScoreTally = (tally) => {
    if (!tally) return ''
    const sign = tally.total > 0 ? '+' : tally.total < 0 ? '' : ''
    return `${sign}${tally.total}`
  }

  return (
    <div className={`player-card relative ${isWinner && player.color ? `ring-4 ${getPlayerRingColorClass(player)}` : ''}`}>
      {/* Winner Badge */}
      {isWinner && player.color && (
        <div className={`absolute -top-2 -left-2 badge ${getPlayerBadgeColorClass(player)}`}>
          🏆 Winner
        </div>
      )}

      {/* Player Name as heading with DaisyUI/Tailwind color */}
      <div className="text-center mb-2">
        <h3 className={`text-lg font-semibold ${getPlayerTextColorClass(player)}`}> 
          {player.name}
        </h3>
      </div>

      {/* Score Display with Tally Superscript */}
      <div className="score-display relative flex items-center justify-center text-3xl font-bold">
        {typeof score !== 'undefined' ? score : (typeof player.score !== 'undefined' ? player.score : 0)}
        {scoreTally && scoreTally.total !== 0 && (
          <sup
            key={scoreTally.timestamp} // Force re-render and restart animation when timestamp changes
            className={`absolute -top-1 -right-2 text-sm font-bold
              ${scoreTally.total > 0 ? 'text-green-400' : 'text-red-400'}
              bg-base-200 px-1 py-0.5 rounded shadow-lg
              score-tally-animation
            `}
            style={{
              fontSize: '0.9em',
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
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Minus Button */}
        <button
          className={`btn btn-error btn-lg text-4xl font-bold aspect-square w-full max-w-20 mx-auto transition-all duration-200 ${
            glowingButton === 'minus' ? 'ring-4 ring-error ring-opacity-75 shadow-lg shadow-error/50 scale-105' : ''
          }`}
          onTouchStart={() => handlePressStart(-1)}
          onTouchEnd={() => handlePressEnd(-1)}
          onTouchCancel={handlePressCancel}
          onMouseDown={() => handlePressStart(-1)}
          onMouseUp={() => handlePressEnd(-1)}
          onMouseLeave={handlePressCancel}
          disabled={disabled}
          title="Tap: -1, Long press: -10"
        >
          -
        </button>

        {/* Plus Button */}
        <button
          className={`btn btn-success btn-lg text-4xl font-bold aspect-square w-full max-w-20 mx-auto transition-all duration-200 ${
            glowingButton === 'plus' ? 'ring-4 ring-success ring-opacity-75 shadow-lg shadow-success/50 scale-105' : ''
          }`}
          onTouchStart={() => handlePressStart(1)}
          onTouchEnd={() => handlePressEnd(1)}
          onTouchCancel={handlePressCancel}
          onMouseDown={() => handlePressStart(1)}
          onMouseUp={() => handlePressEnd(1)}
          onMouseLeave={handlePressCancel}
          disabled={disabled}
          title="Tap: +1, Long press: +10"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default PlayerCard
