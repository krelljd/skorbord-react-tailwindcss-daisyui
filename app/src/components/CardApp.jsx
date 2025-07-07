import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useConnection } from '../contexts/ConnectionContext.jsx'
import GameSetup from './GameSetup.jsx'
import GamePlay from './GamePlay.jsx'
import RivalryStats from './RivalryStats.jsx'
import AdminPanel from './AdminPanel.jsx'

const CardApp = () => {
  const { sqid } = useParams()
  const { socket, isConnected } = useConnection()
  
  // App state
  const [currentView, setCurrentView] = useState('setup') // setup, playing, rivalry-stats, admin
  const [currentGame, setCurrentGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [gameTypes, setGameTypes] = useState([])
  const [rivalries, setRivalries] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize data when socket connects
  useEffect(() => {
    if (socket && isConnected && sqid) {
      setLoading(true)
      setError(null)

      // Join the sqid room
      socket.emit('join-sqid', sqid)
      
      // Load initial data
      loadInitialData()

      // Socket event listeners for real-time updates
      socket.on('game-updated', handleGameUpdate)
      socket.on('player-updated', handlePlayerUpdate)
      socket.on('rivalry-updated', handleRivalryUpdate)
      socket.on('error', handleSocketError)

      return () => {
        socket.off('game-updated', handleGameUpdate)
        socket.off('player-updated', handlePlayerUpdate)
        socket.off('rivalry-updated', handleRivalryUpdate)
        socket.off('error', handleSocketError)
        socket.emit('leave-sqid', sqid)
      }
    }
  }, [socket, isConnected, sqid])

  const loadInitialData = async () => {
    try {
      // Always fetch global game types, but include sqid for favorited status
      const [gameTypesRes, playersRes, rivalriesRes] = await Promise.all([
        fetch(`${__API_URL__}/api/game_types?sqid=${encodeURIComponent(sqid)}`),
        fetch(`${__API_URL__}/api/${sqid}/players`),
        fetch(`${__API_URL__}/api/${sqid}/rivalries`)
      ])

      if (!gameTypesRes.ok || !playersRes.ok || !rivalriesRes.ok) {
        throw new Error('Failed to load initial data')
      }

      const [gameTypesData, playersData, rivalriesData] = await Promise.all([
        gameTypesRes.json(),
        playersRes.json(),
        rivalriesRes.json()
      ])

      // gameTypes is always global, but is_favorited is per sqid
      setGameTypes(gameTypesData.data || [])
      setPlayers(playersData.data || [])
      setRivalries(rivalriesData.data || [])

      // Check if there's an active game
      const activeGameRes = await fetch(`${__API_URL__}/api/${sqid}/games/active`)
      if (activeGameRes.ok) {
        const activeGameData = await activeGameRes.json()
        if (activeGameData.data) {
          setCurrentGame(activeGameData.data)
          setCurrentView('playing')
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Socket event handlers
  const handleGameUpdate = (gameData) => {
    setCurrentGame(gameData)
    if (gameData.status === 'active') {
      setCurrentView('playing')
    } else if (gameData.status === 'completed') {
      // Game finished, show rivalry stats
      setCurrentView('rivalry-stats')
      // Reload rivalries to get updated stats
      loadRivalries()
    }
  }

  const handlePlayerUpdate = (playerData) => {
    setPlayers(prev => {
      const index = prev.findIndex(p => p.id === playerData.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = playerData
        return updated
      } else {
        return [...prev, playerData]
      }
    })
  }

  const handleRivalryUpdate = (rivalryData) => {
    setRivalries(prev => {
      const index = prev.findIndex(r => r.id === rivalryData.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = rivalryData
        return updated
      } else {
        return [...prev, rivalryData]
      }
    })
  }

  const handleSocketError = (error) => {
    console.error('Socket error:', error)
    setError(error.message || 'A connection error occurred')
  }

  const loadRivalries = async () => {
    try {
    const response = await fetch(`${__API_URL__}/api/${sqid}/rivalries`)
      if (response.ok) {
        const data = await response.json()
        setRivalries(data.data || [])
      }
    } catch (err) {
      console.error('Failed to reload rivalries:', err)
    }
  }

  // Navigation functions
  const startNewGame = () => {
    setCurrentGame(null)
    setCurrentView('setup')
  }

  const viewRivalryStats = () => {
    setCurrentView('rivalry-stats')
  }

  const openAdminPanel = () => {
    setCurrentView('admin')
  }

  const backToSetup = () => {
    setCurrentView('setup')
    setCurrentGame(null)
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex justify-center items-center min-h-screen">
          <div className="loading-state"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-container">
        <div className="error-state">
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-center">{error}</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container slide-in-bottom">
      {/* Header with navigation */}
      <div className="navbar bg-base-300 rounded-lg mb-4">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><a onClick={startNewGame}>New Game</a></li>
              <li><a onClick={viewRivalryStats}>Rivalry Stats</a></li>
              <li><a onClick={openAdminPanel}>Admin</a></li>
            </ul>
          </div>
        </div>
        <div className="navbar-center">
          <h1 className="text-xl font-bold">Skorbord</h1>
        </div>
        <div className="navbar-end">
          <div className="badge badge-outline badge-sm">
            {sqid}
          </div>
        </div>
      </div>

      {/* Main content based on current view */}
      {currentView === 'setup' && (
        <GameSetup
          sqid={sqid}
          gameTypes={gameTypes}
          players={players}
          rivalries={rivalries}
          setCurrentGame={setCurrentGame}
          setCurrentView={setCurrentView}
          setPlayers={setPlayers}
          setRivalries={setRivalries}
        />
      )}
      
      {currentView === 'playing' && currentGame && (
        <GamePlay
          sqid={sqid}
          game={currentGame}
          setCurrentGame={setCurrentGame}
          setCurrentView={setCurrentView}
          onGameComplete={() => setCurrentView('rivalry-stats')}
          backToSetup={backToSetup}
        />
      )}
      
      {currentView === 'rivalry-stats' && (
        <RivalryStats
          sqid={sqid}
          rivalries={rivalries}
          backToSetup={backToSetup}
        />
      )}
      
      {currentView === 'admin' && (
        <AdminPanel
          sqid={sqid}
          gameTypes={gameTypes}
          players={players}
          setGameTypes={setGameTypes}
          setPlayers={setPlayers}
          backToSetup={backToSetup}
        />
      )}
    </div>
  )
}

export default CardApp
