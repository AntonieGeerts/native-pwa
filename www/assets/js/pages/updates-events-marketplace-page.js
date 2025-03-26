// updates-events-marketplace-page.js

// Ensure DOM is loaded and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Authentication check is handled in the HTML's inline script
    // We initialize directly or wait for auth check completion if needed
    // Assuming checkAuth() handles redirection if not authenticated.
    initUpdatesEventsMarketplacePage();
});

// State variables
let currentFilter = {
    updates: { keyword: '' },
    events: { keyword: '' },
    marketplace: { keyword: '' }
};

let loadedData = {
    updates: null,
    events: null,
    marketplace: null
};

let apiEndpoints = {
    updates: '/pcache/building-news', // Removed /app/api prefix
    events: '/pcache/building-events', // Removed /app/api prefix
    marketplace: '/pcache/marketplace-items/get-available' // Removed /app/api prefix
};

let templates = {
    updates: 'update-card-template',
    events: 'event-card-template',
    marketplace: 'marketplace-card-template'
};

let renderFunctions = {
    updates: populateUpdateCard,
    events: populateEventCard,
    marketplace: populateMarketplaceCard
};

/**
 * Initializes the page, sets up listeners, and loads initial data.
 */
function initUpdatesEventsMarketplacePage() {
    console.log("Initializing Updates, Events & Marketplace Page");
    setupEventListeners();
    // Initial data load is triggered by the tab switching logic setting the default tab
}

/**
 * Sets up event listeners for tabs and search inputs.
 */
function setupEventListeners() {
    // Tab switching listeners are already in the HTML's inline script.
    // We add a listener for our custom event dispatched when tabs switch.
    document.addEventListener('tab-switched', handleTabSwitch);

    // Search inputs
    document.getElementById('search-updates').addEventListener('input', _.debounce(handleSearch, 300));
    document.getElementById('search-events').addEventListener('input', _.debounce(handleSearch, 300));
    document.getElementById('search-marketplace').addEventListener('input', _.debounce(handleSearch, 300));

    // Clear search buttons listeners are in the HTML's inline script.
}

/**
 * Handles actions needed when a tab becomes active.
 * @param {Event} event - The custom 'tab-switched' event.
 */
function handleTabSwitch(event) {
    const tabId = event.detail.tabId;
    console.log(`Tab switched to: ${tabId}`);
    // Load data only if it hasn't been loaded yet for this tab
    if (!loadedData[tabId]) {
        loadDataForTab(tabId);
    } else {
        // Data already loaded, just ensure it's rendered (e.g., if search was cleared)
        renderData(tabId);
    }
}

/**
 * Handles search input changes for the active tab.
 * @param {Event} event - The input event.
 */
function handleSearch(event) {
    const searchInput = event.target;
    const tabId = searchInput.closest('.tab-content').id;
    currentFilter[tabId].keyword = searchInput.value.toLowerCase().trim();
    console.log(`Search updated for ${tabId}: "${currentFilter[tabId].keyword}"`);
    renderData(tabId); // Re-render the current tab's data with the filter
}

/**
 * Fetches data for a specific tab from the API.
 * @param {string} tabId - The ID of the tab ('updates', 'events', 'marketplace').
 */
async function loadDataForTab(tabId) {
    if (!apiEndpoints[tabId]) {
        console.error(`No API endpoint defined for tab: ${tabId}`);
        return;
    }

    const preloader = document.getElementById(`${tabId}-preloader`);
    const listContainer = document.getElementById(`${tabId}-list`);
    const endpoint = apiEndpoints[tabId];

    if (preloader) preloader.style.display = 'block';
    if (listContainer) listContainer.innerHTML = ''; // Clear previous items

    try {
        console.log(`Fetching data for ${tabId} from ${endpoint}`);
        // Assuming ApiService is globally available from api-service.js
        const response = await ApiService.get(endpoint);
        console.log(`Data received for ${tabId}:`, response);

        // Store the raw response data - adjust based on actual API structure
        // Common structures: response directly array, response.data is array
        loadedData[tabId] = Array.isArray(response) ? response : (response.data || []);

        renderData(tabId); // Render the freshly loaded data

    } catch (error) {
        console.error(`Error loading data for ${tabId}:`, error);
        if (listContainer) {
            listContainer.innerHTML = `<li style="color: var(--error-color); text-align: center; grid-column: 1 / -1;">Failed to load ${tabId}. Please try again later.</li>`;
        }
    } finally {
        if (preloader) preloader.style.display = 'none';
    }
}

/**
 * Renders data for a specific tab into its list container.
 * @param {string} tabId - The ID of the tab to render.
 */
function renderData(tabId) {
    const listContainer = document.getElementById(`${tabId}-list`);
    const preloader = document.getElementById(`${tabId}-preloader`);
    if (!listContainer) {
        console.error(`List container not found for tab: ${tabId}`);
        return;
    }

    const templateId = templates[tabId];
    const renderFunction = renderFunctions[tabId];
    const template = document.getElementById(templateId);
    const apiBaseUrl = ApiService.baseUrl; // Get base URL once

    if (!template || !renderFunction) {
        console.error(`Template or render function missing for tab: ${tabId}`);
        listContainer.innerHTML = `<li style="color: var(--error-color); text-align: center; grid-column: 1 / -1;">Display error for ${tabId}.</li>`;
        if (preloader) preloader.style.display = 'none';
        return;
    }

    let dataToRender = loadedData[tabId] || [];

     // Apply keyword filter
    const keyword = currentFilter[tabId].keyword;
    if (keyword) {
        dataToRender = dataToRender.filter(item => {
            // Simple search across common fields (adjust field names as needed)
            const title = (item.title || item.item_name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const location = (item.location || '').toLowerCase();
            const seller = (item.seller_name || (item.user ? (item.user.name || item.user.username) : '')).toLowerCase(); // For marketplace
            return title.includes(keyword) || description.includes(keyword) || location.includes(keyword) || seller.includes(keyword);
        });
    }

    listContainer.innerHTML = ''; // Clear previous items

    if (dataToRender.length === 0) {
        const message = keyword ? `No ${tabId} found matching "${keyword}".` : `No ${tabId} available.`;
        listContainer.innerHTML = `<li style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1;">${message}</li>`;
    } else {
        dataToRender.forEach(item => {
            try {
                const clone = template.content.cloneNode(true);
                renderFunction(clone, item, apiBaseUrl); // Pass base URL
                listContainer.appendChild(clone);
            } catch (e) {
                console.error(`Error rendering item for ${tabId}:`, item, e);
                // Optionally add an error placeholder for this specific item
            }
        });
    }

     if (preloader) preloader.style.display = 'none';
}

// --- Template Population Functions ---

function populateUpdateCard(clone, item, apiBaseUrl) { // Add apiBaseUrl param
    const card = clone.querySelector('.update-card');
    const link = clone.querySelector('a');
    const imageDiv = clone.querySelector('.update-image');
    const titleEl = clone.querySelector('.update-title');
    const dateEl = clone.querySelector('.update-date');

    if (card) card.dataset.id = item.id;
    // TODO: Define detail page URL structure
    if (link) link.href = `news-detail.html?id=${item.id}&type=update`;
    // Use a placeholder if thumbnail is missing or invalid
    let imageUrl = item.thumbnail || 'assets/images/placeholder-news.png'; // Define a placeholder image
    // Assume API provides an absolute URL or use placeholder
    console.log(`Update ${item.id} image URL from API:`, item.thumbnail); // Log URL from API
    if (imageDiv) imageDiv.style.backgroundImage = `url('${imageUrl}')`;
    if (titleEl) titleEl.textContent = item.title || 'No Title';
    if (dateEl) {
        console.log(`Update ${item.id} date_published:`, item.date_published); // Log raw date
        dateEl.textContent = item.date_published ? moment(item.date_published).fromNow() : 'No Date'; // Use fromNow()
    }
}

function populateEventCard(clone, item, apiBaseUrl) { // Add apiBaseUrl param
    const card = clone.querySelector('.event-card');
    const link = clone.querySelector('a');
    const imageDiv = clone.querySelector('.event-image');
    const titleEl = clone.querySelector('.event-title');
    const dateTimeEl = clone.querySelector('.event-date-time');
    const locationEl = clone.querySelector('.event-location');

    if (card) card.dataset.id = item.id;
     // TODO: Define detail page URL structure
    if (link) link.href = `event-detail.html?id=${item.id}`;
    let imageUrl = item.thumbnail || 'assets/images/placeholder-event.png'; // Define a placeholder image
    // Assume API provides an absolute URL or use placeholder
    console.log(`Event ${item.id} image URL from API:`, item.thumbnail); // Log URL from API
    if (imageDiv) imageDiv.style.backgroundImage = `url('${imageUrl}')`;

    if (titleEl) titleEl.textContent = item.title || 'No Title';

    console.log(`Event ${item.id} date_start:`, item.date_start, `time_start:`, item.time_start); // Log raw dates/times

    let dateTimeString = '';
    if (item.date_start) {
        // Use fromNow() for the date part, keep time format if available
        dateTimeString += moment(item.date_start).fromNow();
        if (item.time_start) {
            dateTimeString += ` (${moment(item.time_start, 'HH:mm:ss').format('h:mm A')})`;
        }
    } else {
        dateTimeString = 'Date/Time TBC';
    }
    if (dateTimeEl) dateTimeEl.textContent = dateTimeString;
    if (locationEl) locationEl.textContent = item.location || 'Location TBC';
}

function populateMarketplaceCard(clone, item, apiBaseUrl) { // Add apiBaseUrl param
    const card = clone.querySelector('.marketplace-card');
    const link = clone.querySelector('a');
    const imageDiv = clone.querySelector('.marketplace-image');
    const titleEl = clone.querySelector('.marketplace-title');
    const priceEl = clone.querySelector('.marketplace-price');
    const descriptionEl = clone.querySelector('.marketplace-description');
    const sellerEl = clone.querySelector('.marketplace-seller');
    const dateEl = clone.querySelector('.marketplace-date');

    if (card) card.dataset.id = item.id;
     // TODO: Define detail page URL structure
    if (link) link.href = `marketplace-detail.html?id=${item.id}`;
    // Assuming API provides an array of images, take the first one
    let imageUrl = (item.photos && item.photos.length > 0) ? item.photos[0].url : 'assets/images/placeholder-marketplace.png'; // Define placeholder
    // Assume API provides an absolute URL or use placeholder
    console.log(`Marketplace ${item.id} image URL from API:`, (item.photos && item.photos.length > 0) ? item.photos[0].url : 'N/A'); // Log URL from API
    if (imageDiv) imageDiv.style.backgroundImage = `url('${imageUrl}')`;

    if (titleEl) titleEl.textContent = item.item_name || 'No Name';
    if (priceEl) priceEl.textContent = item.item_price ? `₱${parseFloat(item.item_price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'Price TBC';
    if (descriptionEl) descriptionEl.textContent = item.description || '';
    // Assuming seller info might be nested
    const sellerName = item.user ? (item.user.name || item.user.username) : 'Unknown Seller';
    if (sellerEl) sellerEl.textContent = `By: ${sellerName}`;
    if (dateEl) {
        console.log(`Marketplace ${item.id} created_at:`, item.created_at); // Log raw date
        dateEl.textContent = item.created_at ? moment(item.created_at).fromNow() : ''; // Use fromNow()
    }
}

// Note: The tab switching logic in the HTML needs to be updated to dispatch the 'tab-switched' event.
// Example update for the HTML's inline script:

/*
// Replace the existing tab switching logic in news.html's <script> tag with this:

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tabs-container .tab a');
    const tabContents = document.querySelectorAll('.tab-content');
    const marketplaceButtons = document.getElementById('marketplace-buttons');

    function setActiveTab(targetId) {
        // Deactivate existing active tab and content
        document.querySelector('.tabs-container .tab a.active')?.classList.remove('active');
        document.querySelector('.tab-content.active')?.classList.remove('active');

        // Activate new tab and content
        const newActiveTab = document.querySelector(`.tabs-container .tab a[href="${targetId}"]`);
        const newActiveContent = document.querySelector(targetId);
        if (newActiveTab) newActiveTab.classList.add('active');
        if (newActiveContent) newActiveContent.classList.add('active');

        // Show/hide marketplace buttons
        if (marketplaceButtons) {
            marketplaceButtons.style.display = (targetId === '#marketplace') ? 'flex' : 'none';
        }

        // Dispatch custom event
        console.log(`Dispatching tab-switched for ${targetId.substring(1)}`);
        document.dispatchEvent(new CustomEvent('tab-switched', { detail: { tabId: targetId.substring(1) } }));
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            const activeContentId = this.getAttribute('href');
            setActiveTab(activeContentId);
            // Optional: Store active tab in localStorage/sessionStorage
            // localStorage.setItem('activeNewsTab', activeContentId);
        });
    });

    // Set initial active tab (ensure this runs after event listener setup in the page script)
    // Defer initial activation slightly to ensure page script listener is ready
    setTimeout(() => {
        const savedTab = localStorage.getItem('activeNewsTab'); // Example if saving state
        setActiveTab(savedTab || '#updates'); // Default to updates
    }, 0);


    // Search clear button logic
    document.querySelectorAll('.clear-search-btn').forEach(btn => {
        const targetInput = document.getElementById(btn.dataset.target);
        if (targetInput) {
            targetInput.addEventListener('input', function() {
                btn.style.display = this.value ? 'block' : 'none';
            });
            btn.addEventListener('click', function() {
                targetInput.value = '';
                targetInput.dispatchEvent(new Event('input')); // Trigger input event for filtering
                targetInput.focus();
                btn.style.display = 'none';
            });
             // Initial check in case field is pre-populated
            btn.style.display = targetInput.value ? 'block' : 'none';
        }
    });

    // Basic back button functionality
    document.getElementById('back-btn').addEventListener('click', () => window.history.back());

    // Check authentication
    checkAuth();
});

*/