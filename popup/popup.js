// MarketShield Chrome Extension - Popup Script

const MARKETSHIELD_APP_URL = 'http://localhost:5000'; // In production: 'https://your-app-domain.com'

class MarketShieldPopup {
  constructor() {
    this.userAuthenticated = false;
    this.currentTab = null;
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.checkCurrentTab();
    await this.checkAuthStatus();
    this.loadSettings();
    this.loadRecentScans();
  }

  bindEvents() {
    // Auth actions
    document.getElementById('loginBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${MARKETSHIELD_APP_URL}/login` });
    });

    // Scan actions
    document.getElementById('scanBtn').addEventListener('click', () => {
      this.performQuickScan();
    });

    document.getElementById('scanCurrentBtn').addEventListener('click', () => {
      this.scanCurrentPage();
    });

    // URL input enter key
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performQuickScan();
      }
    });

    // Settings
    document.getElementById('autoScanEnabled').addEventListener('change', (e) => {
      chrome.storage.sync.set({ enableAutoScan: e.target.checked });
    });

    document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
      chrome.storage.sync.set({ enableNotifications: e.target.checked });
    });

    // Footer actions
    document.getElementById('openDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: `${MARKETSHIELD_APP_URL}/dashboard` });
    });

    document.getElementById('reportScam').addEventListener('click', () => {
      chrome.tabs.create({ url: `${MARKETSHIELD_APP_URL}/report-scam` });
    });
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      if (this.isMarketplaceUrl(tab.url)) {
        document.getElementById('currentPageSection').classList.remove('hidden');
        document.getElementById('currentPageUrl').textContent = this.truncateUrl(tab.url);
      }
    } catch (error) {
      console.error('Error checking current tab:', error);
    }
  }

  async checkAuthStatus() {
    try {
      // Check authentication with background script
      chrome.runtime.sendMessage({ type: 'GET_USER_STATUS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Auth check error:', chrome.runtime.lastError);
          this.showAuthSection();
          return;
        }

        if (response && response.authenticated) {
          this.userAuthenticated = true;
          this.showMainContent();
          this.updateUserStats(response.user);
          this.updateStatusIndicator(true);
        } else {
          this.userAuthenticated = false;
          this.showAuthSection();
          this.updateStatusIndicator(false);
        }
      });
    } catch (error) {
      console.error('Auth status check failed:', error);
      this.showAuthSection();
      this.updateStatusIndicator(false);
    }
  }

  showAuthSection() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
  }

  showMainContent() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
  }

  updateStatusIndicator(active) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (active) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Protected';
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Not signed in';
    }
  }

  updateUserStats(user) {
    // Get today's scan count from storage
    chrome.storage.local.get(['scanHistory'], (result) => {
      const history = result.scanHistory || [];
      const today = new Date().toDateString();
      const todayScans = history.filter(scan => 
        new Date(scan.timestamp).toDateString() === today
      ).length;

      const threatsBlocked = history.filter(scan => 
        scan.result?.analysis?.safetyRating === 'unsafe'
      ).length;

      document.getElementById('scansToday').textContent = todayScans;
      document.getElementById('threatsBlocked').textContent = threatsBlocked;
    });
  }

  async performQuickScan() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError('Please enter a URL to scan');
      return;
    }

    if (!this.isValidMarketplaceUrl(url)) {
      this.showError('Please enter a valid marketplace URL');
      return;
    }

    this.showLoading(true);
    
    chrome.runtime.sendMessage({
      type: 'SCAN_LISTING',
      data: { url: url }
    }, (response) => {
      this.showLoading(false);

      if (chrome.runtime.lastError) {
        this.showError('Extension communication error');
        return;
      }

      if (response && response.success) {
        this.displayScanResult(response.data);
        this.loadRecentScans(); // Refresh recent scans
      } else {
        this.showError(response?.error || 'Scan failed');
      }
    });
  }

  async scanCurrentPage() {
    if (!this.currentTab || !this.isMarketplaceUrl(this.currentTab.url)) {
      this.showError('Current page is not a supported marketplace');
      return;
    }

    // Fill URL input and trigger scan
    document.getElementById('urlInput').value = this.currentTab.url;
    this.performQuickScan();
  }

  displayScanResult(data) {
    const resultDiv = document.getElementById('scanResult');
    const analysis = data.analysis;

    resultDiv.innerHTML = `
      <div class="result-header">
        <span class="safety-badge ${analysis.safetyRating}">${analysis.safetyRating.toUpperCase()}</span>
        <span class="confidence-score">${analysis.confidenceScore}% confidence</span>
      </div>
      ${analysis.riskFactors && analysis.riskFactors.length > 0 ? `
        <div class="risk-factors">
          <h4>Risk Factors:</h4>
          <ul class="risk-list">
            ${analysis.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    resultDiv.classList.remove('hidden');

    // Show notification for unsafe listings
    if (analysis.safetyRating === 'unsafe') {
      chrome.storage.sync.get(['enableNotifications'], (result) => {
        if (result.enableNotifications !== false) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon-48.png',
            title: 'MarketShield Alert',
            message: `Unsafe listing detected! ${analysis.riskFactors?.[0] || 'Multiple risk factors found'}`
          });
        }
      });
    }
  }

  showError(message) {
    const resultDiv = document.getElementById('scanResult');
    resultDiv.innerHTML = `
      <div style="color: #ef4444; text-align: center; padding: 12px;">
        ⚠️ ${message}
      </div>
    `;
    resultDiv.classList.remove('hidden');
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    const scanBtn = document.getElementById('scanBtn');
    
    if (show) {
      overlay.classList.remove('hidden');
      scanBtn.disabled = true;
    } else {
      overlay.classList.add('hidden');
      scanBtn.disabled = false;
    }
  }

  loadSettings() {
    chrome.storage.sync.get(['enableAutoScan', 'enableNotifications'], (result) => {
      document.getElementById('autoScanEnabled').checked = result.enableAutoScan !== false;
      document.getElementById('notificationsEnabled').checked = result.enableNotifications !== false;
    });
  }

  loadRecentScans() {
    chrome.runtime.sendMessage({ type: 'GET_SCAN_HISTORY' }, (response) => {
      if (chrome.runtime.lastError || !response) return;

      const container = document.getElementById('recentScans');
      
      if (!response.length) {
        container.innerHTML = '<div class="no-scans">No recent scans</div>';
        return;
      }

      const recentScans = response.slice(0, 5); // Show last 5 scans
      
      container.innerHTML = recentScans.map(scan => {
        const time = new Date(scan.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const safetyRating = scan.result?.analysis?.safetyRating || 'unknown';
        
        return `
          <div class="scan-item">
            <div class="scan-header">
              <span class="safety-badge ${safetyRating}">${safetyRating}</span>
              <span class="scan-time">${time}</span>
            </div>
            <div class="scan-url">${this.truncateUrl(scan.url, 40)}</div>
          </div>
        `;
      }).join('');
    });
  }

  // Utility functions
  isMarketplaceUrl(url) {
    if (!url) return false;
    
    const marketplacePatterns = [
      /facebook\.com\/marketplace/,
      /marketplace\.facebook\.com/,
      /craigslist\.org/,
      /\.craigslist\.org/
    ];
    
    return marketplacePatterns.some(pattern => pattern.test(url));
  }

  isValidMarketplaceUrl(url) {
    try {
      const urlObj = new URL(url);
      return this.isMarketplaceUrl(url) && 
             (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch {
      return false;
    }
  }

  truncateUrl(url, maxLength = 50) {
    if (!url) return '';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MarketShieldPopup();
});
