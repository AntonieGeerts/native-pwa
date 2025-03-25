/**
 * Ticket Report Page JavaScript
 * Handles functionality for the ticket-report-mobile.html page
 */

const TicketReportPage = {
  // File URLs for uploaded images
  fileUrls: [],
  
  // Dynamic form fields
  dynamicFormFields: [],
  
  // Initialize the page
  init() {
    console.log('Initializing ticket-report-mobile page');
    
    // Check authentication
    this.checkAuthentication();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize date pickers
    this.initDatePickers();
    
    // Load categories
    this.loadCategories();
    
    // Load statuses
    this.loadStatuses();
  },
  
  // Check if user is authenticated
  checkAuthentication() {
    const token = localStorage.getItem('pwa_token');
    if (!token) {
      window.location.href = 'login.html';
    }
  },
  
  // Set up event listeners
  setupEventListeners() {
    // Category select change
    const categorySelect = document.getElementById('ticket_category_id');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        this.loadFormsByCategory(categorySelect.value);
      });
    }
    
    // Form select change
    const formSelect = document.getElementById('ticket_form_id');
    if (formSelect) {
      formSelect.addEventListener('change', () => {
        this.loadFormFields(formSelect.value);
      });
    }
    
    // Image upload
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
      imageUpload.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files);
      });
    }
    
    // Submit button
    const submitBtn = document.getElementById('submit-request-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submitRequest();
      });
    }
    
    // Comment submit button
    const commentBtn = document.getElementById('submit-comment-btn');
    if (commentBtn) {
      commentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submitComment();
      });
    }
    
    // Check for request type in URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestType = urlParams.get('type');
    if (requestType) {
      this.preSelectRequestType(requestType);
    }
  },
  
  // Initialize date pickers
  initDatePickers() {
    // Initialize date picker for visit dates
    const visitDates = document.getElementById('visit-dates');
    if (visitDates) {
      flatpickr(visitDates, {
        mode: 'multiple',
        dateFormat: 'Y-m-d',
        minDate: 'today'
      });
    }
    
    // Initialize any other date pickers that might be added dynamically
    // Use MutationObserver instead of deprecated DOMNodeInserted event
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // Check if the node is an element
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for datepicker class
              if (node.classList && node.classList.contains('datepicker') && !node._flatpickr) {
                flatpickr(node, {
                  dateFormat: 'Y-m-d'
                });
              }
              
              // Check for timepicker class
              if (node.classList && node.classList.contains('timepicker') && !node._flatpickr) {
                flatpickr(node, {
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'H:i',
                  time_24hr: true
                });
              }
              
              // Also check children of the added node
              const datepickers = node.querySelectorAll('.datepicker:not([class*="_flatpickr"])');
              datepickers.forEach(picker => {
                flatpickr(picker, {
                  dateFormat: 'Y-m-d'
                });
              });
              
              const timepickers = node.querySelectorAll('.timepicker:not([class*="_flatpickr"])');
              timepickers.forEach(picker => {
                flatpickr(picker, {
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'H:i',
                  time_24hr: true
                });
              });
            }
          });
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  },
  
  // Load categories
  loadCategories() {
    const categorySelect = document.getElementById('ticket_category_id');
    if (!categorySelect) return;
    
    // Show loading state
    categorySelect.innerHTML = '<option value="">Loading categories...</option>';
    
    // Use the global data store if available
    if (window.App && window.App.data && Array.isArray(window.App.data.categories) && window.App.data.categories.length > 0) {
      console.log('Using categories from global data store:', window.App.data.categories.length);
      
      // Reset select
      categorySelect.innerHTML = '<option value="">Choose category</option>';
      
      // Add categories to select
      window.App.data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } else {
      // Fallback to API if global data is not available
      console.log('Global data not available, fetching categories from API');
      
      // Fetch categories from API
      TicketService.getCategories()
        .then(data => {
          console.log('Categories fetched:', data);
          
          // Reset select
          categorySelect.innerHTML = '<option value="">Choose category</option>';
          
          // Add categories to select
          if (data && Array.isArray(data)) {
            data.forEach(category => {
              const option = document.createElement('option');
              option.value = category.id;
              option.textContent = category.name;
              categorySelect.appendChild(option);
            });
            
            // Store in global data for future use
            if (window.App && window.App.data) {
              window.App.data.categories = data;
              console.log('Stored categories in global data store');
            }
          }
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          categorySelect.innerHTML = '<option value="">Error loading categories</option>';
        });
    }
  },
  
  // Load forms by category
  loadFormsByCategory(categoryId) {
    const formSelect = document.getElementById('ticket_form_id');
    if (!formSelect) return;
    
    // Show loading state
    formSelect.innerHTML = '<option value="">Loading forms...</option>';
    
    // If no category is selected, reset the form select
    if (!categoryId) {
      formSelect.innerHTML = '<option value="">Choose form</option>';
      return;
    }
    
    console.log('Loading forms for category ID:', categoryId);
    
    // Use the global data store if available
    if (window.App && window.App.data && Array.isArray(window.App.data.forms) && window.App.data.forms.length > 0) {
      console.log('Using forms from global data store:', window.App.data.forms.length);
      
      // Reset select
      formSelect.innerHTML = '<option value="">Choose form</option>';
      
      // Filter forms by category
      const categoryForms = window.App.data.forms.filter(form => form.ticket_category_id == categoryId);
      console.log('Category forms:', categoryForms);
      
      if (categoryForms.length > 0) {
        categoryForms.forEach(form => {
          const option = document.createElement('option');
          option.value = form.id;
          option.textContent = form.name;
          formSelect.appendChild(option);
        });
      } else {
        console.warn(`No forms found for category ID: ${categoryId}`);
        formSelect.innerHTML = '<option value="">No forms available for this category</option>';
      }
    } else {
      // Fallback to API if global data is not available
      console.log('Global data not available, fetching from API');
      
      // Fetch forms from API
      TicketService.getForms()
        .then(data => {
          console.log('Forms fetched:', data);
          
          // Try to parse the data if it's a string
          let formsData = data;
          if (typeof data === 'string') {
            try {
              formsData = JSON.parse(data);
              console.log('Parsed forms data:', formsData);
            } catch (e) {
              console.error('Error parsing forms data:', e);
            }
          }
          
          // Reset select
          formSelect.innerHTML = '<option value="">Choose form</option>';
          
          // Add forms to select
          if (formsData && Array.isArray(formsData)) {
            // Filter forms by category
            const categoryForms = formsData.filter(form => form.ticket_category_id == categoryId);
            console.log('Category forms:', categoryForms);
            
            if (categoryForms.length > 0) {
              categoryForms.forEach(form => {
                const option = document.createElement('option');
                option.value = form.id;
                option.textContent = form.name;
                formSelect.appendChild(option);
              });
            } else {
              console.warn(`No forms found for category ID: ${categoryId}`);
              formSelect.innerHTML = '<option value="">No forms available for this category</option>';
            }
            
            // Store in global data for future use
            if (window.App && window.App.data) {
              window.App.data.forms = formsData;
              console.log('Stored forms in global data store');
            }
          } else {
            console.warn('Forms data is not an array:', formsData);
            formSelect.innerHTML = '<option value="">Error: Invalid forms data</option>';
          }
        })
        .catch(error => {
          console.error('Error fetching forms:', error);
          formSelect.innerHTML = '<option value="">Error loading forms</option>';
        });
    }
  },
  
  // Load statuses
  loadStatuses() {
    const statusSelect = document.getElementById('ticket_status');
    if (!statusSelect) return;
    
    // Show loading state
    statusSelect.innerHTML = '<option value="">Loading statuses...</option>';
    
    // Use the global data store if available
    if (window.App && window.App.data && Array.isArray(window.App.data.statuses) && window.App.data.statuses.length > 0) {
      console.log('Using statuses from global data store:', window.App.data.statuses.length);
      
      // Reset select
      statusSelect.innerHTML = '<option value="">Choose status</option>';
      
      // Add statuses to select
      window.App.data.statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.id;
        option.textContent = status.name;
        
        // Pre-select "New" status if available
        if (status.name.toLowerCase() === 'new') {
          option.selected = true;
        }
        
        statusSelect.appendChild(option);
      });
    } else {
      // Fallback to API if global data is not available
      console.log('Global data not available, fetching statuses from API');
      
      // Fetch statuses from API
      TicketService.getStatuses()
        .then(data => {
          console.log('Statuses fetched:', data);
          
          // Reset select
          statusSelect.innerHTML = '<option value="">Choose status</option>';
          
          // Add statuses to select
          if (data && Array.isArray(data)) {
            data.forEach(status => {
              const option = document.createElement('option');
              option.value = status.id;
              option.textContent = status.name;
              
              // Pre-select "New" status if available
              if (status.name.toLowerCase() === 'new') {
                option.selected = true;
              }
              
              statusSelect.appendChild(option);
            });
            
            // Store in global data for future use
            if (window.App && window.App.data) {
              window.App.data.statuses = data;
              console.log('Stored statuses in global data store');
            }
          }
        })
        .catch(error => {
          console.error('Error fetching statuses:', error);
          statusSelect.innerHTML = '<option value="">Error loading statuses</option>';
        });
    }
  },
  
  // Load form fields with memory optimization for mobile
  loadFormFields(formId) {
    const dynamicFormFields = document.querySelector('.js-dynamic-form-fields');
    if (!dynamicFormFields) return;
    
    // Log form loading start
    if (window.Logger) {
      Logger.info('Loading form fields', { formId });
    }
    
    // Clear existing fields
    dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Loading form fields...</div></div>';
    
    // If no form is selected, clear the dynamic fields
    if (!formId) {
      dynamicFormFields.innerHTML = '';
      if (window.Logger) {
        Logger.warn('No form ID provided');
      }
      return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    dynamicFormFields.innerHTML = '';
    dynamicFormFields.appendChild(loadingIndicator);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        // Try to get form details from global data store first
        let formData = null;
        if (window.App && window.App.data && Array.isArray(window.App.data.forms)) {
          formData = window.App.data.forms.find(form => form.id == formId);
        }
        
        if (formData) {
          if (window.Logger) {
            Logger.info('Form details found in global data store', {
              formId,
              formName: formData.name,
              fieldCount: formData.data ? (Array.isArray(formData.data) ? formData.data.length : 'unknown') : 0
            });
          }
          
          // Use memory-optimized rendering
          this.renderFormFieldsLazy(formData, dynamicFormFields);
        } else {
          // Fallback to API if not found in global data store
          if (window.Logger) {
            Logger.info('Fetching form details from API', { formId });
          }
          
          TicketService.getForm(formId)
            .then(data => {
              if (window.Logger) {
                Logger.info('Form details fetched from API', {
                  formId,
                  formName: data.name,
                  fieldCount: data.data ? (Array.isArray(data.data) ? data.data.length : 'unknown') : 0,
                  dataSize: JSON.stringify(data).length
                });
              }
              
              // Clear existing fields
              dynamicFormFields.innerHTML = '';
              
              if (data && Object.keys(data).length > 0) {
                // Use memory-optimized rendering
                this.renderFormFieldsLazy(data, dynamicFormFields);
              } else {
                if (window.Logger) {
                  Logger.error('Form data is empty or invalid', { formId });
                }
                dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
              }
            })
            .catch(error => {
              if (window.Logger) {
                Logger.error('Error fetching form details', {
                  formId,
                  error: error.message,
                  stack: error.stack
                });
              }
              dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
            });
        }
      } catch (error) {
        if (window.Logger) {
          Logger.error('Error in loadFormFields', {
            formId,
            error: error.message,
            stack: error.stack
          });
        }
        dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
      }
    }, 100); // Small delay to allow UI to update
  },
  
  // Render form fields
  renderFormFields(data, dynamicFormFields) {
    // Clear existing fields
    dynamicFormFields.innerHTML = '';
    
    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();
    
    // Parse form data
    let formData = data.data;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        console.error('Error parsing form data:', e);
      }
    }
    
    // Store form fields for later use (only store necessary data)
    this.dynamicFormFields = formData ? formData.map(field => {
      // Only keep essential properties to reduce memory usage
      return {
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options
      };
    }) : [];
    
    // Render form fields
    if (Array.isArray(formData)) {
      // Group fields by sections based on headers
      let currentSection = null;
      let sectionFields = [];
      
      // Process all fields first to group them
      const sections = [];
      let paragraphs = [];
      
      formData.forEach(field => {
        // If this is a header, start a new section
        if (field.type === 'header') {
          // If we have fields in the current section, save it
          if (currentSection && sectionFields.length > 0) {
            sections.push({
              title: currentSection,
              fields: [...sectionFields]
            });
          }
          
          // Start a new section
          currentSection = field.label;
          sectionFields = [];
        }
        // If this is a paragraph, save it separately
        else if (field.type === 'paragraph') {
          paragraphs.push(field.label);
        }
        // Otherwise, add the field to the current section
        else {
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
      
      // Now render all sections at once
      sections.forEach(section => {
        const sectionElement = this.createFormSection(section.title, section.fields);
        fragment.appendChild(sectionElement);
      });
      
      // Render paragraphs
      paragraphs.forEach(paragraphText => {
        const paragraphDiv = document.createElement('div');
        paragraphDiv.className = 'row';
        
        const paragraphLabel = document.createElement('div');
        paragraphLabel.className = 'p-form-label';
        paragraphLabel.style.fontStyle = 'italic';
        paragraphLabel.textContent = paragraphText;
        
        paragraphDiv.appendChild(paragraphLabel);
        fragment.appendChild(paragraphDiv);
      });
      
      // Append all elements at once
      dynamicFormFields.appendChild(fragment);
    }
    
    // Special handling for certain form types
    if (data.name && (data.name.toLowerCase().includes('visitor') ||
        data.name.toLowerCase().includes('gate pass'))) {
      document.querySelector('.js-generate-qr-info-visitors').style.display = 'block';
      document.querySelector('.js-generate-qr-info-dates').style.display = 'block';
    } else {
      document.querySelector('.js-generate-qr-info-visitors').style.display = 'none';
      document.querySelector('.js-generate-qr-info-dates').style.display = 'none';
    }
  },
  
  // Memory-optimized lazy loading of form fields
  renderFormFieldsLazy(data, dynamicFormFields) {
    try {
      // Log rendering start
      if (window.Logger) {
        Logger.info('Starting lazy form field rendering', {
          formName: data.name,
          formId: data.id
        });
      }
      
      // Clear existing fields
      dynamicFormFields.innerHTML = '';
      
      // Parse form data
      let formData = data.data;
      if (typeof formData === 'string') {
        try {
          formData = JSON.parse(formData);
          if (window.Logger) {
            Logger.debug('Parsed form data from string', {
              dataLength: formData.length
            });
          }
        } catch (e) {
          if (window.Logger) {
            Logger.error('Error parsing form data', {
              error: e.message,
              dataPreview: typeof formData === 'string' ? formData.substring(0, 100) : 'not a string'
            });
          }
          formData = [];
        }
      }
      
      // Store minimal form fields data for later use
      this.dynamicFormFields = formData ? formData.map(field => ({
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options
      })) : [];
      
      if (window.Logger) {
        Logger.debug('Stored minimal form field data', {
          fieldCount: this.dynamicFormFields.length,
          memorySize: JSON.stringify(this.dynamicFormFields).length
        });
      }
      
      // Process form data
      if (Array.isArray(formData)) {
        // Group fields by sections
        const sections = [];
        const paragraphs = [];
        let currentSection = null;
        let sectionFields = [];
        
        // First pass: organize fields into sections
        formData.forEach(field => {
          if (field.type === 'header') {
            if (currentSection && sectionFields.length > 0) {
              sections.push({
                title: currentSection,
                fields: [...sectionFields]
              });
            }
            currentSection = field.label;
            sectionFields = [];
          } else if (field.type === 'paragraph') {
            paragraphs.push(field.label);
          } else {
            sectionFields.push(field);
          }
        });
        
        // Add the last section
        if (currentSection && sectionFields.length > 0) {
          sections.push({
            title: currentSection,
            fields: [...sectionFields]
          });
        }
        
        if (window.Logger) {
          Logger.info('Form structure processed', {
            sectionCount: sections.length,
            paragraphCount: paragraphs.length,
            fieldTypes: this.countFieldTypes(formData)
          });
        }
        
        // Create a container for all sections
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'form-sections-container';
        dynamicFormFields.appendChild(sectionsContainer);
        
        // Render sections in batches to avoid memory issues
        const renderNextBatch = (index = 0, batchSize = 1) => {
          // Log batch rendering
          if (window.Logger) {
            Logger.debug('Rendering batch of sections', {
              batchIndex: index,
              batchSize: batchSize,
              remainingSections: sections.length - index
            });
          }
          
          // Create a document fragment for this batch
          const fragment = document.createDocumentFragment();
          
          // Render a batch of sections
          const endIndex = Math.min(index + batchSize, sections.length);
          for (let i = index; i < endIndex; i++) {
            const section = sections[i];
            const sectionElement = this.createFormSection(section.title, section.fields);
            fragment.appendChild(sectionElement);
          }
          
          // Append this batch to the container
          sectionsContainer.appendChild(fragment);
          
          // If there are more sections to render, schedule the next batch
          if (endIndex < sections.length) {
            if (window.Logger) {
              Logger.debug('Scheduling next batch', {
                nextBatchIndex: endIndex,
                remainingSections: sections.length - endIndex
              });
            }
            
            setTimeout(() => {
              renderNextBatch(endIndex, batchSize);
            }, 50); // Small delay between batches
          } else {
            // All sections rendered, now render paragraphs
            if (window.Logger) {
              Logger.info('All sections rendered, rendering paragraphs', {
                paragraphCount: paragraphs.length
              });
            }
            
            const paragraphsFragment = document.createDocumentFragment();
            paragraphs.forEach(paragraphText => {
              const paragraphDiv = document.createElement('div');
              paragraphDiv.className = 'row';
              
              const paragraphLabel = document.createElement('div');
              paragraphLabel.className = 'p-form-label';
              paragraphLabel.style.fontStyle = 'italic';
              paragraphLabel.textContent = paragraphText;
              
              paragraphDiv.appendChild(paragraphLabel);
              paragraphsFragment.appendChild(paragraphDiv);
            });
            sectionsContainer.appendChild(paragraphsFragment);
            
            if (window.Logger) {
              Logger.info('Form rendering completed successfully', {
                formName: data.name,
                formId: data.id,
                totalSections: sections.length,
                totalParagraphs: paragraphs.length
              });
            }
          }
        };
        
        // Start rendering sections
        renderNextBatch();
      }
      
      // Special handling for certain form types
      if (data.name && (data.name.toLowerCase().includes('visitor') ||
          data.name.toLowerCase().includes('gate pass'))) {
        document.querySelector('.js-generate-qr-info-visitors').style.display = 'block';
        document.querySelector('.js-generate-qr-info-dates').style.display = 'block';
      } else {
        document.querySelector('.js-generate-qr-info-visitors').style.display = 'none';
        document.querySelector('.js-generate-qr-info-dates').style.display = 'none';
      }
    } catch (error) {
      if (window.Logger) {
        Logger.error('Error in renderFormFieldsLazy', {
          error: error.message,
          stack: error.stack,
          formName: data ? data.name : 'unknown',
          formId: data ? data.id : 'unknown'
        });
      }
      dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error rendering form fields</div></div>';
    }
  },
  
  // Count field types for logging
  countFieldTypes(formData) {
    const typeCounts = {};
    if (Array.isArray(formData)) {
      formData.forEach(field => {
        if (field.type) {
          typeCounts[field.type] = (typeCounts[field.type] || 0) + 1;
        }
      });
    }
    return typeCounts;
  },
  
  // Create a form section with header and fields (returns DOM element)
  createFormSection(sectionTitle, fields) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'form-section';
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'section-header';
    headerDiv.style.fontWeight = '600';
    headerDiv.style.fontSize = '16px';
    headerDiv.style.margin = '16px 0 8px 0';
    headerDiv.style.color = 'var(--primary-color)';
    headerDiv.textContent = sectionTitle;
    
    rowDiv.appendChild(headerDiv);
    sectionDiv.appendChild(rowDiv);
    
    // Add fields to the section
    fields.forEach(field => {
      const fieldElement = this.createFormField(field);
      if (fieldElement) {
        sectionDiv.appendChild(fieldElement);
      }
    });
    
    return sectionDiv;
  },
  
  // Create a form field (returns DOM element or null)
  createFormField(field) {
    // Get HTML for the field
    const fieldHtml = this.renderFormField(field);
    if (!fieldHtml) return null;
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = fieldHtml;
    
    // Return the first child (the actual field element)
    return tempContainer.firstElementChild;
  },
  
  // Render a form field
  renderFormField(field) {
    let html = '';
    const required = field.required ? '<span style="color:#da848c">*</span>' : '';
    
    try {
    
    switch (field.type) {
      case 'text':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Text'}&nbsp;${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" class="p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
        break;
        
      case 'textarea':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Text Area'}&nbsp;${required}</div>
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
            <div class="label p-form-label">${field.label || 'Select'}&nbsp;${required}</div>
            <div class="select-container p-form-select">
              <select name="${field.name}" class="p-form-no-validate" ${field.required ? 'required' : ''}>
                <option value="">Choose ${field.label || 'option'}</option>
                ${options}
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
        `;
        break;
        
      case 'checkbox':
        html = `
          <div class="row">
            <div class="p-form-checkbox-cont">
              <input type="checkbox" name="${field.name}" id="${field.name}" ${field.required ? 'required' : ''}>
              <span></span>
              <label for="${field.name}">${field.label || 'Checkbox'}&nbsp;${required}</label>
            </div>
          </div>
        `;
        break;
        
      case 'radio':
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
        
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Radio'}&nbsp;${required}</div>
            <div class="radio-container">
              ${radioOptions}
            </div>
          </div>
        `;
        break;
        
      case 'thedate':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Date'}&nbsp;${required}</div>
            <div class="date-container">
              <input type="text" name="${field.name}" class="datepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
              <i class="far fa-calendar-alt"></i>
            </div>
          </div>
        `;
        break;
        
      case 'thetime':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Time'}&nbsp;${required}</div>
            <div class="time-container">
              <input type="text" name="${field.name}" class="timepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
              <i class="far fa-clock"></i>
            </div>
          </div>
        `;
        break;
        
      case 'signature':
        html = `
          <div class="row">
            <div class="label p-form-label">${field.label || 'Signature'}&nbsp;${required}</div>
            <div class="signature-container">
              <canvas class="signature-canvas signature-hhn0vkbc5a" width="300" height="200"></canvas>
              <div class="signature-buttons">
                <button type="button" class="signature-btn p-form-send js-sign-signature">Sign</button>
                <button type="button" class="signature-btn p-form-send js-clear-signature" style="display:none">Clear</button>
              </div>
            </div>
          </div>
        `;
        break;
        
      default:
        return '';
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
  },
  
  // Pre-select request type
  preSelectRequestType(requestType) {
    // Load all categories and forms
    Promise.all([
      TicketService.getCategories(),
      TicketService.getFormsWithCategories()
    ])
    .then(([categories, forms]) => {
      // Make sure forms is an array
      if (!forms || !Array.isArray(forms)) {
        console.warn('Forms data is not an array:', forms);
        return;
      }
      
      // Find the form that matches the request type
      const matchingForm = forms.find(form => {
        return form.name && form.name.toLowerCase().includes(requestType.toLowerCase());
      });
      
      if (matchingForm) {
        // Find the category for this form
        const category = categories.find(cat => cat.id === matchingForm.category_id);
        
        if (category) {
          // Set the category
          const categorySelect = document.getElementById('ticket_category_id');
          if (categorySelect) {
            categorySelect.value = category.id;
            
            // Trigger the change event to load forms for this category
            const event = new Event('change');
            categorySelect.dispatchEvent(event);
            
            // Wait for forms to load, then set the form
            setTimeout(() => {
              const formSelect = document.getElementById('ticket_form_id');
              if (formSelect) {
                formSelect.value = matchingForm.id;
                
                // Trigger the change event to load form fields
                const event = new Event('change');
                formSelect.dispatchEvent(event);
              }
            }, 500);
          }
        }
      }
    })
    .catch(error => {
      console.error('Error pre-selecting request type:', error);
    });
  },
  
  // Handle image upload
  handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    // Process each file
    Array.from(files).forEach(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }
      
      // Create file reader
      const reader = new FileReader();
      
      // Set up reader onload event
      reader.onload = (e) => {
        // Get image data URL
        const imageUrl = e.target.result;
        
        // Add to file URLs array
        this.fileUrls.push({
          name: file.name,
          url: imageUrl
        });
        
        // Show preview
        this.showImagePreview(imageUrl, file.name);
      };
      
      // Read file as data URL
      reader.readAsDataURL(file);
    });
  },
  
  // Show image preview
  showImagePreview(imageUrl, fileName) {
    // Create preview element
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.cssText = `
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    `;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      width: 100%;
      max-height: 200px;
      object-fit: cover;
    `;
    
    // Create caption
    const caption = document.createElement('div');
    caption.textContent = fileName;
    caption.style.cssText = `
      padding: 8px 16px;
      font-size: 14px;
      color: var(--text-secondary);
    `;
    
    // Add elements to preview
    preview.appendChild(img);
    preview.appendChild(caption);
    
    // Add preview to page
    const previewContainer = document.querySelector('.action-button-container');
    previewContainer.parentNode.insertBefore(preview, previewContainer);
  },
  
  // Submit comment
  submitComment() {
    const commentText = document.getElementById('comment-text');
    if (!commentText || !commentText.value.trim()) return;
    
    // Create comment element
    const comment = document.createElement('div');
    comment.className = 'comment';
    
    // Get user data
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userName = userData.name || userData.username || 'User';
    
    // Set comment content
    comment.innerHTML = `
      <div class="name">${userName}</div>
      <div class="comment-data">${commentText.value.trim()}</div>
      <div class="date">Just now</div>
    `;
    
    // Add comment to container
    const commentsContainer = document.getElementById('comments-container');
    commentsContainer.appendChild(comment);
    
    // Clear comment text
    commentText.value = '';
  },
  
  // Submit request
  submitRequest() {
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    // Get form data
    const formData = this.getFormData();
    
    // Show loading state
    const submitBtn = document.getElementById('submit-request-btn');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Submit form data to API
    TicketService.createTicket(formData)
      .then(data => {
        console.log('Request submitted successfully:', data);
        
        // Show success message
        alert('Request submitted successfully!');
        
        // Redirect to requests page
        window.location.href = 'requests.html';
      })
      .catch(error => {
        console.error('Error submitting request:', error);
        
        // Show error message
        alert('Failed to submit request. Please try again.');
        
        // Reset button state
        submitBtn.textContent = 'Submit Request';
        submitBtn.disabled = false;
      });
  },
  
  // Validate form
  validateForm() {
    // Check required fields
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        
        // Add error styling
        field.style.borderColor = '#da848c';
        
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'This field is required';
        errorMsg.style.color = '#da848c';
        errorMsg.style.fontSize = '12px';
        errorMsg.style.marginTop = '4px';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
          existingError.remove();
        }
        
        // Add error message
        field.parentNode.appendChild(errorMsg);
        
        // Scroll to first error
        if (isValid) {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Remove error styling
        field.style.borderColor = '';
        
        // Remove error message
        const errorMsg = field.parentNode.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    });
    
    // Check category, form, and status
    const categorySelect = document.getElementById('ticket_category_id');
    const formSelect = document.getElementById('ticket_form_id');
    const statusSelect = document.getElementById('ticket_status');
    
    if (!categorySelect.value) {
      isValid = false;
      alert('Please select a category');
    } else if (!formSelect.value) {
      isValid = false;
      alert('Please select a form');
    } else if (!statusSelect.value) {
      isValid = false;
      alert('Please select a status');
    }
    
    return isValid;
  },
  
  // Get form data
  getFormData() {
    // Get selected values
    const categoryId = document.getElementById('ticket_category_id').value;
    const formId = document.getElementById('ticket_form_id').value;
    const statusId = document.getElementById('ticket_status').value;
    
    // Get dynamic form field values
    const formData = {};
    
    // Process each field
    if (Array.isArray(this.dynamicFormFields)) {
      this.dynamicFormFields.forEach(field => {
        const element = document.querySelector(`[name="${field.name}"]`);
        if (element) {
          // Get value based on field type
          let value = '';
          
          switch (field.type) {
            case 'checkbox':
              value = element.checked ? 'Yes' : 'No';
              break;
              
            case 'radio':
              const checkedRadio = document.querySelector(`[name="${field.name}"]:checked`);
              value = checkedRadio ? checkedRadio.value : '';
              break;
              
            default:
              value = element.value;
          }
          
          // Add to form data
          formData[field.name] = value;
        }
      });
    }
    
    // Prepare final data
    const requestData = {
      category_id: categoryId,
      form_id: formId,
      status_id: statusId,
      form_data: formData,
      attachments: this.fileUrls
    };
    
    return requestData;
  }
};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  TicketReportPage.init();
});