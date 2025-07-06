import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConnectionContext from '../contexts/ConnectionContext';
import ConnectionStatus from '../components/ConnectionStatus';

const renderWithContext = (contextValue) => {
  return render(
    <ConnectionContext.Provider value={contextValue}>
      <ConnectionStatus />
    </ConnectionContext.Provider>
  );
};

describe('ConnectionStatus', () => {
  it('shows connected status when connected', () => {
    const contextValue = {
      socket: { connected: true },
      isConnected: true,
      connectionError: null,
    };
    
    renderWithContext(contextValue);
    
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toHaveClass('text-success');
  });

  it('shows disconnected status when not connected', () => {
    const contextValue = {
      socket: { connected: false },
      isConnected: false,
      connectionError: null,
    };
    
    renderWithContext(contextValue);
    
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    expect(screen.getByText(/disconnected/i)).toHaveClass('text-error');
  });

  it('shows error message when there is a connection error', () => {
    const contextValue = {
      socket: { connected: false },
      isConnected: false,
      connectionError: 'Network timeout',
    };
    
    renderWithContext(contextValue);
    
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/disconnected/i)).toHaveClass('text-error');
  });

  it('shows connecting status during connection attempts', () => {
    const contextValue = {
      socket: { connected: false },
      isConnected: false,
      connectionError: null,
      isConnecting: true,
    };
    
    renderWithContext(contextValue);
    
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByText(/connecting/i)).toHaveClass('text-warning');
  });

  it('renders with correct CSS classes', () => {
    const contextValue = {
      socket: { connected: true },
      isConnected: true,
      connectionError: null,
    };
    
    renderWithContext(contextValue);
    
    const statusElement = screen.getByText(/connected/i).closest('div');
    expect(statusElement).toHaveClass('connection-status');
    expect(statusElement).toHaveClass('text-xs');
  });

  it('updates when connection state changes', () => {
    const contextValue = {
      socket: { connected: true },
      isConnected: true,
      connectionError: null,
    };
    
    const { rerender } = renderWithContext(contextValue);
    
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    
    // Simulate connection loss
    const newContextValue = {
      socket: { connected: false },
      isConnected: false,
      connectionError: 'Connection lost',
    };
    
    rerender(
      <ConnectionContext.Provider value={newContextValue}>
        <ConnectionStatus />
      </ConnectionContext.Provider>
    );
    
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
  });
});
