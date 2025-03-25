/**
 * Capacitor initialization and utilities
 */

// Import Capacitor plugins
const { Capacitor } = window.Capacitor || {};
const { Preferences } = window.Capacitor?.Plugins || {};
const { Browser } = window.Capacitor?.Plugins || {};

// Check if running on a native platform
const isNativePlatform = () => {
  return Capacitor && Capacitor.isNativePlatform();
};

// Platform detection helpers
const isAndroid = () => {
  return isNativePlatform() && Capacitor.getPlatform() === 'android';
};

const isIOS = () => {
  return isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

const isWeb = () => {
  return !isNativePlatform() || Capacitor.getPlatform() === 'web';
};

// Storage utilities using Capacitor Preferences plugin
const CapacitorStorage = {
  async set(key, value) {
    if (Preferences) {
      await Preferences.set({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      });
    } else {
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  },
  
  async get(key) {
    if (Preferences) {
      const result = await Preferences.get({ key });
      return result.value;
    } else {
      return localStorage.getItem(key);
    }
  },
  
  async remove(key) {
    if (Preferences) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
  
  async clear() {
    if (Preferences) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }
};

// Browser utilities using Capacitor Browser plugin
const CapacitorBrowser = {
  async open(url) {
    if (Browser) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  },
  
  async close() {
    if (Browser) {
      await Browser.close();
    }
  }
};

// Export Capacitor utilities
window.CapacitorApp = {
  isNativePlatform,
  isAndroid,
  isIOS,
  isWeb,
  storage: CapacitorStorage,
  browser: CapacitorBrowser
};

// Log platform info
console.log('Capacitor initialized');
console.log('Platform:', Capacitor ? Capacitor.getPlatform() : 'web');
console.log('Is native:', isNativePlatform());