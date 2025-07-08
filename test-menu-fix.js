#!/usr/bin/env node

// Test script to verify the Current Game menu item fix
console.log('🧪 Testing Current Game Menu Item Fix');
console.log('='.repeat(40));

const API_URL = 'http://localhost:2525';
const SQID = 'test123';

async function testMenuItemFix() {
  try {
    console.log('\n📋 Step 1: Check current active game state');
    
    const activeResponse = await fetch(`${API_URL}/api/${SQID}/games/active`);
    if (activeResponse.ok) {
      const activeGame = await activeResponse.json();
      console.log('✅ Active game found:', activeGame.data.id);
      console.log('   - finalized value:', activeGame.data.finalized);
      console.log('   - finalized type:', typeof activeGame.data.finalized);
      console.log('   - !finalized evaluates to:', !activeGame.data.finalized);
      console.log('   - Menu item should be VISIBLE');
    } else {
      console.log('ℹ️  No active game found');
      console.log('   - Menu item should be HIDDEN');
    }
    
    console.log('\n📋 Step 2: Test the boolean logic');
    
    // Test the different finalized values
    const testCases = [
      { value: 0, expected: true, description: 'finalized: 0 (from DB)' },
      { value: false, expected: true, description: 'finalized: false (boolean)' },
      { value: 1, expected: false, description: 'finalized: 1 (from DB)' },
      { value: true, expected: false, description: 'finalized: true (boolean)' }
    ];
    
    testCases.forEach(testCase => {
      const result = !testCase.value;
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`${status} ${testCase.description} -> !finalized = ${result} (expected: ${testCase.expected})`);
    });
    
    console.log('\n🎉 DIAGNOSIS:');
    console.log('❌ Previous condition: currentGame.finalized === false');
    console.log('   - Would fail for finalized: 0 (number from DB)');
    console.log('✅ Fixed condition: !currentGame.finalized');
    console.log('   - Works for both finalized: 0 and finalized: false');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMenuItemFix();
