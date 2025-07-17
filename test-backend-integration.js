#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * 
 * This script tests the integration between the React Native app
 * and the FastAPI backend to ensure everything is working correctly.
 */

const https = require('http');
const util = require('util');

// Backend configuration
const BACKEND_URL = 'http://localhost:8000';
const TIMEOUT = 10000; // 10 seconds

// Test data
const TEST_SHIPPING_REQUEST = {
  origin: {
    city: "New York",
    state: "NY", 
    zip_code: "10001",
    country: "US"
  },
  destination: {
    city: "Los Angeles",
    state: "CA",
    zip_code: "90210", 
    country: "US"
  },
  package: {
    weight_kg: 5.0,
    category: "medium",
    length_cm: 30,
    width_cm: 25,
    height_cm: 20
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', colors.yellow);
  
  try {
    const response = await makeRequest('/health');
    
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      log('✅ Backend is healthy!', colors.green);
      log(`   - Available routes: ${response.data.available_routes}`, colors.cyan);
      log(`   - Available services: ${response.data.available_services}`, colors.cyan);
      log(`   - Eco-efficiency enabled: ${response.data.eco_efficiency_enabled}`, colors.cyan);
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.statusCode}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Backend health check error: ${error.message}`, colors.red);
    return false;
  }
}

async function testShippingCalculation() {
  log('\n📦 Testing Shipping Calculation...', colors.yellow);
  
  try {
    const response = await makeRequest('/calculate-shipping', 'POST', TEST_SHIPPING_REQUEST);
    
    if (response.statusCode === 200 && response.data.success) {
      const quotes = response.data.data.quotes;
      log(`✅ Shipping calculation successful!`, colors.green);
      log(`   - Generated ${quotes.length} quotes`, colors.cyan);
      
      // Test first quote details
      if (quotes.length > 0) {
        const firstQuote = quotes[0];
        log(`   - Sample quote: ${firstQuote.service_name}`, colors.cyan);
        log(`   - Cost: $${firstQuote.cost_usd}`, colors.cyan);
        log(`   - Carbon footprint: ${firstQuote.carbon_context.total_co2_kg} kg CO₂`, colors.cyan);
        log(`   - Eco-efficiency: ${firstQuote.eco_efficiency.points} points (${firstQuote.eco_efficiency.tier})`, colors.cyan);
      }
      
      return true;
    } else {
      log(`❌ Shipping calculation failed: ${response.statusCode}`, colors.red);
      if (response.data.detail) {
        log(`   Error: ${response.data.detail}`, colors.red);
      }
      return false;
    }
  } catch (error) {
    log(`❌ Shipping calculation error: ${error.message}`, colors.red);
    return false;
  }
}

async function testRoutesEndpoint() {
  log('\n🗺️  Testing Routes Endpoint...', colors.yellow);
  
  try {
    const response = await makeRequest('/routes');
    
    if (response.statusCode === 200 && response.data.success) {
      const routes = response.data.data.routes;
      log(`✅ Routes endpoint successful!`, colors.green);
      log(`   - Available routes: ${routes.length}`, colors.cyan);
      
      if (routes.length > 0) {
        const sampleRoute = routes[0];
        log(`   - Sample route: ${sampleRoute.origin.city} → ${sampleRoute.destination.city}`, colors.cyan);
        log(`   - Distance: ${sampleRoute.distances.air_km} km (air)`, colors.cyan);
      }
      
      return true;
    } else {
      log(`❌ Routes endpoint failed: ${response.statusCode}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Routes endpoint error: ${error.message}`, colors.red);
    return false;
  }
}

async function testServicesEndpoint() {
  log('\n🚚 Testing Services Endpoint...', colors.yellow);
  
  try {
    const response = await makeRequest('/services');
    
    if (response.statusCode === 200 && response.data.success) {
      const services = response.data.data.services;
      log(`✅ Services endpoint successful!`, colors.green);
      log(`   - Available services: ${services.length}`, colors.cyan);
      
      if (services.length > 0) {
        const sampleService = services[0];
        log(`   - Sample service: ${sampleService.service_name}`, colors.cyan);
        log(`   - Eco-efficiency range: ${sampleService.eco_efficiency_range.typical_range} points`, colors.cyan);
      }
      
      return true;
    } else {
      log(`❌ Services endpoint failed: ${response.statusCode}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Services endpoint error: ${error.message}`, colors.red);
    return false;
  }
}

async function runIntegrationTests() {
  log('🧪 UPS EcoShip - Backend Integration Test Suite', colors.magenta);
  log('=' * 60, colors.magenta);
  log(`Backend URL: ${BACKEND_URL}`, colors.blue);
  
  const tests = [
    { name: 'Backend Health', test: testBackendHealth },
    { name: 'Shipping Calculation', test: testShippingCalculation },
    { name: 'Routes Endpoint', test: testRoutesEndpoint },
    { name: 'Services Endpoint', test: testServicesEndpoint }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ ${name} test crashed: ${error.message}`, colors.red);
      failed++;
    }
  }
  
  log('\n📊 Test Results Summary', colors.magenta);
  log('=' * 30, colors.magenta);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, colors.blue);
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Backend integration is working perfectly.', colors.green);
    log('The React Native app should now be able to connect to the backend.', colors.cyan);
  } else {
    log('\n⚠️  Some tests failed. Please check the backend server and try again.', colors.yellow);
    log('Make sure the backend is running on http://localhost:8000', colors.cyan);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, colors.red);
  process.exit(1);
});

// Run the tests
runIntegrationTests();
