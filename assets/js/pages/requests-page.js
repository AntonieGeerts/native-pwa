/**
 * Requests Page JavaScript
 * Handles functionality for the requests.html page
 */

const RequestsPage = {
  // Data slices for pagination
  dataSlice1: 0,
  dataSlice2: 2,
  
  // Advanced search parameters
  advancedSearch: {},
  
  // Initialize the page
  init() {
    console.log('Initializing requests page');
    
    // Check authentication
    this.checkAuthentication();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize tabs
    this.initTabs();
    
    // Fetch and render requests
    this.fetchAndRenderRequests();
    
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
  
  // Set up event listeners
  setupEventListeners() {
    // Tab switching
    const newRequestTab = document.getElementById('new-request-tab');
    const yourRequestsTab = document.getElementById('your-requests-tab');
    
    if (newRequestTab && yourRequestsTab) {
      newRequestTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('newRequest');
      });
      
      yourRequestsTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('yourRequests');
      });
    }
    
    // Request type selection
    const requestTypes = document.querySelectorAll('.nav-container');
    requestTypes.forEach(type => {
      type.addEventListener('click', () => {
        const requestType = type.getAttribute('data-request');
        sessionStorage.setItem('search_filter_request', requestType);
        setTimeout(() => {
          window.location.href = 'ticket-report-mobile.html';
        }, 200);
      });
    });
    
    // Search functionality
    const searchKeyword = document.getElementById('search-keyword');
    if (searchKeyword) {
      searchKeyword.addEventListener('keyup', () => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        
        this.timeout = setTimeout(() => {
          const filterSearchKeyword = document.getElementById('filter-search-keyword');
          if (filterSearchKeyword) {
            filterSearchKeyword.value = searchKeyword.value;
          }
          this.renderYourRequests();
        }, 350);
      });
    }
    
    // Open filter modal
    const openFilterBtn = document.querySelector('.open-request-filter');
    if (openFilterBtn) {
      openFilterBtn.addEventListener('click', () => {
        const overlay = document.querySelector('.filter-modal-overlay');
        const modal = document.querySelector('.filter-modal-container');
        
        if (overlay && modal) {
          overlay.style.display = 'block';
          modal.style.transform = 'translateY(0)';
          modal.style.pointerEvents = 'all';
          document.body.style.overflowY = 'hidden';
        }
      });
    }
    
    // Close filter modal
    const closeFilterBtn = document.querySelector('.close-request-filter');
    if (closeFilterBtn) {
      closeFilterBtn.addEventListener('click', () => {
        const overlay = document.querySelector('.filter-modal-overlay');
        const modal = document.querySelector('.filter-modal-container');
        
        if (overlay && modal) {
          overlay.style.display = 'none';
          modal.style.transform = 'translateY(-10000px)';
          modal.style.pointerEvents = 'none';
          document.body.style.overflowY = 'auto';
        }
      });
    }
    
    // Click outside filter modal to close
    const overlay = document.querySelector('.filter-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        const closeFilterBtn = document.querySelector('.close-request-filter');
        if (closeFilterBtn) {
          closeFilterBtn.click();
        }
      });
    }
    
    // Filter search button
    const filterSearchBtn = document.getElementById('filter-search-btn');
    if (filterSearchBtn) {
      filterSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        const serviceType = document.getElementById('service-type');
        const filterSearchKeyword = document.getElementById('filter-search-keyword');
        const searchKeyword = document.getElementById('search-keyword');
        
        this.advancedSearch = {
          date_from: dateFrom ? dateFrom.value.trim() : '',
          date_to: dateTo ? dateTo.value.trim() : '',
          service: serviceType ? serviceType.value.trim() : ''
        };
        
        if (searchKeyword && filterSearchKeyword) {
          searchKeyword.value = filterSearchKeyword.value;
        }
        
        const closeFilterBtn = document.querySelector('.close-request-filter');
        if (closeFilterBtn) {
          closeFilterBtn.click();
        }
        
        this.renderYourRequests();
      });
    }
    
    // Infinite scroll for tickets
    window.addEventListener('scroll', () => {
      if (this.scrolled) return;
      
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
        this.scrolled = true;
        const preloader = document.querySelector('.preloader-container');
        
        if (preloader) {
          preloader.style.display = 'block';
        }
        
        this.dataSlice1 += 2;
        this.dataSlice2 += 2;
        
        setTimeout(() => {
          this.renderYourRequests(true);
          
          if (preloader) {
            preloader.style.display = 'none';
          }
          
          setTimeout(() => {
            this.scrolled = false;
          }, 500);
        }, 500);
      }
    });
  },
  
  // Initialize tabs
  initTabs() {
    const tabs = document.querySelectorAll('.tab a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = tab.getAttribute('href').substring(1);
        this.switchTab(targetId);
      });
    });
  },
  
  // Switch tab
  switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      if (tab.getAttribute('href') === `#${tabId}`) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  },
  
  // Fetch and render requests
  fetchAndRenderRequests() {
    // Fetch ticket data from API
    TicketService.getTickets()
      .then(data => {
        // Store data in localStorage for offline use
        localStorage.setItem('ticket_data', JSON.stringify(data));
        
        // Populate service type dropdown
        this.populateServiceTypeDropdown();
        
        // Render pending requests count
        this.renderPendingRequestsCount(data);
        
        // Render your requests
        this.renderYourRequests();
      })
      .catch(error => {
        console.error('Error fetching ticket data:', error);
        
        // Try to use cached data
        const cachedData = localStorage.getItem('ticket_data');
        if (cachedData) {
          try {
            const data = JSON.parse(cachedData);
            this.populateServiceTypeDropdown();
            this.renderPendingRequestsCount(data);
            this.renderYourRequests();
          } catch (e) {
            console.error('Error parsing cached ticket data:', e);
          }
        }
      });
  },
  
  // Populate service type dropdown
  populateServiceTypeDropdown() {
    TicketService.getForms()
      .then(forms => {
        const serviceType = document.getElementById('service-type');
        if (!serviceType) return;
        
        let options = '<option value="">Choose a Service Type</option>';
        
        if (forms && Array.isArray(forms)) {
          forms.forEach(form => {
            options += `<option value="${form.id}">${form.name}</option>`;
          });
        }
        
        serviceType.innerHTML = options;
      })
      .catch(error => {
        console.error('Error fetching forms for dropdown:', error);
      });
  },
  
  // Render pending requests count
  renderPendingRequestsCount(data) {
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid tickets data:', data);
      return;
    }
    
    const pendingCount = data.filter(ticket => {
      return (_.get(ticket, 'status', 'New') || 'New') === 'New';
    }).length;
    
    const pendingRequestsCount = document.getElementById('pending-requests-count');
    if (pendingRequestsCount) {
      pendingRequestsCount.textContent = pendingCount;
    }
    
    const requestsAlert = document.querySelector('.requests-alert');
    if (requestsAlert && pendingCount > 0) {
      requestsAlert.classList.add('active');
    } else if (requestsAlert) {
      requestsAlert.classList.remove('active');
    }
  },
  
  // Render your requests
  renderYourRequests(append = false) {
    // Get ticket data from localStorage
    const cachedData = localStorage.getItem('ticket_data');
    if (!cachedData) {
      console.warn('No ticket data found');
      return;
    }
    
    try {
      const data = JSON.parse(cachedData);
      
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid tickets data:', data);
        return;
      }
      
      // Filter out void tickets
      const filteredTickets = data.filter(ticket => {
        return (_.get(ticket, 'status', 'New') || 'New').toLowerCase() !== 'void';
      });
      
      // Format tickets for display
      const formattedTickets = filteredTickets.map(ticket => {
        return {
          id: ticket.id,
          ticket_id: ticket.serial,
          ticket_title: ticket.title,
          description: ticket.description,
          reported_by: ticket.serial.indexOf('BILL-') !== -1 ? 
            'Finance' : 
            this.getDisplayName(ticket.reporter_user_id),
          assigned_to: this.getDisplayName(ticket.reporter_user_id),
          date_reported: moment(ticket.created_at).add(moment().utcOffset(), 'minutes').format('MMM DD YYYY - hh:mm A'),
          age: moment(ticket.created_at).add(moment().utcOffset(), 'minutes').fromNow(),
          priority: 'High',
          status: _.startCase(ticket.status || 'New'),
          created_at: ticket.created_at,
          raw: ticket,
          category: ticket.serial.indexOf('BILL-') !== -1 ? 
            'Billing' : 
            _.get(ticket, 'form_entries.category.name', 'Uncategorized'),
          unit_number: _.get(ticket, 'unit.alias', 'PMO'),
          form: _.get(ticket, 'form_entries.name', ''),
          date_time: moment(ticket.created_at).add(moment().utcOffset(), 'minutes').format('MMMM D, YYYY - hh:mm A'),
          status_style: ticket.status !== null ? 
            ticket.status.toLowerCase() === 'new' ? 
              'background-color: #79B1DA;' : 
              ticket.status.toLowerCase() === 'in progress' ? 
                'background-color: #E0A311;' : 
                'background-color: #01AC4E;' : 
            'background-color: #79B1DA;'
        };
      });
      
      // Apply search filters
      const filteredFormattedTickets = this.applySearchFilters(formattedTickets);
      
      // Render tickets
      this.renderTickets(filteredFormattedTickets, append);
    } catch (e) {
      console.error('Error rendering your requests:', e);
    }
  },
  
  // Apply search filters
  applySearchFilters(tickets) {
    const searchKeyword = document.getElementById('search-keyword');
    const keyword = searchKeyword ? searchKeyword.value.trim().toLowerCase() : '';
    
    return tickets.filter(ticket => {
      let result = true;
      let keywordMatch = false;
      
      // Apply keyword search
      if (keyword !== '') {
        keywordMatch = 
          ticket.status.toLowerCase().includes(keyword) ||
          ticket.ticket_id.toLowerCase().includes(keyword) ||
          ticket.category.toLowerCase().includes(keyword) ||
          ticket.form.toLowerCase().includes(keyword) ||
          ticket.unit_number.toLowerCase().includes(keyword) ||
          ticket.reported_by.toLowerCase().includes(keyword) ||
          ticket.date_time.toLowerCase().includes(keyword);
        
        result = result && keywordMatch;
      }
      
      // Apply advanced search filters
      if (Object.keys(this.advancedSearch).length > 0) {
        const { date_from, date_to, service } = this.advancedSearch;
        
        if (date_from) {
          result = result && moment(ticket.created_at)
            .add(moment().utcOffset(), 'minutes')
            .isSameOrAfter(moment(date_from + ' 00:00:00'));
        }
        
        if (date_to) {
          result = result && moment(ticket.created_at)
            .add(moment().utcOffset(), 'minutes')
            .isSameOrBefore(moment(date_to + ' 23:59:59'));
        }
        
        if (service) {
          result = result && ticket.raw.form_entries.id === service;
        }
      }
      
      return result;
    });
  },
  
  // Render tickets
  renderTickets(tickets, append = false) {
    const ticketsGrid = document.getElementById('tickets-grid');
    if (!ticketsGrid) return;
    
    // Clear existing tickets if not appending
    if (!append) {
      ticketsGrid.innerHTML = '';
    }
    
    // Get tickets to display based on current slice
    const ticketsToDisplay = tickets.slice(this.dataSlice1, this.dataSlice2);
    
    // Create and append ticket elements
    ticketsToDisplay.forEach(ticket => {
      const ticketElement = document.createElement('div');
      ticketElement.className = 'ticket-container';
      ticketElement.setAttribute('data-id', ticket.id);
      
      ticketElement.innerHTML = `
        <div class="status-container" style="${ticket.status_style}">
          <div class="status">${ticket.status}</div>
        </div>
        <div class="id-container">
          <span class="id-label">ID #</span> <span class="ticket-id">${ticket.ticket_id}</span>
        </div>
        <div class="data-container">
          <div class="ticket-label">Category - <span class="category">${ticket.category}</span></div>
          <div class="ticket-category">Services - <span class="form">${ticket.form}</span></div>
        </div>
        <div class="data-container">
          <div class="ticket-label">Unit No.</div>
          <div class="ticket-location">${ticket.unit_number}</div>
        </div>
        <div class="data-container">
          <div class="ticket-label">Reported by</div>
          <div class="ticket-reporter">${ticket.reported_by}</div>
        </div>
        <div class="data-container">
          <div class="ticket-label">Date/Time</div>
          <div class="ticket-datetime">${ticket.date_time}</div>
        </div>
        <div class="button-container">
          <a href="#" class="view-ticket-btn" data-id="${ticket.id}">View Ticket</a>
        </div>
      `;
      
      // Add to grid
      ticketsGrid.appendChild(ticketElement);
      
      // Add event listener to view ticket button
      const viewTicketBtn = ticketElement.querySelector('.view-ticket-btn');
      viewTicketBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('ticket_id', ticket.id);
        window.location.href = 'ticket-view-edit-mobile.html';
      });
    });
  },
  
  // Get display name for user
  getDisplayName(userId) {
    // This would normally fetch the user's name from the user data
    // For now, we'll just return a placeholder
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.name || userData.username || 'User';
  },
  
  // Initialize swipe gesture
  initSwipeGesture() {
    // Initialize Hammer.js on the container
    const element = document.querySelector('.container');
    if (!element) return;
    
    const hammertime = new Hammer(element);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    
    hammertime.on('swipe', function(event) {
      if (event.deltaX < 0) {
        // Swipe left - go to menu-mobile page
        window.location.href = 'menu-mobile.html';
      } else if (event.deltaX > 0) {
        // Swipe right - go to navigation page
        window.location.href = 'navigation.html';
      }
    });
  }
};

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  RequestsPage.init();
});