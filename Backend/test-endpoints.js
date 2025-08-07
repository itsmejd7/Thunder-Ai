// Test script for backend endpoints
// Run with: node test-endpoints.js

const BASE_URL = 'https://thunder-ai-backend.onrender.com';

async function testEndpoints() {
  console.log('Testing backend endpoints...\n');

  // Test 1: Health check
  try {
    const response = await fetch(`${BASE_URL}/`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Test endpoint
  try {
    const response = await fetch(`${BASE_URL}/test`);
    const data = await response.json();
    console.log('✅ Test endpoint:', data);
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }

  // Test 3: API endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    const data = await response.json();
    console.log('✅ API endpoint:', data);
  } catch (error) {
    console.log('❌ API endpoint failed:', error.message);
  }
}

testEndpoints(); 