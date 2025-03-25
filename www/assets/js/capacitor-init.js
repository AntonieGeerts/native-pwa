/**
 * Capacitor Initialization Script
 * 
 * This script initializes Capacitor plugins and provides a consistent API
 * for both web and native platforms. It detects whether the app is running
 * in a native environment and provides appropriate fallbacks for web.
 */

// Global object to store Capacitor plugin instances and utilities
window.CapacitorApp = window.CapacitorApp || {};

(function() {
  'use strict';
  
  // Check if Capacitor is available
  const isCapacitorAvailable = typeof window.Capacitor !== 'undefined';
  
  // Check if running on a native platform
  const isNativePlatform = isCapacitorAvailable && window.Capacitor.isNativePlatform();
  
  // Store platform information
  CapacitorApp.isAvailable = isCapacitorAvailable;
  
  // Make isNativePlatform a function to match how it's used in api-service.js
  CapacitorApp.isNativePlatform = function() {
    return isNativePlatform;
  };
  
  CapacitorApp.platform = isCapacitorAvailable ? window.Capacitor.getPlatform() : 'web';
  
  // Log platform information
  console.log(`Capacitor: ${isCapacitorAvailable ? 'Available' : 'Not Available'}`);
  console.log(`Platform: ${CapacitorApp.platform}`);
  console.log(`Native: ${CapacitorApp.isNativePlatform() ? 'Yes' : 'No'}`);
  
  // Initialize plugins only if Capacitor is available
  if (isCapacitorAvailable) {
    try {
      // Import Capacitor plugins
      const { 
        SplashScreen, StatusBar, Device, Network, Browser,
        Preferences, Keyboard, LocalNotifications, PushNotifications,
        Camera, Filesystem, Geolocation, Share, Toast, Haptics, Dialog
      } = window.Capacitor.Plugins;
      
      // Store plugin instances
      CapacitorApp.plugins = {
        SplashScreen,
        StatusBar,
        Device,
        Network,
        Browser,
        Preferences,
        Keyboard,
        LocalNotifications,
        PushNotifications,
        Camera,
        Filesystem,
        Geolocation,
        Share,
        Toast,
        Haptics,
        Dialog
      };
      
      // Initialize platform-specific features
      initPlatformSpecific();
      
      // Log success
      console.log('Capacitor plugins initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor plugins:', error);
    }
  } else {
    // Provide web fallbacks for common Capacitor plugins
    provideWebFallbacks();
    console.log('Web fallbacks initialized for Capacitor plugins');
  }
  
  /**
   * Initialize platform-specific features
   */
  function initPlatformSpecific() {
    if (!isNativePlatform) return;
    
    try {
      // iOS-specific initialization
      if (CapacitorApp.platform === 'ios') {
        // Set status bar style
        CapacitorApp.plugins.StatusBar.setStyle({ style: 'dark' });
        
        // Configure keyboard behavior
        CapacitorApp.plugins.Keyboard.setAccessoryBarVisible({ isVisible: false });
      }
      
      // Android-specific initialization
      if (CapacitorApp.platform === 'android') {
        // Set status bar color
        CapacitorApp.plugins.StatusBar.setBackgroundColor({ color: '#7F126E' });
        
        // Handle back button
        document.addEventListener('backbutton', handleBackButton);
      }
      
      // Register for push notifications if available
      if (CapacitorApp.plugins.PushNotifications) {
        registerPushNotifications();
      }
      
      // Hide splash screen with a delay
      setTimeout(() => {
        CapacitorApp.plugins.SplashScreen.hide();
      }, 1000);
    } catch (error) {
      console.error('Error in platform-specific initialization:', error);
    }
  }
  
  /**
   * Handle Android back button
   */
  function handleBackButton() {
    // Get the current URL path
    const path = window.location.pathname;
    
    // If on the main page, ask if the user wants to exit the app
    if (path === '/index.html' || path === '/' || path === '') {
      CapacitorApp.plugins.Dialog.confirm({
        title: 'Exit App',
        message: 'Do you want to exit the app?',
        okButtonTitle: 'Yes',
        cancelButtonTitle: 'No'
      }).then(result => {
        if (result.value) {
          // Exit the app
          window.navigator.app.exitApp();
        }
      });
    } else {
      // Otherwise, go back to the previous page
      window.history.back();
    }
  }
  
  /**
   * Register for push notifications
   */
  function registerPushNotifications() {
    try {
      // Request permission
      CapacitorApp.plugins.PushNotifications.requestPermissions().then(result => {
        if (result.granted) {
          // Register with FCM/APNS
          CapacitorApp.plugins.PushNotifications.register();
        }
      });
      
      // Listen for registration success
      CapacitorApp.plugins.PushNotifications.addListener('registration', token => {
        console.log('Push registration success, token:', token.value);
        // Store the token for later use
        CapacitorApp.pushToken = token.value;
      });
      
      // Listen for registration error
      CapacitorApp.plugins.PushNotifications.addListener('registrationError', err => {
        console.error('Push registration error:', err.error);
      });
      
      // Listen for push notification received
      CapacitorApp.plugins.PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received:', notification);
        // Handle the notification
        handlePushNotification(notification);
      });
      
      // Listen for push notification action
      CapacitorApp.plugins.PushNotifications.addListener('pushNotificationActionPerformed', action => {
        console.log('Push notification action performed:', action);
        // Handle the action
        handlePushNotificationAction(action);
      });
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }
  
  /**
   * Handle push notification received
   */
  function handlePushNotification(notification) {
    // Display a toast message
    if (CapacitorApp.plugins.Toast) {
      CapacitorApp.plugins.Toast.show({
        text: notification.title,
        duration: 'long',
        position: 'bottom'
      });
    }
    
    // Trigger a custom event for the app to handle
    const event = new CustomEvent('pushNotificationReceived', {
      detail: notification
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Handle push notification action
   */
  function handlePushNotificationAction(action) {
    // Trigger a custom event for the app to handle
    const event = new CustomEvent('pushNotificationActionPerformed', {
      detail: action
    });
    document.dispatchEvent(event);
    
    // Navigate to the appropriate page based on the notification
    if (action.notification && action.notification.data) {
      const data = action.notification.data;
      
      // Handle different notification types
      if (data.type === 'ticket') {
        window.location.href = `ticket-detail.html?id=${data.ticketId}`;
      } else if (data.type === 'message') {
        window.location.href = `messages.html`;
      } else if (data.type === 'announcement') {
        window.location.href = `announcements.html`;
      }
    }
  }
  
  /**
   * Provide web fallbacks for common Capacitor plugins
   */
  function provideWebFallbacks() {
    // Create a plugins object with web fallbacks
    CapacitorApp.plugins = {
      // Storage fallback using localStorage
      Preferences: {
        get: async ({ key }) => {
          return { value: localStorage.getItem(key) };
        },
        set: async ({ key, value }) => {
          localStorage.setItem(key, value);
        },
        remove: async ({ key }) => {
          localStorage.removeItem(key);
        },
        clear: async () => {
          localStorage.clear();
        }
      },
      
      // Browser fallback using window.open
      Browser: {
        open: async ({ url }) => {
          window.open(url, '_blank');
        }
      },
      
      // Toast fallback using alert
      Toast: {
        show: async ({ text }) => {
          alert(text);
        }
      },
      
      // Dialog fallback using confirm/alert
      Dialog: {
        alert: async ({ title, message }) => {
          alert(`${title}\n${message}`);
          return { value: true };
        },
        confirm: async ({ title, message }) => {
          const result = confirm(`${title}\n${message}`);
          return { value: result };
        },
        prompt: async ({ title, message }) => {
          const result = prompt(message, '');
          return { value: result, cancelled: result === null };
        }
      },
      
      // Network fallback using navigator.onLine
      Network: {
        getStatus: async () => {
          return {
            connected: navigator.onLine,
            connectionType: navigator.onLine ? 'wifi' : 'none'
          };
        },
        addListener: (eventName, callback) => {
          if (eventName === 'networkStatusChange') {
            window.addEventListener('online', () => callback({ connected: true, connectionType: 'wifi' }));
            window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }));
          }
          return { remove: () => {} };
        }
      },
      
      // Device fallback with basic info
      Device: {
        getInfo: async () => {
          return {
            model: 'Web Browser',
            platform: 'web',
            operatingSystem: 'web',
            osVersion: 'unknown',
            manufacturer: 'unknown',
            isVirtual: false,
            webViewVersion: navigator.userAgent
          };
        }
      },
      
      // Share fallback using navigator.share if available
      Share: {
        share: async ({ title, text, url }) => {
          if (navigator.share) {
            return navigator.share({ title, text, url });
          } else {
            alert(`Share: ${title}\n${text}\n${url}`);
          }
        }
      }
    };
  }
  
  /**
   * Public API for CapacitorApp
   */
  
  // Check if the device is online
  CapacitorApp.isOnline = async function() {
    if (isNativePlatform && CapacitorApp.plugins.Network) {
      const status = await CapacitorApp.plugins.Network.getStatus();
      return status.connected;
    }
    return navigator.onLine;
  };
  
  // Get device information
  CapacitorApp.getDeviceInfo = async function() {
    if (isNativePlatform && CapacitorApp.plugins.Device) {
      return CapacitorApp.plugins.Device.getInfo();
    }
    return {
      model: 'Web Browser',
      platform: 'web',
      operatingSystem: 'web',
      osVersion: 'unknown',
      manufacturer: 'unknown',
      isVirtual: false,
      webViewVersion: navigator.userAgent
    };
  };
  
  // Show a toast message
  CapacitorApp.showToast = function(message, duration = 'short') {
    if (isNativePlatform && CapacitorApp.plugins.Toast) {
      CapacitorApp.plugins.Toast.show({
        text: message,
        duration: duration,
        position: 'bottom'
      });
    } else {
      alert(message);
    }
  };
  
  // Open a URL in the browser
  CapacitorApp.openUrl = function(url) {
    if (isNativePlatform && CapacitorApp.plugins.Browser) {
      CapacitorApp.plugins.Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  };
  
  // Store a value in preferences
  CapacitorApp.storeValue = async function(key, value) {
    if (isNativePlatform && CapacitorApp.plugins.Preferences) {
      await CapacitorApp.plugins.Preferences.set({ key, value: JSON.stringify(value) });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };
  
  // Get a value from preferences
  CapacitorApp.getValue = async function(key) {
    if (isNativePlatform && CapacitorApp.plugins.Preferences) {
      const result = await CapacitorApp.plugins.Preferences.get({ key });
      return result.value ? JSON.parse(result.value) : null;
    } else {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  };
  
  // Remove a value from preferences
  CapacitorApp.removeValue = async function(key) {
    if (isNativePlatform && CapacitorApp.plugins.Preferences) {
      await CapacitorApp.plugins.Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  };
  
  // Share content
  CapacitorApp.shareContent = async function(title, text, url) {
    if (isNativePlatform && CapacitorApp.plugins.Share) {
      await CapacitorApp.plugins.Share.share({
        title: title,
        text: text,
        url: url,
        dialogTitle: title
      });
    } else if (navigator.share) {
      await navigator.share({
        title: title,
        text: text,
        url: url
      });
    } else {
      alert(`Share: ${title}\n${text}\n${url}`);
    }
  };
  
  // Show an alert dialog
  CapacitorApp.showAlert = async function(title, message) {
    if (isNativePlatform && CapacitorApp.plugins.Dialog) {
      await CapacitorApp.plugins.Dialog.alert({
        title: title,
        message: message
      });
    } else {
      alert(`${title}\n${message}`);
    }
  };
  
  // Show a confirmation dialog
  CapacitorApp.showConfirm = async function(title, message) {
    if (isNativePlatform && CapacitorApp.plugins.Dialog) {
      const result = await CapacitorApp.plugins.Dialog.confirm({
        title: title,
        message: message
      });
      return result.value;
    } else {
      return confirm(`${title}\n${message}`);
    }
  };
  
  // Show a prompt dialog
  CapacitorApp.showPrompt = async function(title, message, defaultText = '') {
    if (isNativePlatform && CapacitorApp.plugins.Dialog) {
      const result = await CapacitorApp.plugins.Dialog.prompt({
        title: title,
        message: message,
        inputPlaceholder: defaultText
      });
      return result.cancelled ? null : result.value;
    } else {
      return prompt(message, defaultText);
    }
  };
  
  // Vibrate the device
  CapacitorApp.vibrate = function(type = 'medium') {
    if (isNativePlatform && CapacitorApp.plugins.Haptics) {
      switch (type) {
        case 'light':
          CapacitorApp.plugins.Haptics.impact({ style: 'light' });
          break;
        case 'medium':
          CapacitorApp.plugins.Haptics.impact({ style: 'medium' });
          break;
        case 'heavy':
          CapacitorApp.plugins.Haptics.impact({ style: 'heavy' });
          break;
        case 'success':
          CapacitorApp.plugins.Haptics.notification({ type: 'success' });
          break;
        case 'warning':
          CapacitorApp.plugins.Haptics.notification({ type: 'warning' });
          break;
        case 'error':
          CapacitorApp.plugins.Haptics.notification({ type: 'error' });
          break;
      }
    } else if (navigator.vibrate) {
      // Use Web Vibration API as fallback
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'success':
          navigator.vibrate([10, 50, 10]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 100, 50]);
          break;
      }
    }
  };
  
  // Schedule a local notification
  CapacitorApp.scheduleNotification = async function(title, body, id, schedule = null) {
    if (isNativePlatform && CapacitorApp.plugins.LocalNotifications) {
      // Request permission first
      const permission = await CapacitorApp.plugins.LocalNotifications.requestPermissions();
      
      if (permission.granted) {
        const notificationOptions = {
          notifications: [
            {
              title: title,
              body: body,
              id: id,
              sound: 'beep.wav',
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#7F126E'
            }
          ]
        };
        
        // Add schedule if provided
        if (schedule) {
          notificationOptions.notifications[0].schedule = schedule;
        }
        
        await CapacitorApp.plugins.LocalNotifications.schedule(notificationOptions);
        return true;
      }
      return false;
    } else if ('Notification' in window) {
      // Use Web Notifications API as fallback
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: '/assets/images/icons/icon-72x72.png'
        });
        return true;
      }
      return false;
    }
    return false;
  };
  
  // Listen for network status changes
  CapacitorApp.addNetworkListener = function(callback) {
    if (isNativePlatform && CapacitorApp.plugins.Network) {
      const listener = CapacitorApp.plugins.Network.addListener('networkStatusChange', status => {
        callback(status.connected);
      });
      
      // Return a function to remove the listener
      return () => listener.remove();
    } else {
      // Web fallback
      const onlineHandler = () => callback(true);
      const offlineHandler = () => callback(false);
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Return a function to remove the listeners
      return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
      };
    }
  };
  
  // Log initialization complete
  console.log('CapacitorApp initialization complete');
})();