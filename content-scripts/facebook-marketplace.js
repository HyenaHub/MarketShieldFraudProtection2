// MarketShield Chrome Extension - Facebook Marketplace Content Script

class FacebookMarketplaceProtection {
  constructor() {
    this.isInitialized = false;
    this.scanQueue = new Set();
    this.scannedUrls = new Map();
    this.settings = {
      enableAutoScan: true,
      showSafetyBadges: true
    };
    
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('[MarketShield] Initializing Facebook Marketplace protection');
    
    await this.loadSettings();
    this.setupMutationObserver();
    this.addMarketShieldBranding();
    this.scanVisibleListings();
    
    this.isInitialized = true;
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enableAutoScan', 'showSafetyBadges'], (result) => {
        this.settings = {
          enableAutoScan: result.enableAutoScan !== false,
          showSafetyBadges: result.showSafetyBadges !== false
        };
        resolve();
      });
    });
  }

  setupMutationObserver() {
    // Watch for new listing elements being added to the page
    const observer = new MutationObserver((mutations) => {
      let hasNewListings = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new listings were added
              if (this.containsListingElements(node)) {
                hasNewListings = true;
              }
            }
          });
        }
      });

      if (hasNewListings && this.settings.enableAutoScan) {
        // Debounce to avoid excessive scanning
        clearTimeout(this.scanTimeout);
        this.scanTimeout = setTimeout(() => {
          this.scanVisibleListings();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  containsListingElements(element) {
    // Facebook uses various selectors for marketplace listings
    const listingSelectors = [
      '[role="article"]',
      'a[href*="/marketplace/item/"]',
      '[data-testid^="marketplace"]',
      '.marketplace-item',
      '[href*="marketplace/item"]'
    ];

    return listingSelectors.some(selector => 
      element.matches && element.matches(selector) ||
      element.querySelector && element.querySelector(selector)
    );
  }

  scanVisibleListings() {
    if (!this.settings.enableAutoScan) return;

    // Find all marketplace listing links
    const listingLinks = this.findListingLinks();
    
    listingLinks.forEach(link => {
      const url = this.extractListingUrl(link);
      if (url && !this.scannedUrls.has(url) && !this.scanQueue.has(url)) {
        this.queueListingScan(url, link);
      }
    });
  }

  findListingLinks() {
    const selectors = [
      'a[href*="/marketplace/item/"]',
      'a[href*="marketplace/item"]',
      '[role="article"] a',
      '.marketplace-listing-item a'
    ];

    const links = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.href && el.href.includes('marketplace') && el.href.includes('item')) {
          links.push(el);
        }
      });
    });

    return [...new Set(links)]; // Remove duplicates
  }

  extractListingUrl(element) {
    const href = element.href || element.getAttribute('href');
    if (!href) return null;

    try {
      const url = new URL(href, window.location.origin);
      // Clean URL parameters except essential ones
      const cleanUrl = `${url.origin}${url.pathname}`;
      return cleanUrl;
    } catch (error) {
      console.warn('[MarketShield] Invalid URL:', href);
      return null;
    }
  }

  async queueListingScan(url, element) {
    this.scanQueue.add(url);

    try {
      const result = await this.scanListing(url);
      this.scannedUrls.set(url, result);
      
      if (this.settings.showSafetyBadges) {
        this.addSafetyBadge(element, result);
      }

      // Show warning for unsafe listings
      if (result?.analysis?.safetyRating === 'unsafe') {
        this.highlightUnsafeListing(element, result);
      }

    } catch (error) {
      console.warn('[MarketShield] Scan failed for:', url, error);
    } finally {
      this.scanQueue.delete(url);
    }
  }

  async scanListing(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'SCAN_LISTING',
        data: { url: url }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Scan failed'));
        }
      });
    });
  }

  addSafetyBadge(element, scanResult) {
    const analysis = scanResult?.analysis;
    if (!analysis) return;

    // Find the best container for the badge
    const container = this.findBadgeContainer(element);
    if (!container) return;

    // Remove existing badge if present
    const existingBadge = container.querySelector('.marketshield-safety-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Create safety badge
    const badge = document.createElement('div');
    badge.className = `marketshield-safety-badge marketshield-${analysis.safetyRating}`;
    badge.innerHTML = `
      <span class="marketshield-icon">${this.getSafetyIcon(analysis.safetyRating)}</span>
      <span class="marketshield-text">${analysis.safetyRating.toUpperCase()}</span>
    `;

    // Add tooltip with more details
    badge.title = `MarketShield: ${analysis.safetyRating} (${analysis.confidenceScore}% confidence)${
      analysis.riskFactors?.length ? '\nRisk factors: ' + analysis.riskFactors.join(', ') : ''
    }`;

    // Position the badge
    container.style.position = 'relative';
    container.appendChild(badge);

    // Also add color flag next to listing title
    this.addTitleFlag(element, analysis);
  }

  addTitleFlag(element, analysis) {
    // Find the listing title within this element or its container
    const titleSelectors = [
      'h3 a[href*="/marketplace/item/"]',
      'h2 a[href*="/marketplace/item/"]', 
      'div[role="heading"] a',
      'span[dir="auto"] a',
      'a[href*="/marketplace/item/"] span',
      'a[aria-label] span',
      '[role="link"] span'
    ];

    let titleElement = null;
    
    // First try to find title within the element
    for (const selector of titleSelectors) {
      titleElement = element.querySelector(selector);
      if (titleElement && titleElement.textContent?.trim()) break;
    }

    // If not found, try in parent containers
    if (!titleElement) {
      const parentElement = element.closest('[data-pagelet]') || 
                           element.closest('div[role="article"]') ||
                           element.closest('[data-testid^="marketplace"]');
      if (parentElement) {
        for (const selector of titleSelectors) {
          titleElement = parentElement.querySelector(selector);
          if (titleElement && titleElement.textContent?.trim()) break;
        }
      }
    }

    // Also try to find any link that contains marketplace/item
    if (!titleElement) {
      const marketplaceLink = element.closest('a[href*="/marketplace/item/"]') || 
                             element.querySelector('a[href*="/marketplace/item/"]');
      if (marketplaceLink) {
        const textSpan = marketplaceLink.querySelector('span[dir="auto"]') ||
                        marketplaceLink.querySelector('span') ||
                        marketplaceLink.querySelector('[role="heading"]');
        if (textSpan && textSpan.textContent?.trim()) {
          titleElement = textSpan;
        }
      }
    }

    if (!titleElement) return;

    // Remove existing flags to avoid duplicates
    const existingFlags = document.querySelectorAll('.marketshield-title-flag');
    existingFlags.forEach(flag => {
      if (titleElement.contains(flag) || titleElement.parentElement?.contains(flag)) {
        flag.remove();
      }
    });

    // Create safety flag
    const flag = document.createElement('span');
    flag.className = `marketshield-title-flag marketshield-flag-${analysis.safetyRating}`;
    flag.innerHTML = this.getSafetyFlagIcon(analysis.safetyRating);
    flag.title = `MarketShield Safety: ${analysis.safetyRating.toUpperCase()} (${analysis.confidenceScore}% confidence)`;
    flag.style.cssText = `
      display: inline-block;
      margin-right: 6px;
      font-size: 12px;
      line-height: 1;
      vertical-align: middle;
    `;

    // Insert flag at the beginning of the title
    if (titleElement.firstChild) {
      titleElement.insertBefore(flag, titleElement.firstChild);
    } else {
      titleElement.appendChild(flag);
    }
  }

  getSafetyFlagIcon(rating) {
    const icons = {
      'safe': '<span style="color: #10b981; font-weight: bold;">●</span>',
      'caution': '<span style="color: #f59e0b; font-weight: bold;">●</span>', 
      'unsafe': '<span style="color: #ef4444; font-weight: bold; animation: marketshield-pulse-flag 2s infinite;">●</span>',
      'pending': '<span style="color: #9ca3af; font-weight: bold; opacity: 0.6;">●</span>',
      'default': '<span style="color: #9ca3af; font-weight: bold;">●</span>'
    };
    return icons[rating] || icons['default'];
  }

  findBadgeContainer(element) {
    // Try to find the best container for the badge
    let container = element;
    
    // Look for article or card-like containers
    const selectors = ['[role="article"]', '.marketplace-item', '[data-testid^="marketplace"]'];
    
    for (const selector of selectors) {
      const parent = element.closest(selector);
      if (parent) {
        container = parent;
        break;
      }
    }

    // If still the same element, try to find an image container
    if (container === element) {
      const imageContainer = element.querySelector('img')?.parentElement;
      if (imageContainer) {
        container = imageContainer;
      }
    }

    return container;
  }

  highlightUnsafeListing(element, scanResult) {
    const container = this.findBadgeContainer(element);
    if (!container) return;

    // Add warning overlay
    container.classList.add('marketshield-unsafe-listing');
    
    // Add click handler to show warning
    const originalOnClick = element.onclick;
    element.onclick = (e) => {
      const proceed = confirm(
        `⚠️ MarketShield Warning ⚠️\n\n` +
        `This listing has been flagged as potentially unsafe.\n` +
        `Risk factors: ${scanResult.analysis.riskFactors?.join(', ') || 'Multiple issues detected'}\n\n` +
        `Do you want to continue viewing this listing?`
      );
      
      if (!proceed) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      if (originalOnClick) {
        return originalOnClick.call(this, e);
      }
    };
  }

  getSafetyIcon(rating) {
    switch (rating) {
      case 'safe': return '✅';
      case 'caution': return '⚠️';
      case 'unsafe': return '🚨';
      default: return '❓';
    }
  }

  addMarketShieldBranding() {
    // Add a subtle indicator that MarketShield is active
    if (document.getElementById('marketshield-branding')) return;

    const branding = document.createElement('div');
    branding.id = 'marketshield-branding';
    branding.className = 'marketshield-branding';
    branding.innerHTML = `
      <div class="marketshield-brand-content">
        <span class="marketshield-shield">🛡️</span>
        <span class="marketshield-brand-text">Protected by MarketShield</span>
        <button class="marketshield-settings-btn" id="marketshieldSettings">⚙️</button>
      </div>
    `;

    document.body.appendChild(branding);

    // Add settings click handler
    document.getElementById('marketshieldSettings').addEventListener('click', () => {
      this.showQuickSettings();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      branding.classList.add('marketshield-hidden');
    }, 5000);
  }

  showQuickSettings() {
    const modal = document.createElement('div');
    modal.className = 'marketshield-settings-modal';
    modal.innerHTML = `
      <div class="marketshield-settings-content">
        <h3>MarketShield Settings</h3>
        <label>
          <input type="checkbox" id="autoScanToggle" ${this.settings.enableAutoScan ? 'checked' : ''}>
          Auto-scan listings
        </label>
        <label>
          <input type="checkbox" id="safetyBadgesToggle" ${this.settings.showSafetyBadges ? 'checked' : ''}>
          Show safety badges
        </label>
        <div class="marketshield-settings-actions">
          <button id="saveSettings">Save</button>
          <button id="cancelSettings">Cancel</button>
          <button id="openDashboard">Open Dashboard</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind events
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.settings.enableAutoScan = document.getElementById('autoScanToggle').checked;
      this.settings.showSafetyBadges = document.getElementById('safetyBadgesToggle').checked;
      
      chrome.storage.sync.set({
        enableAutoScan: this.settings.enableAutoScan,
        showSafetyBadges: this.settings.showSafetyBadges
      });
      
      modal.remove();
    });

    document.getElementById('cancelSettings').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('openDashboard').addEventListener('click', () => {
      window.open('http://localhost:5000/dashboard', '_blank');
      modal.remove();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Initialize protection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FacebookMarketplaceProtection();
  });
} else {
  new FacebookMarketplaceProtection();
}

// Handle page navigation (for SPAs like Facebook)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Reinitialize on navigation
    setTimeout(() => {
      new FacebookMarketplaceProtection();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
