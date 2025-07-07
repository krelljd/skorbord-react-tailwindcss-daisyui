import { useState } from 'react'

const AdminPanel = ({ 
  sqid, 
  gameTypes, 
  players, 
  setGameTypes, 
  setPlayers, 
  backToSetup 
}) => {
  const [activeTab, setActiveTab] = useState('game-types') // game-types, players
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Game Type Management
  const [newGameType, setNewGameType] = useState({
    name: '',
    win_condition_type: 'win',
    win_condition_value: 100
  })

  // Player Management
  const [newPlayerName, setNewPlayerName] = useState('')

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  // Game Type Functions
  const addGameType = async () => {
    if (!newGameType.name.trim()) {
      setError('Game type name is required')
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`${__API_URL__}/api/game_types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newGameType.name.trim(),
          win_condition_type: newGameType.win_condition_type,
          win_condition_value: parseInt(newGameType.win_condition_value)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add game type')
      }

      const result = await response.json()
      setGameTypes(prev => [...prev, result.data])
      setNewGameType({ name: '', win_condition_type: 'win', win_condition_value: 100 })
      setSuccess('Game type added successfully!')

    } catch (err) {
      console.error('Failed to add game type:', err)
      setError(err.message || 'Failed to add game type')
    } finally {
      setLoading(false)
    }
  }

  const toggleGameTypeFavorite = async (gameTypeId, currentStatus) => {
    setLoading(true)
    clearMessages()

    try {
      const method = currentStatus ? 'DELETE' : 'POST'
      const response = await fetch(`${__API_URL__}/api/${sqid}/game_types/${gameTypeId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update favorite status')
      }

      // After toggling, re-fetch game types to get correct is_favorited for this sqid
      const gameTypesRes = await fetch(`${__API_URL__}/api/game_types?sqid=${encodeURIComponent(sqid)}`)
      if (gameTypesRes.ok) {
        const gameTypesData = await gameTypesRes.json()
        setGameTypes(gameTypesData.data || [])
      }
      setSuccess(`Game type ${!currentStatus ? 'favorited' : 'unfavorited'}!`)

    } catch (err) {
      console.error('Failed to update favorite status:', err)
      setError(err.message || 'Failed to update favorite status')
    } finally {
      setLoading(false)
    }
  }

  const deleteGameType = async (gameTypeId) => {
    if (!confirm('Are you sure you want to delete this game type? This cannot be undone.')) {
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`${__API_URL__}/api/game_types/${gameTypeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete game type')
      }

      setGameTypes(prev => prev.filter(gt => gt.id !== gameTypeId))
      setSuccess('Game type deleted successfully!')

    } catch (err) {
      console.error('Failed to delete game type:', err)
      setError(err.message || 'Failed to delete game type')
    } finally {
      setLoading(false)
    }
  }

  // Player Functions
  const addPlayer = async () => {
    // Allow empty names, do not block
    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`${__API_URL__}/api/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPlayerName // allow empty string
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add player')
      }

      const result = await response.json()
      setPlayers(prev => [...prev, result.data])
      setNewPlayerName('')
      setSuccess('Player added successfully!')

    } catch (err) {
      console.error('Failed to add player:', err)
      setError(err.message || 'Failed to add player')
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerName = async (playerId, newName) => {
    if (!newName.trim()) {
      setError('Player name cannot be empty')
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`${__API_URL__}/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update player')
      }

      const result = await response.json()
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? result.data : p
      ))
      setSuccess('Player updated successfully!')

    } catch (err) {
      console.error('Failed to update player:', err)
      setError(err.message || 'Failed to update player')
    } finally {
      setLoading(false)
    }
  }

  const deletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player? This cannot be undone.')) {
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`${__API_URL__}/api/players/${playerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete player')
      }

      setPlayers(prev => prev.filter(p => p.id !== playerId))
      setSuccess('Player deleted successfully!')

    } catch (err) {
      console.error('Failed to delete player:', err)
      setError(err.message || 'Failed to delete player')
    } finally {
      setLoading(false)
    }
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
        <h2 className="text-xl font-bold">Admin</h2>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="success-state">
          <p>{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button 
          className={`tab ${activeTab === 'game-types' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('game-types')}
        >
          Game Types
        </button>
        <button 
          className={`tab ${activeTab === 'players' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          Players
        </button>
      </div>

      {/* Game Types Tab */}
      {activeTab === 'game-types' && (
        <div className="space-y-6">
          {/* Add New Game Type */}
          <div className="card bg-base-200 p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Game Type</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Game Type Name</span>
                </label>
                <input 
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g. Hearts, Spades, Rummy"
                  value={newGameType.name}
                  onChange={(e) => setNewGameType(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Win Condition</span>
                </label>
                <div className="flex gap-2">
                  <select 
                    className="select select-bordered flex-1"
                    value={newGameType.win_condition_type}
                    onChange={(e) => setNewGameType(prev => ({ ...prev, win_condition_type: e.target.value }))}
                  >
                    <option value="win">Win at score</option>
                    <option value="lose">Lose at score</option>
                  </select>
                  <input 
                    type="number"
                    className="input input-bordered w-8"
                    placeholder="100"
                    value={newGameType.win_condition_value}
                    onChange={(e) => setNewGameType(prev => ({ ...prev, win_condition_value: e.target.value }))}
                  />
                </div>
              </div>

              <button 
                className="btn btn-primary w-full"
                onClick={addGameType}
                disabled={loading || !newGameType.name.trim()}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Adding...
                  </>
                ) : (
                  'Add Game Type'
                )}
              </button>
            </div>
          </div>

          {/* Existing Game Types */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Existing Game Types</h3>
            
            {gameTypes.length === 0 ? (
              <p className="text-center opacity-75 py-4">No game types yet</p>
            ) : (
              gameTypes.map(gameType => (
                <div key={gameType.id} className="card bg-base-200 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        {gameType.name}
                        {gameType.is_favorited && <span>⭐</span>}
                      </h4>
                      <p className="text-sm opacity-75">
                        {gameType.win_condition_type === 'win' ? 'Win at' : 'Lose at'} {gameType.win_condition_value}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        className={`btn btn-sm transition-all duration-200 ${gameType.is_favorited ? 'btn-warning ring-2 ring-warning ring-offset-2 font-bold scale-110' : 'btn-outline'}`}
                        onClick={() => toggleGameTypeFavorite(gameType.id, gameType.is_favorited)}
                        disabled={loading}
                        title={gameType.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={gameType.is_favorited}
                      >
                        {gameType.is_favorited ? '★' : '☆'}
                      </button>
                      
                      <button 
                        className="btn btn-error btn-sm"
                        onClick={() => deleteGameType(gameType.id)}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* Add New Player */}
          <div className="card bg-base-200 p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Player</h3>
            
            <div className="flex gap-2">
              <input 
                type="text"
                className="input input-bordered flex-1"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <button 
                className="btn btn-primary"
                onClick={addPlayer}
                // Disable if loading or if after adding, there would be fewer than 2 non-empty names
                disabled={loading || (players.filter(p => p.name && p.name.trim()).length + (newPlayerName && newPlayerName.trim() ? 1 : 0) < 2)}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Add'
                )}
              </button>
            </div>
            <p className="text-xs opacity-60 mt-2">At least two player names must be filled out to enable adding.</p>
          </div>

          {/* Existing Players */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Existing Players</h3>
            
            {players.length === 0 ? (
              <p className="text-center opacity-75 py-4">No players yet</p>
            ) : (
              players.map(player => (
                <div key={player.id} className="card bg-base-200 p-4">
                  <div className="flex justify-between items-center">
                    <input 
                      type="text"
                      className="input input-ghost flex-1 font-semibold"
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      // Allow empty names, no validation or defaulting
                      disabled={loading}
                    />
                    <button 
                      className="btn btn-error btn-sm ml-2"
                      onClick={() => deletePlayer(player.id)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
