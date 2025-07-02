import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeamManager from './components/TeamManager';
import CardsPage from './pages/CardsPage';
import GameTypeSelector from './components/GameTypeSelector';
import socket from './socket';
import Modal from './components/Modal';
import RivalryStatsModal from './components/RivalryStatsModal';
import LoadingModal from './components/LoadingModal';
import ConfirmationModal from './components/ConfirmationModal';
import { useMultipleModals } from './hooks/useModal';
import './App.css';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App Logo/Header */}
        <div className="professional-card p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Skorbord
          </h1>
          <p className="opacity-80 leading-relaxed">
            Professional card game scoring with real-time sync and beautiful analytics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <button className="modern-btn w-full text-lg py-4 group">
            <span className="group-hover:scale-110 transition-transform inline-block">🎮</span>
            Start New Game
          </button>

          <button className="modern-btn w-full text-lg py-4 group">
            <span className="group-hover:scale-110 transition-transform inline-block">🔗</span>
            Join Game
          </button>

          <button className="modern-btn w-full text-lg py-4 group">
            <span className="group-hover:scale-110 transition-transform inline-block">📊</span>
            View Statistics
          </button>
        </div>

        {/* Features */}
        <div className="professional-card p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Features</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
              Real-time multiplayer scoring
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              Multiple game formats
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
              Beautiful analytics & history
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
              Touch-optimized interface
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Modal management with custom hook
  const { modalStates, openModal, closeModal, setLoading } = useMultipleModals([
    'admin',
    'rivalryStats',
    'loading',
    'confirmation'
  ]);

  // Replace local state with real-time sync
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' },
    { id: 4, name: 'Player 4' },
  ]);
  const [teams, setTeams] = useState([
    { id: 1, name: 'Team 1', players: [ { id: 1, name: 'Player 1' } ] },
    { id: 2, name: 'Team 2', players: [ { id: 2, name: 'Player 2' } ] },
  ]);
  const [gameTypes] = useState([
    { id: 1, name: 'Hearts', description: 'Classic trick-taking game' },
    { id: 2, name: 'Spades' },
    { id: 3, name: 'Euchre' },
  ]);
  const [favoriteGameTypes, setFavoriteGameTypes] = useState([]);
  const [selectedGameType, setSelectedGameType] = useState(null);

  const sampleRivalryStats = {
    team1_name: 'Team 1',
    team2_name: 'Team 2',
    avg_margin: 7.2,
    last_10: 'WWWLLLWLWL',
    min_win: 2,
    max_win: 15,
  };

  // Real-time listeners
  useEffect(() => {
    socket.on('teams:update', setTeams);
    socket.on('players:update', setPlayers);
    return () => {
      socket.off('teams:update', setTeams);
      socket.off('players:update', setPlayers);
    };
  }, []);

  // Emit changes
  const emitTeams = (nextTeams) => {
    setTeams(nextTeams);
    socket.emit('teams:update', nextTeams);
  };
  const emitPlayers = (nextPlayers) => {
    setPlayers(nextPlayers);
    socket.emit('players:update', nextPlayers);
  };

  // Handlers (currently unused but may be needed for future features)
  // eslint-disable-next-line no-unused-vars
  const handleAddTeam = () => {
    const nextId = teams.length ? Math.max(...teams.map(t => t.id)) + 1 : 1;
    emitTeams([...teams, { id: nextId, name: `Team ${nextId}`, players: [] }]);
  };
  // eslint-disable-next-line no-unused-vars
  const handleRemoveTeam = (teamId) => {
    emitTeams(teams.filter(t => t.id !== teamId));
  };
  // eslint-disable-next-line no-unused-vars
  const handleAddPlayerToTeam = (teamId, playerId) => {
    emitTeams(teams.map(team =>
      team.id === teamId
        ? { ...team, players: [...team.players, players.find(p => p.id === playerId)] }
        : team
    ));
  };
  // eslint-disable-next-line no-unused-vars
  const handleRemovePlayerFromTeam = (teamId, playerId) => {
    emitTeams(teams.map(team =>
      team.id === teamId
        ? { ...team, players: team.players.filter(p => p.id !== playerId) }
        : team
    ));
  };
  // eslint-disable-next-line no-unused-vars
  const handleEditTeamName = (teamId, newName) => {
    emitTeams(teams.map(team =>
      team.id === teamId ? { ...team, name: newName } : team
    ));
  };
  // eslint-disable-next-line no-unused-vars
  const handleEditPlayerName = (playerId, newName) => {
    emitPlayers(players.map(p =>
      p.id === playerId ? { ...p, name: newName } : p
    ));
    emitTeams(teams.map(team => ({
      ...team,
      players: team.players.map(p =>
        p.id === playerId ? { ...p, name: newName } : p
      )
    })));
  };
  const handleToggleFavorite = (gameTypeId) => {
    setFavoriteGameTypes(favorites =>
      favorites.includes(gameTypeId)
        ? favorites.filter(id => id !== gameTypeId)
        : [...favorites, gameTypeId]
    );
  };

  // Demo functions for modal interactions
  const handleExportData = async () => {
    setLoading('admin', true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading('admin', false);
    closeModal('admin');
    // Show success message or handle export
  };

  const handleResetTournament = () => {
    closeModal('admin');
    openModal('confirmation');
  };

  const confirmResetTournament = async () => {
    setLoading('confirmation', true);
    // Simulate reset operation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading('confirmation', false);
    closeModal('confirmation');
    // Reset tournament data
    console.log('Tournament reset confirmed');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
              {/* App Header */}
              <div className="professional-card p-8 mb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">S</span>
                </div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Skorbord
                </h1>
                <p className="opacity-80 leading-relaxed">
                  Professional card game scoring with real-time sync.
                </p>
              </div>

              {/* Game Type Selector */}
              <div className="professional-card p-6 mb-4">
                <GameTypeSelector
                  gameTypes={gameTypes}
                  value={selectedGameType}
                  onChange={setSelectedGameType}
                  favorites={favoriteGameTypes}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  className="modern-btn w-full py-4 text-lg font-semibold"
                  onClick={() => {
                    const favs = gameTypes.filter(gt => favoriteGameTypes.includes(gt.id));
                    if (favs.length > 0) {
                      const random = favs[Math.floor(Math.random() * favs.length)];
                      setSelectedGameType(random.id);
                    }
                  }}
                  disabled={favoriteGameTypes.length === 0}
                >
                  🎲 Random Favorite Game
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="modern-btn py-3 text-sm font-medium"
                    onClick={() => openModal('admin')}
                  >
                    Admin
                  </button>
                  <button
                    className="modern-btn py-3 text-sm font-medium"
                    onClick={() => openModal('rivalryStats')}
                  >
                    Stats
                  </button>
                </div>
              </div>

              {/* Quick Start Demo */}
              <div className="professional-card p-4 mt-6 text-center">
                <p className="text-sm opacity-75 mb-3">Quick Demo</p>
                <button
                  className="modern-btn px-6 py-2 text-sm"
                  onClick={() => window.location.href = '/cards/demo123'}
                >
                  View Sample Scoreboard
                </button>
              </div>
            </div>

            <Modal open={modalStates.admin?.isOpen} onClose={() => closeModal('admin')} title="⚙️ Admin Dashboard">
              <div className="space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Administrative functions and game management tools for organizing tournaments and managing player data.
                </p>

                {/* Admin Actions Grid */}
                <div className="space-y-3">
                  <button className="modern-btn w-full py-3 text-left flex items-center">
                    <span className="mr-3">👥</span>
                    <div>
                      <div className="font-semibold">Manage Players</div>
                      <div className="text-xs opacity-75">Add, edit, or remove players</div>
                    </div>
                  </button>

                  <button className="modern-btn w-full py-3 text-left flex items-center">
                    <span className="mr-3">🎮</span>
                    <div>
                      <div className="font-semibold">Game Settings</div>
                      <div className="text-xs opacity-75">Configure scoring rules and formats</div>
                    </div>
                  </button>

                  <button
                    className="modern-btn w-full py-3 text-left flex items-center"
                    onClick={handleExportData}
                    disabled={modalStates.admin?.isLoading}
                  >
                    <span className="mr-3">📊</span>
                    <div>
                      <div className="font-semibold">
                        {modalStates.admin?.isLoading ? 'Exporting...' : 'Export Data'}
                      </div>
                      <div className="text-xs opacity-75">Download game history and statistics</div>
                    </div>
                    {modalStates.admin?.isLoading && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    )}
                  </button>

                  <button
                    className="modern-btn w-full py-3 text-left flex items-center bg-red-600 hover:bg-red-700"
                    onClick={handleResetTournament}
                  >
                    <span className="mr-3">🔄</span>
                    <div>
                      <div className="font-semibold">Reset Tournament</div>
                      <div className="text-xs opacity-75">Clear all scores and start fresh</div>
                    </div>
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 p-4 rounded-lg mt-6">
                  <div className="text-sm font-semibold text-gray-300 mb-2">Quick Stats</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-cyan-400 font-bold">{players.length}</div>
                      <div className="text-gray-400">Active Players</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-bold">{teams.length}</div>
                      <div className="text-gray-400">Teams</div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>

            <RivalryStatsModal
              open={modalStates.rivalryStats?.isOpen}
              onClose={() => closeModal('rivalryStats')}
              stats={sampleRivalryStats}
            />

            <ConfirmationModal
              open={modalStates.confirmation?.isOpen}
              onClose={() => closeModal('confirmation')}
              onConfirm={confirmResetTournament}
              title="Reset Tournament"
              message="Are you sure you want to reset the tournament? This will permanently delete all scores and game history. This action cannot be undone."
              confirmText="Reset Tournament"
              variant="danger"
              isLoading={modalStates.confirmation?.isLoading}
            />
          </div>
        } />
        <Route path="/cards/:sqid" element={<CardsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
