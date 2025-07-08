#!/usr/bin/env node

// Simple test script to verify real-time score updates
import { io } from 'socket.io-client';

console.log('Testing real-time score updates...');

const API_URL = 'http://localhost:2424';
const SQID = 'test123';
const GAME_ID = '8abefa5c-9063-46e7-97d1-50fecb5a43aa';

// Create two clients to simulate multiple browser instances
const client1 = io(API_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000
});

const client2 = io(API_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000
});

let connectedClients = 0;
let receivedUpdates = 0;

function checkComplete() {
  if (receivedUpdates >= 2) {
    console.log('✅ Real-time updates working! Both clients received the update.');
    client1.disconnect();
    client2.disconnect();
    process.exit(0);
  }
}

// Setup client 1
client1.on('connect', () => {
  console.log('📱 Client 1 connected:', client1.id);
  client1.emit('join-sqid', SQID);
  connectedClients++;
  
  if (connectedClients === 2) {
    testScoreUpdate();
  }
});

client1.on('score_update', (data) => {
  console.log('📱 Client 1 received score update:', data.type, 'for game:', data.game_id);
  receivedUpdates++;
  checkComplete();
});

// Setup client 2
client2.on('connect', () => {
  console.log('📱 Client 2 connected:', client2.id);
  client2.emit('join-sqid', SQID);
  connectedClients++;
  
  if (connectedClients === 2) {
    testScoreUpdate();
  }
});

client2.on('score_update', (data) => {
  console.log('📱 Client 2 received score update:', data.type, 'for game:', data.game_id);
  receivedUpdates++;
  checkComplete();
});

async function testScoreUpdate() {
  console.log('🧪 Testing score update...');
  
  try {
    // Get the game details to find players
    const gameResponse = await fetch(`${API_URL}/api/${SQID}/games/${GAME_ID}`);
    const game = await gameResponse.json();
    
    if (!game.data.players || game.data.players.length === 0) {
      throw new Error('Game has no players');
    }
    
    console.log('🎮 Game has', game.data.players.length, 'players');
    
    // Wait a moment then simulate a score update
    setTimeout(async () => {
      console.log('📊 Sending score update...');
      
      const playerId = game.data.players[0].id;
      const scoreChange = Math.floor(Math.random() * 10) + 1; // Random score 1-10
      
      const statsResponse = await fetch(`${API_URL}/api/${SQID}/games/${GAME_ID}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: [{ player_id: playerId, score: scoreChange }]
        })
      });
      
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(`Failed to update score: ${errorData.error}`);
      }
      
      console.log('📊 Score update sent (+' + scoreChange + ' for player ' + playerId + ')');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    client1.disconnect();
    client2.disconnect();
    process.exit(1);
  }
}

// Error handlers
client1.on('connect_error', (error) => {
  console.error('❌ Client 1 connection error:', error.message);
  process.exit(1);
});

client2.on('connect_error', (error) => {
  console.error('❌ Client 2 connection error:', error.message);
  process.exit(1);
});

// Timeout after 20 seconds
setTimeout(() => {
  console.log('❌ Test timeout - real-time updates may not be working');
  console.log('Received updates:', receivedUpdates);
  client1.disconnect();
  client2.disconnect();
  process.exit(1);
}, 20000);
