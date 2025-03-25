/**
 * Mobile Form Test Script
 * 
 * This script simulates a mobile device request to the ticket form API endpoint
 * to help diagnose issues with form rendering on mobile devices.
 */

// Configuration
const API_BASE_URL = 'https://new-app.managedpmo.com/app/api';
const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/17.5 Mobile/15A5370a Safari/602.1';
const CATEGORY_ID = 127; // Airbnb category ID
const FORM_ID = 263; // Airbnb Guest form ID

// Login credentials
const USERNAME = 'Admin.1';
const PASSWORD = 'Replay_50';
let AUTH_TOKEN = ''; // Will be set after login

// Utility function to measure execution time
function measureTime(fn) {
  const start = performance.now();
  return fn().then(result => {
    const end = performance.now();
    console.log(`Operation took ${(end - start).toFixed(2)}ms`);
    return result;
  });
}

// Function to login and get auth token
async function login() {
  console.log('Logging in...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login-pwa`, {
      method: 'POST',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Login successful');
    
    if (data.pwa_token) {
      AUTH_TOKEN = data.pwa_token;
      console.log('Auth token received');
      return true;
    } else {
      console.error('No token in login response');
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Function to get categories
async function getCategories() {
  console.log('Fetching categories...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/ticket/ticket-category`, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
        'pwa_token': AUTH_TOKEN,
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} categories`);
    
    // Find AirBNB category
    const airbnbCategory = data.find(category => 
      category.name && category.name.toLowerCase().includes('airbnb'));
    
    if (airbnbCategory) {
      console.log(`Found AirBNB category: ${airbnbCategory.name} (ID: ${airbnbCategory.id})`);
      return airbnbCategory;
    } else {
      console.log('AirBNB category not found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return null;
  }
}

// Function to get forms for a category
async function getFormsForCategory(categoryId) {
  console.log(`Fetching forms for category ID ${categoryId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/ticket/ticket-forms-with-categories`, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
        'pwa_token': AUTH_TOKEN,
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} forms total`);
    
    // Filter forms for the specified category
    const categoryForms = data.filter(form => 
      form.category_id === categoryId || form.ticket_category_id === categoryId);
    
    console.log(`Found ${categoryForms.length} forms for category ID ${categoryId}`);
    
    // Find AirBNB Guest form
    const airbnbGuestForm = categoryForms.find(form => 
      form.name && form.name.toLowerCase().includes('guest'));
    
    if (airbnbGuestForm) {
      console.log(`Found AirBNB Guest form: ${airbnbGuestForm.name} (ID: ${airbnbGuestForm.id})`);
      return airbnbGuestForm;
    } else if (categoryForms.length > 0) {
      console.log(`Using first form: ${categoryForms[0].name} (ID: ${categoryForms[0].id})`);
      return categoryForms[0];
    } else {
      console.log('No forms found for this category');
      return null;
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return null;
  }
}

// Function to get form details
async function getFormDetails(formId) {
  console.log(`Fetching details for form ID ${formId}...`);
  
  try {
    // Log memory usage before request
    if (global.gc) {
      global.gc();
      console.log(`Memory usage before request: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    console.log(`Making request to ${API_BASE_URL}/ticket/ticket-form/${formId}`);
    console.log(`Using User-Agent: ${MOBILE_USER_AGENT}`);
    
    const response = await fetch(`${API_BASE_URL}/ticket/ticket-form/${formId}`, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
        'pwa_token': AUTH_TOKEN,
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    // Log response headers
    console.log('Response headers:');
    response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    
    // Get response text first to check size
    const responseText = await response.text();
    console.log(`Response size: ${responseText.length} characters`);
    
    if (responseText.length > 1000000) {
      console.warn('WARNING: Response is very large (>1MB), which may cause memory issues');
    }
    
    // Parse response with timing
    console.log('Parsing response...');
    const parseStartTime = performance.now();
    
    // Parse in a controlled way to avoid memory issues
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error('Failed to parse response JSON');
    }
    
    const parseTime = performance.now() - parseStartTime;
    console.log(`Response parsed in ${parseTime.toFixed(2)}ms`);
    
    // Log memory usage after parsing
    if (global.gc) {
      global.gc();
      console.log(`Memory usage after parsing: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }
    
    // Check response size and structure
    const responseSize = JSON.stringify(data).length;
    console.log(`Parsed response size: ${responseSize} characters`);
    
    // Analyze form data
    console.log(`Form name: ${data.name}`);
    
    if (data.data) {
      let formFields;
      
      if (typeof data.data === 'string') {
        console.log('Form data is a string, parsing...');
        try {
          formFields = JSON.parse(data.data);
          console.log(`Parsed ${formFields.length} fields from string`);
        } catch (e) {
          console.error('Error parsing form data string:', e);
          formFields = [];
        }
      } else if (Array.isArray(data.data)) {
        formFields = data.data;
        console.log(`Form has ${formFields.length} fields as array`);
      } else {
        console.log(`Form data is type: ${typeof data.data}`);
        formFields = [];
      }
      
      // Count field types
      const fieldTypes = {};
      formFields.forEach(field => {
        if (field.type) {
          fieldTypes[field.type] = (fieldTypes[field.type] || 0) + 1;
        }
      });
      
      console.log('Field types:');
      Object.entries(fieldTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // Check for large paragraphs
      const paragraphs = formFields.filter(field => field.type === 'paragraph');
      if (paragraphs.length > 0) {
        console.log(`Form has ${paragraphs.length} paragraphs`);
        
        // Calculate total content length
        let totalContentLength = 0;
        paragraphs.forEach(paragraph => {
          if (paragraph.content) {
            if (Array.isArray(paragraph.content)) {
              paragraph.content.forEach(item => {
                totalContentLength += (item ? item.length : 0);
              });
            } else if (typeof paragraph.content === 'string') {
              totalContentLength += paragraph.content.length;
            }
          }
        });
        
        console.log(`Total paragraph content length: ${totalContentLength} characters`);
        
        if (totalContentLength > 5000) {
          console.warn('WARNING: Form has large amount of paragraph text (>5000 chars)');
        }
      }
    } else {
      console.log('Form has no data field');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching form details:', error);
    return null;
  }
}

// Main function
async function main() {
  console.log('=== Mobile Form Test ===');
  console.log(`Testing with API URL: ${API_BASE_URL}`);
  console.log(`Testing with User-Agent: ${MOBILE_USER_AGENT}`);
  console.log(`Testing with Category ID: ${CATEGORY_ID}`);
  console.log(`Testing with Form ID: ${FORM_ID}`);
  console.log(`Using credentials: ${USERNAME} / ${PASSWORD.replace(/./g, '*')}`);
  console.log('-------------------------');
  
  try {
    // Login first to get auth token
    const loginSuccess = await measureTime(() => login());
    if (!loginSuccess) {
      console.error('Login failed. Exiting.');
      return;
    }
    
    // Skip category and form search, directly use the provided IDs
    console.log(`Using Airbnb category (ID: ${CATEGORY_ID})`);
    console.log(`Using Airbnb Guest form (ID: ${FORM_ID})`);
    
    // Add memory usage tracking
    if (global.gc) {
      global.gc();
      console.log(`Memory usage before form fetch: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }
    
    // Get form details directly
    console.log('Fetching form details...');
    const formDetails = await measureTime(() => getFormDetails(FORM_ID));
    if (!formDetails) {
      console.error('Failed to get form details. Exiting.');
      return;
    }
    
    // Check memory usage after form fetch
    if (global.gc) {
      global.gc();
      console.log(`Memory usage after form fetch: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main().catch(console.error);