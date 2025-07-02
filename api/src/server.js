// Main server entry for Skorbord API (Express + Socket.IO)
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const socketSetup = require('./socket');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Socket.IO setup with CORS and best practices
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 5000,
  maxPayload: 1000000,
  connectTimeout: 1000,
});

// Attach custom Socket.IO logic
socketSetup(io);

server.listen(PORT, () => {
  // Log for deployment on Raspberry Pi
  console.log(`Skorbord API listening on http://localhost:${PORT}`);
});
