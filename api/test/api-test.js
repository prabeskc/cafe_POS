/**
 * Simple API test script to verify endpoints
 * Run with: node api/test/api-test.js
 */

const baseUrl = 'http://localhost:3001';

// Simple HTTP request function
function makeRequest(url, options = {}) {
  const https = require('http');
  const urlParts = new URL(url);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlParts.hostname,
      port: urlParts.port,
      path: urlParts.pathname + urlParts.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${baseUrl}/api/health`);
    console.log(`✅ Health Check: ${response.status} - ${JSON.stringify(response.data)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

async function testMenuEndpoints() {
  console.log('\n🔍 Testing Menu Endpoints...');
  
  // Test GET /api/menu
  try {
    const response = await makeRequest(`${baseUrl}/api/menu`);
    console.log(`📋 GET Menu: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
    if (response.data.error) {
      console.log(`   Error: ${response.data.error.message}`);
    }
  } catch (error) {
    console.log(`❌ GET Menu Failed: ${error.message}`);
  }
  
  // Test POST /api/menu
  try {
    const testItem = {
      name: 'Test Coffee',
      price: 4.50,
      category: 'coffee',
      imageUrl: 'https://example.com/test.jpg'
    };
    
    const response = await makeRequest(`${baseUrl}/api/menu`, {
      method: 'POST',
      body: testItem
    });
    
    console.log(`➕ POST Menu: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
    if (response.data.error) {
      console.log(`   Error: ${response.data.error.message}`);
    }
    
    return response.data.data?._id; // Return ID for further testing
  } catch (error) {
    console.log(`❌ POST Menu Failed: ${error.message}`);
  }
}

async function testOrderEndpoints() {
  console.log('\n🔍 Testing Order Endpoints...');
  
  // Test GET /api/orders
  try {
    const response = await makeRequest(`${baseUrl}/api/orders`);
    console.log(`📋 GET Orders: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
    if (response.data.error) {
      console.log(`   Error: ${response.data.error.message}`);
    }
  } catch (error) {
    console.log(`❌ GET Orders Failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log('=' .repeat(50));
  
  const healthOk = await testHealthEndpoint();
  
  if (!healthOk) {
    console.log('\n❌ Server is not responding. Make sure the server is running on port 3001.');
    return;
  }
  
  await testMenuEndpoints();
  await testOrderEndpoints();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ API Tests Completed!');
  console.log('\n📝 Note: Some endpoints may fail if MongoDB is not running.');
  console.log('   This is expected for development testing.');
}

// Run tests
runTests().catch(console.error);