/**
 * CapacitorHttp Test Script
 * This script tests the CapacitorHttp plugin with different API URLs
 */

// List of potential API URLs to test
const API_URLS = [
  'https://new-app.managedpmo.com/app/api'
];

// Test endpoints
const TEST_ENDPOINTS = [
  '/auth/login-status-check'
];

// Test credentials (to be filled by the user)
let testUsername = '';
let testPassword = '';

// Function to test CapacitorHttp GET request
async function testCapacitorHttpGet(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`Testing CapacitorHttp GET: ${url}`);
  
  try {
    // Check if Capacitor and CapacitorHttp plugin are available
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.CapacitorHttp) {
      console.log('ERROR: CapacitorHttp plugin not available');
      console.log('This test must be run on a native device or emulator');
      return;
    }
    
    // Make the request
    const result = await window.Capacitor.Plugins.CapacitorHttp.get({
      url: url,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Headers: ${JSON.stringify(result.headers)}`);
    
    // Check if response is JSON
    if (typeof result.data === 'object') {
      console.log('Response is valid JSON:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('Response is not JSON:');
      console.log(result.data.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('---');
}

// Function to test CapacitorHttp POST request for login
async function testCapacitorHttpLogin(baseUrl) {
  if (!testUsername || !testPassword) {
    console.log('Please enter test credentials first');
    return;
  }
  
  const url = `${baseUrl}/auth/login-pwa`;
  console.log(`Testing CapacitorHttp POST (Login): ${url}`);
  
  try {
    // Check if Capacitor and CapacitorHttp plugin are available
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.CapacitorHttp) {
      console.log('ERROR: CapacitorHttp plugin not available');
      console.log('This test must be run on a native device or emulator');
      return;
    }
    
    // Make the request
    const result = await window.Capacitor.Plugins.CapacitorHttp.post({
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        username: testUsername,
        password: testPassword
      }
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Headers: ${JSON.stringify(result.headers)}`);
    
    // Check if response is JSON
    if (typeof result.data === 'object') {
      console.log('Response is valid JSON:');
      console.log(JSON.stringify(result.data, null, 2));
      
      if (result.data.pwa_token) {
        console.log('SUCCESS: Login successful, token received');
      } else {
        console.log('ERROR: No token in response');
      }
    } else {
      console.log('Response is not JSON:');
      console.log(result.data.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('---');
}

// Run tests for all URLs
async function runCapacitorHttpTests() {
  console.log('Starting CapacitorHttp tests...');
  console.log('==============================');
  
  // First check if we're running in a native environment
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  console.log(`Running in native environment: ${isNative}`);
  
  if (!isNative) {
    console.log('WARNING: Not running in a native environment');
    console.log('CapacitorHttp tests may not work correctly');
    console.log('Please run these tests on a native device or emulator');
    console.log('---');
  }
  
  // Test GET requests
  for (const url of API_URLS) {
    for (const endpoint of TEST_ENDPOINTS) {
      await testCapacitorHttpGet(url, endpoint);
    }
  }
  
  // Test login POST requests
  for (const url of API_URLS) {
    await testCapacitorHttpLogin(url);
  }
  
  console.log('Tests completed');
}

// Set test credentials
function setCredentials(username, password) {
  testUsername = username;
  testPassword = password;
  console.log('Test credentials set');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check for credentials in form
  const usernameInput = document.getElementById('test-username');
  const passwordInput = document.getElementById('test-password');
  const testButton = document.getElementById('run-capacitor-tests');
  
  if (usernameInput && passwordInput && testButton) {
    testButton.addEventListener('click', function() {
      setCredentials(usernameInput.value, passwordInput.value);
      runCapacitorHttpTests();
    });
  }
});