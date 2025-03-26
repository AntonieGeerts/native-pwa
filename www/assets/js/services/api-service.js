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
    // TEMPORARY MODIFICATION FOR LOCAL PWA TESTING: Always use absolute URL
    console.log('DEBUG: Forcing absolute API URL for testing');
    return 'https://new-app.managedpmo.com/app/api';
    /*
    // Check if running in a native app
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // Use absolute URL for native apps, relative URL for web
    if (isNative) {
      // Use the correct API URL for native apps
      console.log('Using absolute API URL for native app');
      return 'https://new-app.managedpmo.com/app/api';
    } else {
      // Use relative URL for web
      console.log('Using relative API URL for web');
      return '/app/api';
    }
    */
  },
  
  /**
   * Get full URL for an endpoint (for use in native apps)
   * @param {string} endpoint - The API endpoint
   * @returns {string} The full URL
   */
  getFullUrl(endpoint) {
    // Check if running in a native app
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // Always use absolute URL for native apps, relative URL for web
    if (isNative) {
      // For native apps, ensure we use the correct base API URL
      const baseUrl = 'https://new-app.managedpmo.com/app/api'; // Correct base URL
      // Construct the full URL
      let fullUrl = `${baseUrl}${endpoint}`; // Use endpoint directly

      // Add a timestamp to prevent caching issues (optional, but keep for consistency)
      const timestamp = Date.now();
      const separator = fullUrl.includes('?') ? '&' : '?';
      return `${fullUrl}${separator}_t=${timestamp}`;
    } else {
      // For web, we can use relative URLs
      // Ensure endpoint starts with /app/api if it doesn't already
      if (!endpoint.startsWith('/app/api')) {
        // Avoid double slashes if endpoint already starts with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return `/app/api/${cleanEndpoint}`;
      }
      return endpoint;
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
   * @param {boolean} isNative - Flag indicating if the request is from a native context
   * @returns {Object} The default headers
   */
  getHeaders(isNative = false) { // Accept flag
    const token = this.getToken();
    
    // Basic headers for all requests
    const headers = {
      // Use dash instead of underscore for custom header
      'Pwa-Token': token,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Add cache control headers for native apps to prevent caching issues
    // Note: CapacitorHttp might handle caching differently, but keep for fetch fallback
    if (isNative) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // Remove Content-Type for GET requests when using CapacitorHttp? Sometimes needed.
    // Let's keep it for now unless issues arise.

    return headers;
  },
  
  /**
   * Make a GET request with enhanced error handling, using CapacitorHttp if native
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
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

    try {
      // Check for authentication before making request
      const token = this.getToken();
      if (!token && !options.allowNoAuth) {
        console.warn(`[${requestId}] No authentication token available for request to ${endpoint}`);
      }
      
      // Construct the URL correctly based on environment
      let fullUrl;
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        // Endpoint is already an absolute URL, use it directly
        fullUrl = endpoint;
      } else {
        // Endpoint is relative, prepend the base URL
        const relativeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        fullUrl = `${this.baseUrl}${relativeEndpoint}`;
      }
      
      // Add cache-busting timestamp for native GET requests (CapacitorHttp might ignore cache headers)
      if (isNative) {
        const timestamp = Date.now();
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl = `${fullUrl}${separator}_t=${timestamp}`;
      }
      
      // *** DEBUG LOGGING: Check final URL before request ***
      console.log(`[${requestId}] Final URL for ${endpoint}: ${fullUrl}`);
      // *** END DEBUG LOGGING ***

      // Determine if Capacitor HTTP plugin is available and should be used
      const capacitorHttpAvailable = isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Http;
      console.log(`[${requestId}] Capacitor HTTP available check: ${capacitorHttpAvailable}`); // DEBUG LOG

      // Enhanced logging for debugging
      console.log(`[${requestId}] Making API GET request to: ${fullUrl}`, {
        isMobile: isMobileDevice,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        token: token ? `${token.substring(0, 5)}...` : 'none',
        isNative: isNative,
        usingCapHttp: capacitorHttpAvailable // Log if actually using Capacitor Http
      });
      
      // Logger calls remain the same...
      if (window.Logger && endpoint.includes('/ticket/ticket-form/') && isMobileDevice) {
        Logger.info(`[${requestId}] Mobile form request details`, { /* ... */ });
      }
      
      let responseData;
      let responseStatus;
      let responseHeaders;

      if (capacitorHttpAvailable) {
        // Use Capacitor Http for native
        console.log(`[${requestId}] Using Capacitor Http plugin.`);
        const { Http } = Capacitor.Plugins; 
        try {
          const response = await Http.request({
            method: 'GET',
            url: fullUrl,
            headers: this.getHeaders(true), // Pass native flag
            connectTimeout: isMobileDevice ? 30000 : 60000,
            readTimeout: isMobileDevice ? 30000 : 60000,
          });
          responseData = response.data; 
          responseStatus = response.status;
          responseHeaders = response.headers;
        } catch (error) {
          // Capacitor Http throws on network errors or non-2xx status
          console.error(`[${requestId}] CapacitorHttp GET error:`, error);
          // Try to extract status code if available in the error object
          responseStatus = error.status || 500; // Default to 500 if status unknown
          responseData = error.data || error.message; // Use error data or message
          // Error will be handled by centralized logic below
        }
      } else {
        // Use standard fetch for web OR as fallback if native plugin not ready
        if (isNative) {
           console.warn(`[${requestId}] Capacitor Http plugin not available or ready, falling back to fetch.`);
        }
        console.log(`[${requestId}] Using standard fetch API.`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), isMobileDevice ? 30000 : 60000); 
        
        try {
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: this.getHeaders(false), // Pass native flag
            cache: 'no-store',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          responseStatus = response.status;
          responseHeaders = Object.fromEntries([...response.headers.entries()]); // Normalize headers

          // Get text first to check for HTML or parse JSON
          const responseText = await response.text();
          if (response.ok) {
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
              console.error(`[${requestId}] Fetch received HTML instead of JSON. Status: ${responseStatus}`);
              responseData = responseText; // Keep HTML to trigger error handling
            } else {
              try {
                responseData = JSON.parse(responseText);
              } catch (parseError) {
                console.error(`[${requestId}] Fetch failed to parse JSON:`, parseError);
                responseData = `Parse Error: ${parseError.message}. Response: ${responseText.substring(0,100)}`;
                responseStatus = 500; // Treat parse error as server error
              }
            }
          } else {
             // Store error text for non-ok fetch responses
             responseData = responseText;
          }
        } catch (error) {
           // Handle fetch-specific errors (e.g., network, abort)
           clearTimeout(timeoutId); // Ensure timeout is cleared
           console.error(`[${requestId}] Fetch GET error:`, error);
           responseStatus = error.name === 'AbortError' ? 408 : 503; // Timeout or Network error
           responseData = error.message;
           // Error will be handled by centralized logic below
        }
      }
      
      // --- Centralized Response Handling ---
      const responseTime = performance.now() - startTime;
      console.log(`[${requestId}] Response received in ${responseTime.toFixed(2)}ms. Status: ${responseStatus}`);
      
      // Logger calls remain the same...
      if (isMobileDevice && window.Logger && endpoint.includes('/ticket/ticket-form/')) {
        Logger.info(`[${requestId}] Mobile form response details`, { 
            status: responseStatus, 
            responseTime: `${responseTime.toFixed(2)}ms`,
            headers: JSON.stringify(responseHeaders) 
        });
      }
      
      const isSuccess = responseStatus >= 200 && responseStatus < 300;
      const isHtmlError = typeof responseData === 'string' && (responseData.trim().startsWith('<!DOCTYPE') || responseData.trim().startsWith('<html'));

      if (isSuccess && !isHtmlError) {
        // Successful JSON response
        return responseData;
      } else {
        // Handle errors (HTML response, non-2xx status, network error)
        let errorMessage = `API Error Status: ${responseStatus}`;
        if (isHtmlError) {
          errorMessage = 'Server returned HTML instead of JSON.';
          console.error(`[${requestId}] ${errorMessage} First 200 chars:`, responseData.substring(0, 200));
        } else {
          // Log non-HTML error response data
          console.error(`[${requestId}] API Error Response Data:`, responseData);
          // Try to extract a message from the response data if it's an object or string
          if (typeof responseData === 'object' && responseData !== null && responseData.message) {
            errorMessage = responseData.message;
          } else if (typeof responseData === 'string') {
            // Append response string if it's not too long, otherwise just use status
            errorMessage = `${errorMessage} - ${responseData.substring(0, 100)}`; 
          }
        }

        // Special handling for 401
        if (responseStatus === 401) {
          console.error(`[${requestId}] Authentication error (401). Token may be invalid or expired.`);
          // Optionally trigger logout or token refresh here
          // Allow fallback if options permit
          if (!options.returnEmptyOnError) {
             throw new Error(errorMessage); // Re-throw if not handling gracefully
          }
        } else if (!options.returnEmptyOnError) {
           // Throw for other errors if not returning empty
           throw new Error(errorMessage);
        }

        // If we reach here, it means returnEmptyOnError is true
        console.warn(`[${requestId}] Returning empty data for ${endpoint} due to error (Status: ${responseStatus})`);
        return options.emptyValue || {};
      }

    } catch (error) { // Catch errors thrown explicitly (e.g., from new Error)
      // Log errors that were explicitly thrown or missed by inner catches
      const errorTime = performance.now() - startTime;
      console.error(`[${requestId}] Final catch block error for ${endpoint} after ${errorTime.toFixed(2)}ms:`, error);
      
      // Log details if Logger is available
      if (isMobileDevice && window.Logger) {
        Logger.error(`[${requestId}] Mobile API final error details`, {
          endpoint: endpoint,
          errorType: error.name || 'Unknown',
          errorMessage: error.message || 'No error message',
          errorTime: `${errorTime.toFixed(2)}ms`,
          stack: error.stack,
          userAgent: navigator.userAgent
        });
      }
      
      // Handle final return/throw based on options
      if (options.returnEmptyOnError) {
        console.warn(`[${requestId}] Returning empty data for ${endpoint} due to final catch`);
        return options.emptyValue || {};
      }
      
      throw error; // Re-throw the final error
    }
  }, 
  
  /**
   * Make a POST request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise} The fetch promise
   */
  async post(endpoint, data) {
    // TODO: Refactor to use Capacitor Http if native
    try {
      // Get the full URL for the request
      const fullUrl = this.getFullUrl(`${this.baseUrl}${endpoint}`); // getFullUrl already includes baseUrl
      console.log(`Making POST request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      console.log(`POST response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get more information about the error
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the response as JSON, try to get the text
          try {
            const errorText = await response.text();
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            // If we can't get the text either, just use the status
          }
        }
        throw new Error(errorMessage);
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
    // TODO: Refactor to use Capacitor Http if native
    try {
      // Get the full URL for the request
      const fullUrl = this.getFullUrl(`${this.baseUrl}${endpoint}`); // getFullUrl already includes baseUrl
      console.log(`Making PATCH request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      console.log(`PATCH response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get more information about the error
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the response as JSON, try to get the text
          try {
            const errorText = await response.text();
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            // If we can't get the text either, just use the status
          }
        }
        throw new Error(errorMessage);
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
    // TODO: Refactor to use Capacitor Http if native
    try {
      // Get the full URL for the request
      const fullUrl = this.getFullUrl(`${this.baseUrl}${endpoint}`); // getFullUrl already includes baseUrl
      console.log(`Making DELETE request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      console.log(`DELETE response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get more information about the error
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the response as JSON, try to get the text
          try {
            const errorText = await response.text();
            errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            // If we can't get the text either, just use the status
          }
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }
};

// Expose ApiService globally
window.ApiService = ApiService;