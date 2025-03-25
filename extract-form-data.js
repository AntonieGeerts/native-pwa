#!/usr/bin/env node

/**
 * Command-line script to extract form data
 * 
 * This script fetches all categories, forms, and fields from the API
 * and saves them to a JSON file for analysis.
 * 
 * Usage:
 *   node extract-form-data.js [output-file]
 * 
 * Example:
 *   node extract-form-data.js form-data.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: 'http://localhost/app/api',
  outputFile: process.argv[2] || 'form-data.json',
  token: process.env.API_TOKEN || ''
};

// Check if we have a token
if (!config.token) {
  console.warn('\nWARNING: No API token provided. Authentication may fail.');
  console.warn('To provide a token, set the API_TOKEN environment variable:');
  console.warn('  API_TOKEN=your_token_here node extract-form-data.js\n');
}

// API Service
const ApiService = {
  /**
   * Make a GET request
   */
  async get(endpoint) {
    return new Promise((resolve, reject) => {
      console.log(`Making API request to: ${config.baseUrl}${endpoint}`);
      
      // Determine if we're using http or https
      const httpModule = config.baseUrl.startsWith('https') ? https : http;
      
      // Parse URL
      const url = new URL(`${config.baseUrl}${endpoint}`);
      
      // Request options
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };
      
      // Add token if available
      if (config.token) {
        options.headers['pwa_token'] = config.token;
        options.headers['Authorization'] = `Bearer ${config.token}`;
      }
      
      // Make request
      const req = httpModule.request(options, (res) => {
        let data = '';
        
        // Handle response data
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // Handle response end
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (error) {
              reject(new Error(`Error parsing response: ${error.message}`));
            }
          } else {
            reject(new Error(`API error: ${res.statusCode}`));
          }
        });
      });
      
      // Handle request error
      req.on('error', (error) => {
        reject(error);
      });
      
      // End request
      req.end();
    });
  }
};

// Form Data Extractor
const FormDataExtractor = {
  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await ApiService.get('/ticket/ticket-category');
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
      const response = await ApiService.get(`/ticket/ticket-form?category_id=${categoryId}`);
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
      const response = await ApiService.get(`/ticket/ticket-form/${formId}`);
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
  saveToFile(data, filePath) {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write data to file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`Data saved to ${filePath}`);
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
      this.saveToFile(data, config.outputFile);
      
      // Print summary
      console.log('\nExtraction Summary:');
      console.log(`Categories: ${data.categories.length}`);
      
      let totalForms = 0;
      let totalFields = 0;
      let totalTextFields = 0;
      let totalParagraphs = 0;
      let totalHeaders = 0;
      
      data.categories.forEach(category => {
        totalForms += category.forms.length;
        
        category.forms.forEach(form => {
          totalFields += form.fields.length;
          
          // Count field types
          if (form.fieldTypeCounts) {
            totalTextFields += form.fieldTypeCounts.text || 0;
            totalParagraphs += form.fieldTypeCounts.paragraph || 0;
            totalHeaders += form.fieldTypeCounts.header || 0;
          }
        });
      });
      
      console.log(`Forms: ${totalForms}`);
      console.log(`Fields: ${totalFields}`);
      console.log(`Text Fields: ${totalTextFields}`);
      console.log(`Paragraphs: ${totalParagraphs}`);
      console.log(`Headers: ${totalHeaders}`);
      
      return data;
    } catch (error) {
      console.error('Error running form data extractor:', error);
      throw error;
    }
  }
};

// Run the extractor
FormDataExtractor.run()
  .then(() => {
    console.log(`\nForm data extraction completed successfully. Data saved to ${config.outputFile}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error extracting form data:', error);
    process.exit(1);
  });