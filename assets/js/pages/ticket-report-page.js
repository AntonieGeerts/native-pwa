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
    
    // Back button - Navigate directly to menu page
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Use direct navigation as history.back() might be unreliable in Capacitor
        window.location.href = 'menu-mobile.html';
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
    
    // Show a simple loading message instead of animated spinner on mobile
    dynamicFormFields.innerHTML = '';
    
    // Check if we're on a mobile device
    const isMobileDevice = window.CapacitorApp ?
      window.CapacitorApp.isNativePlatform() :
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // No spinner or animation for any device to prevent memory issues
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'row';
    loadingMessage.innerHTML = '<div class="label p-form-label">Loading form fields, please wait...</div>';
    dynamicFormFields.appendChild(loadingMessage);
    
    if (window.Logger) {
      Logger.info('Using simple text loading indicator for all devices');
    }
    
    // Store device type in a global variable to ensure consistent behavior
    window.PMO_IS_MOBILE_DEVICE = isMobileDevice;
    
    // Check immediately if this is a known large form on mobile
    // These forms are known to cause memory issues on mobile devices
    const knownLargeForms = [263, 264, 265]; // Add IDs of known large forms
    
    if (knownLargeForms.includes(Number(formId)) && isMobileDevice) {
      if (window.Logger) {
        Logger.info('Detected known large form on mobile device - using direct rendering', {
          formId,
          isMobile: isMobileDevice,
          formName: formId == 263 ? 'Airbnb Guest' : 'Large Form',
          memoryUsage: window.performance && window.performance.memory ?
            `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)}MB` :
            'unavailable'
        });
      }
      
      // Show a simplified version of the form for mobile - DIRECT RENDERING (no setTimeout)
      dynamicFormFields.innerHTML = `
        <div class="row">
          <div class="label p-form-label">Form Optimization</div>
          <div class="p-form-text" style="padding: 12px; color: #666;">
            <p>This form contains a large amount of content that may cause performance issues on mobile devices.</p>
            <p>We're showing a simplified version to ensure better performance.</p>
            <p>For the complete form with all details, please use a desktop device.</p>
          </div>
        </div>
        
        <!-- Essential fields only -->
        <div class="row">
          <div class="label p-form-label">Name <span style="color:#da848c">*</span></div>
          <div class="text-container">
            <input type="text" name="name" class="p-form-text p-form-no-validate" required>
          </div>
        </div>
        
        <div class="row">
          <div class="label p-form-label">Date <span style="color:#da848c">*</span></div>
          <div class="date-container">
            <input type="text" name="date" class="datepicker p-form-text p-form-no-validate" required>
            <i class="far fa-calendar-alt"></i>
          </div>
        </div>
        
        <div class="row">
          <div class="label p-form-label">Description</div>
          <div class="textarea-container">
            <textarea name="description" class="p-form-text p-form-no-validate" rows="4"></textarea>
          </div>
        </div>
      `;
      
      // Initialize date pickers
      try {
        const datePickers = document.querySelectorAll('.datepicker');
        datePickers.forEach(picker => {
          flatpickr(picker, {
            dateFormat: 'Y-m-d',
            allowInput: true
          });
        });
        
        if (window.Logger) {
          Logger.info('Simplified form rendered successfully', {
            formId,
            isMobile: isMobileDevice
          });
        }
      } catch (error) {
        console.error('Error initializing date pickers:', error);
        if (window.Logger) {
          Logger.error('Error initializing date pickers', {
            error: error.message,
            stack: error.stack
          });
        }
      }
      
      return; // Skip the regular form loading
    }
    
    // For regular forms or desktop, use a minimal delay
    const timeoutDelay = 50; // Reduced delay to prevent timeout violations
    
    if (window.Logger) {
      Logger.info('Setting timeout delay for standard form', {
        timeoutDelay,
        isMobileDevice
      });
    }
    
    // Use the same core loading logic for both mobile and desktop, but only for regular forms
    // (known large forms on mobile are handled directly above)
    setTimeout(() => {
      try {
        // Try to get form details from global data store first
        let cachedFormData = null;
        if (window.App && window.App.data && Array.isArray(window.App.data.forms)) {
          cachedFormData = window.App.data.forms.find(form => form.id == formId);
        }
        
        if (cachedFormData) {
          if (window.Logger) {
            Logger.info('Form details found in global data store', {
              formId,
              formName: cachedFormData.name,
              fieldCount: cachedFormData.data ? (Array.isArray(cachedFormData.data) ? cachedFormData.data.length : 'unknown') : 0
            });
          }
          
          // Use memory-optimized rendering
          this.renderFormFieldsLazy(cachedFormData, dynamicFormFields);
        } else {
          // Fallback to API if not found in global data store
          if (window.Logger) {
            Logger.info('Fetching form details from API', { formId });
          }
          
          // Fetch form details from API
          ApiService.get(`/ticket/ticket-form/${formId}`)
            .then(data => {
              if (data) {
                // Store in global data store for future use
                if (window.App && !window.App.data) {
                  window.App.data = {};
                }
                
                if (window.App && !window.App.data.forms) {
                  window.App.data.forms = [];
                }
                
                if (window.App && window.App.data && Array.isArray(window.App.data.forms)) {
                  // Add to global data store if not already present
                  const existingForm = window.App.data.forms.find(f => f.id == formId);
                  if (!existingForm) {
                    window.App.data.forms.push(data);
                  }
                }
                
                // Use memory-optimized rendering
                this.renderFormFieldsLazy(data, dynamicFormFields);
              } else {
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
          
          // Initialize date pickers
          const datePickers = document.querySelectorAll('.datepicker');
          datePickers.forEach(picker => {
            flatpickr(picker, {
              dateFormat: 'Y-m-d',
              allowInput: true
            });
          });
          
          return; // Skip the regular form loading
        }
        
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
                // Provide a more helpful error message for mobile users
                const isMobileDevice = window.PMO_IS_MOBILE_DEVICE ||
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobileDevice) {
                  dynamicFormFields.innerHTML = `
                    <div class="row">
                      <div class="label p-form-label">Error loading form fields</div>
                      <div class="p-form-text" style="padding: 12px; color: #666;">
                        <p>We're having trouble loading this form on your mobile device.</p>
                        <p>This may be due to the form's size or complexity.</p>
                        <p>Try refreshing the page or using a desktop device.</p>
                      </div>
                    </div>`;
                } else {
                  // Provide a more helpful error message for mobile users
                  const isMobileDevice = window.PMO_IS_MOBILE_DEVICE ||
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  
                  if (isMobileDevice) {
                    dynamicFormFields.innerHTML = `
                      <div class="row">
                        <div class="label p-form-label">Error loading form fields</div>
                        <div class="p-form-text" style="padding: 12px; color: #666;">
                          <p>We're having trouble loading this form on your mobile device.</p>
                          <p>This may be due to the form's size or complexity.</p>
                          <p>Try refreshing the page or using a desktop device.</p>
                        </div>
                      </div>`;
                  } else {
                    dynamicFormFields.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
                  }
                }
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
    }, timeoutDelay); // Adjusted delay based on device type
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
    // Define isMobileDevice at the beginning to avoid initialization issues
    const isMobileDevice = window.PMO_IS_MOBILE_DEVICE || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const renderStartTime = performance.now();
    const renderSessionId = `render_${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      // Log rendering start with detailed metrics
      if (window.Logger) {
        Logger.info(`[${renderSessionId}] Starting form field rendering`, {
          formName: data.name,
          formId: data.id,
          isMobile: isMobileDevice,
          timestamp: new Date().toISOString(),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent,
          memoryBefore: window.performance && window.performance.memory ?
            `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)}MB` :
            'unavailable'
        });
      }
      
      // Clear existing fields
      dynamicFormFields.innerHTML = '';
      
      // Parse form data with performance monitoring
      const parseStartTime = performance.now();
      let formData = data.data;
      if (typeof formData === 'string') {
        try {
          formData = JSON.parse(formData);
          const parseTime = performance.now() - parseStartTime;
          
          if (window.Logger) {
            Logger.debug(`[${renderSessionId}] Parsed form data from string`, {
              dataLength: formData.length,
              parseTime: `${parseTime.toFixed(2)}ms`,
              isMobile: isMobileDevice
            });
          }
        } catch (e) {
          const parseErrorTime = performance.now() - parseStartTime;
          
          if (window.Logger) {
            Logger.error(`[${renderSessionId}] Error parsing form data`, {
              error: e.message,
              parseErrorTime: `${parseErrorTime.toFixed(2)}ms`,
              dataPreview: typeof formData === 'string' ? formData.substring(0, 100) : 'not a string',
              isMobile: isMobileDevice
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
      
      // Process form data with performance monitoring
      if (Array.isArray(formData)) {
        const organizeStartTime = performance.now();
        
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
            // Add paragraphs to the current section if there is one
            if (currentSection) {
              sectionFields.push(field);
            } else {
              // If no current section, create a standalone paragraph
              paragraphs.push(field);
            }
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
        
        const organizeTime = performance.now() - organizeStartTime;
        
        if (window.Logger) {
          Logger.info(`[${renderSessionId}] Form structure processed`, {
            sectionCount: sections.length,
            paragraphCount: paragraphs.length,
            fieldTypes: this.countFieldTypes(formData),
            organizeTime: `${organizeTime.toFixed(2)}ms`,
            isMobile: isMobileDevice,
            totalFields: formData.length,
            memoryAfterOrganize: window.performance && window.performance.memory ?
              `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB` :
              'unavailable'
          });
        }
        
        // Create a container for all sections
        const sectionsContainer = document.createElement('div');
        sectionsContainer.className = 'form-sections-container';
        dynamicFormFields.appendChild(sectionsContainer);
        
        // Use very small batch size and longer delay for all devices to prevent hangs
        const batchSize = 1; // Always render one section at a time
        const batchDelay = isMobileDevice ? 150 : 50; // Longer delay for mobile
        
        if (window.Logger) {
          Logger.info('Batch rendering configuration', {
            batchSize,
            batchDelay,
            isMobileDevice,
            totalSections: sections.length
          });
        }
        
        // Render sections in batches to avoid memory issues
        const renderNextBatch = (index = 0) => {
          const batchStartTime = performance.now();
          
          // Log batch rendering
          if (window.Logger) {
            Logger.debug(`[${renderSessionId}] Rendering batch of sections`, {
              batchIndex: index,
              batchSize: batchSize,
              remainingSections: sections.length - index,
              isMobile: isMobileDevice,
              memoryBeforeBatch: window.performance && window.performance.memory ?
                `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB` :
                'unavailable'
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
            
            // Use a simple setTimeout with a longer delay for mobile
            // This prevents the recursive loop that can happen with requestAnimationFrame
            setTimeout(() => {
              // Add a maximum execution time check to prevent infinite loops
              const currentTime = performance.now();
              const totalExecutionTime = currentTime - renderStartTime;
              
              // If we've been rendering for more than 10 seconds, stop to prevent hangs
              if (totalExecutionTime > 10000) {
                if (window.Logger) {
                  Logger.warn('Rendering taking too long, stopping to prevent browser hang', {
                    totalExecutionTime: `${Math.round(totalExecutionTime)}ms`,
                    remainingSections: sections.length - endIndex,
                    isMobile: isMobileDevice
                  });
                }
                
                // Show a message to the user
                const warningElement = document.createElement('div');
                warningElement.className = 'row';
                warningElement.innerHTML = `
                  <div class="label p-form-label">Form rendering stopped</div>
                  <div class="p-form-text" style="padding: 12px; color: #666;">
                    <p>Form rendering was taking too long and was stopped to prevent browser issues.</p>
                    <p>Try refreshing the page or using a desktop device.</p>
                  </div>
                `;
                sectionsContainer.appendChild(warningElement);
                
                return; // Stop rendering
              }
              
              // Continue rendering
              renderNextBatch(endIndex);
            }, isMobileDevice ? 250 : 50); // Much longer delay for mobile
          } else {
            // All sections rendered, now render standalone paragraphs
            if (window.Logger) {
              Logger.info('All sections rendered, rendering standalone paragraphs', {
                paragraphCount: paragraphs.length
              });
            }
            
            if (paragraphs.length > 0) {
              const paragraphsFragment = document.createDocumentFragment();
              
              // Render each paragraph field using the same rendering function
              paragraphs.forEach(paragraphField => {
                const fieldElement = this.createFormField(paragraphField);
                if (fieldElement) {
                  paragraphsFragment.appendChild(fieldElement);
                }
              });
              
              sectionsContainer.appendChild(paragraphsFragment);
            }
            
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
        
      case 'paragraph':
        // Handle paragraph content as array or string with mobile optimization
        let paragraphContent = '';
        // Use the global isMobileDevice variable to avoid redefinition
        // This prevents potential issues with variable shadowing
        
        try {
          // Safely handle content
          if (field.content) {
            try {
              if (Array.isArray(field.content)) {
                // On mobile, limit the number of items to prevent rendering issues
                const maxItems = isMobileDevice ? 5 : field.content.length; // Reduced from 10 to 5 for mobile
                
                // Also limit total content size on mobile to prevent memory issues
                let contentToRender;
                if (isMobileDevice) {
                  // Calculate total content size
                  let totalSize = 0;
                  let itemCount = 0;
                  
                  // Only include items up to a maximum total size
                  contentToRender = [];
                  for (let i = 0; i < Math.min(maxItems, field.content.length); i++) {
                    const item = field.content[i];
                    const itemSize = item ? String(item).length : 0;
                    
                    // Stop if adding this item would exceed the maximum size
                    if (isMobileDevice && totalSize + itemSize > 1000) {
                      break;
                    }
                    
                    contentToRender.push(item);
                    totalSize += itemSize;
                    itemCount++;
                  }
                } else {
                  // On desktop, include all items up to maxItems
                  contentToRender = field.content.slice(0, maxItems);
                }
                
                // Create list items for array content with length limits
                const listItems = contentToRender.map(item => {
                  try {
                    // Safely handle each item
                    const itemStr = String(item || ''); // Convert to string safely
                    // Truncate long text on mobile
                    const displayText = isMobileDevice && itemStr.length > 100 ?
                      `${itemStr.substring(0, 100)}...` : itemStr;
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
                const displayText = isMobileDevice && contentStr.length > 200 ?
                  `${contentStr.substring(0, 200)}... (content truncated for mobile)` : contentStr;
                
                paragraphContent = `<p>${displayText}</p>`;
              }
            } catch (contentError) {
              console.error('Error processing content:', contentError);
              paragraphContent = '<p>Error displaying content</p>';
            }
          }
          
          // Add additional content if present (truncated on mobile)
          if (field.additional_content) {
            try {
              const additionalStr = String(field.additional_content || ''); // Convert to string safely
              const additionalText = isMobileDevice && additionalStr.length > 100 ?
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