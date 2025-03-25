/**
 * API Service
 * Handles all API connections for the application
 */

const ApiService = {
  /**
   * Base API URL
   * The Apache configuration has an alias for /app that points to /var/www/pmo-dev/pmo2__backend/public
   * For native mobile apps, we need to use the full URL
   */
  get baseUrl() {
    // Check if running in a native app
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // Use absolute URL for native apps, relative URL for web
    if (isNative) {
      // Try different API URLs for native apps
      console.log('Using API URL for native app');
      return 'https://app.managedpmo.com/api';
    } else {
      // Use relative URL for web
      console.log('Using relative API URL for web');
      return '/app/api';
    }
  },
  
  /**
   * Get auth token with fallbacks
   * @returns {string} The authentication token
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
   * Make a GET request with enhanced error handling
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise} The fetch promise
   */
  async get(endpoint, options = {}) {
    const startTime = performance.now();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (window.CapacitorApp && window.CapacitorApp.isNativePlatform());
    
    // Create a unique request ID for tracking
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      // Check for authentication before making request
      const token = this.getToken();
      if (!token && !options.allowNoAuth) {
        console.warn(`[${requestId}] No authentication token available for request to ${endpoint}`);
      }
      
      // Enhanced logging for debugging
      console.log(`[${requestId}] Making API request to: ${this.baseUrl}${endpoint}`, {
        isMobile: isMobileDevice,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        token: token ? `${token.substring(0, 5)}...` : 'none'
      });
      
      if (window.Logger && endpoint.includes('/ticket/ticket-form/') && isMobileDevice) {
        Logger.info(`[${requestId}] Mobile form request details`, {
          endpoint: endpoint,
          fullUrl: `${this.baseUrl}${endpoint}`,
          headers: JSON.stringify(this.getHeaders()),
          timestamp: new Date().toISOString(),
          memoryUsage: window.performance && window.performance.memory ?
            `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)}MB` :
            'unavailable'
        });
      }
      
      // Make the request with timeout for mobile devices
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobileDevice ? 30000 : 60000); // 30s timeout for mobile
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log response time
      const responseTime = performance.now() - startTime;
      console.log(`[${requestId}] Response received in ${responseTime.toFixed(2)}ms`);
      
      if (isMobileDevice && window.Logger && endpoint.includes('/ticket/ticket-form/')) {
        Logger.info(`[${requestId}] Mobile form response details`, {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime.toFixed(2)}ms`,
          headers: JSON.stringify(Object.fromEntries([...response.headers.entries()]))
        });
      }
      
      // Handle response status
      if (!response.ok) {
        // Check for authentication errors
        if (response.status === 401) {
          console.error(`[${requestId}] Authentication error: Token may be invalid or expired`);
          // Don't throw here to allow fallback behavior
        } else {
          throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
      }
      
      // Parse response with timing
      const parseStartTime = performance.now();
      const data = await response.json();
      const parseTime = performance.now() - parseStartTime;
      
      if (isMobileDevice && window.Logger && endpoint.includes('/ticket/ticket-form/')) {
        Logger.info(`[${requestId}] Mobile form data parsing details`, {
          parseTime: `${parseTime.toFixed(2)}ms`,
          dataSize: JSON.stringify(data).length,
          hasData: !!data,
          dataType: typeof data,
          isArray: Array.isArray(data)
        });
      }
      
      return data;
    } catch (error) {
      const errorTime = performance.now() - startTime;
      const errorType = error.name || 'Unknown';
      const errorMessage = error.message || 'No error message';
      const isTimeout = errorType === 'AbortError' || errorMessage.includes('timeout');
      
      console.error(`[${requestId}] Error fetching ${endpoint} after ${errorTime.toFixed(2)}ms:`, error);
      
      if (isMobileDevice && window.Logger) {
        Logger.error(`[${requestId}] Mobile API error details`, {
          endpoint: endpoint,
          errorType: errorType,
          errorMessage: errorMessage,
          errorTime: `${errorTime.toFixed(2)}ms`,
          isTimeout: isTimeout,
          stack: error.stack,
          userAgent: navigator.userAgent
        });
        
        // For ticket form endpoints, log additional diagnostic information
        if (endpoint.includes('/ticket/ticket-form/')) {
          Logger.error(`[${requestId}] Mobile form request failure diagnostics`, {
            networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            isOnline: navigator.onLine,
            memoryUsage: window.performance && window.performance.memory ?
              `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)}MB` :
              'unavailable',
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Return empty data instead of throwing to prevent UI crashes
      if (options.returnEmptyOnError) {
        console.warn(`[${requestId}] Returning empty data for ${endpoint} due to error`);
        return options.emptyValue || {};
      }
      
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