/**
 * Authentication utilities for PMO Native App
 * Handles login, logout, and token management
 */

// API base URL - adjust based on your Laravel backend URL
const API_BASE_URL = '/app/api';

// Authentication endpoints
const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login-pwa`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  CHECK_STATUS: `${API_BASE_URL}/auth/login-status-check`,
  RENEW_TOKEN: `${API_BASE_URL}/auth/login-pwa-renew`
};

/**
 * Perform login with username and password
 * @param {string} username - Username or unit number
 * @param {string} password - User password
 * @returns {Promise} - Promise resolving to login response
 */
async function login(username, password) {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
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

    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed with status: ${response.status}`);
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
    
    // Call status check endpoint
    const response = await fetch(AUTH_ENDPOINTS.CHECK_STATUS, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.authenticated === true;
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