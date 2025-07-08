#!/usr/bin/env node

// Test script to verify real-time updates across multiple clients
import { io } from 'socket.io-client';

console.log('Testing real-time updates across multiple clients...');

const API_URL = 'http://localhost:2424';
const SQID = 'test123';

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
    testRealTimeUpdates();
  }
});

client1.on('score_update', (data) => {
  console.log('📱 Client 1 received score update:', data);
  receivedUpdates++;
  checkComplete();
});

// Setup client 2
client2.on('connect', () => {
  console.log('📱 Client 2 connected:', client2.id);
  client2.emit('join-sqid', SQID);
  connectedClients++;
  
  if (connectedClients === 2) {
    testRealTimeUpdates();
  }
});

client2.on('score_update', (data) => {
  console.log('📱 Client 2 received score update:', data);
  receivedUpdates++;
  checkComplete();
});

async function testRealTimeUpdates() {
  console.log('🧪 Testing real-time updates...');
  
  try {
    // Create a test game and players to trigger score updates
    const randomName = `Test Player ${Date.now()}`;
    const playerResponse = await fetch(`${API_URL}/api/${SQID}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: randomName })
    });
    
    if (!playerResponse.ok) {
      throw new Error('Failed to create test player');
    }
    
    const player = await playerResponse.json();
    console.log('👤 Created test player:', player.data.name);
    
    // Get game types
    const gameTypesResponse = await fetch(`${API_URL}/api/game_types`);
    const gameTypes = await gameTypesResponse.json();
    
    if (!gameTypes.data || gameTypes.data.length === 0) {
      throw new Error('No game types available');
    }
    
    // Create a test game
    const gameResponse = await fetch(`${API_URL}/api/${SQID}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type_id: gameTypes.data[0].id,
        player_names: [`${randomName} 1`, `${randomName} 2`]
      })
    });
    
    if (!gameResponse.ok) {
      throw new Error('Failed to create test game');
    }
    
    const game = await gameResponse.json();
    console.log('🎮 Created test game:', game.data.id);
    console.log('🎮 Game has players:', game.data.players?.length || 0);
    
    if (!game.data.players || game.data.players.length === 0) {
      throw new Error('Game has no players');
    }
    
    // Wait a moment then simulate a score update
    setTimeout(async () => {
      console.log('📊 Simulating score update...');
      
      const statsResponse = await fetch(`${API_URL}/api/${SQID}/games/${game.data.id}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: [{ player_id: game.data.players[0].id, score: 5 }]
        })
      });
      
      if (!statsResponse.ok) {
        throw new Error('Failed to update score');
      }
      
      console.log('📊 Score update sent');
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

// Timeout after 30 seconds
setTimeout(() => {
  console.log('❌ Test timeout - real-time updates may not be working');
  client1.disconnect();
  client2.disconnect();
  process.exit(1);
}, 30000);
