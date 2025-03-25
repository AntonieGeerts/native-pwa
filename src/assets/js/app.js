/**
 * Main application JavaScript for PMO Native App
 */

// App configuration
const AppConfig = {
  appName: 'PMO Native App',
  apiBaseUrl: '/app/api',
  version: '1.0.0'
};

// App state
const AppState = {
  initialized: false,
  online: navigator.onLine,
  authenticated: false,
  darkMode: false
};

/**
 * Initialize the application
 */
function initApp() {
  if (AppState.initialized) return;
  
  console.log(`Initializing ${AppConfig.appName} v${AppConfig.version}`);
  
  // Set up event listeners
  setupEventListeners();
  
  // Check authentication status
  checkAuthStatus();
  
  // Initialize UI
  initUI();
  
  // Mark as initialized
  AppState.initialized = true;
  
  console.log(`${AppConfig.appName} initialized`);
}

/**
 * Set up application event listeners
 */
function setupEventListeners() {
  // Network status listeners
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  
  // Handle back button on native platforms
  document.addEventListener('backbutton', handleBackButton);
  
  // Handle app pause/resume events
  document.addEventListener('pause', handleAppPause);
  document.addEventListener('resume', handleAppResume);
}

/**
 * Handle online/offline status changes
 */
function handleOnlineStatus() {
  AppState.online = navigator.onLine;
  console.log(`Network status: ${AppState.online ? 'online' : 'offline'}`);
  
  // Update UI based on network status
  const networkStatusIndicator = document.getElementById('network-status');
  if (networkStatusIndicator) {
    networkStatusIndicator.classList.toggle('offline', !AppState.online);
    networkStatusIndicator.classList.toggle('online', AppState.online);
  }
  
  // Show toast notification
  showToast(AppState.online ? 'You are back online' : 'You are offline');
}

/**
 * Handle back button press on native platforms
 * @param {Event} e - The event object
 */
function handleBackButton(e) {
  // Prevent default behavior
  e.preventDefault();
  
  // Check if we have a back navigation function defined
  if (typeof window.handleBackNavigation === 'function') {
    window.handleBackNavigation();
  } else {
    // Default behavior: go back in history or exit app
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Exit app if no history
      if (window.CapacitorApp && window.CapacitorApp.isNativePlatform()) {
        navigator.app.exitApp();
      }
    }
  }
}

/**
 * Handle app pause event (when app goes to background)
 */
function handleAppPause() {
  console.log('App paused');
  // Save any necessary state
}

/**
 * Handle app resume event (when app comes to foreground)
 */
function handleAppResume() {
  console.log('App resumed');
  // Refresh data if needed
  checkAuthStatus();
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  if (window.Auth) {
    try {
      AppState.authenticated = await window.Auth.isAuthenticated();
      console.log(`Authentication status: ${AppState.authenticated ? 'authenticated' : 'not authenticated'}`);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      AppState.authenticated = false;
    }
  } else {
    // Auth module not loaded yet
    const token = localStorage.getItem('pwa_token');
    AppState.authenticated = !!token;
  }
}

/**
 * Initialize UI components
 */
function initUI() {
  // Set up dark mode toggle if present
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    // Check saved preference
    const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
    AppState.darkMode = savedDarkMode;
    
    // Apply dark mode if enabled
    if (AppState.darkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
    
    // Set up toggle event
    darkModeToggle.addEventListener('change', function() {
      AppState.darkMode = this.checked;
      document.body.classList.toggle('dark-mode', this.checked);
      localStorage.setItem('dark_mode', this.checked);
    });
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, duration = 3000) {
  // Check if toast container exists, create if not
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise resolving to response data
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('pwa_token');
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make request
    const response = await fetch(`${AppConfig.apiBaseUrl}${endpoint}`, {
      ...options,
      headers
    });
    
    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status: ${response.status}`);
    }
    
    // Parse response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export app utilities
window.App = {
  config: AppConfig,
  state: AppState,
  showToast,
  apiRequest
};