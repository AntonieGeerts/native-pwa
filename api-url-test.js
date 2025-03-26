/**
 * API URL Test Script
 * This script tests different API URLs to find the correct one
 */

// List of potential API URLs to test
const API_URLS = [
  'https://new-app.managedpmo.com/app/api'
];

// Test endpoints
const TEST_ENDPOINTS = [
  '/auth/login-status-check',
  '/auth/login-pwa'
];

// Function to test a URL
async function testUrl(baseUrl) {
  console.log(`Testing URL: ${baseUrl}`);
  
  for (const endpoint of TEST_ENDPOINTS) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`  Testing endpoint: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`    Status: ${response.status}`);
      
      // Try to parse response as JSON
      try {
        const contentType = response.headers.get('content-type');
        console.log(`    Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          console.log('    Response is valid JSON');
        } else {
          console.log('    Response is not JSON');
        }
      } catch (e) {
        console.log(`    Error parsing response: ${e.message}`);
      }
    } catch (error) {
      console.log(`    Error: ${error.message}`);
    }
    
    console.log('  ---');
  }
  
  console.log('---');
}

// Run tests
async function runTests() {
  console.log('Starting API URL tests...');
  console.log('========================');
  
  for (const url of API_URLS) {
    await testUrl(url);
  }
  
  console.log('Tests completed');
}

// Run the tests when the page loads
document.addEventListener('DOMContentLoaded', runTests);