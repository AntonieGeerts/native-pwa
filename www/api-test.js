/**
 * API Test Script
 * This script tests the API endpoints using Node.js
 * 
 * Usage:
 * node api-test.js --token=your_token --endpoint=/ticket/ticket-category
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Default values
const token = args.token || '';
const endpoint = args.endpoint || '';
const baseUrl = args.url || 'http://localhost/app/api';

// Check if endpoint is provided
if (!endpoint) {
  console.error('Error: No endpoint provided');
  console.log('Usage: node api-test.js --token=your_token --endpoint=/ticket/ticket-category');
  process.exit(1);
}

// Make API request
console.log(`Making API request to: ${baseUrl}${endpoint}`);
console.log(`Using token: ${token ? token.substring(0, 10) + '...' : 'None'}`);

// Parse URL
const parsedUrl = url.parse(`${baseUrl}${endpoint}`);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

// Request options
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || (isHttps ? 443 : 80),
  path: parsedUrl.path,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

// Add authorization header if token is provided
if (token) {
  options.headers['Authorization'] = `Bearer ${token}`;
}

// Make request
const req = client.request(options, (res) => {
  let data = '';
  
  // Handle response data
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Handle response end
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log('Response:');
    
    try {
      // Try to parse JSON
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      // If not JSON, print raw data
      console.log(data);
    }
  });
});

// Handle request error
req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// End request
req.end();