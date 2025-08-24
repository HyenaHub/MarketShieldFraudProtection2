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
    const settings = await chrome.storage.sync.get(['userAuthenticated', 'apiKey']);
    
    if (!settings.userAuthenticated) {
      sendResponse({ 
        success: false, 
        error: 'Please log in to MarketShield to scan listings' 
      });
      return;
    }

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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
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
    const response = await fetch(`${MARKETSHIELD_API_BASE}/api/auth/user`, {
      credentials: 'include'
    });
    
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
    console.error('Auth check error:', error);
    sendResponse({ authenticated: false, error: error.message });
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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scanWithMarketShield') {
    const urlToScan = info.linkUrl || info.pageUrl;
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url) => {
        chrome.runtime.sendMessage({
          type: 'SCAN_LISTING',
          data: { url: url }
        }, (response) => {
          if (response.success) {
            alert(`MarketShield Scan Complete!\nSafety Rating: ${response.data.analysis.safetyRating}\nConfidence: ${response.data.analysis.confidenceScore}%`);
          } else {
            alert(`Scan failed: ${response.error}`);
          }
        });
      },
      args: [urlToScan]
    });
  }
});
