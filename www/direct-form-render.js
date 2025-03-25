/**
 * Direct Form Rendering Script
 * 
 * This script directly renders the form fields without using the complex batch rendering process.
 * It's designed to help diagnose and fix issues with form rendering on mobile devices.
 */

// Configuration
const API_BASE_URL = 'https://new-app.managedpmo.com/app/api';
const FORM_ID = 263; // Airbnb Guest form ID
const USERNAME = 'Admin.1';
const PASSWORD = 'Replay_50';
const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/17.5 Mobile/15A5370a Safari/602.1';

// Global variables
let AUTH_TOKEN = '';
const isMobileDevice = true; // Simulate mobile device

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
    
    return data;
  } catch (error) {
    console.error('Error fetching form details:', error);
    return null;
  }
}

// Function to render a form field
function renderFormField(field) {
  let html = '';
  const required = field.required ? '<span style="color:#da848c">*</span>' : '';
  
  try {
    switch (field.type) {
      case 'text':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Text'} ${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" class="p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
        break;
        
      case 'textarea':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Text Area'} ${required}</div>
            <div class="textarea-container">
              <textarea name="${field.name}" class="p-form-text p-form-no-validate" rows="4" ${field.required ? 'required' : ''}></textarea>
            </div>
          </div>
        `;
        break;
        
      case 'select':
        let options = '';
        if (field.options && Array.isArray(field.options)) {
          options = field.options.map(option => `<option value="${option.value || ''}">${option.label || ''}</option>`).join('');
        }
        
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Select'} ${required}</div>
            <div class="select-container">
              <select name="${field.name}" class="p-form-no-validate" ${field.required ? 'required' : ''}>
                <option value="">Choose ${field.label || 'option'}</option>
                ${options}
              </select>
            </div>
          </div>
        `;
        break;
        
      case 'paragraph':
        // Handle paragraph content as array or string with mobile optimization
        let paragraphContent = '';
        
        try {
          if (field.content) {
            if (Array.isArray(field.content)) {
              // On mobile, limit the number of items to prevent rendering issues
              const maxItems = 3; // Very limited for mobile
              
              // Also limit total content size on mobile to prevent memory issues
              let contentToRender = [];
              
              // Calculate total content size
              let totalSize = 0;
              
              // Only include items up to a maximum total size
              for (let i = 0; i < Math.min(maxItems, field.content.length); i++) {
                const item = field.content[i];
                const itemSize = item ? String(item).length : 0;
                
                // Stop if adding this item would exceed the maximum size
                if (totalSize + itemSize > 500) { // Very limited size
                  break;
                }
                
                contentToRender.push(item);
                totalSize += itemSize;
              }
              
              // Create list items for array content with length limits
              const listItems = contentToRender.map(item => {
                try {
                  // Safely handle each item
                  const itemStr = String(item || ''); // Convert to string safely
                  // Truncate long text on mobile
                  const displayText = itemStr.length > 50 ? // Very short truncation
                    `${itemStr.substring(0, 50)}...` : itemStr;
                  return `<li>${displayText}</li>`;
                } catch (itemError) {
                  console.error('Error processing list item:', itemError);
                  return '<li>Error displaying item</li>';
                }
              }).join('');
              
              // Add a note if items were truncated
              const truncationNote = field.content.length > contentToRender.length ?
                `<li class="truncation-note">(${field.content.length - contentToRender.length} more items not shown on mobile)</li>` : '';
              
              paragraphContent = `<ul class="paragraph-list">${listItems}${truncationNote}</ul>`;
            } else {
              // Handle string content with truncation for mobile
              const contentStr = String(field.content || ''); // Convert to string safely
              const displayText = contentStr.length > 100 ? // Very short truncation
                `${contentStr.substring(0, 100)}... (content truncated for mobile)` : contentStr;
              
              paragraphContent = `<p>${displayText}</p>`;
            }
          }
          
          // Add additional content if present (truncated on mobile)
          if (field.additional_content) {
            try {
              const additionalStr = String(field.additional_content || ''); // Convert to string safely
              const additionalText = additionalStr.length > 50 ? // Very short truncation
                `${additionalStr.substring(0, 50)}...` : additionalStr;
              
              paragraphContent += `<p class="italic">${additionalText}</p>`;
            } catch (additionalError) {
              console.error('Error processing additional content:', additionalError);
              paragraphContent += '<p class="italic">Error displaying additional content</p>';
            }
          }
          
          html = `
            <div class="row">
              <div class="paragraph-container">
                <h3 class="paragraph-header"><u><b>${field.label || 'Paragraph'}</b></u></h3>
                <div class="paragraph-content">
                  ${paragraphContent}
                </div>
              </div>
            </div>
          `;
        } catch (error) {
          console.error('Error rendering paragraph:', error, field);
          html = `
            <div class="row">
              <div class="paragraph-container">
                <h3 class="paragraph-header"><u><b>${field.label || 'Paragraph'}</b></u></h3>
                <div class="paragraph-content">
                  <p>Error rendering content</p>
                </div>
              </div>
            </div>
          `;
        }
        break;
        
      default:
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Unknown Field Type'} ${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" class="p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
    }
    
    return html;
  } catch (error) {
    console.error('Error rendering form field:', error, field);
    return `
      <div class="row">
        <div class="label p-form-label">Error rendering field</div>
      </div>
    `;
  }
}

// Function to directly render form fields
function renderFormFields(formData) {
  console.log('Directly rendering form fields...');
  
  let html = '<div class="form-container">';
  
  try {
    // Parse form data
    let fields = [];
    
    if (formData.data) {
      if (typeof formData.data === 'string') {
        try {
          fields = JSON.parse(formData.data);
          console.log(`Parsed ${fields.length} fields from string`);
        } catch (e) {
          console.error('Error parsing form data string:', e);
        }
      } else if (Array.isArray(formData.data)) {
        fields = formData.data;
        console.log(`Form has ${fields.length} fields as array`);
      }
    }
    
    // Count field types
    const fieldTypes = {};
    fields.forEach(field => {
      if (field.type) {
        fieldTypes[field.type] = (fieldTypes[field.type] || 0) + 1;
      }
    });
    
    console.log('Field types:');
    Object.entries(fieldTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Render fields directly (no batching)
    console.log('Rendering fields directly...');
    
    // Group fields by sections
    let currentSection = null;
    let sectionFields = [];
    const sections = [];
    
    fields.forEach(field => {
      if (field.type === 'header') {
        if (currentSection && sectionFields.length > 0) {
          sections.push({
            title: currentSection,
            fields: [...sectionFields]
          });
        }
        currentSection = field.label;
        sectionFields = [];
      } else {
        sectionFields.push(field);
      }
    });
    
    // Add the last section if there is one
    if (currentSection && sectionFields.length > 0) {
      sections.push({
        title: currentSection,
        fields: [...sectionFields]
      });
    }
    
    // Render each section
    sections.forEach(section => {
      html += `<div class="form-section">`;
      html += `<div class="row"><div class="section-header">${section.title}</div></div>`;
      
      // Render fields in this section
      section.fields.forEach(field => {
        html += renderFormField(field);
      });
      
      html += `</div>`;
    });
    
    html += '</div>';
    
    // Write the HTML to a file
    const fs = require('fs');
    fs.writeFileSync('rendered-form.html', `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rendered Form</title>
        <style>
          /* Basic styling */
          body {
            font-family: Calibri, 'Segoe UI', Roboto, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          
          .form-container {
            max-width: 100%;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .row {
            margin-bottom: 16px;
          }
          
          .label, .p-form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
          }
          
          .section-header {
            font-size: 18px;
            font-weight: bold;
            color: #7F126E;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          }
          
          input[type="text"], 
          textarea,
          select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          
          .paragraph-header {
            margin-bottom: 12px;
            font-size: 16px;
            color: #333;
          }
          
          .paragraph-content {
            line-height: 1.5;
            color: #444;
          }
          
          .paragraph-list {
            margin: 0;
            padding-left: 20px;
          }
          
          .paragraph-list li {
            margin-bottom: 8px;
          }
          
          .truncation-note {
            font-style: italic;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Rendered Form: ${formData.name || 'Unknown Form'}</h1>
        ${html}
      </body>
      </html>
    `);
    
    console.log('Form rendered successfully and saved to rendered-form.html');
    return html;
  } catch (error) {
    console.error('Error rendering form fields:', error);
    return '<div class="row"><div class="label p-form-label">Error rendering form fields</div></div>';
  }
}

// Main function
async function main() {
  console.log('=== Direct Form Rendering Test ===');
  console.log(`Testing with API URL: ${API_BASE_URL}`);
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
    
    // Get form details
    console.log('Fetching form details...');
    const formDetails = await measureTime(() => getFormDetails(FORM_ID));
    if (!formDetails) {
      console.error('Failed to get form details. Exiting.');
      return;
    }
    
    // Render form fields directly
    console.log('Rendering form fields...');
    await measureTime(() => renderFormFields(formDetails));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main().catch(console.error);