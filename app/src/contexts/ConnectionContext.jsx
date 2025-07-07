import { createContext, useContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'

const ConnectionContext = createContext()

export const useConnection = () => {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}


export const ConnectionProvider = ({ children, sqid }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    if (!sqid) return
    // Initialize socket connection with sqid in auth
    const newSocket = io(__API_URL__, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      retries: 3,
      ackTimeout: 10000,
      forceNew: true,
      auth: { sqid }
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      setConnectionError(null)
      setIsReconnecting(false)
    })

    newSocket.on('disconnect', (reason, details) => {
      console.log('Socket disconnected:', reason, details)
      setIsConnected(false)
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        newSocket.connect()
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnectionError(error.message || 'Connection failed')
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsReconnecting(false)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnect attempt:', attemptNumber)
      setIsReconnecting(true)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnect error:', error)
      setConnectionError('Reconnection failed')
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnect failed')
      setConnectionError('Unable to reconnect')
      setIsReconnecting(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [sqid])

  const value = {
    socket,
    isConnected,
    connectionError,
    isReconnecting
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}
