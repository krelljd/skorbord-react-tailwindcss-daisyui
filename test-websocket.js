#!/usr/bin/env node

// Test script to verify WebSocket connection
import { io } from 'socket.io-client';

console.log('Testing WebSocket connection...');

// Test connection to frontend dev server (proxied)
const socket = io('http://localhost:2424', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  auth: { sqid: 'demo' }
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('Socket ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('❌ Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 15000);
