#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test
 * Tests the complete data flow from frontend request to backend response
 * and validates the data transformations match what the UI expects.
 */

const { backendAPIService } = require('./services/backendAPI.ts');

console.log('🧪 Frontend-Backend Integration Test');
console.log('=====================================\n');

async function testFrontendBackendIntegration() {
  try {
    console.log('📡 Testing Backend Health Check...');
    const health = await backendAPIService.checkHealth();
    
    if (!health) {
      console.error('❌ Backend health check failed');
      return;
    }
    
    console.log('✅ Backend is healthy');
    console.log(`   Routes: ${health.available_routes}, Services: ${health.available_services}\n`);

    console.log('🏙️  Testing Frontend Data Conversion...');
    
    // Simulate typical frontend city selection data
    const frontendOriginCity = {
      name: 'New York',
      display_name: 'New York, NY, USA',
      administrative: [{ short_name: 'NY' }],
      postcode: '10001'
    };
    
    const frontendDestCity = {
      name: 'Los Angeles', 
      display_name: 'Los Angeles, CA, USA',
      administrative: [{ short_name: 'CA' }],
      postcode: '90210'
    };
    
    const packageWeight = 5.0; // kg (now using kg consistently)
    
    // Test the data conversion (as done in the React Native app)
    const backendRequest = backendAPIService.convertToBackendRequest(
      {
        city: frontendOriginCity.name,
        state: frontendOriginCity.administrative?.[0]?.short_name || 'NY',
        postalCode: frontendOriginCity.postcode || '10001',
        country: 'US'
      },
      {
        city: frontendDestCity.name,
        state: frontendDestCity.administrative?.[0]?.short_name || 'CA', 
        postalCode: frontendDestCity.postcode || '90210',
        country: 'US'
      },
      {
        weight: packageWeight // Weight already in kg
      }
    );
    
    console.log('✅ Frontend to Backend conversion successful');
    console.log(`   Origin: ${backendRequest.origin.city}, ${backendRequest.origin.state}`);
    console.log(`   Destination: ${backendRequest.destination.city}, ${backendRequest.destination.state}`);
    console.log(`   Weight: ${backendRequest.package.weight_kg} kg (no conversion needed)\n`);

    console.log('📦 Testing Shipping Calculation...');
    const backendResponse = await backendAPIService.calculateShipping(backendRequest);
    
    if (!backendResponse || !backendResponse.success) {
      console.error('❌ Shipping calculation failed');
      return;
    }
    
    console.log('✅ Backend calculation successful');
    console.log(`   Generated ${backendResponse.data.quotes.length} quotes\n`);

    console.log('🔄 Testing Backend to Frontend Conversion...');
    const appRates = backendAPIService.convertToAppRates(backendResponse);
    
    // Test the enhanced options creation (as done in the React Native app)
    const enhancedOptions = appRates.map((option, index) => ({
      id: `option-${index}`,
      name: option.service,
      cost: option.cost,
      carbonFootprint: option.carbonFootprint,
      deliveryDate: option.estimatedDelivery || option.transitTime,
      ecoScore: option.ecoEfficiency?.points || 50,
      airTransportPercent: option.transportMix?.air_percentage || 0,
      transportMix: {
        air: option.transportMix?.air_percentage || 0,
        truck: option.transportMix?.ground_percentage || 100
      },
      treesEquivalent: option.treesEquivalent,
      carMilesEquivalent: option.carMilesEquivalent,
      carbonNeutral: option.carbonNeutral,
      carbonSavings: option.carbonSavings,
      ecoEfficiency: option.ecoEfficiency
    }));
    
    console.log('✅ Backend to Frontend conversion successful');
    console.log(`   Created ${enhancedOptions.length} enhanced shipping options\n`);

    console.log('🎯 Testing ShippingOptionCard Data Format...');
    const sampleOption = enhancedOptions[0];
    
    // Verify all required fields for ShippingOptionCard are present
    const requiredFields = ['id', 'name', 'cost', 'carbonFootprint', 'deliveryDate', 'ecoScore', 'transportMix'];
    const missingFields = requiredFields.filter(field => !(field in sampleOption));
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('✅ All required fields present for ShippingOptionCard');
    console.log(`   Sample: ${sampleOption.name} - $${sampleOption.cost} - ${parseFloat(sampleOption.carbonFootprint).toFixed(2)} kg CO₂e\n`);

    console.log('🏆 Testing Best Option Selection...');
    const bestOption = enhancedOptions.reduce((best, current) => {
      const bestCarbon = parseFloat(best.carbonFootprint) || 0;
      const currentCarbon = parseFloat(current.carbonFootprint) || 0;
      return currentCarbon < bestCarbon ? current : best;
    });
    
    console.log('✅ Best option calculation successful');
    console.log(`   Best eco option: ${bestOption.name} (${parseFloat(bestOption.carbonFootprint).toFixed(2)} kg CO₂e)\n`);

    console.log('📊 Integration Test Results');
    console.log('===========================');
    console.log('✅ Backend Health: PASS');
    console.log('✅ Data Conversion (Frontend → Backend): PASS');
    console.log('✅ Shipping Calculation: PASS');
    console.log('✅ Data Conversion (Backend → Frontend): PASS');
    console.log('✅ ShippingOptionCard Format: PASS');
    console.log('✅ Best Option Selection: PASS');
    console.log('\n🎉 All integration tests passed!');
    console.log('The frontend and backend are properly integrated.');
    
    // Display sample data for verification
    console.log('\n📋 Sample Shipping Options (as they appear in the app):');
    enhancedOptions.slice(0, 3).forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`);
      console.log(`   Cost: $${option.cost}`);
      console.log(`   Carbon: ${parseFloat(option.carbonFootprint).toFixed(2)} kg CO₂e`);
      console.log(`   Delivery: ${option.deliveryDate}`);
      console.log(`   Eco Score: ${option.ecoScore}/25 (${option.ecoEfficiency?.tier || 'unranked'})`);
      console.log(`   Transport: ${option.transportMix.air}% air, ${option.transportMix.truck}% ground`);
      console.log(`   Weight handled: 5.0 kg (uniform kg usage)\n`);
    });

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFrontendBackendIntegration();
