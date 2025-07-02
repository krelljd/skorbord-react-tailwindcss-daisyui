import { io } from 'socket.io-client';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2525';

// Singleton Socket.IO connection
const socket = io(API_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

export default socket;
