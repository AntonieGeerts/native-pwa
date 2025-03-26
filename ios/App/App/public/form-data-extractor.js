/**
 * Form Data Extractor
 * 
 * This script fetches all categories, forms, and fields from the API
 * and saves them to a JSON file for analysis.
 */

// Import the API service
const ApiService = {
  /**
   * Base API URL
   */
  baseUrl: '/app/api',
  
  /**
   * Get auth token with fallbacks
   */
  getToken() {
    // Try multiple possible token storage locations
    const token = localStorage.getItem('pwa_token') || 
                 localStorage.getItem('auth_token') || 
                 localStorage.getItem('user_session') || 
                 sessionStorage.getItem('pwa_token') || 
                 sessionStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No authentication token found in storage');
    }
    
    return token;
  },
  
  /**
   * Get default headers
   */
  getHeaders() {
    const token = this.getToken();
    return {
      'pwa_token': token,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  },
  
  /**
   * Make a GET request with enhanced error handling
   */
  async get(endpoint, options = {}) {
    try {
      console.log(`Making API request to: ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error: Token may be invalid or expired');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      
      if (options.returnEmptyOnError) {
        console.warn(`Returning empty data for ${endpoint} due to error`);
        return options.emptyValue || {};
      }
      
      throw error;
    }
  }
};

/**
 * Form Data Extractor
 */
const FormDataExtractor = {
  /**
   * Output file path
   */
  outputFile: 'form-data.json',
  
  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await ApiService.get('/ticket/ticket-category', {
        returnEmptyOnError: true,
        emptyValue: []
      });
      
      console.log(`Fetched ${response.length} categories`);
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  
  /**
   * Get all forms for a category
   */
  async getFormsForCategory(categoryId) {
    try {
      const response = await ApiService.get(`/ticket/ticket-form?category_id=${categoryId}`, {
        returnEmptyOnError: true,
        emptyValue: []
      });
      
      console.log(`Fetched ${response.length} forms for category ${categoryId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching forms for category ${categoryId}:`, error);
      return [];
    }
  },
  
  /**
   * Get form details
   */
  async getFormDetails(formId) {
    try {
      const response = await ApiService.get(`/ticket/ticket-form/${formId}`, {
        returnEmptyOnError: true,
        emptyValue: {}
      });
      
      console.log(`Fetched details for form ${formId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching details for form ${formId}:`, error);
      return {};
    }
  },
  
  /**
   * Count field types in a form
   */
  countFieldTypes(fields) {
    const counts = {};
    
    if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (field.type) {
          counts[field.type] = (counts[field.type] || 0) + 1;
        }
      });
    }
    
    return counts;
  },
  
  /**
   * Extract all form data
   */
  async extractAllData() {
    console.log('Starting form data extraction...');
    
    // Get all categories
    const categories = await this.getCategories();
    
    // Initialize result structure
    const result = {
      extractedAt: new Date().toISOString(),
      categories: []
    };
    
    // Process each category
    for (const category of categories) {
      console.log(`Processing category: ${category.name} (ID: ${category.id})`);
      
      const categoryData = {
        id: category.id,
        name: category.name,
        forms: []
      };
      
      // Get forms for this category
      const forms = await this.getFormsForCategory(category.id);
      
      // Process each form
      for (const form of forms) {
        console.log(`Processing form: ${form.name} (ID: ${form.id})`);
        
        // Get form details
        const formDetails = await this.getFormDetails(form.id);
        
        // Parse form fields
        let formFields = [];
        if (formDetails && formDetails.data) {
          if (typeof formDetails.data === 'string') {
            try {
              formFields = JSON.parse(formDetails.data);
            } catch (e) {
              console.error(`Error parsing form fields for form ${form.id}:`, e);
            }
          } else if (Array.isArray(formDetails.data)) {
            formFields = formDetails.data;
          }
        }
        
        // Count field types
        const fieldTypeCounts = this.countFieldTypes(formFields);
        
        // Add form data to category
        categoryData.forms.push({
          id: form.id,
          name: form.name,
          fieldCount: formFields.length,
          fieldTypeCounts: fieldTypeCounts,
          fields: formFields.map(field => ({
            name: field.name,
            type: field.type,
            label: field.label,
            required: field.required
          }))
        });
      }
      
      // Add category data to result
      result.categories.push(categoryData);
    }
    
    console.log('Form data extraction complete!');
    
    // Return the result
    return result;
  },
  
  /**
   * Save data to file
   */
  saveToFile(data) {
    try {
      // In a browser environment, create a download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = this.outputFile;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Data saved to ${this.outputFile}`);
      return true;
    } catch (error) {
      console.error('Error saving data to file:', error);
      return false;
    }
  },
  
  /**
   * Run the extractor
   */
  async run() {
    try {
      // Extract all data
      const data = await this.extractAllData();
      
      // Save to file
      this.saveToFile(data);
      
      return data;
    } catch (error) {
      console.error('Error running form data extractor:', error);
      throw error;
    }
  }
};

// Export the extractor
window.FormDataExtractor = FormDataExtractor;

// Log that the script is loaded
console.log('Form Data Extractor loaded. Run FormDataExtractor.run() to extract data.');