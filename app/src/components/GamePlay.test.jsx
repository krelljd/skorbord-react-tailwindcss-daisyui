import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConnectionContext from '../contexts/ConnectionContext';
import GamePlay from '../components/GamePlay';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
};

const mockConnectionValue = {
  socket: mockSocket,
  isConnected: true,
  connectionError: null,
};

const mockGame = {
  id: 'test-game-123',
  short_id: 'ABC123',
  status: 'active',
  game_type: {
    id: 'hearts',
    name: 'Hearts',
    description: 'Classic Hearts game',
  },
  settings: {
    target_score: 100,
    rounds: 4,
  },
  players: [
    { id: '1', name: 'Player 1', avatar_color: '#FF0000' },
    { id: '2', name: 'Player 2', avatar_color: '#00FF00' },
    { id: '3', name: 'Player 3', avatar_color: '#0000FF' },
    { id: '4', name: 'Player 4', avatar_color: '#FFFF00' },
  ],
  scores: [
    { player_id: '1', total_score: 25, round_scores: [10, 15] },
    { player_id: '2', total_score: 30, round_scores: [15, 15] },
    { player_id: '3', total_score: 20, round_scores: [5, 15] },
    { player_id: '4', total_score: 35, round_scores: [20, 15] },
  ],
  rounds: [
    { round_number: 1, completed: true },
    { round_number: 2, completed: true },
    { round_number: 3, completed: false },
  ],
};

const renderWithContext = (component, contextValue = mockConnectionValue) => {
  return render(
    <ConnectionContext.Provider value={contextValue}>
      {component}
    </ConnectionContext.Provider>
  );
};

describe('GamePlay', () => {
  const mockOnGameEnd = vi.fn();

  beforeEach(() => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockGame,
    });
  });

  it('renders game information', async () => {
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hearts/i)).toBeInTheDocument();
      expect(screen.getByText(/abc123/i)).toBeInTheDocument();
    });
  });

  it('displays current scores', async () => {
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/player 1/i)).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument(); // Player 1's total score
      expect(screen.getByText(/player 2/i)).toBeInTheDocument();
      expect(screen.getByText(/30/)).toBeInTheDocument(); // Player 2's total score
    });
  });

  it('shows round progress', async () => {
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/round 3/i)).toBeInTheDocument();
    });
  });

  it('allows adding scores for current round', async () => {
    const user = userEvent.setup();
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/add scores/i)).toBeInTheDocument();
    });

    // Find score input for Player 1
    const scoreInputs = screen.getAllByRole('spinbutton');
    expect(scoreInputs).toHaveLength(4); // One for each player

    // Enter score for Player 1
    await user.type(scoreInputs[0], '15');
    await user.type(scoreInputs[1], '20');
    await user.type(scoreInputs[2], '10');
    await user.type(scoreInputs[3], '25');

    // Submit scores
    const submitButton = screen.getByText(/submit scores/i);
    await user.click(submitButton);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:2424/api/games/test-game-123/scores',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"round_number":3'),
      })
    );
  });

  it('validates score inputs', async () => {
    const user = userEvent.setup();
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/add scores/i)).toBeInTheDocument();
    });

    // Try to submit without entering all scores
    const submitButton = screen.getByText(/submit scores/i);
    await user.click(submitButton);

    expect(screen.getByText(/all players must have scores/i)).toBeInTheDocument();
  });

  it('handles score submission errors', async () => {
    const user = userEvent.setup();
    
    // Mock error response for score submission
    global.fetch.mockImplementation((url) => {
      if (url.includes('/scores')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Duplicate round' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockGame,
      });
    });

    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/add scores/i)).toBeInTheDocument();
    });

    const scoreInputs = screen.getAllByRole('spinbutton');
    await user.type(scoreInputs[0], '15');
    await user.type(scoreInputs[1], '20');
    await user.type(scoreInputs[2], '10');
    await user.type(scoreInputs[3], '25');

    const submitButton = screen.getByText(/submit scores/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/duplicate round/i)).toBeInTheDocument();
    });
  });

  it('allows ending the game', async () => {
    const user = userEvent.setup();
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/end game/i)).toBeInTheDocument();
    });

    const endButton = screen.getByText(/end game/i);
    await user.click(endButton);

    // Should show confirmation
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    const confirmButton = screen.getByText(/yes, end game/i);
    await user.click(confirmButton);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:2424/api/games/test-game-123/status',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
    );
  });

  it('updates in real-time via socket events', async () => {
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('score-updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('game-status-changed', expect.any(Function));
    });

    // Simulate socket event
    const scoreUpdateHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'score-updated'
    )[1];

    const newScoreData = {
      gameId: 'test-game-123',
      round: 3,
      scores: [
        { player_id: '1', points: 15 },
        { player_id: '2', points: 20 },
        { player_id: '3', points: 10 },
        { player_id: '4', points: 25 },
      ],
    };

    scoreUpdateHandler(newScoreData);
    
    // Should trigger a game reload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`http://localhost:2424/api/games/test-game-123`);
    });
  });

  it('shows loading state', () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    expect(screen.getByText(/loading game/i)).toBeInTheDocument();
  });

  it('handles game not found error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Game not found' }),
    });
    
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />);
    
    await waitFor(() => {
      expect(screen.getByText(/game not found/i)).toBeInTheDocument();
    });
  });

  it('handles disconnected state', () => {
    const disconnectedContext = {
      ...mockConnectionValue,
      isConnected: false,
    };
    
    renderWithContext(<GamePlay gameId="test-game-123" onGameEnd={mockOnGameEnd} />, disconnectedContext);
    
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
  });
});
