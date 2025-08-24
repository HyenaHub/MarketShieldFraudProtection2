// MarketShield Chrome Extension - Background Service Worker

const MARKETSHIELD_API_BASE = 'http://localhost:5000'; // In production: 'https://your-app-domain.com'

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('MarketShield extension installed/updated:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    enableAutoScan: true,
    showSafetyBadges: true,
    enableNotifications: true,
    apiKey: null,
    userAuthenticated: false
  });

  // Show welcome notification
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'MarketShield Installed!',
      message: 'Your marketplace protection is now active. Click the extension icon to get started.'
    });
  }
});

// Handle tab updates to check for marketplace pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isMarketplacePage = isMarketplaceUrl(tab.url);
    
    if (isMarketplacePage) {
      // Inject protection features into marketplace pages
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: initializeMarketShieldProtection
      });
    }
  }
});

// Message handling between content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'SCAN_LISTING':
      handleListingScan(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GET_USER_STATUS':
      getUserAuthStatus(sendResponse);
      return true;
      
    case 'SAVE_SCAN_RESULT':
      saveScanResult(request.data);
      break;
      
    case 'GET_SCAN_HISTORY':
      getScanHistory(sendResponse);
      return true;
      
    default:
      console.log('Unknown message type:', request.type);
  }
});

// Utility functions
function isMarketplaceUrl(url) {
  const marketplacePatterns = [
    /facebook\.com\/marketplace/,
    /marketplace\.facebook\.com/,
    /craigslist\.org/,
    /\.craigslist\.org/
  ];
  
  return marketplacePatterns.some(pattern => pattern.test(url));
}

function initializeMarketShieldProtection() {
  // This function runs in the page context
  if (window.marketShieldInitialized) return;
  
  window.marketShieldInitialized = true;
  console.log('MarketShield protection initialized');
  
  // Add visual indicators that protection is active
  const indicator = document.createElement('div');
  indicator.id = 'marketshield-indicator';
  indicator.innerHTML = '🛡️ MarketShield Active';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #10b981;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(indicator);
  
  // Fade out after 3 seconds
  setTimeout(() => {
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }
  }, 3000);
}

// API interaction functions
async function handleListingScan(data, sendResponse) {
  try {
    // First check if user is authenticated by making a test request
    const authResponse = await fetch(`${MARKETSHIELD_API_BASE}/api/auth/status`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!authResponse.ok || authResponse.status === 401) {
      // Update local storage to reflect unauthenticated state
      chrome.storage.sync.set({ userAuthenticated: false });
      sendResponse({ 
        success: false, 
        error: 'Please log in to MarketShield to scan listings',
        needsAuth: true
      });
      return;
    }

    // User is authenticated, proceed with scan
    const response = await fetch(`${MARKETSHIELD_API_BASE}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: data.url,
        source: 'chrome_extension'
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        chrome.storage.sync.set({ userAuthenticated: false });
        throw new Error('Please log in to MarketShield to scan listings');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update authentication status on success
    chrome.storage.sync.set({ userAuthenticated: true });
    
    // Save scan result locally
    saveScanResult({
      url: data.url,
      result: result,
      timestamp: Date.now()
    });

    sendResponse({ 
      success: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to scan listing' 
    });
  }
}

async function getUserAuthStatus(sendResponse) {
  try {
    console.log('[MarketShield] Checking auth status at:', `${MARKETSHIELD_API_BASE}/api/auth/status`);
    
    const response = await fetch(`${MARKETSHIELD_API_BASE}/api/auth/status`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[MarketShield] Auth check response:', response.status, response.statusText);
    
    if (response.ok) {
      const user = await response.json();
      await chrome.storage.sync.set({ 
        userAuthenticated: true,
        userEmail: user.email,
        subscriptionTier: user.subscriptionTier || 'free'
      });
      
      sendResponse({ 
        authenticated: true, 
        user: user 
      });
    } else {
      await chrome.storage.sync.set({ userAuthenticated: false });
      sendResponse({ authenticated: false });
    }
  } catch (error) {
    console.error('[MarketShield] Auth check error:', error);
    
    // Detailed error logging
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[MarketShield] Network error - check if MarketShield server is running at:', MARKETSHIELD_API_BASE);
      console.error('[MarketShield] Make sure CORS is configured and localhost:5000 is accessible');
    }
    
    chrome.storage.sync.set({ userAuthenticated: false });
    
    sendResponse({ 
      authenticated: false, 
      error: error.message || 'Authentication check failed'
    });
  }
}

function saveScanResult(data) {
  chrome.storage.local.get(['scanHistory'], (result) => {
    const history = result.scanHistory || [];
    history.unshift(data); // Add to beginning
    
    // Keep only last 100 scans
    if (history.length > 100) {
      history.splice(100);
    }
    
    chrome.storage.local.set({ scanHistory: history });
  });
}

function getScanHistory(sendResponse) {
  chrome.storage.local.get(['scanHistory'], (result) => {
    sendResponse(result.scanHistory || []);
  });
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus) {
    try {
      chrome.contextMenus.create({
        id: 'scanWithMarketShield',
        title: 'Scan with MarketShield',
        contexts: ['page', 'link'],
        documentUrlPatterns: [
          'https://facebook.com/marketplace/*',
          'https://www.facebook.com/marketplace/*',
          'https://marketplace.facebook.com/*',
          'https://craigslist.org/*',
          'https://*.craigslist.org/*'
        ]
      });
    } catch (error) {
      console.log('MarketShield: Context menu creation failed:', error);
    }
  }
});

// Context menu click handler
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'scanWithMarketShield') {
      const urlToScan = info.linkUrl || info.pageUrl;
      
      if (chrome.scripting) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (url) => {
            // Show immediate feedback
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed; top: 20px; right: 20px; z-index: 10000;
              background: #3b82f6; color: white; padding: 12px 16px;
              border-radius: 8px; font-family: sans-serif; font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            notification.textContent = 'MarketShield: Scanning listing...';
            document.body.appendChild(notification);

            // Remove notification after 3 seconds
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 3000);
          },
          args: [urlToScan]
        }).then(() => {
          // Process scan in background
          handleScanRequest(urlToScan, (result) => {
            if (result.success) {
              // Show results via badge or notification
              chrome.action.setBadgeText({ 
                text: result.data.analysis.safetyRating === 'unsafe' ? '!' : '✓',
                tabId: tab.id 
              });
              chrome.action.setBadgeBackgroundColor({
                color: result.data.analysis.safetyRating === 'unsafe' ? '#ef4444' : 
                       result.data.analysis.safetyRating === 'caution' ? '#f59e0b' : '#10b981'
              });
            }
          });
        }).catch((error) => {
          console.error('MarketShield: Script execution failed:', error);
        });
      }
    }
  });
}
