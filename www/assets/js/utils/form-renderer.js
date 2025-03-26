/**
 * Form Renderer Utility
 * Handles rendering dynamic form fields based on API data,
 * including lazy loading and mobile optimizations.
 */
const FormRenderer = {

  // Store dynamic fields temporarily during rendering/submission
  dynamicFormFields: [], 

  // Memory-optimized lazy loading of form fields (Field-by-field rendering)
  renderFormFieldsLazy(data, dynamicFormFieldsContainer, isMobileDevice) {
    const renderStartTime = performance.now();
    const renderSessionId = `render_${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      // Log rendering start
      if (window.Logger) {
        Logger.info(`[${renderSessionId}] Starting form field rendering`, { 
            formName: data.name, 
            formId: data.id, 
            isMobile: isMobileDevice, 
            timestamp: new Date().toISOString(),
            memoryBefore: window.performance && window.performance.memory ? `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB` : 'unavailable' 
        });
      }
      
      dynamicFormFieldsContainer.innerHTML = ''; // Clear previous
      
      let formData = data.data;
      if (typeof formData === 'string') {
        try {
          formData = JSON.parse(formData);
        } catch (e) {
          if (window.Logger) Logger.error(`[${renderSessionId}] Error parsing form data`, { error: e.message });
          formData = [];
        }
      }
      
      // Store minimal field data
      this.dynamicFormFields = formData ? formData.map(field => ({
        name: field.name, type: field.type, label: field.label, required: field.required, options: field.options
      })) : [];
      if (window.Logger) Logger.debug('Stored minimal form field data', { fieldCount: this.dynamicFormFields.length });

      if (!Array.isArray(formData) || formData.length === 0) {
         dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">No fields defined for this form.</div></div>';
         if (window.Logger) Logger.warn(`[${renderSessionId}] No fields to render for formId: ${data.id}`);
         return;
      }

      const allFields = formData;
      const totalFields = allFields.length;
      const fieldDelay = isMobileDevice ? 50 : 10; 
      if (window.Logger) Logger.info('Field-by-field rendering configuration', { fieldDelay, isMobileDevice, totalFields });

      // Render fields one by one
      const renderNextField = (index = 0) => {
        if (index >= totalFields) {
          if (window.Logger) Logger.info(`[${renderSessionId}] Form rendering completed successfully`, { totalFieldsRendered: totalFields, totalRenderTime: `${(performance.now() - renderStartTime).toFixed(2)}ms` });
          // Re-initialize date/time pickers globally after all fields are added
          this.initializePickers(dynamicFormFieldsContainer); 
          return;
        }
        
        const field = allFields[index];
        const fieldElement = this.createFormField(field, isMobileDevice); // Pass isMobileDevice
        if (fieldElement) {
          dynamicFormFieldsContainer.appendChild(fieldElement);
        }

        setTimeout(() => {
          const currentTime = performance.now();
          const totalExecutionTime = currentTime - renderStartTime;
          if (totalExecutionTime > 20000) { // Timeout check
            if (window.Logger) Logger.warn('Rendering taking too long, stopping...', { totalExecutionTime: `${Math.round(totalExecutionTime)}ms`, fieldsRendered: index + 1, totalFields });
            const warningElement = document.createElement('div');
            warningElement.className = 'row';
            warningElement.innerHTML = `<div class="label p-form-label">Form rendering stopped</div><div class="p-form-text" style="padding: 12px; color: #666;"><p>Form rendering took too long.</p></div>`;
            dynamicFormFieldsContainer.appendChild(warningElement);
            return; 
          }
          renderNextField(index + 1);
        }, fieldDelay);
      };
      
      renderNextField(); // Start rendering

    } catch (error) {
      if (window.Logger) Logger.error('Error in renderFormFieldsLazy', { error: error.message, stack: error.stack, formId: data.id });
      dynamicFormFieldsContainer.innerHTML = '<div class="row"><div class="label p-form-label">Error rendering form fields</div></div>';
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

  // Create a form field element
  createFormField(field, isMobileDevice) { 
    const fieldHtml = this.renderFormField(field, isMobileDevice); 
    if (!fieldHtml) return null;
    const tempContainer = document.createElement('div');
    // Use innerHTML carefully, ensure fieldHtml is properly escaped if needed
    tempContainer.innerHTML = fieldHtml.trim(); 
    return tempContainer.firstElementChild;
  },

  // Initialize date/time pickers within a container
  initializePickers(container) {
      try {
          const datePickers = container.querySelectorAll('.datepicker:not([class*="_flatpickr"])');
          datePickers.forEach(picker => {
              if (!picker._flatpickr) { // Double check instance doesn't exist
                  flatpickr(picker, { dateFormat: 'Y-m-d', allowInput: true });
              }
          });

          const timePickers = container.querySelectorAll('.timepicker:not([class*="_flatpickr"])');
          timePickers.forEach(picker => {
               if (!picker._flatpickr) {
                  flatpickr(picker, { enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true });
               }
          });
          if (window.Logger) Logger.info('Flatpickr initialized for rendered fields.');
      } catch(error) {
          console.error("Error initializing flatpickr:", error);
          if (window.Logger) Logger.error("Error initializing flatpickr", { error: error.message });
      }
  },

  // Render HTML string for a single form field
  renderFormField(field, isMobileDevice) { 
    let html = '';
    const required = field.required ? '<span style="color:#da848c">*</span>' : '';
    const fieldName = field.name || `field_${Math.random().toString(36).substring(2, 10)}`; // Ensure name exists
    
    try {
      switch (field.type) {
        case 'text':
          html = `
            <div class="row">
              <div class="label p-form-label">${field.label || 'Text'}&nbsp;${required}</div>
              <div class="text-container">
                <input type="text" name="${fieldName}" class="p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
              </div>
            </div>
          `;
          break;
        case 'textarea':
          html = `
            <div class="row">
              <div class="label p-form-label">${field.label || 'Text Area'}&nbsp;${required}</div>
              <div class="textarea-container">
                <textarea name="${fieldName}" class="p-form-text p-form-no-validate" rows="4" ${field.required ? 'required' : ''}></textarea>
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
                <select name="${fieldName}" class="p-form-no-validate" ${field.required ? 'required' : ''}>
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
                 <input type="checkbox" name="${fieldName}" id="${fieldName}" ${field.required ? 'required' : ''}>
                 <span></span>
                 <label for="${fieldName}">${field.label || 'Checkbox'}&nbsp;${required}</label>
               </div>
             </div>
           `;
           break;
        case 'radio':
           let radioOptions = '';
           if (field.options && Array.isArray(field.options)) {
             radioOptions = field.options.map((option, index) => `
               <div class="p-form-radio-cont">
                 <input type="radio" name="${fieldName}" id="${fieldName}_${index}" value="${option.value || ''}" ${index === 0 && field.required ? 'required' : ''}>
                 <span></span>
                 <label for="${fieldName}_${index}">${option.label || ''}</label>
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
                 <input type="text" name="${fieldName}" class="datepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
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
                 <input type="text" name="${fieldName}" class="timepicker p-form-text p-form-no-validate" ${field.required ? 'required' : ''}>
                 <i class="far fa-clock"></i>
               </div>
             </div>
           `;
           break;
        case 'signature':
           // Note: Signature pad initialization might need separate handling
           html = `
             <div class="row">
               <div class="label p-form-label">${field.label || 'Signature'}&nbsp;${required}</div>
               <div class="signature-container">
                 <canvas class="signature-canvas" data-name="${fieldName}" width="300" height="200"></canvas>
                 <div class="signature-buttons">
                   <button type="button" class="signature-btn p-form-send js-sign-signature">Sign</button>
                   <button type="button" class="signature-btn p-form-send js-clear-signature" style="display:none">Clear</button>
                 </div>
               </div>
             </div>
           `;
           break;
        case 'paragraph':
           // Using simplified rendering for now
           let paragraphContent = '<p><i>Paragraph content rendering simplified for debugging.</i></p>';
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
           break;
        case 'header': 
           html = `
             <div class="row">
               <div class="section-header" style="font-weight: 600; font-size: 16px; margin: 16px 0 8px 0; color: var(--primary-color);">
                 ${field.label || 'Section'}
               </div>
             </div>
           `;
           break;
        // Add cases for other field types if necessary (e.g., 'unit', 'tag', 'grid', 'productcheckout', 'propertyfacility', 'thedatetime')
        default:
          console.warn(`Unsupported field type: ${field.type}`);
          return '';
      }
      return html;
    } catch (error) {
      console.error('Error rendering form field:', error, field);
      return `<div class="row"><div class="label p-form-label">Error rendering field: ${field.name || 'Unknown'}</div></div>`;
    }
  }
};