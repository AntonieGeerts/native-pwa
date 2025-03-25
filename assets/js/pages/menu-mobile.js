/**
 * Menu Mobile Page JavaScript
 * Handles functionality for the menu-mobile.html page
 */

// Main object for menu-mobile page functionality
const MenuMobilePage = {
  // User data
  userData: null,
  
  // QR code data
  qrCodeData: null,
  
  // Initialize the page
  init() {
    console.log('Initializing menu-mobile page');
    
    // Check authentication
    this.checkAuthentication();
    
    // Load user data
    this.loadUserData();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Fetch points data
    this.fetchPointsData();
    
    // Generate QR code
    this.generateQRCode();
    
    // Check for notifications
    this.checkNotifications();
    
    // Check dark mode preference
    this.checkDarkMode();
    
    // Initialize swipe gesture
    this.initSwipeGesture();
  },
  
  // Check if user is authenticated
  checkAuthentication() {
    const token = localStorage.getItem('pwa_token');
    if (!token) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  
  // Load user data from localStorage
  loadUserData() {
    try {
      const userDataString = localStorage.getItem('user_data');
      if (!userDataString) {
        console.error('No user data found in localStorage');
        return;
      }
      
      this.userData = JSON.parse(userDataString);
      console.log('User data loaded:', this.userData);
      
      // Update UI with user data
      this.updateUserUI();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },
  
  // Update UI with user data
  updateUserUI() {
    if (!this.userData) return;
    
    // Update user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = this.userData.name || 'User';
    }
    
    // Set unit number
    const unitElement = document.getElementById('user-unit');
    if (unitElement) {
      if (this.userData.units && this.userData.units.length > 0) {
        if (this.userData.units.length === 1) {
          unitElement.textContent = this.userData.units[0].alias_custom || this.userData.units[0].alias_raw;
        } else if (this.userData.units.length > 1) {
          unitElement.innerHTML = `${this.userData.units[0].alias_custom || this.userData.units[0].alias_raw}, <span class="more-units">more...</span>`;
        } else {
          unitElement.textContent = 'PMO';
        }
      } else {
        unitElement.textContent = 'PMO';
      }
    }
    
    // Set profile photo
    const profilePhoto = document.getElementById('profile-photo');
    if (profilePhoto && this.userData.photo) {
      profilePhoto.src = this.userData.photo;
    }
    
    // Check role for showing/hiding elements
    if (this.userData.role_id === 10102) {
      // Hide meter readings
      const meterReadingsElements = document.querySelectorAll('.meter_readings_html');
      meterReadingsElements.forEach(el => el.style.display = 'none');
    }
    
    if (this.userData.role_id === 10001) {
      // Hide rewards button and points
      const viewRewardsBtn = document.getElementById('view-rewards-btn');
      if (viewRewardsBtn) {
        viewRewardsBtn.style.display = 'none';
      }
      
      const pointsCard = document.querySelector('.points-card');
      if (pointsCard) {
        pointsCard.style.display = 'none';
      }
    }
  },
  
  // Set up event listeners
  setupEventListeners() {
    // Settings button
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
          settingsModal.classList.add('ppt-modal-active');
        }
      });
    }
    
    // Close settings button
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
          settingsModal.classList.remove('ppt-modal-active');
        }
      });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const darkModeSwitch = document.getElementById('dark-mode-switch');
        if (darkModeSwitch) {
          darkModeSwitch.checked = !darkModeSwitch.checked;
          this.toggleDarkMode(darkModeSwitch.checked);
        }
      });
    }
    
    // QR code click to show full screen
    const qrCode = document.getElementById('qr-code');
    if (qrCode) {
      qrCode.addEventListener('click', () => {
        const qrFocusContainer = document.getElementById('qr-focus-container');
        const qrFocusCode = document.getElementById('qr-focus-code');
        
        if (qrFocusContainer && qrFocusCode) {
          // Show modal
          qrFocusContainer.style.display = 'flex';
        }
      });
    }
    
    // Close QR focus modal
    const closeQrFocusBtn = document.getElementById('close-qr-focus-btn');
    if (closeQrFocusBtn) {
      closeQrFocusBtn.addEventListener('click', () => {
        const qrFocusContainer = document.getElementById('qr-focus-container');
        if (qrFocusContainer) {
          qrFocusContainer.style.display = 'none';
        }
      });
    }
    
    // Renew QR code button
    const renewCodeBtn = document.getElementById('renew-code-btn');
    if (renewCodeBtn) {
      renewCodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.generateQRCode();
      });
    }
    
    // View rewards button
    const viewRewardsBtn = document.getElementById('view-rewards-btn');
    if (viewRewardsBtn) {
      viewRewardsBtn.addEventListener('click', () => {
        window.location.href = 'rewards.html';
      });
    }
    
    // Handle "more..." units click
    const moreUnitsElement = document.querySelector('.more-units');
    if (moreUnitsElement) {
      moreUnitsElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.userData && this.userData.units) {
          // Show units in a modal or alert
          const unitsList = this.userData.units.map(unit => unit.alias_custom || unit.alias_raw).join(', ');
          alert(`Your units: ${unitsList}`);
        }
      });
    }
    
    // Handle orientation change for QR code
    window.addEventListener('orientationchange', () => {
      const qrFocusContainer = document.getElementById('qr-focus-container');
      if (qrFocusContainer) {
        if (window.orientation !== 0) {
          // Landscape mode - show QR focus
          qrFocusContainer.style.display = 'flex';
        } else {
          // Portrait mode - hide QR focus
          qrFocusContainer.style.display = 'none';
        }
      }
    });
  },
  
  // Fetch points data from API
  fetchPointsData() {
    // Check if we have cached points data
    const cachedPointsData = localStorage.getItem('points_data');
    if (cachedPointsData) {
      try {
        const pointsData = JSON.parse(cachedPointsData);
        this.updatePointsUI(pointsData);
      } catch (e) {
        console.error('Error parsing cached points data:', e);
      }
    }
    
    // Fetch fresh points data from API
    fetch('/app/api/pwa-reward-point-transaction/my-total-points', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('pwa_token')}`,
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch points data');
      }
      return response.json();
    })
    .then(data => {
      console.log('Points data fetched:', data);
      
      // Save points data to localStorage
      localStorage.setItem('points_data', JSON.stringify(data));
      
      // Update UI
      this.updatePointsUI(data);
    })
    .catch(error => {
      console.error('Error fetching points data:', error);
      
      // Use default values if API fails
      this.updatePointsUI({
        total_points: 0,
        prev_points: 0
      });
    });
  },
  
  // Update points UI with data
  updatePointsUI(pointsData) {
    if (!pointsData || typeof pointsData.total_points === 'undefined') {
      console.warn('Invalid points data:', pointsData);
      pointsData = {
        total_points: 0,
        prev_points: 0
      };
    }
    
    const totalPointsElement = document.getElementById('total-points');
    const lastPointsElement = document.getElementById('last-points');
    
    if (totalPointsElement) {
      totalPointsElement.textContent = pointsData.total_points.toLocaleString();
    }
    
    if (lastPointsElement) {
      lastPointsElement.textContent = pointsData.prev_points.toLocaleString();
    }
  },
  
  // Generate QR code using the theqr library
  generateQRCode() {
    if (!this.userData) {
      console.error('Cannot generate QR code: User data not loaded');
      return;
    }
    
    // Get unit alias
    let unitAlias = 'PMO';
    if (this.userData.units && this.userData.units.length > 0) {
      unitAlias = this.userData.units[0].alias_custom || this.userData.units[0].alias_raw;
    }
    
    // Create data for QR code
    const expectedDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const expiryDate = moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const name = this.userData.name || this.userData.username;
    
    // Get floors data
    const floors = this.userData.units ? 
      this.userData.units.map(unit => `${unit.floor || ''}:${unit.the_building_id || ''}:${unit.id}`) : 
      [];
    
    // Create data object
    const data = {
      name,
      expected_date: expectedDate,
      expiry_date: expiryDate,
      floors
    };
    
    // Generate QR code
    const code = theqr.generate_qr_code_raw(unitAlias, this.userData.id, 'U', data);
    
    // Display QR code
    theqr.display(code);
    
    // Save QR code data
    this.qrCodeData = code;
  },
  
  // Check for notifications
  checkNotifications() {
    const notificationCount = localStorage.getItem('notification_count');
    const badge = document.getElementById('notification-badge');
    
    if (badge) {
      if (notificationCount && parseInt(notificationCount) > 0) {
        badge.textContent = notificationCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
    
    // Try to fetch notifications from API
    // Note: We're handling the 404 error gracefully here
    fetch('/app/api/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('pwa_token')}`,
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        // If API returns 404, we'll just use the cached notification count
        if (response.status === 404) {
          console.log('Notifications API not available (404)');
          return { unread_count: notificationCount || 0 };
        }
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    })
    .then(data => {
      console.log('Notifications data:', data);
      
      // Update notification count if we have valid data
      if (data && typeof data.unread_count !== 'undefined') {
        localStorage.setItem('notification_count', data.unread_count);
        
        if (badge) {
          badge.textContent = data.unread_count;
          badge.style.display = data.unread_count > 0 ? 'flex' : 'none';
        }
      }
    })
    .catch(error => {
      console.error('Error fetching notifications:', error);
      // Don't show error to user, just use cached notification count
    });
  },
  
  // Check dark mode preference
  checkDarkMode() {
    const darkModeEnabled = localStorage.getItem('dark_mode') === 'true';
    const darkModeSwitch = document.getElementById('dark-mode-switch');
    
    if (darkModeEnabled) {
      document.body.classList.add('dark-mode');
      if (darkModeSwitch) {
        darkModeSwitch.checked = true;
      }
    } else {
      document.body.classList.remove('dark-mode');
      if (darkModeSwitch) {
        darkModeSwitch.checked = false;
      }
    }
  },
  
  // Toggle dark mode
  toggleDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('dark_mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('dark_mode', 'false');
    }
  },
  
  // Initialize swipe gesture
  initSwipeGesture() {
    // Initialize Hammer.js on the main page container
    const element = document.querySelector('.main-page-container');
    if (!element) return;
    
    const hammertime = new Hammer(element);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    
    hammertime.on('swipe', function(event) {
      if (event.deltaX > 0) {
        // Swipe right - go to navigation page
        window.location.href = 'navigation.html';
      }
    });
  }
};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  MenuMobilePage.init();
});
