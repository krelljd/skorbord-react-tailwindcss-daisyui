import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import socket from '../socket';
import ScoreBoard from '../components/ScoreBoard';

/**
 * CardsPage
 * Handles access to a scoreboard via a Sqid in the URL.
 * Redirects to home if no Sqid is present or invalid.
 */
export default function CardsPage() {
  const { sqid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);

  // Sample teams data for demonstration
  const [teams] = useState([
    {
      id: 1,
      name: '757 Elite 15 Teal',
      players: [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }]
    },
    {
      id: 2,
      name: 'Epic United 15 National',
      players: [{ id: 3, name: 'Player 3' }, { id: 4, name: 'Player 4' }]
    }
  ]);

  // Validate Sqid and fetch data
  useEffect(() => {
    if (!sqid || typeof sqid !== 'string' || sqid.length < 4) {
      setError('Invalid Sqid');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Validate Sqid
    fetch(`/api/sqids?value=${encodeURIComponent(sqid)}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          setError('Sqid not found');
          setLoading(false);
          return;
        }
        // Fetch related data
        Promise.all([
          fetch('/api/games').then(r => r.json()),
          fetch('/api/players').then(r => r.json())
        ]).then(([games, players]) => {
          setGames(games);
          setPlayers(players);
          setLoading(false);
        });
      })
      .catch(() => {
        setError('Error loading data');
        setLoading(false);
      });
  }, [sqid]);

  // Real-time updates
  useEffect(() => {
    function handleGamesUpdate(next) { setGames(next); }
    function handlePlayersUpdate(next) { setPlayers(next); }
    socket.on('games:update', handleGamesUpdate);
    socket.on('players:update', handlePlayersUpdate);
    return () => {
      socket.off('games:update', handleGamesUpdate);
      socket.off('players:update', handlePlayersUpdate);
    };
  }, []);

  const handleScoreChange = (setId, teamId, newScore) => {
    // Emit score change to server
    socket.emit('score:update', { setId, teamId, newScore, sqid });

    // You can also update local state or perform other actions here
    console.log(`Score updated - Set: ${setId}, Team: ${teamId}, Score: ${newScore}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="professional-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg">Loading scoreboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white py-6">
      {/* Header with back button */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.back()}
            className="modern-btn px-4 py-2 text-sm"
          >
            ← Back
          </button>
          <div className="text-center">
            <div className="text-sm opacity-75">Game ID</div>
            <div className="font-mono text-lg font-semibold">{sqid}</div>
          </div>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main ScoreBoard */}
      <ScoreBoard
        teams={teams}
        onScoreChange={handleScoreChange}
        gameTitle="Card Game Championship"
      />

      {/* Game Status */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="professional-card p-4 text-center">
          <div className="text-sm opacity-75">
            Game Status: <span className="text-green-400 font-semibold">Active</span> •
            Players: {players.length} •
            Total Games: {games.length}
          </div>
        </div>
      </div>
    </div>
  );
}
