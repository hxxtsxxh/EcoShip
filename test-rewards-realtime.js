const { UserService } = require('./services/userService.js');

async function testRealtimeRewardsUpdate() {
  console.log('=== Testing Real-time Rewards Update ===\n');
  
  try {
    const userId = 'demo-user';
    
    // Clear demo user data first for clean test
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('demo_user_data');
    }
    
    console.log('1. Getting initial user data...');
    let userData = await UserService.getUserData(userId);
    console.log(`Initial reward points: ${userData.rewardPoints}`);
    console.log(`Initial shipments: ${userData.numberOfShipments}\n`);
    
    // Add a shipment that will generate reward points
    console.log('2. Adding a shipment...');
    const shipmentData = {
      trackingNumber: 'TEST123',
      selectedOption: {
        service: 'UPS 3-Day Select',
        price: 45.99,
        estimatedDelivery: '2024-01-15',
        carbonEmissions: 2.1,
        ecoEfficiencyScore: 85
      },
      origin: 'New York, NY',
      destination: 'Los Angeles, CA'
    };
    
    const result = await UserService.addShipment(userId, shipmentData);
    console.log(`Updated reward points: ${result.userData.rewardPoints}`);
    console.log(`Updated shipments: ${result.userData.numberOfShipments}`);
    console.log(`Points added: ${result.pointsEarned}\n`);
    
    // Verify the data persists
    console.log('3. Verifying data persistence...');
    userData = await UserService.getUserData(userId);
    console.log(`Verified reward points: ${userData.rewardPoints}`);
    console.log(`Verified shipments: ${userData.numberOfShipments}\n`);
    
    // Test reward eligibility
    console.log('4. Testing reward eligibility...');
    const rewards = await UserService.getRewards();
    const eligibleRewards = rewards.filter(reward => reward.minimumPoints <= userData.rewardPoints);
    const nextReward = rewards.find(reward => reward.minimumPoints > userData.rewardPoints);
    
    console.log(`Eligible rewards: ${eligibleRewards.length}`);
    if (eligibleRewards.length > 0) {
      console.log('Available rewards:');
      eligibleRewards.forEach(reward => {
        console.log(`  - ${reward.prize} (${reward.minimumPoints} points)`);
      });
    }
    
    if (nextReward) {
      console.log(`\nNext reward: ${nextReward.prize} (${nextReward.minimumPoints} points)`);
      const progress = (userData.rewardPoints / nextReward.minimumPoints) * 100;
      console.log(`Progress: ${progress.toFixed(1)}%`);
    }
    
    console.log('\n✅ Real-time rewards update test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: function(key) {
      return this[key] || null;
    },
    setItem: function(key, value) {
      this[key] = value;
    },
    removeItem: function(key) {
      delete this[key];
    }
  };
}

testRealtimeRewardsUpdate();
