import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConnectionContext from '../contexts/ConnectionContext';
import GameSetup from '../components/GameSetup';

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

// Helper to render with context
const renderWithContext = (component, contextValue = mockConnectionValue) => {
  return render(
    <ConnectionContext.Provider value={contextValue}>
      {component}
    </ConnectionContext.Provider>
  );
};

describe('GameSetup', () => {
  const mockOnGameCreated = vi.fn();

  beforeEach(() => {
    // Mock successful API responses
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        players: [
          { id: '1', name: 'Player 1', avatar_color: '#FF0000' },
          { id: '2', name: 'Player 2', avatar_color: '#00FF00' },
        ],
        gameTypes: [
          { id: 'hearts', name: 'Hearts', description: 'Classic Hearts', min_players: 4, max_players: 4 },
          { id: 'spades', name: 'Spades', description: 'Classic Spades', min_players: 4, max_players: 4 },
        ],
      }),
    });
  });

  it('renders game setup form', async () => {
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/create new game/i)).toBeInTheDocument();
    });
  });

  it('loads players and game types on mount', async () => {
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:2424/api/players');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:2424/api/game-types');
    });
  });

  it('allows selecting game type', async () => {
    const user = userEvent.setup();
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hearts/i)).toBeInTheDocument();
    });

    const heartsOption = screen.getByText(/hearts/i);
    await user.click(heartsOption);
    
    expect(heartsOption.closest('input')).toBeChecked();
  });

  it('shows player selection after game type selection', async () => {
    const user = userEvent.setup();
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hearts/i)).toBeInTheDocument();
    });

    const heartsOption = screen.getByText(/hearts/i);
    await user.click(heartsOption);
    
    await waitFor(() => {
      expect(screen.getByText(/select players/i)).toBeInTheDocument();
    });
  });

  it('validates minimum players requirement', async () => {
    const user = userEvent.setup();
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hearts/i)).toBeInTheDocument();
    });

    // Select Hearts (requires 4 players)
    await user.click(screen.getByText(/hearts/i));
    
    await waitFor(() => {
      expect(screen.getByText(/select players/i)).toBeInTheDocument();
    });

    // Try to create game without enough players
    const createButton = screen.getByText(/create game/i);
    await user.click(createButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/need exactly 4 players/i)).toBeInTheDocument();
    });
  });

  it('creates game when all requirements are met', async () => {
    const user = userEvent.setup();
    
    // Mock successful game creation
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/games')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'new-game-123',
            short_id: 'ABC123',
            status: 'active',
          }),
        });
      }
      // Default mock for other calls
      return Promise.resolve({
        ok: true,
        json: async () => ({
          players: [
            { id: '1', name: 'Player 1', avatar_color: '#FF0000' },
            { id: '2', name: 'Player 2', avatar_color: '#00FF00' },
            { id: '3', name: 'Player 3', avatar_color: '#0000FF' },
            { id: '4', name: 'Player 4', avatar_color: '#FFFF00' },
          ],
          gameTypes: [
            { id: 'hearts', name: 'Hearts', description: 'Classic Hearts', min_players: 4, max_players: 4 },
          ],
        }),
      });
    });

    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hearts/i)).toBeInTheDocument();
    });

    // Select Hearts
    await user.click(screen.getByText(/hearts/i));
    
    await waitFor(() => {
      expect(screen.getByText(/player 1/i)).toBeInTheDocument();
    });

    // Select all 4 players
    await user.click(screen.getByText(/player 1/i));
    await user.click(screen.getByText(/player 2/i));
    await user.click(screen.getByText(/player 3/i));
    await user.click(screen.getByText(/player 4/i));

    // Create game
    const createButton = screen.getByText(/create game/i);
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockOnGameCreated).toHaveBeenCalledWith('new-game-123');
    });
  });

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows disconnected state when not connected', () => {
    const disconnectedContext = {
      ...mockConnectionValue,
      isConnected: false,
      connectionError: 'Connection lost',
    };
    
    renderWithContext(<GameSetup onGameCreated={mockOnGameCreated} />, disconnectedContext);
    
    expect(screen.getByText(/connection required/i)).toBeInTheDocument();
  });
});
