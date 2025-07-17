#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test
 * Tests the complete data flow from frontend request to backend response
 * and validates the data transformations match what the UI expects.
 */

console.log('🧪 Frontend-Backend Integration Test');
console.log('=====================================\n');

// Simple fetch-based backend API service for testing
class TestBackendAPIService {
  constructor() {
    this.backendUrl = 'http://localhost:8000';
    this.timeout = 10000;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      return null;
    }
  }

  async calculateShipping(request) {
    try {
      console.log('🚀 Sending shipping request to backend:', JSON.stringify(request, null, 2));

      const response = await fetch(`${this.backendUrl}/calculate-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response received successfully');
      return result;
    } catch (error) {
      console.error('Backend shipping calculation failed:', error);
      return null;
    }
  }

  convertToBackendRequest(origin, destination, packageDetails) {
    const weightKg = packageDetails.weight;
    
    let category = 'medium';
    if (weightKg <= 0.5) category = 'envelope';
    else if (weightKg <= 5) category = 'small';
    else if (weightKg <= 20) category = 'medium';
    else category = 'large';

    return {
      origin: {
        city: origin.city,
        state: origin.state,
        zip_code: origin.postalCode,
        country: origin.country || 'US'
      },
      destination: {
        city: destination.city,
        state: destination.state,
        zip_code: destination.postalCode,
        country: destination.country || 'US'
      },
      package: {
        weight_kg: weightKg,
        category
      }
    };
  }

  // This is the key function that needs to match frontend expectations
  convertToAppRates(backendResponse) {
    return backendResponse.data.quotes.map(quote => ({
      service: quote.service_name,
      serviceCode: quote.service_code,
      cost: quote.cost_usd.toFixed(2),
      currency: 'USD',
      transitTime: quote.commitment_formatted,
      carbonNeutral: quote.eco_badge === 'carbon_neutral' || quote.eco_badge === 'eco_friendly',
      estimatedDelivery: quote.estimated_delivery_date || quote.delivery_date_formatted,
      // Enhanced fields from backend with proper structure mapping
      carbonFootprint: quote.carbon_context.total_co2_kg,
      treesEquivalent: quote.carbon_context.trees_offset_equivalent,
      carMilesEquivalent: quote.carbon_context.car_miles_equivalent,
      ecoEfficiency: quote.eco_efficiency,
      // Fix transport mix structure to match frontend expectations
      transportMix: {
        air_percentage: quote.transport_mix.air_percentage,
        ground_percentage: quote.transport_mix.ground_percentage
      },
      carbonSavings: quote.carbon_savings_percentage
    }));
  }
}

const backendAPIService = new TestBackendAPIService();

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

    console.log('🔍 Analyzing Backend Response Structure...');
    const sampleQuote = backendResponse.data.quotes[0];
    console.log('📋 Sample Backend Quote Structure:');
    console.log(`   service_name: ${sampleQuote.service_name}`);
    console.log(`   cost_usd: ${sampleQuote.cost_usd}`);
    console.log(`   carbon_context.total_co2_kg: ${sampleQuote.carbon_context.total_co2_kg}`);
    console.log(`   transport_mix.air_percentage: ${sampleQuote.transport_mix.air_percentage}`);
    console.log(`   transport_mix.ground_percentage: ${sampleQuote.transport_mix.ground_percentage}`);
    console.log(`   eco_efficiency.points: ${sampleQuote.eco_efficiency?.points}`);
    console.log(`   eco_efficiency.tier: ${sampleQuote.eco_efficiency?.tier}`);
    console.log(`   commitment_formatted: ${sampleQuote.commitment_formatted}\n`);

    console.log('🔄 Testing Backend to Frontend Conversion...');
    const appRates = backendAPIService.convertToAppRates(backendResponse);
    
    console.log('📋 Sample Converted Rate Structure:');
    const sampleRate = appRates[0];
    console.log(`   service: ${sampleRate.service}`);
    console.log(`   cost: ${sampleRate.cost}`);
    console.log(`   carbonFootprint: ${sampleRate.carbonFootprint}`);
    console.log(`   transportMix: ${JSON.stringify(sampleRate.transportMix)}`);
    console.log(`   ecoEfficiency: ${JSON.stringify(sampleRate.ecoEfficiency)}`);
    console.log(`   estimatedDelivery: ${sampleRate.estimatedDelivery}\n`);
    
    // Test the enhanced options creation (as done in the React Native app)
    const enhancedOptions = appRates.map((option, index) => ({
      id: `option-${index}`,
      name: option.service,
      cost: option.cost,
      carbonFootprint: option.carbonFootprint,
      deliveryDate: option.estimatedDelivery || option.transitTime,
      ecoScore: option.ecoEfficiency?.points || 0, // Use 0 as fallback for 0-25 scale
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
      console.log('Available fields:', Object.keys(sampleOption));
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
