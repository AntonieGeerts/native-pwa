/**
 * API Service
 * Handles all API connections for the application
 */

const ApiService = {
  /**
   * Base API URL
   * The Apache configuration has an alias for /app that points to /var/www/pmo-dev/pmo2__backend/public
   */
  baseUrl: '/app/api',
  
  /**
   * Get auth token
   * @returns {string} The authentication token
   */
  getToken() {
    return localStorage.getItem('pwa_token');
  },
  
  /**
   * Get default headers
   * @returns {Object} The default headers
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
   * Make a GET request
   * @param {string} endpoint - The API endpoint
   * @returns {Promise} The fetch promise
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a POST request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise} The fetch promise
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a PATCH request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise} The fetch promise
   */
  async patch(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - The API endpoint
   * @returns {Promise} The fetch promise
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }
};