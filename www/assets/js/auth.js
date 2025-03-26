/**
 * Authentication utilities for PMO Native App
 * Handles login, logout, and token management
 */

// Get API base URL based on environment
function getApiBaseUrl() {
  // Check if running in a native app
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  
  // Always use absolute URL for native apps, relative URL for web
  if (isNative) {
    // Use the correct API URL for native apps
    console.log('Using absolute API URL for native app');
    return 'https://new-app.managedpmo.com/app/api';
  } else {
    // Use relative URL for web
    console.log('Using relative API URL for web');
    return '/app/api';
  }
}

// Get full API URL (for use in native apps)
function getFullApiUrl(endpoint) {
  // Check if running in a native app
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  
  // Always use absolute URL for native apps, relative URL for web
  if (isNative) {
    // For native apps, ensure we have a full URL
    const baseUrl = 'https://new-app.managedpmo.com';
    // Remove any leading slashes from the endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  } else {
    // For web, we can use relative URLs
    return endpoint;
  }
}

// Authentication endpoints
const AUTH_ENDPOINTS = {
  get LOGIN() {
    // Check if running in a native app
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    
    if (isNative) {
      // For native apps, use the full URL
      console.log('Using native login URL');
      // Try a different URL format
      return 'https://new-app.managedpmo.com/app/api/auth/login-pwa';
    } else {
      // For web, use the relative URL
      console.log('Using web login URL');
      return `${getApiBaseUrl()}/auth/login-pwa`;
    }
  },
  get LOGOUT() {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    return isNative ? 'https://new-app.managedpmo.com/app/api/auth/logout' : `${getApiBaseUrl()}/auth/logout`;
  },
  get CHECK_STATUS() {
    // Use the endpoint that fetches user data, implicitly checking auth
    // Hardcode the full URL to ensure correctness during auth check
    return 'https://new-app.managedpmo.com/app/api/pcache/main/users/my_account_get';
  },
  get RENEW_TOKEN() {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    return isNative ? 'https://new-app.managedpmo.com/app/api/auth/login-pwa-renew' : `${getApiBaseUrl()}/auth/login-pwa-renew`;
  }
};

/**
 * Perform login with username and password
 * @param {string} username - Username or unit number
 * @param {string} password - User password
 * @returns {Promise} - Promise resolving to login response
 */
async function login(username, password) {
  try {
    // Check if running in a native app
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    console.log('Is native platform:', isNative);
    console.log('Capacitor available:', !!window.Capacitor);
    console.log('CapacitorHttp available:', !!(window.Capacitor && (window.Capacitor.Plugins.CapacitorHttp || window.CapacitorApp.plugins.CapacitorHttp)));
    
    // Use a consistent URL format for both native and web
    // For native apps, ensure we're using the full URL with the correct path
    // TEMPORARY MODIFICATION FOR PWA TESTING: Always use absolute URL
    const loginUrl = 'https://new-app.managedpmo.com/app/api/auth/login-pwa';
    // const loginUrl = isNative ? 'https://new-app.managedpmo.com/app/api/auth/login-pwa' : AUTH_ENDPOINTS.LOGIN; // Original logic
    console.log('Final login URL (forced absolute):', loginUrl);
    
    let response;
    
    // Determine if Capacitor HTTP plugin is available
    const capacitorHttpAvailable = isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Http;

    if (capacitorHttpAvailable) {
      // Use CapacitorHttp plugin for native apps
      console.log('Using CapacitorHttp for login request');
      
      try {
        const httpPlugin = window.Capacitor.Plugins.CapacitorHttp || window.CapacitorApp.plugins.CapacitorHttp;
        console.log('HTTP Plugin found:', !!httpPlugin);
        
        // Skip the test request and go directly to the login request
        console.log('Sending login request to:', loginUrl);
        
        // Add a timestamp to prevent caching issues
        const timestampedUrl = `${loginUrl}?_t=${Date.now()}`;
        console.log('Using timestamped URL:', timestampedUrl);
        
        const result = await httpPlugin.post({
          url: timestampedUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          data: {
            username,
            password
          }
        });
        
        console.log('CapacitorHttp response status:', result.status);
        console.log('CapacitorHttp response headers:', result.headers);
        
        // Enhanced response handling with better logging
        console.log('CapacitorHttp response received, status:', result.status);
        
        // Check if the response is JSON
        let responseData = result.data;
        if (typeof responseData === 'string') {
          console.log('Response is string, attempting to parse as JSON');
          try {
            // Check if the response starts with HTML
            if (responseData.trim().startsWith('<!DOCTYPE') || responseData.trim().startsWith('<html')) {
              console.error('Received HTML instead of JSON. First 200 chars:', responseData.substring(0, 200));
              throw new Error('Server returned HTML instead of JSON. This usually indicates a routing or server configuration issue.');
            }
            
            responseData = JSON.parse(responseData);
            console.log('Successfully parsed response as JSON');
          } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            console.log('Raw response (first 200 chars):', responseData.substring(0, 200));
            
            // Throw a more descriptive error
            throw new Error(`Failed to parse response as JSON: ${e.message}. Check server response format.`);
          }
        } else {
          console.log('Response is already an object');
        }
        
        // Convert CapacitorHttp response to fetch-like response with enhanced error handling
        response = {
          ok: result.status >= 200 && result.status < 300,
          status: result.status,
          json: () => Promise.resolve(responseData),
          text: () => Promise.resolve(typeof result.data === 'string' ? result.data : JSON.stringify(result.data)),
          headers: new Map(Object.entries(result.headers || {}))
        };
      } catch (error) {
        console.error('CapacitorHttp error:', error);
        throw new Error(`CapacitorHttp error: ${error.message}`);
      }
    } else {
      // Use fetch for web OR as fallback if native plugin not ready
      if (isNative && !capacitorHttpAvailable) {
        console.warn('Capacitor Http plugin not available for login, falling back to fetch.');
      }
      console.log('Using fetch for login request');
      // console.log('Login URL (from AUTH_ENDPOINTS):', AUTH_ENDPOINTS.LOGIN); // Original used relative path via AUTH_ENDPOINTS
      
      try {
        response = await fetch(loginUrl, { // Use the forced absolute loginUrl
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username,
            password
          })
        });
        
        console.log('Fetch response status:', response.status);
        console.log('Fetch response headers:', Object.fromEntries([...response.headers.entries()]));
      } catch (error) {
        console.error('Fetch error:', error);
        throw new Error(`Fetch error: ${error.message}`);
      }
    }

    // Check if response is OK
    if (!response.ok) {
      try {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login error response:', errorData);
        throw new Error(errorData.message || `Login failed with status: ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // Try to get the raw text to see what's being returned
        const rawText = await response.text().catch(() => 'Unable to get response text');
        console.error('Raw response text:', rawText);
        throw new Error(`Login failed with status: ${response.status}. Raw response: ${rawText.substring(0, 100)}...`);
      }
    }

    // Parse response data
    const data = await response.json();
    
    // Store token and user data
    if (data.pwa_token) {
      localStorage.setItem('pwa_token', data.pwa_token);
      
      // Also store in Capacitor Preferences if available
      if (window.CapacitorApp && window.CapacitorApp.storage) {
        await window.CapacitorApp.storage.set('pwa_token', data.pwa_token);
      }
    }
    
    if (data.user) {
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Also store in Capacitor Preferences if available
      if (window.CapacitorApp && window.CapacitorApp.storage) {
        await window.CapacitorApp.storage.set('user_data', JSON.stringify(data.user));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout the current user
 * @returns {Promise} - Promise resolving when logout is complete
 */
async function logout() {
  try {
    const token = localStorage.getItem('pwa_token');
    
    if (token) {
      // Call logout endpoint
      await fetch(AUTH_ENDPOINTS.LOGOUT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    }
    
    // Clear local storage
    localStorage.removeItem('pwa_token');
    localStorage.removeItem('user_data');
    
    // Clear Capacitor Preferences if available
    if (window.CapacitorApp && window.CapacitorApp.storage) {
      await window.CapacitorApp.storage.remove('pwa_token');
      await window.CapacitorApp.storage.remove('user_data');
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear local storage even if API call fails
    localStorage.removeItem('pwa_token');
    localStorage.removeItem('user_data');
    
    // Clear Capacitor Preferences if available
    if (window.CapacitorApp && window.CapacitorApp.storage) {
      await window.CapacitorApp.storage.remove('pwa_token');
      await window.CapacitorApp.storage.remove('user_data');
    }
    
    return false;
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - Promise resolving to authentication status
 */
async function isAuthenticated() {
  try {
    const token = localStorage.getItem('pwa_token');
    
    if (!token) {
      return false;
    }
    
    // Use ApiService.get for consistent handling
    // ApiService.get handles URL construction, caching, and CapacitorHttp internally
    const data = await ApiService.get(AUTH_ENDPOINTS.CHECK_STATUS, {
        allowNoAuth: false, // Ensure token is required
        returnEmptyOnError: true, // Return empty object on error instead of throwing
        emptyValue: null // Return null specifically on error
    });

    // Check if the response contains a valid user ID, indicating authentication
    // If data is null (due to error), it will evaluate to false
    return !!(data && data.id);
  // End of try block
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

/**
 * Renew authentication token
 * @returns {Promise} - Promise resolving to renewed token response
 */
async function renewToken() {
  try {
    const token = localStorage.getItem('pwa_token');
    
    if (!token) {
      throw new Error('No token available to renew');
    }
    
    const response = await fetch(AUTH_ENDPOINTS.RENEW_TOKEN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Token renewal failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update token in storage
    if (data.pwa_token) {
      localStorage.setItem('pwa_token', data.pwa_token);
      
      // Also update in Capacitor Preferences if available
      if (window.CapacitorApp && window.CapacitorApp.storage) {
        await window.CapacitorApp.storage.set('pwa_token', data.pwa_token);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Token renewal error:', error);
    throw error;
  }
}

/**
 * Get current user data
 * @returns {Object|null} - User data object or null if not authenticated
 */
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Get authentication token
 * @returns {string|null} - Authentication token or null if not authenticated
 */
function getToken() {
  return localStorage.getItem('pwa_token');
}

// Export authentication functions
window.Auth = {
  login,
  logout,
  isAuthenticated,
  renewToken,
  getCurrentUser,
  getToken
};