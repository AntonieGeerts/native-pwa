/**
 * Ticket Report Page JavaScript
 * Handles functionality for the ticket-report-mobile.html page
 */

// Ensure FormRenderer is loaded before this script in the HTML

const TicketReportPage = {
  // File URLs for uploaded images
  fileUrls: [],
  
  // Keep track of all enabled forms loaded initially
  allForms: [], 
  availableCategories: [],

  // Initialize the page
  init() {
    console.log('Initializing ticket-report-mobile page');
    this.checkAuthentication();
    this.setupEventListeners();
    this.initDatePickers(); // Keep general date picker init here
    this.loadInitialData(); 
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
    
    // Comment submit button (If applicable to this page)
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
  
  // Initialize date pickers (Only non-dynamic ones remain here)
  initDatePickers() {
    const visitDates = document.getElementById('visit-dates');
    if (visitDates && !visitDates._flatpickr) { // Check if already initialized
      flatpickr(visitDates, {
        mode: 'multiple',
        dateFormat: 'Y-m-d',
        minDate: 'today'
      });
    }
    // Dynamic date/time pickers are now initialized within FormRenderer.initializePickers
  }, 

  // Load initial categories and forms data, applying filtering
  loadInitialData() {
    const categorySelect = document.getElementById('ticket_category_id');
    const formSelect = document.getElementById('ticket_form_id'); 
    if (!categorySelect || !formSelect) return;

    console.log('Loading initial forms and categories data...');
    categorySelect.innerHTML = '<option value="">Loading categories...</option>';
    formSelect.innerHTML = '<option value="">Choose category first</option>'; 

    // Use the pcache endpoint that returns both forms and categories
    ApiService.get('/pcache/ticket/ticket-forms-with-categories')
      .then(data => {
        if (!data || !Array.isArray(data.forms) || !Array.isArray(data.categories)) {
          console.error('Invalid data structure received:', data);
          throw new Error('Invalid data structure for forms and categories.');
        }

        console.log(`Received ${data.forms.length} forms and ${data.categories.length} categories raw.`);

        // 1. Filter forms based on ticket_form_disabled
        // Store all enabled forms for later use in loadFormsByCategory
        this.allForms = data.forms.filter(form => form.ticket_form_disabled && form.ticket_form_disabled.length === 0);
        console.log(`Filtered forms (enabled): ${this.allForms.length}`);

        // 2. Filter categories based on whether they have any enabled forms
        const rawCategories = data.categories;
        this.availableCategories = rawCategories.filter(category =>
          this.allForms.some(form => form.ticket_category_id === category.id)
        );
        console.log(`Filtered categories (with enabled forms): ${this.availableCategories.length}`);

        // 3. Populate category dropdown
        categorySelect.innerHTML = '<option value="">Choose category</option>'; // Reset
        this.availableCategories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });

      })
      .catch(error => {
        console.error('Error loading initial forms/categories data:', error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>';
        formSelect.innerHTML = '<option value="">Error loading forms</option>';
      });
  }, 
  
  // Load forms by category (using pre-filtered data)
  loadFormsByCategory(categoryId) {
    const formSelect = document.getElementById('ticket_form_id');
    if (!formSelect) return;

    // Reset form select and dynamic fields
    formSelect.innerHTML = '<option value="">Choose form</option>';
    const dynamicFormFields = document.querySelector('.js-dynamic-form-fields');
    if (dynamicFormFields) dynamicFormFields.innerHTML = ''; 

    if (!categoryId) {
      return; // No category selected
    }

    // Use the pre-filtered this.allForms
    if (!this.allForms) {
      console.warn('Forms data not loaded yet in loadFormsByCategory');
      formSelect.innerHTML = '<option value="">Forms not loaded</option>';
      return;
    }

    // Filter the already enabled forms by the selected category
    const categoryForms = this.allForms.filter(form => form.ticket_category_id == categoryId);
    console.log(`Forms for category ${categoryId}:`, categoryForms);

    if (categoryForms.length > 0) {
      categoryForms.forEach(form => {
        const option = document.createElement('option');
        option.value = form.id;
        option.textContent = form.name;
        formSelect.appendChild(option);
      });
      // Trigger change to load fields for the first form in the list automatically? Optional.
      // if (formSelect.options.length > 1) {
      //    formSelect.value = formSelect.options[1].value; // Select the first actual form
      //    this.loadFormFields(formSelect.value);
      // }
    } else {
      console.warn(`No enabled forms found for category ID: ${categoryId}`);
      formSelect.innerHTML = '<option value="">No forms available</option>';
    }
  }, 
  
  // Load statuses
  loadStatuses() {
    const statusSelect = document.getElementById('ticket_status');
    if (!statusSelect) return;
    
    statusSelect.innerHTML = '<option value="">Loading statuses...</option>';
    
    TicketService.getStatuses() // Uses pcache endpoint now
      .then(data => {
        statusSelect.innerHTML = '<option value="">Choose status</option>';
        if (data && Array.isArray(data)) {
          data.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            if (status.name.toLowerCase() === 'new') {
              option.selected = true;
            }
            statusSelect.appendChild(option);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching statuses:', error);
        statusSelect.innerHTML = '<option value="">Error loading statuses</option>';
      });
  }, 
  
  // Load form fields using FormRenderer
  loadFormFields(formId) {
    const dynamicFormFieldsContainer = document.querySelector('.js-dynamic-form-fields');
    if (!dynamicFormFieldsContainer) return;
    
    if (window.Logger) Logger.info('Loading form fields', { formId });
    dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">Loading form fields...</div></div>';
    
    if (!formId) {
      dynamicFormFieldsContainer.innerHTML = '';
      if (window.Logger) Logger.warn('No form ID provided');
      return;
    }
    
    const isMobileDevice = window.CapacitorApp ? window.CapacitorApp.isNativePlatform() : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    window.PMO_IS_MOBILE_DEVICE = isMobileDevice; // Store globally if needed by FormRenderer logic

    const knownLargeForms = [258, 263, 264, 265]; 
    
    if (knownLargeForms.includes(Number(formId)) && isMobileDevice) {
      // Use simplified rendering (keep minimal version here)
      if (window.Logger) Logger.info('Detected known large form on mobile - using simplified rendering path', { formId });
       dynamicFormFieldsContainer.innerHTML = `
         <div class="row">
           <div class="label p-form-label">Form Optimization</div>
           <div class="p-form-text" style="padding: 12px; color: #666;">
             <p>This form contains a large amount of content that may cause performance issues on mobile devices.</p>
             <p>We're showing a simplified version to ensure better performance.</p>
             <p>For the complete form with all details, please use a desktop device.</p>
           </div>
         </div>
         <!-- Essential fields only -->
         <div class="row"> <div class="label p-form-label">Name <span style="color:#da848c">*</span></div> <div class="text-container"> <input type="text" name="name" class="p-form-text p-form-no-validate" required> </div> </div>
         <div class="row"> <div class="label p-form-label">Date <span style="color:#da848c">*</span></div> <div class="date-container"> <input type="text" name="date" class="datepicker p-form-text p-form-no-validate" required> <i class="far fa-calendar-alt"></i> </div> </div>
         <div class="row"> <div class="label p-form-label">Description</div> <div class="textarea-container"> <textarea name="description" class="p-form-text p-form-no-validate" rows="4"></textarea> </div> </div>
       `;
       // Initialize pickers for simplified form using FormRenderer utility
       FormRenderer.initializePickers(dynamicFormFieldsContainer); 
       return; 
    }
    
    // For regular forms, fetch data and use lazy rendering
    const timeoutDelay = 50; 
    if (window.Logger) Logger.info('Setting timeout delay for standard form', { timeoutDelay, isMobileDevice });

    setTimeout(() => {
      try {
        // Try to get form details from pre-loaded this.allForms
        let formData = null;
        if (this.allForms) {
          formData = this.allForms.find(form => form.id == formId);
        }
        
        if (formData) {
           if (window.Logger) Logger.info('Form details found in pre-loaded data', { formId, formName: formData.name });
           // Use memory-optimized rendering from FormRenderer
           FormRenderer.renderFormFieldsLazy(formData, dynamicFormFieldsContainer, isMobileDevice);
        } else {
          // Fallback: Fetch individual form data if not found (should be rare now)
          if (window.Logger) Logger.warn('Form details not found in pre-loaded data, fetching from API as fallback', { formId });
          ApiService.get(`/ticket/ticket-form/${formId}`) // Use non-pcache endpoint for individual form fetch
            .then(data => {
              if (data && Object.keys(data).length > 0 && data.data) { 
                 FormRenderer.renderFormFieldsLazy(data, dynamicFormFieldsContainer, isMobileDevice);
              } else {
                 if (window.Logger) Logger.error('Form data from API is empty or invalid', { formId, data });
                 dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">Error: Form data not found or is empty.</div></div>';
              }
            })
            .catch(error => {
              if (window.Logger) Logger.error('Error fetching form details', { formId, error: error.message });
              dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
            });
        }
      } catch (error) {
        if (window.Logger) Logger.error('Error in loadFormFields setTimeout', { formId, error: error.message });
        dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">Error loading form fields</div></div>';
      }
    }, timeoutDelay); 
  }, 

  // REMOVED renderFormFields, renderFormFieldsLazy, countFieldTypes, createFormSection, createFormField, renderFormField
  
  // Pre-select request type
  preSelectRequestType(requestType) {
    // This might need adjustment based on how loadInitialData stores data
    // Assuming this.availableCategories and this.allForms are populated by loadInitialData
    if (!this.availableCategories || !this.allForms) {
        console.warn("Data not ready for pre-selection, retrying...");
        setTimeout(() => this.preSelectRequestType(requestType), 500); // Retry after delay
        return;
    }

    const matchingForm = this.allForms.find(form => 
        form.name && form.name.toLowerCase().includes(requestType.toLowerCase())
    );

    if (matchingForm) {
        const category = this.availableCategories.find(cat => cat.id === matchingForm.ticket_category_id);
        
        if (category) {
            const categorySelect = document.getElementById('ticket_category_id');
            if (categorySelect) {
                categorySelect.value = category.id;
                
                // Trigger change to load forms
                const event = new Event('change');
                categorySelect.dispatchEvent(event);
                
                // Wait slightly for forms dropdown to populate, then select form and load fields
                setTimeout(() => {
                    const formSelect = document.getElementById('ticket_form_id');
                    if (formSelect) {
                        formSelect.value = matchingForm.id;
                        const formEvent = new Event('change');
                        formSelect.dispatchEvent(formEvent);
                    }
                }, 100); // Short delay for form dropdown population
            }
        }
    } else {
        console.warn(`No matching form found for pre-selection type: ${requestType}`);
    }
  }, 
  
  // Handle image upload
  handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        this.fileUrls.push({ name: file.name, url: imageUrl });
        this.showImagePreview(imageUrl, file.name);
      };
      reader.readAsDataURL(file);
    });
  }, 
  
  // Show image preview
  showImagePreview(imageUrl, fileName) {
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.cssText = `margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; overflow: hidden;`;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `width: 100%; max-height: 200px; object-fit: cover;`;
    
    const caption = document.createElement('div');
    caption.textContent = fileName;
    caption.style.cssText = `padding: 8px 16px; font-size: 14px; color: var(--text-secondary);`;
    
    preview.appendChild(img);
    preview.appendChild(caption);
    
    const previewContainer = document.querySelector('.action-button-container');
    previewContainer.parentNode.insertBefore(preview, previewContainer);
  }, 
  
  // Submit comment
  submitComment() {
    const commentText = document.getElementById('comment-text');
    if (!commentText || !commentText.value.trim()) return;
    
    const comment = document.createElement('div');
    comment.className = 'comment';
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userName = userData.name || userData.username || 'User';
    
    comment.innerHTML = `
      <div class="name">${userName}</div>
      <div class="comment-data">${commentText.value.trim()}</div>
      <div class="date">Just now</div>
    `;
    
    const commentsContainer = document.getElementById('comments-container');
    commentsContainer.appendChild(comment);
    
    commentText.value = '';
  }, 
  
  // Submit request
  submitRequest() {
    if (!this.validateForm()) {
      return;
    }
    
    const formData = this.getFormData();
    
    const submitBtn = document.getElementById('submit-request-btn');
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    TicketService.createTicket(formData)
      .then(data => {
        console.log('Request submitted successfully:', data);
        alert('Request submitted successfully!');
        window.location.href = 'requests.html';
      })
      .catch(error => {
        console.error('Error submitting request:', error);
        alert('Failed to submit request. Please try again.');
        submitBtn.textContent = 'Submit Request';
        submitBtn.disabled = false;
      });
  }, 
  
  // Validate form
  validateForm() {
    const requiredFields = document.querySelectorAll('.js-dynamic-form-fields [required]'); // Scope to dynamic fields
    let isValid = true;
    let firstErrorField = null;

    requiredFields.forEach(field => {
      let fieldValid = true;
      if (field.type === 'checkbox' && !field.checked) {
          fieldValid = false;
      } else if (field.type === 'radio') {
          // Check if any radio button in the group is checked
          const groupName = field.name;
          if (!document.querySelector(`input[name="${groupName}"]:checked`)) {
              // Mark only the first radio of the group as invalid for UI feedback
              if (field === document.querySelector(`input[name="${groupName}"]`)) {
                 fieldValid = false;
              } else {
                 fieldValid = true; // Don't mark subsequent radios in the same group
              }
          }
      } else if (!field.value || !field.value.trim()) {
          fieldValid = false;
      }

      const parentRow = field.closest('.row'); // Find the parent row for error message placement
      let errorMsgContainer = parentRow ? parentRow.querySelector('.error-message-container') : null;
      if (!errorMsgContainer && parentRow) {
          errorMsgContainer = document.createElement('div');
          errorMsgContainer.className = 'error-message-container';
          parentRow.appendChild(errorMsgContainer);
      }
      const existingError = errorMsgContainer ? errorMsgContainer.querySelector('.error-message') : null;

      if (!fieldValid) {
          isValid = false; 
          field.style.borderColor = '#da848c'; // Use CSS variable if defined: var(--error-color)
          if (!firstErrorField) {
              firstErrorField = field; // Keep track of the first error field
          }
          if (errorMsgContainer && !existingError) {
              const errorMsg = document.createElement('div');
              errorMsg.className = 'error-message';
              errorMsg.textContent = 'This field is required';
              errorMsg.style.cssText = 'color: #da848c; font-size: 12px; margin-top: 4px;';
              errorMsgContainer.appendChild(errorMsg);
          }
      } else {
          field.style.borderColor = ''; // Reset border color
          if (existingError) {
              existingError.remove(); // Remove error message if field is now valid
          }
      }
    });

    // Check static selects
    const categorySelect = document.getElementById('ticket_category_id');
    const formSelect = document.getElementById('ticket_form_id');
    const statusSelect = document.getElementById('ticket_status');

    [categorySelect, formSelect, statusSelect].forEach(select => {
        if (select && !select.value) {
            isValid = false;
            select.style.borderColor = '#da848c';
             if (!firstErrorField) {
                firstErrorField = select;
            }
            // Optionally add error message logic for selects too
        } else if (select) {
            select.style.borderColor = '';
        }
    });

    if (!isValid && firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Consider a more user-friendly notification than multiple alerts
        alert('Please fill in all required fields.'); 
    }
    
    return isValid;
  }, 
  
  // Get form data
  getFormData() {
    // Get selected values
    const categoryId = document.getElementById('ticket_category_id').value;
    const formId = document.getElementById('ticket_form_id').value;
    const statusId = document.getElementById('ticket_status').value;
    
    // Get dynamic form field values using FormRenderer's stored fields
    const formData = {};
    if (Array.isArray(FormRenderer.dynamicFormFields)) { // Access via FormRenderer
      FormRenderer.dynamicFormFields.forEach(field => {
        const element = document.querySelector(`.js-dynamic-form-fields [name="${field.name}"]`); // Scope query
        if (element) {
          let value = '';
          switch (field.type) {
            case 'checkbox':
              value = element.checked ? 'Yes' : 'No';
              break;
            case 'radio':
              const checkedRadio = document.querySelector(`.js-dynamic-form-fields input[name="${field.name}"]:checked`);
              value = checkedRadio ? checkedRadio.value : '';
              break;
            default:
              value = element.value;
          }
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