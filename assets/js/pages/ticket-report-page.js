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
    
    // Initialize form
    this.initForm();
    
    // Initialize date pickers
    this.initDatePickers();
  },
  
  // Check if user is authenticated
  checkAuthentication() {
    const token = localStorage.getItem('pwa_token');
    if (!token) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  
  // Set up event listeners
  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
    
    // Collapsible headers
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const parent = header.parentElement;
        parent.classList.toggle('active');
      });
    });
    
    // Next button
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        // Find the next collapsible item
        const currentActive = document.querySelector('.collapsible li.active');
        const nextItem = currentActive.nextElementSibling;
        
        if (nextItem) {
          currentActive.classList.remove('active');
          nextItem.classList.add('active');
          
          // Scroll to the next item
          nextItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // If there's no next item, scroll to the comment section
          document.querySelector('.comment-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
    
    // Category select
    const categorySelect = document.getElementById('ticket_category_id');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        this.loadFormsByCategory(categorySelect.value);
      });
    }
    
    // Form select
    const formSelect = document.getElementById('ticket_form_id');
    if (formSelect) {
      formSelect.addEventListener('change', () => {
        this.loadFormFields(formSelect.value);
      });
    }
    
    // Take photo button
    const takePhotoBtn = document.getElementById('take-photo-btn');
    const cameraInput = document.getElementById('camera-input');
    if (takePhotoBtn && cameraInput) {
      takePhotoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cameraInput.click();
      });
      
      cameraInput.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files);
      });
    }
    
    // Upload photo button
    const uploadPhotoBtn = document.getElementById('upload-photo-btn');
    const fileInput = document.getElementById('file-input');
    if (uploadPhotoBtn && fileInput) {
      uploadPhotoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
      
      fileInput.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files);
      });
    }
    
    // Comment submit button
    const commentSubmitBtn = document.getElementById('comment-submit-btn');
    if (commentSubmitBtn) {
      commentSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submitComment();
      });
    }
    
    // Submit request button
    const submitRequestBtn = document.getElementById('submit-request-btn');
    if (submitRequestBtn) {
      submitRequestBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submitRequest();
      });
    }
  },
  
  // Initialize form
  initForm() {
    // Load categories
    this.loadCategories();
    
    // Load statuses
    this.loadStatuses();
    
    // Check if there's a pre-selected request type from the requests page
    const requestType = sessionStorage.getItem('search_filter_request');
    if (requestType) {
      console.log('Pre-selected request type:', requestType);
      // We'll use this to pre-select the appropriate category and form
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
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        categorySelect.innerHTML = '<option value="">Error loading categories</option>';
      });
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
    
    // Fetch forms from API
    TicketService.getFormsWithCategories()
      .then(data => {
        console.log('Forms fetched:', data);
        
        // Reset select
        formSelect.innerHTML = '<option value="">Choose form</option>';
        
        // Add forms to select
        if (data && Array.isArray(data)) {
          // Filter forms by category
          const categoryForms = data.filter(form => form.category_id == categoryId);
          
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
          console.warn('Forms data is not an array:', data);
          formSelect.innerHTML = '<option value="">Error: Invalid forms data</option>';
        }
      })
      .catch(error => {
        console.error('Error fetching forms:', error);
        formSelect.innerHTML = '<option value="">Error loading forms</option>';
      });
  },
  
  // Load statuses
  loadStatuses() {
    const statusSelect = document.getElementById('ticket_status');
    if (!statusSelect) return;
    
    // Show loading state
    statusSelect.innerHTML = '<option value="">Loading statuses...</option>';
    
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
        }
      })
      .catch(error => {
        console.error('Error fetching statuses:', error);
        statusSelect.innerHTML = '<option value="">Error loading statuses</option>';
      });
  },
  
  // Load form fields
  loadFormFields(formId) {
    const dynamicFormFields = document.querySelector('.js-dynamic-form-fields');
    if (!dynamicFormFields) return;
    
    // Clear existing fields
    dynamicFormFields.innerHTML = '<div class="row"><div class="label">Loading form fields...</div></div>';
    
    // If no form is selected, clear the dynamic fields
    if (!formId) {
      dynamicFormFields.innerHTML = '';
      return;
    }
    
    // Fetch form details from API
    TicketService.getForm(formId)
      .then(data => {
        console.log('Form details fetched:', data);
        
        // Clear existing fields
        dynamicFormFields.innerHTML = '';
        
        // Parse form data
        let formData = data.data;
        if (typeof formData === 'string') {
          formData = JSON.parse(formData);
        }
        
        // Store form fields for later use
        this.dynamicFormFields = formData;
        
        // Render form fields
        if (Array.isArray(formData)) {
          formData.forEach(field => {
            const fieldHtml = this.renderFormField(field);
            if (fieldHtml) {
              dynamicFormFields.innerHTML += fieldHtml;
            }
          });
        }
        
        // Special handling for certain form types
        if (data.name.toLowerCase().includes('visitor') || data.name.toLowerCase().includes('gate pass')) {
          document.querySelector('.js-generate-qr-info-visitors').style.display = 'block';
          document.querySelector('.js-generate-qr-info-dates').style.display = 'block';
        } else {
          document.querySelector('.js-generate-qr-info-visitors').style.display = 'none';
          document.querySelector('.js-generate-qr-info-dates').style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Error fetching form details:', error);
        dynamicFormFields.innerHTML = '<div class="row"><div class="label">Error loading form fields</div></div>';
      });
  },
  
  // Render form field
  renderFormField(field) {
    if (!field || !field.type) return '';
    
    let html = '';
    const required = field.required ? '<span style="color:#da848c">*</span>' : '';
    
    switch (field.type) {
      case 'header':
        html = `
          <div class="row">
            <div class="header" style="font-size:18px; font-weight:600; margin-bottom:16px;">${field.label || 'Header'}</div>
          </div>
        `;
        break;
        
      case 'paragraph':
        html = `
          <div class="row">
            <div class="paragraph-container">
              <div class="js-paragraph">${field.label || ''}</div>
            </div>
          </div>
        `;
        break;
        
      case 'text':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Text'}&nbsp;${required}</div>
            <div class="text-container">
              <input type="text" name="${field.name}" ${field.required ? 'required' : ''}>
            </div>
          </div>
        `;
        break;
        
      case 'textarea':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Textarea'}&nbsp;${required}</div>
            <div class="textarea-container">
              <textarea name="${field.name}" ${field.required ? 'required' : ''}></textarea>
            </div>
          </div>
        `;
        break;
        
      case 'select':
        let options = '';
        if (field.values && Array.isArray(field.values)) {
          options = field.values.map(value => `<option value="${value.value}">${value.label}</option>`).join('');
        }
        
        html = `
          <div class="row">
            <div class="label">${field.label || 'Select'}&nbsp;${required}</div>
            <div class="select-container">
              <select name="${field.name}" ${field.required ? 'required' : ''}>
                <option value="">Choose option</option>
                ${options}
              </select>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
        `;
        break;
        
      case 'checkbox-group':
        let checkboxes = '';
        if (field.values && Array.isArray(field.values)) {
          checkboxes = field.values.map(value => `
            <div class="checkbox-item">
              <input type="checkbox" name="${field.name}" value="${value.value}" id="${field.name}_${value.value}">
              <label for="${field.name}_${value.value}">${value.label}</label>
            </div>
          `).join('');
        }
        
        html = `
          <div class="row">
            <div class="label">${field.label || 'Checkbox'}&nbsp;${required}</div>
            <div class="checkbox-container">
              ${checkboxes}
            </div>
          </div>
        `;
        break;
        
      case 'thedate':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Date'}&nbsp;${required}</div>
            <div class="date-container">
              <input type="text" name="${field.name}" class="datepicker" ${field.required ? 'required' : ''}>
              <i class="far fa-calendar-alt"></i>
            </div>
          </div>
        `;
        break;
        
      case 'thetime':
        html = `
          <div class="row">
            <div class="label">${field.label || 'Time'}&nbsp;${required}</div>
            <div class="time-container">
              <input type="text" name="${field.name}" class="timepicker" ${field.required ? 'required' : ''}>
              <i class="far fa-clock"></i>
            </div>
          </div>
        `;
        break;
        
      default:
        return '';
    }
    
    return html;
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
    
    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Process each file
    fileArray.forEach(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.error('File is not an image:', file.name);
        return;
      }
      
      // Create a FileReader to read the file
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.querySelector('.js-temp-canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data URL
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Add to file URLs
          this.fileUrls.push({
            url: imageDataUrl,
            name: file.name,
            type: file.type
          });
          
          // Show preview
          this.showImagePreview(imageDataUrl, file.name);
        };
      };
      
      reader.readAsDataURL(file);
    });
  },
  
  // Show image preview
  showImagePreview(imageUrl, fileName) {
    // Create a preview element
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.cssText = `
      margin: 16px 0;
      background-color: var(--card-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    img.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
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
      categorySelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    
    if (!formSelect.value) {
      isValid = false;
      alert('Please select a form type');
      formSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    
    if (!statusSelect.value) {
      isValid = false;
      alert('Please select a status');
      statusSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    
    return isValid;
  },
  
  // Get form data
  getFormData() {
    // Get basic form data
    const categoryId = document.getElementById('ticket_category_id').value;
    const formId = document.getElementById('ticket_form_id').value;
    const statusId = document.getElementById('ticket_status').value;
    
    // Get dynamic form fields data
    const formData = {};
    
    // Process each dynamic field
    this.dynamicFormFields.forEach(field => {
      if (!field.name) return;
      
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'select':
        case 'thedate':
        case 'thetime':
          const input = document.querySelector(`[name="${field.name}"]`);
          if (input) {
            formData[field.name] = input.value;
          }
          break;
          
        case 'checkbox-group':
          const checkboxes = document.querySelectorAll(`[name="${field.name}"]:checked`);
          formData[field.name] = Array.from(checkboxes).map(cb => cb.value);
          break;
      }
    });
    
    // Get visitor data if visible
    const visitorsContainer = document.querySelector('.js-generate-qr-info-visitors');
    if (visitorsContainer && visitorsContainer.style.display !== 'none') {
      const visitorRows = visitorsContainer.querySelectorAll('tbody tr');
      const visitors = [];
      
      visitorRows.forEach(row => {
        const nameInput = row.querySelector('td:nth-child(1) input');
        const emailInput = row.querySelector('td:nth-child(2) input');
        
        if (nameInput && emailInput && nameInput.value.trim()) {
          visitors.push({
            name: nameInput.value.trim(),
            email: emailInput.value.trim()
          });
        }
      });
      
      formData.visitors = visitors;
    }
    
    // Get visit dates if visible
    const visitDatesContainer = document.querySelector('.js-generate-qr-info-dates');
    if (visitDatesContainer && visitDatesContainer.style.display !== 'none') {
      const visitDatesInput = document.getElementById('visit-dates');
      if (visitDatesInput && visitDatesInput.value) {
        formData.visit_dates = visitDatesInput.value.split(',').map(date => date.trim());
      }
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