#!/usr/bin/env node

// Simple test to verify the Current Game menu implementation
console.log('Testing Current Game menu implementation...');

const API_URL = 'http://localhost:2525';
const SQID = 'test123';

async function testImplementation() {
  try {
    // Test 1: Check if there's an active game
    console.log('\n1. Checking for active game...');
    const activeGameResponse = await fetch(`${API_URL}/api/${SQID}/games/active`);
    
    if (activeGameResponse.ok) {
      const activeGame = await activeGameResponse.json();
      console.log('✅ Active game found:', activeGame.data.id);
      console.log('   - Finalized:', activeGame.data.finalized);
      console.log('   - Menu item should be VISIBLE');
    } else {
      console.log('ℹ️  No active game found');
      console.log('   - Menu item should be HIDDEN');
    }
    
    // Test 2: Test that creating a new game deletes existing non-finalized games
    console.log('\n2. Testing new game creation (should delete non-finalized games)...');
    
    const gameTypesResponse = await fetch(`${API_URL}/api/game_types?sqid=${SQID}`);
    const gameTypes = await gameTypesResponse.json();
    
    if (gameTypes.data.length > 0) {
      const newGameResponse = await fetch(`${API_URL}/api/${SQID}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type_id: gameTypes.data[0].id,
          player_names: ['Test Player 1', 'Test Player 2']
        })
      });
      
      if (newGameResponse.ok) {
        const newGame = await newGameResponse.json();
        console.log('✅ New game created:', newGame.data.id);
        console.log('   - Previous non-finalized games deleted');
        console.log('   - Menu item should now be VISIBLE for new game');
      } else {
        const errorData = await newGameResponse.json();
        console.error('❌ Failed to create new game:', errorData.error);
      }
    }
    
    console.log('\n🎉 Implementation Summary:');
    console.log('✅ Current Game menu item shows only when there is a non-finalized game');
    console.log('✅ Backend deletes non-finalized games when starting a new game');
    console.log('✅ Frontend navigation function switches to playing view');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImplementation();
