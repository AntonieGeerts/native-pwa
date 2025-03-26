/**
 * Verify Changes Utility
 * This script verifies that our changes to fix the spinner issue are being applied correctly
 */

(function() {
  // Function to check if our changes are applied
  function verifyChanges() {
    // Check if we're on a mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (window.CapacitorApp && window.CapacitorApp.isNativePlatform());
    
    console.log('%c Verifying changes to fix spinner issue... ', 'background: #007aff; color: white; font-size: 14px; padding: 3px;');
    console.log('Device type:', isMobileDevice ? 'Mobile' : 'Desktop');
    
    // Check authentication status
    const isLoggedIn = checkLoginStatus();
    console.log('Authentication status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    
    // Check if spinner CSS is removed
    const spinnerStyles = getComputedStyle(document.documentElement).getPropertyValue('--spinner-animation');
    console.log('Spinner animation CSS:', spinnerStyles || 'Not found (good)');
    
    // Check if any spinners exist in the DOM
    const spinners = document.querySelectorAll('.spinner');
    console.log('Spinner elements found:', spinners.length);
    if (spinners.length > 0) {
      console.warn('Warning: Spinner elements still exist in the DOM!');
      spinners.forEach((spinner, index) => {
        // Don't log the full element to avoid console bloat
        console.warn(`Spinner ${index} found in:`, spinner.parentElement ? spinner.parentElement.tagName : 'unknown');
      });
    } else {
      console.log('No spinner elements found (good)');
    }
    
    // Check if our CSS file is loaded
    const formFieldsCSS = Array.from(document.styleSheets).find(sheet =>
      sheet.href && sheet.href.includes('form-fields.css'));
    console.log('Form fields CSS loaded:', formFieldsCSS ? 'Yes' : 'No');
    
    // Check if cache busting is working
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const jsScripts = Array.from(document.querySelectorAll('script[src]'));
    
    const cacheBustedCSS = cssLinks.filter(link => link.href && link.href.includes('?v='));
    const cacheBustedJS = jsScripts.filter(script => script.src && script.src.includes('?v='));
    
    console.log('CSS files with cache busting:', cacheBustedCSS.length);
    console.log('JS files with cache busting:', cacheBustedJS.length);
    
    // Check for any remaining animations
    const animatedElements = findAnimatedElements();
    console.log('Elements with animations:', animatedElements.length);
    
    // Log results to console in a visible way
    console.log('%c VERIFICATION COMPLETE ', 'background: #007aff; color: white; font-size: 16px; padding: 5px;');
    
    // Log to Logger if available
    if (window.Logger) {
      Logger.info('Change verification results', {
        deviceType: isMobileDevice ? 'mobile' : 'desktop',
        authStatus: isLoggedIn ? 'logged_in' : 'not_logged_in',
        spinnerElementsFound: spinners.length,
        formFieldsCSSLoaded: !!formFieldsCSS,
        cacheBustedCSSCount: cacheBustedCSS.length,
        cacheBustedJSCount: cacheBustedJS.length,
        animatedElementsCount: animatedElements.length
      });
    }
    
    return {
      deviceType: isMobileDevice ? 'mobile' : 'desktop',
      isLoggedIn,
      spinnersFound: spinners.length,
      cssLoaded: !!formFieldsCSS,
      cacheBusting: {
        css: cacheBustedCSS.length,
        js: cacheBustedJS.length
      },
      animatedElements: animatedElements.length
    };
  }
  
  // Check login status without interfering with it
  function checkLoginStatus() {
    // Check common auth token locations
    const hasLocalStorageToken = localStorage.getItem('auth_token') ||
                                localStorage.getItem('user_session') ||
                                localStorage.getItem('token');
                                
    const hasSessionStorageToken = sessionStorage.getItem('auth_token') ||
                                  sessionStorage.getItem('user_session') ||
                                  sessionStorage.getItem('token');
                                  
    // Check for auth cookies (without accessing them directly)
    const hasCookies = document.cookie.includes('auth') ||
                      document.cookie.includes('token') ||
                      document.cookie.includes('session');
                      
    return !!(hasLocalStorageToken || hasSessionStorageToken || hasCookies);
  }
  
  // Find elements with animations
  function findAnimatedElements() {
    const allElements = document.querySelectorAll('*');
    const animatedElements = [];
    
    for (let i = 0; i < Math.min(allElements.length, 1000); i++) { // Limit to 1000 to avoid performance issues
      const element = allElements[i];
      const style = window.getComputedStyle(element);
      
      if (style.animation && style.animation !== 'none' && style.animation !== '') {
        animatedElements.push({
          element: element.tagName,
          animation: style.animation
        });
      }
    }
    
    return animatedElements;
  }
  
  // Run verification after page load
  window.addEventListener('load', function() {
    // Wait a bit to ensure everything is loaded
    setTimeout(verifyChanges, 1000);
  });
  
  // Expose function globally for manual verification
  window.verifyChanges = verifyChanges;
  
  console.log('Verification script loaded');
})();