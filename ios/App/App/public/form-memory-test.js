/**
 * Form Memory Test Script
 * 
 * This script tests the memory usage of rendering form fields
 * to help diagnose memory leaks in the ticket-report-mobile.html page.
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Configuration
const FORM_DATA_PATH = path.join(__dirname, 'form-data-sample.json');
const ITERATIONS = 10; // Number of times to render the form
const SIMULATE_MOBILE = true; // Whether to simulate mobile device constraints

// Utility function to measure memory usage
function logMemoryUsage(label) {
  if (global.gc) {
    global.gc();
  }
  
  const memoryUsage = process.memoryUsage();
  console.log(`Memory usage (${label}):`);
  console.log(`  RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`  Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`  Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`  External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
  console.log('');
  
  return memoryUsage.heapUsed;
}

// Simplified form field rendering function
function renderFormField(field) {
  try {
    const required = field.required ? '<span style="color:red">*</span>' : '';
    let html = '';
    
    switch (field.type) {
      case 'text':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Text'} ${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
        break;
        
      case 'textarea':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Text Area'} ${required}</div>
            <div class="textarea-container">
              <textarea name="${field.name}" rows="4" ${field.required ? 'required' : ''}></textarea>
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
            <div class="label">${field.label || 'Select'} ${required}</div>
            <div class="select-container">
              <select name="${field.name}" ${field.required ? 'required' : ''}>
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
              const maxItems = SIMULATE_MOBILE ? 10 : field.content.length;
              const contentToRender = field.content.slice(0, maxItems);
              
              // Create list items for array content with length limits
              const listItems = contentToRender.map(item => {
                try {
                  // Safely handle each item
                  const itemStr = String(item || ''); // Convert to string safely
                  // Truncate long text on mobile
                  const displayText = SIMULATE_MOBILE && itemStr.length > 100 ?
                    `${itemStr.substring(0, 100)}...` : itemStr;
                  return `<li>${displayText}</li>`;
                } catch (itemError) {
                  console.error('Error processing list item:', itemError);
                  return '<li>Error displaying item</li>';
                }
              }).join('');
              
              // Add a note if items were truncated
              const truncationNote = field.content.length > maxItems ?
                `<li class="truncation-note">(${field.content.length - maxItems} more items not shown on mobile)</li>` : '';
              
              paragraphContent = `<ul class="paragraph-list">${listItems}${truncationNote}</ul>`;
            } else {
              // Handle string content with truncation for mobile
              const contentStr = String(field.content || ''); // Convert to string safely
              const displayText = SIMULATE_MOBILE && contentStr.length > 200 ?
                `${contentStr.substring(0, 200)}... (content truncated for mobile)` : contentStr;
              
              paragraphContent = `<p>${displayText}</p>`;
            }
          }
          
          // Add additional content if present (truncated on mobile)
          if (field.additional_content) {
            try {
              const additionalStr = String(field.additional_content || ''); // Convert to string safely
              const additionalText = SIMULATE_MOBILE && additionalStr.length > 100 ?
                `${additionalStr.substring(0, 100)}...` : additionalStr;
              
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
            <div class="label">${field.label || 'Unknown Field Type'} ${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
    }
    
    return html;
  } catch (error) {
    console.error('Error rendering form field:', error, field);
    return `
      <div class="row">
        <div class="label">Error rendering field</div>
      </div>
    `;
  }
}

// Function to render all form fields
function renderFormFields(formData) {
  let html = '<div class="form-container">';
  
  if (Array.isArray(formData)) {
    formData.forEach(field => {
      html += renderFormField(field);
    });
  } else if (formData && formData.data) {
    let fields = formData.data;
    
    if (typeof fields === 'string') {
      try {
        fields = JSON.parse(fields);
      } catch (e) {
        console.error('Error parsing form data string:', e);
        fields = [];
      }
    }
    
    if (Array.isArray(fields)) {
      fields.forEach(field => {
        html += renderFormField(field);
      });
    }
  }
  
  html += '</div>';
  return html;
}

// Main function
async function main() {
  console.log('=== Form Memory Test ===');
  console.log(`Simulating ${SIMULATE_MOBILE ? 'mobile' : 'desktop'} device`);
  console.log(`Running ${ITERATIONS} iterations`);
  console.log('-------------------------');
  
  try {
    // Load form data
    let formData;
    try {
      const formDataJson = fs.readFileSync(FORM_DATA_PATH, 'utf8');
      formData = JSON.parse(formDataJson);
      console.log(`Loaded form data from ${FORM_DATA_PATH}`);
      
      if (formData.data) {
        let fields = formData.data;
        if (typeof fields === 'string') {
          fields = JSON.parse(fields);
        }
        
        if (Array.isArray(fields)) {
          console.log(`Form has ${fields.length} fields`);
          
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
          
          // Check for paragraphs
          const paragraphs = fields.filter(field => field.type === 'paragraph');
          if (paragraphs.length > 0) {
            console.log(`Form has ${paragraphs.length} paragraphs`);
            
            // Calculate total content length
            let totalContentLength = 0;
            paragraphs.forEach(paragraph => {
              if (paragraph.content) {
                if (Array.isArray(paragraph.content)) {
                  paragraph.content.forEach(item => {
                    totalContentLength += (item ? String(item).length : 0);
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
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      return;
    }
    
    // Initial memory usage
    const initialMemory = logMemoryUsage('Initial');
    
    // Run rendering iterations
    for (let i = 0; i < ITERATIONS; i++) {
      console.log(`Iteration ${i + 1}/${ITERATIONS}`);
      
      // Render form fields
      const html = renderFormFields(formData);
      
      // Log memory usage after rendering
      const currentMemory = logMemoryUsage(`After iteration ${i + 1}`);
      
      // Check for memory leak
      const memoryDiff = currentMemory - initialMemory;
      console.log(`Memory difference: ${Math.round(memoryDiff / 1024 / 1024)} MB`);
      
      // Force garbage collection between iterations
      if (global.gc) {
        global.gc();
      }
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main().catch(console.error);