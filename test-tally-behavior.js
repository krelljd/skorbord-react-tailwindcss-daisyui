#!/usr/bin/env node

// Test script to verify tally behavior is correct (no doubling)
import { io } from 'socket.io-client';

console.log('Testing tally behavior...');

const API_URL = 'http://localhost:2424';
const SQID = 'test123';
const GAME_ID = '8abefa5c-9063-46e7-97d1-50fecb5a43aa';

// Create client to simulate the initiating user
const initiator = io(API_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000
});

// Create client to simulate a listening user
const listener = io(API_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000
});

let connectedClients = 0;
let initiatorEvents = [];
let listenerEvents = [];

// Setup initiator
initiator.on('connect', () => {
  console.log('🎯 Initiator connected:', initiator.id);
  initiator.emit('join-sqid', SQID);
  connectedClients++;
  
  if (connectedClients === 2) {
    runTallyTest();
  }
});

initiator.on('score_update', (data) => {
  initiatorEvents.push({
    type: 'score_update',
    player_id: data.player_id,
    score_change: data.score_change,
    timestamp: Date.now()
  });
  console.log('🎯 Initiator received score update:', data.score_change, 'for player:', data.player_id);
  
  if (initiatorEvents.length >= 1 && listenerEvents.length >= 1) {
    analyzeTallyBehavior();
  }
});

// Setup listener
listener.on('connect', () => {
  console.log('👂 Listener connected:', listener.id);
  listener.emit('join-sqid', SQID);
  connectedClients++;
  
  if (connectedClients === 2) {
    runTallyTest();
  }
});

listener.on('score_update', (data) => {
  listenerEvents.push({
    type: 'score_update',
    player_id: data.player_id,
    score_change: data.score_change,
    timestamp: Date.now()
  });
  console.log('👂 Listener received score update:', data.score_change, 'for player:', data.player_id);
  
  if (initiatorEvents.length >= 1 && listenerEvents.length >= 1) {
    analyzeTallyBehavior();
  }
});

async function runTallyTest() {
  console.log('🧪 Testing tally behavior...');
  
  try {
    // Get the game details to find players
    const gameResponse = await fetch(`${API_URL}/api/${SQID}/games/${GAME_ID}`);
    const game = await gameResponse.json();
    
    if (!game.data.players || game.data.players.length === 0) {
      throw new Error('Game has no players');
    }
    
    console.log('🎮 Game has', game.data.players.length, 'players');
    
    // Wait a moment then simulate a score update from the initiator's perspective
    setTimeout(async () => {
      console.log('📊 Initiator sending score update...');
      
      const playerId = game.data.players[0].id;
      const scoreChange = 5; // Fixed score for consistent testing
      
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
    initiator.disconnect();
    listener.disconnect();
    process.exit(1);
  }
}

function analyzeTallyBehavior() {
  console.log('\n📊 Analyzing tally behavior...');
  console.log('Initiator events:', initiatorEvents.length);
  console.log('Listener events:', listenerEvents.length);
  
  if (initiatorEvents.length === 1 && listenerEvents.length === 1) {
    const initiatorEvent = initiatorEvents[0];
    const listenerEvent = listenerEvents[0];
    
    console.log('\n✅ Expected behavior:');
    console.log('- Both clients should receive exactly 1 score_update event');
    console.log('- Both should show the same score_change value');
    console.log('- Tally should appear the same on both clients (no doubling)');
    
    console.log('\n📋 Results:');
    console.log('- Initiator score_change:', initiatorEvent.score_change);
    console.log('- Listener score_change:', listenerEvent.score_change);
    
    if (initiatorEvent.score_change === listenerEvent.score_change) {
      console.log('✅ SUCCESS: Both clients received the same score_change value');
      console.log('✅ The tally doubling issue should be fixed!');
    } else {
      console.log('❌ FAILURE: Clients received different score_change values');
    }
    
    initiator.disconnect();
    listener.disconnect();
    process.exit(0);
  }
}

// Error handlers
initiator.on('connect_error', (error) => {
  console.error('❌ Initiator connection error:', error.message);
  process.exit(1);
});

listener.on('connect_error', (error) => {
  console.error('❌ Listener connection error:', error.message);
  process.exit(1);
});

// Timeout after 20 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  console.log('Initiator events received:', initiatorEvents.length);
  console.log('Listener events received:', listenerEvents.length);
  initiator.disconnect();
  listener.disconnect();
  process.exit(1);
}, 20000);
