import React, { useState, useEffect } from 'react';

/**
 * Professional ScoreBoard component inspired by modern app design
 * Features multiple sets/rounds with team scoring
 */
export default function ScoreBoard({ teams = [], onScoreChange, gameTitle = "Card Game" }) {
  const [sets, setSets] = useState([
    { id: 1, name: 'Set 1', scores: {}, isActive: false },
    { id: 2, name: 'Set 2', scores: {}, isActive: true }
  ]);

  const [animatingScores, setAnimatingScores] = useState(new Set());

  // Initialize scores for teams
  useEffect(() => {
    setSets(currentSets =>
      currentSets.map(set => ({
        ...set,
        scores: teams.reduce((acc, team) => ({
          ...acc,
          [team.id]: set.scores[team.id] || 0
        }), {})
      }))
    );
  }, [teams]);

  const updateScore = (setId, teamId, newScore) => {
    // Add animation class
    setAnimatingScores(prev => new Set([...prev, `${setId}-${teamId}`]));

    setSets(currentSets =>
      currentSets.map(set =>
        set.id === setId
          ? {
              ...set,
              scores: { ...set.scores, [teamId]: Math.max(0, newScore) }
            }
          : set
      )
    );

    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${setId}-${teamId}`);
        return newSet;
      });
    }, 400);

    // Notify parent component
    if (onScoreChange) {
      onScoreChange(setId, teamId, newScore);
    }
  };

  const setActiveSet = (setId) => {
    setSets(currentSets =>
      currentSets.map(set => ({
        ...set,
        isActive: set.id === setId
      }))
    );
  };

  const addNewSet = () => {
    const newSetId = Math.max(...sets.map(s => s.id)) + 1;
    setSets(currentSets => [
      ...currentSets.map(set => ({ ...set, isActive: false })),
      {
        id: newSetId,
        name: `Set ${newSetId}`,
        scores: teams.reduce((acc, team) => ({ ...acc, [team.id]: 0 }), {}),
        isActive: true
      }
    ]);
  };

  const getTeamColor = (index) => {
    const colors = ['team-teal', 'team-orange', 'team-blue', 'team-purple'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{gameTitle}</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
      </div>

      {/* Sets/Rounds */}
      {sets.map((set, setIndex) => (
        <div
          key={set.id}
          className={`professional-card p-6 ${set.isActive ? 'active-set' : ''}`}
          style={{ animationDelay: `${setIndex * 0.1}s` }}
        >
          {/* Set Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">{set.name}</h2>
            {set.isActive && (
              <span className="px-3 py-1 bg-cyan-500 text-white text-sm font-medium rounded-full">
                Active
              </span>
            )}
            {!set.isActive && (
              <button
                onClick={() => setActiveSet(set.id)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-full transition-colors"
              >
                Set Active
              </button>
            )}
          </div>

          {/* Team Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team, teamIndex) => (
              <div
                key={team.id}
                className={`professional-card p-4 ${getTeamColor(teamIndex)}`}
                style={{ animationDelay: `${(setIndex * 0.1) + (teamIndex * 0.05)}s` }}
              >
                {/* Team Name */}
                <h3 className="text-lg font-semibold mb-4 text-center opacity-90">
                  {team.name}
                </h3>

                {/* Score Display and Controls */}
                <div className="flex items-center justify-between">
                  {/* Decrease Button */}
                  <button
                    onClick={() => updateScore(set.id, team.id, (set.scores[team.id] || 0) - 1)}
                    className="touch-control bg-black/20 hover:bg-black/30 border-2 border-white/30 text-white font-bold transition-all duration-200 hover:scale-110"
                    disabled={!set.isActive}
                  >
                    −
                  </button>

                  {/* Score Display */}
                  <div
                    className={`score-display text-center px-4 ${
                      animatingScores.has(`${set.id}-${team.id}`) ? 'score-animate' : ''
                    }`}
                  >
                    {set.scores[team.id] || 0}
                  </div>

                  {/* Increase Button */}
                  <button
                    onClick={() => updateScore(set.id, team.id, (set.scores[team.id] || 0) + 1)}
                    className="touch-control bg-black/20 hover:bg-black/30 border-2 border-white/30 text-white font-bold transition-all duration-200 hover:scale-110"
                    disabled={!set.isActive}
                  >
                    +
                  </button>
                </div>

                {/* Player Names */}
                {team.players && team.players.length > 0 && (
                  <div className="mt-3 text-center">
                    <div className="text-sm opacity-75">
                      {team.players.map(player => player.name).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Set Total (if multiple teams) */}
          {teams.length > 1 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-center text-white/80 text-sm">
                Total Points: {Object.values(set.scores).reduce((sum, score) => sum + (score || 0), 0)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Set Button */}
      <div className="text-center">
        <button
          onClick={addNewSet}
          className="modern-btn text-lg px-8 py-3"
        >
          + Add New Set
        </button>
      </div>

      {/* Game Summary */}
      <div className="professional-card p-6 mt-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">Game Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team, index) => {
            const totalScore = sets.reduce((total, set) => total + (set.scores[team.id] || 0), 0);
            return (
              <div
                key={team.id}
                className={`professional-card p-4 text-center ${getTeamColor(index)}`}
              >
                <div className="text-lg font-semibold opacity-90">{team.name}</div>
                <div className="text-2xl font-bold mt-2">{totalScore}</div>
                <div className="text-sm opacity-75 mt-1">Total Points</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
