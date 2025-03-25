/**
 * Simplified Form Renderer for Mobile Devices
 * 
 * This script provides a direct, simplified rendering approach for forms on mobile devices.
 * It bypasses the complex batch rendering process that's causing issues on mobile.
 */

// Add this script to your project and include it in ticket-report-mobile.html
// <script src="simplified-form-renderer.js"></script>

(function() {
  // Store the original loadFormFields function for desktop use
  const originalLoadFormFields = window.TicketReportPage ? 
    window.TicketReportPage.loadFormFields : null;
  
  // Create a simplified form renderer for mobile devices
  const SimplifiedFormRenderer = {
    // Check if we're on a mobile device
    isMobileDevice: function() {
      return window.CapacitorApp ? 
        window.CapacitorApp.isNativePlatform() : 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Render a form directly (no batching)
    renderForm: function(formId) {
      if (!formId) return;
      
      // Log the start of form rendering
      if (window.Logger) {
        Logger.info('SimplifiedFormRenderer: Starting direct form rendering', {
          formId,
          isMobile: this.isMobileDevice(),
          timestamp: new Date().toISOString()
        });
      }
      
      // Get the form container
      const dynamicFormFields = document.querySelector('.js-dynamic-form-fields');
      if (!dynamicFormFields) {
        console.error('SimplifiedFormRenderer: Form container not found');
        return;
      }
      
      // Show loading message
      dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Loading form fields, please wait...</div></div>';
      
      // Get form data from global store or API
      this.getFormData(formId)
        .then(formData => {
          if (!formData) {
            dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error: Form data not found</div></div>';
            return;
          }
          
          // Render the form directly
          this.renderFormDirectly(formData, dynamicFormFields);
        })
        .catch(error => {
          console.error('SimplifiedFormRenderer: Error rendering form', error);
          dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
          
          if (window.Logger) {
            Logger.error('SimplifiedFormRenderer: Error rendering form', {
              error: error.message,
              stack: error.stack,
              formId
            });
          }
        });
    },
    
    // Get form data from global store or API
    getFormData: function(formId) {
      return new Promise((resolve, reject) => {
        try {
          // Check if we have the form data in the global store
          if (window.GlobalDataStore && 
              window.GlobalDataStore.forms && 
              window.GlobalDataStore.forms[formId]) {
            
            if (window.Logger) {
              Logger.info('SimplifiedFormRenderer: Form details found in global data store', {
                formId,
                formName: window.GlobalDataStore.forms[formId].name
              });
            }
            
            resolve(window.GlobalDataStore.forms[formId]);
            return;
          }
          
          // If not in global store, fetch from API
          if (window.Logger) {
            Logger.info('SimplifiedFormRenderer: Form not in global store, fetching from API', {
              formId
            });
          }
          
          // Use the TicketService if available
          if (window.TicketService && window.TicketService.getFormById) {
            window.TicketService.getFormById(formId)
              .then(formData => {
                if (formData) {
                  // Store in global data store for future use
                  if (window.GlobalDataStore) {
                    if (!window.GlobalDataStore.forms) {
                      window.GlobalDataStore.forms = {};
                    }
                    window.GlobalDataStore.forms[formId] = formData;
                  }
                  
                  resolve(formData);
                } else {
                  reject(new Error('Form data not found'));
                }
              })
              .catch(reject);
          } else {
            reject(new Error('TicketService not available'));
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    
    // Render the form directly without batching
    renderFormDirectly: function(formData, container) {
      try {
        if (window.Logger) {
          Logger.info('SimplifiedFormRenderer: Rendering form directly', {
            formName: formData.name,
            formId: formData.id
          });
        }
        
        // Clear the container
        container.innerHTML = '';
        
        // Parse form fields
        let fields = [];
        if (formData.data) {
          if (typeof formData.data === 'string') {
            try {
              fields = JSON.parse(formData.data);
            } catch (e) {
              console.error('SimplifiedFormRenderer: Error parsing form data', e);
              if (window.Logger) {
                Logger.error('SimplifiedFormRenderer: Error parsing form data', {
                  error: e.message,
                  formId: formData.id
                });
              }
            }
          } else if (Array.isArray(formData.data)) {
            fields = formData.data;
          }
        }
        
        if (fields.length === 0) {
          container.innerHTML = '<div class="row"><div class="label p-form-label">No form fields found</div></div>';
          return;
        }
        
        // Group fields by sections
        const sections = this.organizeFieldsIntoSections(fields);
        
        // Create a document fragment to hold all the content
        const fragment = document.createDocumentFragment();
        
        // Render each section
        sections.forEach(section => {
          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'form-section';
          
          // Add section header
          if (section.title) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'row';
            headerDiv.innerHTML = `<div class="section-header">${section.title}</div>`;
            sectionDiv.appendChild(headerDiv);
          }
          
          // Render fields in this section
          section.fields.forEach(field => {
            const fieldElement = this.createFormField(field);
            if (fieldElement) {
              sectionDiv.appendChild(fieldElement);
            }
          });
          
          fragment.appendChild(sectionDiv);
        });
        
        // Append all content to the container at once
        container.appendChild(fragment);
        
        // Initialize date pickers
        this.initializeDatePickers();
        
        if (window.Logger) {
          Logger.info('SimplifiedFormRenderer: Form rendered successfully', {
            formName: formData.name,
            formId: formData.id,
            sectionCount: sections.length,
            fieldCount: fields.length
          });
        }
        
        // Special handling for certain form types
        if (formData.name && (formData.name.toLowerCase().includes('visitor') ||
            formData.name.toLowerCase().includes('gate pass'))) {
          const visitorInfo = document.querySelector('.js-generate-qr-info-visitors');
          const dateInfo = document.querySelector('.js-generate-qr-info-dates');
          
          if (visitorInfo) visitorInfo.style.display = 'block';
          if (dateInfo) dateInfo.style.display = 'block';
        } else {
          const visitorInfo = document.querySelector('.js-generate-qr-info-visitors');
          const dateInfo = document.querySelector('.js-generate-qr-info-dates');
          
          if (visitorInfo) visitorInfo.style.display = 'none';
          if (dateInfo) dateInfo.style.display = 'none';
        }
      } catch (error) {
        console.error('SimplifiedFormRenderer: Error rendering form directly', error);
        container.innerHTML = '<div class="row"><div class="label p-form-label">Error rendering form fields</div></div>';
        
        if (window.Logger) {
          Logger.error('SimplifiedFormRenderer: Error rendering form directly', {
            error: error.message,
            stack: error.stack,
            formName: formData ? formData.name : 'unknown',
            formId: formData ? formData.id : 'unknown'
          });
        }
      }
    },
    
    // Organize fields into sections
    organizeFieldsIntoSections: function(fields) {
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
      
      // If no sections were created, create a default one
      if (sections.length === 0 && fields.length > 0) {
        sections.push({
          title: 'Form Fields',
          fields: fields
        });
      }
      
      return sections;
    },
    
    // Create a form field element
    createFormField: function(field) {
      if (!field || !field.type) return null;
      
      // Create a row div for the field
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';
      
      try {
        switch (field.type) {
          case 'text':
            this.renderTextField(rowDiv, field);
            break;
            
          case 'textarea':
            this.renderTextareaField(rowDiv, field);
            break;
            
          case 'select':
            this.renderSelectField(rowDiv, field);
            break;
            
          case 'radio':
            this.renderRadioField(rowDiv, field);
            break;
            
          case 'thedate':
            this.renderDateField(rowDiv, field);
            break;
            
          case 'thetime':
            this.renderTimeField(rowDiv, field);
            break;
            
          case 'signature':
            this.renderSignatureField(rowDiv, field);
            break;
            
          case 'paragraph':
            this.renderParagraphField(rowDiv, field);
            break;
            
          default:
            // Default to text input for unknown types
            this.renderTextField(rowDiv, field);
        }
        
        return rowDiv;
      } catch (error) {
        console.error('SimplifiedFormRenderer: Error creating form field', error, field);
        rowDiv.innerHTML = `<div class="label p-form-label">Error rendering ${field.label || 'field'}</div>`;
        return rowDiv;
      }
    },
    
    // Render a text field
    renderTextField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Text'} ${required}</div>
        <div class="text-container">
          <input type="text" name="${field.name}" class="p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
        </div>
      `;
    },
    
    // Render a textarea field
    renderTextareaField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Text Area'} ${required}</div>
        <div class="textarea-container">
          <textarea name="${field.name}" class="p-form-text p-form-no-validate" rows="4" ${field.required ? 'required' : ''}></textarea>
        </div>
      `;
    },
    
    // Render a select field
    renderSelectField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      
      let options = '';
      if (field.options && Array.isArray(field.options)) {
        options = field.options.map(option => 
          `<option value="${option.value || ''}">${option.label || ''}</option>`
        ).join('');
      }
      
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Select'} ${required}</div>
        <div class="select-container">
          <select name="${field.name}" class="p-form-no-validate" ${field.required ? 'required' : ''}>
            <option value="">Choose ${field.label || 'option'}</option>
            ${options}
          </select>
        </div>
      `;
    },
    
    // Render a radio field
    renderRadioField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      
      let radioOptions = '';
      if (field.options && Array.isArray(field.options)) {
        radioOptions = field.options.map((option, index) => `
          <div class="p-form-radio-cont">
            <input type="radio" name="${field.name}" id="${field.name}_${index}" value="${option.value || ''}" ${index === 0 && field.required ? 'required' : ''}>
            <span></span>
            <label for="${field.name}_${index}">${option.label || ''}</label>
          </div>
        `).join('');
      }
      
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Radio'} ${required}</div>
        <div class="radio-container">
          ${radioOptions}
        </div>
      `;
    },
    
    // Render a date field
    renderDateField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Date'} ${required}</div>
        <div class="date-container">
          <input type="text" name="${field.name}" class="datepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
          <i class="far fa-calendar-alt"></i>
        </div>
      `;
    },
    
    // Render a time field
    renderTimeField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Time'} ${required}</div>
        <div class="time-container">
          <input type="text" name="${field.name}" class="timepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
          <i class="far fa-clock"></i>
        </div>
      `;
    },
    
    // Render a signature field
    renderSignatureField: function(container, field) {
      const required = field.required ? '<span style="color:#da848c">*</span>' : '';
      const uniqueId = 'signature-' + Math.random().toString(36).substring(2, 10);
      
      container.innerHTML = `
        <div class="label p-form-label">${field.label || 'Signature'} ${required}</div>
        <div class="signature-container">
          <canvas class="signature-canvas ${uniqueId}" width="300" height="200"></canvas>
          <div class="signature-buttons">
            <button type="button" class="signature-btn p-form-send js-sign-signature">Sign</button>
            <button type="button" class="signature-btn p-form-send js-clear-signature" style="display:none">Clear</button>
          </div>
        </div>
      `;
    },
    
    // Render a paragraph field with content limits for mobile
    renderParagraphField: function(container, field) {
      try {
        // Handle paragraph content as array or string with mobile optimization
        let paragraphContent = '';
        const isMobile = this.isMobileDevice();
        
        if (field.content) {
          if (Array.isArray(field.content)) {
            // On mobile, limit the number of items to prevent rendering issues
            const maxItems = isMobile ? 3 : field.content.length;
            
            // Also limit total content size on mobile to prevent memory issues
            let contentToRender = [];
            
            // Calculate total content size
            let totalSize = 0;
            
            // Only include items up to a maximum total size
            for (let i = 0; i < Math.min(maxItems, field.content.length); i++) {
              const item = field.content[i];
              const itemSize = item ? String(item).length : 0;
              
              // Stop if adding this item would exceed the maximum size
              if (isMobile && totalSize + itemSize > 500) {
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
                const displayText = isMobile && itemStr.length > 50 ?
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
            const displayText = isMobile && contentStr.length > 100 ?
              `${contentStr.substring(0, 100)}... (content truncated for mobile)` : contentStr;
            
            paragraphContent = `<p>${displayText}</p>`;
          }
        }
        
        // Add additional content if present (truncated on mobile)
        if (field.additional_content) {
          try {
            const additionalStr = String(field.additional_content || ''); // Convert to string safely
            const additionalText = isMobile && additionalStr.length > 50 ?
              `${additionalStr.substring(0, 50)}...` : additionalStr;
            
            paragraphContent += `<p class="italic">${additionalText}</p>`;
          } catch (additionalError) {
            console.error('Error processing additional content:', additionalError);
            paragraphContent += '<p class="italic">Error displaying additional content</p>';
          }
        }
        
        container.innerHTML = `
          <div class="paragraph-container">
            <h3 class="paragraph-header"><u><b>${field.label || 'Paragraph'}</b></u></h3>
            <div class="paragraph-content">
              ${paragraphContent}
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Error rendering paragraph:', error);
        container.innerHTML = `
          <div class="paragraph-container">
            <h3 class="paragraph-header"><u><b>${field.label || 'Paragraph'}</b></u></h3>
            <div class="paragraph-content">
              <p>Error rendering content</p>
            </div>
          </div>
        `;
      }
    },
    
    // Initialize date pickers
    initializeDatePickers: function() {
      try {
        // Initialize date pickers
        const datePickers = document.querySelectorAll('.datepicker');
        if (datePickers.length > 0 && window.flatpickr) {
          datePickers.forEach(picker => {
            window.flatpickr(picker, {
              dateFormat: 'Y-m-d',
              allowInput: true
            });
          });
        }
        
        // Initialize time pickers
        const timePickers = document.querySelectorAll('.timepicker');
        if (timePickers.length > 0 && window.flatpickr) {
          timePickers.forEach(picker => {
            window.flatpickr(picker, {
              enableTime: true,
              noCalendar: true,
              dateFormat: 'H:i',
              time_24hr: true,
              allowInput: true
            });
          });
        }
      } catch (error) {
        console.error('SimplifiedFormRenderer: Error initializing pickers', error);
        if (window.Logger) {
          Logger.error('SimplifiedFormRenderer: Error initializing pickers', {
            error: error.message,
            stack: error.stack
          });
        }
      }
    }
  };
  
  // Override the loadFormFields function for mobile devices
  if (window.TicketReportPage) {
    window.TicketReportPage.loadFormFields = function(formId) {
      // Check if we're on a mobile device
      const isMobileDevice = SimplifiedFormRenderer.isMobileDevice();
      
      if (isMobileDevice) {
        // Use the simplified renderer for mobile
        if (window.Logger) {
          Logger.info('Using simplified form renderer for mobile device', {
            formId
          });
        }
        SimplifiedFormRenderer.renderForm(formId);
      } else if (originalLoadFormFields) {
        // Use the original function for desktop
        if (window.Logger) {
          Logger.info('Using original form renderer for desktop', {
            formId
          });
        }
        originalLoadFormFields.call(window.TicketReportPage, formId);
      } else {
        // Fallback if original function is not available
        SimplifiedFormRenderer.renderForm(formId);
      }
    };
    
    // Log that the override is in place
    if (window.Logger) {
      Logger.info('SimplifiedFormRenderer: Overridden loadFormFields function', {
        isMobile: SimplifiedFormRenderer.isMobileDevice()
      });
    }
  }
  
  // Export the renderer for direct use
  window.SimplifiedFormRenderer = SimplifiedFormRenderer;
  
  console.log('SimplifiedFormRenderer: Initialized');
})();