#!/usr/bin/env node

// Test script to verify direct WebSocket connection to API server
import { io } from 'socket.io-client';

console.log('Testing direct WebSocket connection to API server...');

// Test direct connection to API server
const socket = io('http://localhost:2525', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  auth: { sqid: 'demo' }
});

socket.on('connect', () => {
  console.log('✅ Direct WebSocket connection successful!');
  console.log('Socket ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Direct WebSocket connection failed:', error.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('❌ Direct connection timeout');
  socket.disconnect();
  process.exit(1);
}, 15000);
