import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionProvider } from '../contexts/ConnectionContext';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('ConnectionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  it('provides initial connection state', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    const { result } = renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    expect(result.current).toMatchObject({
      socket: expect.any(Object),
      isConnected: false,
      connectionError: null,
    });
  });

  it('updates connection state when socket connects', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    const { result } = renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    // Simulate socket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionError).toBe(null);
  });

  it('updates connection state when socket disconnects', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    const { result } = renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    // First connect
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);

    // Then disconnect
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('handles connection errors', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    const { result } = renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    // Simulate connection error
    const errorMessage = 'Network timeout';
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error(errorMessage));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBe(errorMessage);
  });

  it('cleans up socket listeners on unmount', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    const { unmount } = renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error');
  });

  it('attempts reconnection on connection loss', () => {
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    // Simulate disconnect
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler();
    });

    // Should attempt to reconnect after a delay
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('uses correct socket configuration', () => {
    const { io } = require('socket.io-client');
    
    const wrapper = ({ children }) => <ConnectionProvider>{children}</ConnectionProvider>;
    renderHook(() => {
      const context = React.useContext(ConnectionContext);
      return context;
    }, { wrapper });

    expect(io).toHaveBeenCalledWith('http://localhost:2424', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  });
});
