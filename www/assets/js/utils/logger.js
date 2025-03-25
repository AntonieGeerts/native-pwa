/**
 * Logger Utility
 * Provides logging functionality with file output for debugging
 */

const Logger = {
  // Log levels
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },
  
  // Current log level
  currentLevel: 0, // DEBUG by default
  
  // Log buffer to minimize writes
  buffer: [],
  
  // Maximum buffer size before writing to file
  maxBufferSize: 10,
  
  // Log file name
  logFileName: 'app-debug.log',
  
  /**
   * Initialize the logger
   * @param {Object} options - Logger options
   */
  init(options = {}) {
    // Set options
    if (options.level !== undefined) {
      this.currentLevel = options.level;
    }
    
    if (options.maxBufferSize !== undefined) {
      this.maxBufferSize = options.maxBufferSize;
    }
    
    if (options.logFileName !== undefined) {
      this.logFileName = options.logFileName;
    }
    
    // Clear log file on init if requested
    if (options.clearOnInit) {
      this.clearLog();
    }
    
    // Log initialization
    this.info('Logger initialized', { options });
    
    // Set up error event listeners
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null
      });
    });
    
    // Set up unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unknown reason'
      });
    });
    
    // Set up memory usage logging
    if (options.logMemoryUsage) {
      this.startMemoryLogging(options.memoryLoggingInterval || 10000);
    }
  },
  
  /**
   * Start logging memory usage at intervals
   * @param {number} interval - Interval in milliseconds
   */
  startMemoryLogging(interval) {
    setInterval(() => {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        this.debug('Memory usage', {
          totalJSHeapSize: this.formatBytes(memory.totalJSHeapSize),
          usedJSHeapSize: this.formatBytes(memory.usedJSHeapSize),
          jsHeapSizeLimit: this.formatBytes(memory.jsHeapSizeLimit),
          percentUsed: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
        });
      }
    }, interval);
  },
  
  /**
   * Format bytes to human-readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  debug(message, data) {
    this.log('DEBUG', message, data);
  },
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  info(message, data) {
    this.log('INFO', message, data);
  },
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  warn(message, data) {
    this.log('WARN', message, data);
  },
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  error(message, data) {
    this.log('ERROR', message, data);
  },
  
  /**
   * Internal log method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, message, data) {
    // Check if we should log this level
    if (this.levels[level] < this.currentLevel) {
      return;
    }
    
    // Create log entry
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || {}
    };
    
    // Add to buffer
    this.buffer.push(logEntry);
    
    // Log to console
    const consoleMethod = level.toLowerCase();
    if (console[consoleMethod]) {
      if (data) {
        console[consoleMethod](`[${timestamp}] [${level}] ${message}`, data);
      } else {
        console[consoleMethod](`[${timestamp}] [${level}] ${message}`);
      }
    }
    
    // Write to file if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.writeToFile();
    }
  },
  
  /**
   * Write log buffer to file
   */
  writeToFile() {
    if (this.buffer.length === 0) {
      return;
    }
    
    try {
      // Convert buffer to string
      const logText = this.buffer.map(entry => {
        return `[${entry.timestamp}] [${entry.level}] ${entry.message} ${JSON.stringify(entry.data)}`;
      }).join('\n') + '\n';
      
      // Use Capacitor Filesystem API if available
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        const { Filesystem } = window.Capacitor.Plugins;
        
        // Append to log file
        Filesystem.appendFile({
          path: this.logFileName,
          data: logText,
          directory: 'DOCUMENTS'
        }).catch(error => {
          console.error('Error writing to log file:', error);
        });
      } else {
        // Fallback to localStorage for web
        const existingLog = localStorage.getItem('app_debug_log') || '';
        localStorage.setItem('app_debug_log', existingLog + logText);
      }
      
      // Clear buffer
      this.buffer = [];
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  },
  
  /**
   * Clear the log file
   */
  clearLog() {
    try {
      // Use Capacitor Filesystem API if available
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        const { Filesystem } = window.Capacitor.Plugins;
        
        // Delete existing log file
        Filesystem.deleteFile({
          path: this.logFileName,
          directory: 'DOCUMENTS'
        }).catch(() => {
          // Ignore errors if file doesn't exist
        });
      } else {
        // Fallback to localStorage for web
        localStorage.removeItem('app_debug_log');
      }
    } catch (error) {
      console.error('Error clearing log file:', error);
    }
  },
  
  /**
   * Get the current log content
   * @returns {Promise<string>} Log content
   */
  async getLogContent() {
    try {
      // Flush buffer first
      this.writeToFile();
      
      // Use Capacitor Filesystem API if available
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        const { Filesystem } = window.Capacitor.Plugins;
        
        try {
          const result = await Filesystem.readFile({
            path: this.logFileName,
            directory: 'DOCUMENTS'
          });
          
          return result.data;
        } catch (error) {
          return 'No log file found';
        }
      } else {
        // Fallback to localStorage for web
        return localStorage.getItem('app_debug_log') || 'No log data found';
      }
    } catch (error) {
      console.error('Error reading log file:', error);
      return 'Error reading log file';
    }
  }
};

// Export Logger
window.Logger = Logger;