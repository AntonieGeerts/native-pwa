/**
 * API Test Direct Script
 * This script tests direct API calls to diagnose login issues
 */

// Test function to make direct API calls
async function testDirectApiCalls() {
  console.log('Starting direct API test...');
  
  // Test URLs
  const urls = [
    'https://new-app.managedpmo.com/app/api/auth/login-status-check',
    'https://new-app.managedpmo.com/app/api/auth/login-pwa',
    'https://app.managedpmo.com/api/auth/login-status-check',
    'https://app.managedpmo.com/api/auth/login-pwa'
  ];
  
  // Test with both fetch and CapacitorHttp if available
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  console.log('Is native platform:', isNative);
  
  // Test with fetch
  console.log('Testing with fetch API...');
  for (const url of urls) {
    try {
      console.log(`Fetching ${url}...`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status for ${url}: ${response.status}`);
      
      // Try to parse response
      try {
        const data = await response.json();
        console.log(`Response data for ${url}:`, data);
      } catch (parseError) {
        console.error(`Error parsing JSON for ${url}:`, parseError);
        const text = await response.text();
        console.log(`Raw response for ${url} (first 100 chars):`, text.substring(0, 100));
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
    }
  }
  
  // Test with CapacitorHttp if available
  if (isNative && (window.Capacitor.Plugins.CapacitorHttp || window.CapacitorApp.plugins.CapacitorHttp)) {
    console.log('Testing with CapacitorHttp...');
    const httpPlugin = window.Capacitor.Plugins.CapacitorHttp || window.CapacitorApp.plugins.CapacitorHttp;
    
    for (const url of urls) {
      try {
        console.log(`CapacitorHttp GET ${url}...`);
        const result = await httpPlugin.get({
          url: url,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log(`CapacitorHttp status for ${url}: ${result.status}`);
        
        // Check response data
        if (typeof result.data === 'string') {
          console.log(`CapacitorHttp response is string, attempting to parse as JSON`);
          try {
            const jsonData = JSON.parse(result.data);
            console.log(`CapacitorHttp parsed data for ${url}:`, jsonData);
          } catch (parseError) {
            console.error(`CapacitorHttp error parsing JSON for ${url}:`, parseError);
            console.log(`CapacitorHttp raw response for ${url} (first 100 chars):`, result.data.substring(0, 100));
          }
        } else {
          console.log(`CapacitorHttp response data for ${url}:`, result.data);
        }
      } catch (error) {
        console.error(`CapacitorHttp error for ${url}:`, error);
      }
    }
  }
  
  console.log('Direct API test completed');
}

// Run the test when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, running API test...');
  testDirectApiCalls();
});

// Also run the test when Capacitor is ready
document.addEventListener('capacitorReady', () => {
  console.log('Capacitor ready, running API test...');
  testDirectApiCalls();
});