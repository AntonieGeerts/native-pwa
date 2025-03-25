/**
 * Login Test Script
 * This script tests the login functionality with different API URLs
 */

// List of potential API URLs to test
const API_URLS = [
  'https://new-app.managedpmo.com/app/api',
  'https://app.managedpmo.com/api',
  'https://api.managedpmo.com',
  'https://managedpmo.com/api'
];

// Login endpoint
const LOGIN_ENDPOINT = '/auth/login-pwa';

// Test credentials (to be filled by the user)
let testUsername = '';
let testPassword = '';

// Function to test login with a specific URL
async function testLogin(baseUrl) {
  if (!testUsername || !testPassword) {
    console.log('Please enter test credentials first');
    return;
  }
  
  const url = `${baseUrl}${LOGIN_ENDPOINT}`;
  console.log(`Testing login at: ${url}`);
  
  try {
    // First, try with fetch API
    console.log('Using fetch API...');
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword
      })
    });
    
    console.log(`Status: ${fetchResponse.status}`);
    
    // Try to parse response as JSON
    try {
      const contentType = fetchResponse.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await fetchResponse.json();
        console.log('Response is valid JSON:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.pwa_token) {
          console.log('SUCCESS: Login successful, token received');
        } else {
          console.log('ERROR: No token in response');
        }
      } else {
        console.log('Response is not JSON');
        const text = await fetchResponse.text();
        console.log('Response text (first 100 chars):');
        console.log(text.substring(0, 100) + '...');
      }
    } catch (e) {
      console.log(`Error parsing response: ${e.message}`);
    }
    
    // Now try with XMLHttpRequest for comparison
    console.log('\nUsing XMLHttpRequest...');
    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log(`Status: ${xhr.status}`);
          console.log(`Content-Type: ${xhr.getResponseHeader('content-type')}`);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('Response is valid JSON:');
              console.log(JSON.stringify(data, null, 2));
              
              if (data.pwa_token) {
                console.log('SUCCESS: Login successful, token received');
              } else {
                console.log('ERROR: No token in response');
              }
            } catch (e) {
              console.log(`Error parsing response: ${e.message}`);
              console.log('Response text (first 100 chars):');
              console.log(xhr.responseText.substring(0, 100) + '...');
            }
          } else {
            console.log(`Error: ${xhr.statusText}`);
          }
          
          resolve();
        }
      };
      
      xhr.send(JSON.stringify({
        username: testUsername,
        password: testPassword
      }));
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('---');
}

// Run tests for all URLs
async function runLoginTests() {
  console.log('Starting login tests...');
  console.log('========================');
  
  for (const url of API_URLS) {
    await testLogin(url);
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
  const loginButton = document.getElementById('run-login-tests');
  
  if (usernameInput && passwordInput && loginButton) {
    loginButton.addEventListener('click', function() {
      setCredentials(usernameInput.value, passwordInput.value);
      runLoginTests();
    });
  }
});