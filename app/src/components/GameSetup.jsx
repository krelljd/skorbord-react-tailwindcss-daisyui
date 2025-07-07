import { useState, useEffect } from 'react'
import { useConnection } from '../contexts/ConnectionContext.jsx'

const GameSetup = ({ 
  sqid, 
  gameTypes, 
  players, 
  rivalries, 
  setCurrentGame, 
  setCurrentView,
  setPlayers,
  setRivalries
}) => {
  const { socket } = useConnection()
  
  // Setup state
  const [selectedGameType, setSelectedGameType] = useState('')
  const [selectedRivalry, setSelectedRivalry] = useState('')
  const [customPlayers, setCustomPlayers] = useState(['', ''])
  const [customWinCondition, setCustomWinCondition] = useState('')
  const [useCustomCondition, setUseCustomCondition] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get favorited game types for randomizer
  const favoritedGameTypes = gameTypes.filter(gt => gt.is_favorited)

  const addPlayer = () => {
    setCustomPlayers([...customPlayers, ''])
  }

  const removePlayer = (index) => {
    if (customPlayers.length > 2) {
      setCustomPlayers(customPlayers.filter((_, i) => i !== index))
    }
  }

  const updatePlayerName = (index, name) => {
    const updated = [...customPlayers]
    updated[index] = name // allow empty string
    setCustomPlayers(updated)
  }

  const selectRivalry = (rivalryId) => {
    setSelectedRivalry(rivalryId)
    if (rivalryId) {
      const rivalry = rivalries.find(r => r.id === rivalryId)
      if (rivalry) {
        // Populate players from rivalry
        setCustomPlayers(rivalry.player_names || [])
      }
    } else {
      // Reset to empty players
      setCustomPlayers(['', ''])
    }
  }

  const selectRandomGameType = () => {
    if (favoritedGameTypes.length > 0) {
      const randomType = favoritedGameTypes[Math.floor(Math.random() * favoritedGameTypes.length)]
      setSelectedGameType(randomType.id)
      setCustomWinCondition('')
      setUseCustomCondition(false)
    }
  }

  const startGame = async () => {
    if (!selectedGameType) {
      setError('Please select a game type')
      return
    }

    // Require at least 2 non-empty player names
    if (customPlayers.filter(name => name && name.trim()).length < 2) {
      setError('At least 2 player names must be filled out')
      return
    }

    setLoading(true)
    setError('')

    try {
      const gameType = gameTypes.find(gt => gt.id === selectedGameType)
      // Only require 2+ non-empty names, let backend handle mapping/creation
      const enteredNames = customPlayers.filter(name => name && name.trim()).map(name => name.trim())
      if (enteredNames.length < 2) {
        setError('At least 2 player names must be filled out')
        setLoading(false)
        return
      }
      const gameData = {
        game_type_id: selectedGameType,
        player_names: enteredNames,
        win_condition_type: useCustomCondition ? 
          (customWinCondition ? 'custom' : gameType.win_condition_type) : 
          gameType.win_condition_type,
        win_condition_value: useCustomCondition && customWinCondition ? 
          parseInt(customWinCondition) : 
          gameType.win_condition_value
      }

      // Correct endpoint: /api/${sqid}/games
      const response = await fetch(`${__API_URL__}/api/${sqid}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to start game')
      }

      const result = await response.json()
      setCurrentGame(result.data)
      setCurrentView('playing')

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('game-started', { sqid, game: result.data })
      }

    } catch (err) {
      console.error('Failed to start game:', err)
      setError(err.message || 'Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  const selectedGameTypeData = gameTypes.find(gt => gt.id === selectedGameType)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Setup New Game</h2>
        <p className="text-sm opacity-75">Choose a game type and players to begin</p>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {/* Game Type Selection */}
      <div className="card bg-base-200 p-4">
        <h3 className="text-lg font-semibold mb-3">Game Type</h3>
        
        <div className="form-control mb-4">
          <select 
            className="game-type-select"
            value={selectedGameType}
            onChange={(e) => {
              setSelectedGameType(e.target.value)
              setCustomWinCondition('')
              setUseCustomCondition(false)
            }}
          >
            <option value="">Select a game type...</option>
            {gameTypes.map(gameType => (
              <option key={gameType.id} value={gameType.id}>
                {gameType.name} 
                {gameType.is_favorited ? ' ⭐' : ''}
                {' '}({gameType.win_condition_type === 'win' ? 'Win at' : 'Lose at'} {gameType.win_condition_value})
              </option>
            ))}
          </select>
        </div>

        {favoritedGameTypes.length > 0 && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={selectRandomGameType}
          >
            🎲 Random Favorite
          </button>
        )}

        {/* Custom Win Condition */}
        {selectedGameTypeData && (
          <div className="mt-4 p-3 bg-base-300 rounded-lg">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Use custom win condition</span>
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={useCustomCondition}
                  onChange={(e) => setUseCustomCondition(e.target.checked)}
                />
              </label>
            </div>
            
            {useCustomCondition && (
              <div className="form-control mt-2">
                <label className="label">
                  <span className="label-text">
                    {selectedGameTypeData.win_condition_type === 'win' ? 'Win at score:' : 'Lose at score:'}
                  </span>
                </label>
                <input 
                  type="number"
                  className="input input-bordered"
                  placeholder={selectedGameTypeData.win_condition_value.toString()}
                  value={customWinCondition}
                  onChange={(e) => setCustomWinCondition(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rivalry Selection */}
      <div className="card bg-base-200 p-4">
        <h3 className="text-lg font-semibold mb-3">Players</h3>
        
        {rivalries.length > 0 && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Select existing rivalry (optional)</span>
            </label>
            <select 
              className="select select-bordered"
              value={selectedRivalry}
              onChange={(e) => selectRivalry(e.target.value)}
            >
              <option value="">Custom players...</option>
              {rivalries.map(rivalry => (
                <option key={rivalry.id} value={rivalry.id}>
                  {rivalry.player_names.join(' vs ')}
                  {' '}({rivalry.total_games} games)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Players */}
        <div className="space-y-3">
          {customPlayers.map((playerName, index) => (
            <div key={index} className="flex gap-2">
              <input 
                type="text"
                className="input input-bordered flex-1"
                placeholder={`Player ${index + 1}`}
                value={playerName}
                onChange={(e) => updatePlayerName(index, e.target.value)}
              />
              {customPlayers.length > 2 && (
                <button 
                  className="btn btn-error btn-sm"
                  onClick={() => removePlayer(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          <button 
            className="btn btn-outline btn-sm w-full"
            onClick={addPlayer}
          >
            + Add Player
          </button>
        </div>
      </div>

      {/* Start Game Button */}
      <button 
        className="btn btn-primary btn-lg w-full"
        onClick={startGame}
        disabled={loading || !selectedGameType || customPlayers.filter(name => name && name.trim()).length < 2}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Starting Game...
          </>
        ) : (
          'Start Game'
        )}
      </button>
    </div>
  )
}

export default GameSetup
