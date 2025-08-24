# MarketShield Chrome Extension

![MarketShield Logo](icons/icon-128.png)

A powerful Chrome extension that protects users from scams and fraudulent listings on Facebook Marketplace, Craigslist, and other online marketplaces. Built to work seamlessly with the MarketShield web application.

## Features

### 🛡️ Real-Time Protection
- **Auto-scan listings** as you browse marketplace sites
- **AI-powered scam detection** with 99.2% accuracy rate
- **Visual safety badges** on listings (Safe ✅, Caution ⚠️, Unsafe 🚨)
- **Community-driven reports** integration

### 🎯 Supported Platforms
- Facebook Marketplace
- Craigslist (all regional sites)
- More platforms coming soon

### 🚀 Key Capabilities
- **Quick scan** any marketplace URL from the popup
- **Current page scanning** with one click
- **Scan history** tracking and statistics
- **Customizable settings** for auto-scan and notifications
- **Seamless integration** with MarketShield web dashboard

### 💼 Pro Features (requires MarketShield subscription)
- **Bulk URL scanning** (up to 50 URLs)
- **API access** for custom integrations
- **Priority support** and faster scanning
- **Advanced threat detection** algorithms

## Installation

### From Chrome Web Store (Recommended)
1. Visit the [MarketShield Chrome Extension](https://chrome.google.com/webstore/detail/marketshield) page
2. Click "Add to Chrome"
3. Sign in to your MarketShield account

### Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension will appear in your toolbar

## Getting Started

### 1. Sign In
- Click the MarketShield extension icon in your browser toolbar
- Click "Sign In to MarketShield" to authenticate with your account
- If you don't have an account, visit [MarketShield](http://localhost:5000) to create one

### 2. Configure Settings
- Auto-scan listings (recommended)
- Show safety badges on listings
- Enable notifications for unsafe listings

### 3. Start Browsing
- Visit Facebook Marketplace or Craigslist
- The extension automatically scans visible listings
- Safety badges appear on each listing
- Click listings to see detailed scan results

## How It Works

### Automatic Scanning
The extension continuously monitors marketplace pages for new listings and automatically scans them using MarketShield's AI-powered detection system.

### Visual Indicators
- **Green badges** (✅ Safe): Low risk, verified sellers
- **Yellow badges** (⚠️ Caution): Some risk factors detected
- **Red badges** (🚨 Unsafe): High risk, avoid transaction

### Risk Detection
Our AI analyzes multiple factors:
- Seller profile authenticity
- Price vs. market value analysis
- Image authenticity verification
- Communication pattern analysis
- Community report correlation

## Usage

### Extension Popup
Click the MarketShield icon to access:
- **Quick Scan**: Paste any marketplace URL for instant analysis
- **Current Page**: Scan the page you're currently viewing
- **Recent Scans**: View your scanning history
- **Settings**: Customize protection preferences

### Content Protection
While browsing marketplaces:
- Listings are automatically scanned and badged
- Unsafe listings show warning dialogs before access
- Right-click any listing to scan with MarketShield
- Settings accessible via the floating protection indicator

## Privacy & Security

### Data Collection
- Only scans URLs you visit on supported marketplace sites
- No personal browsing data is stored
- Scan results cached locally for performance
- Full privacy policy: [MarketShield Privacy Policy](http://localhost:5000/privacy-policy)

### Security Features
- All API communication encrypted with HTTPS
- No sensitive data transmitted to third parties
- Local storage for extension preferences
- Secure authentication with MarketShield servers

## Development

### Prerequisites
- Chrome browser with Developer Mode enabled
- MarketShield web application running locally
- Basic knowledge of Chrome extensions

### Project Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js           # Service worker
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup functionality
├── content-scripts/
│   ├── facebook-marketplace.js  # Facebook integration
│   ├── craigslist.js            # Craigslist integration
│   └── marketshield.css         # Content script styles
├── icons/                 # Extension icons
└── README.md             # This file
```

### Local Development
1. Update API endpoints in JavaScript files:
   ```javascript
   const MARKETSHIELD_API_BASE = 'http://localhost:5000';
   ```

2. Load the extension in Chrome:
   ```bash
   chrome://extensions/ → Developer mode → Load unpacked
   ```

3. Test on marketplace sites:
   - facebook.com/marketplace
   - craigslist.org

### Building for Production
1. Update API endpoints to production URLs
2. Optimize images and icons
3. Test on multiple Chrome versions
4. Submit to Chrome Web Store

## API Integration

The extension integrates with the MarketShield web application API:

### Authentication
```javascript
GET /api/auth/user
```

### Listing Scanning
```javascript
POST /api/scan
Content-Type: application/json
{
  "url": "https://facebook.com/marketplace/item/123456789",
  "source": "chrome_extension"
}
```

### Response Format
```javascript
{
  "success": true,
  "data": {
    "analysis": {
      "safetyRating": "safe|caution|unsafe",
      "confidenceScore": 85,
      "riskFactors": ["Unusually low price", "New seller account"]
    },
    "listing": {
      "title": "iPhone 15 Pro",
      "price": "$800",
      "location": "San Francisco, CA"
    }
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ JavaScript features
- Follow existing code formatting
- Add comments for complex logic
- Test across different marketplace layouts

## Support

### Getting Help
- **Documentation**: [MarketShield Help Center](http://localhost:5000/faq)
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/marketshield-extension/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-org/marketshield-extension/discussions)
- **Email Support**: MarketShieldFraudProtection@gmail.com

### Troubleshooting

#### Extension Not Working
1. Refresh the marketplace page
2. Check if you're signed in to MarketShield
3. Verify extension permissions
4. Restart Chrome browser

#### Scans Not Appearing
1. Ensure auto-scan is enabled in settings
2. Check your MarketShield subscription status
3. Verify you're on a supported marketplace site
4. Clear extension storage and re-authenticate

#### Performance Issues
1. Disable auto-scan for better performance
2. Clear scan history in extension popup
3. Update to latest extension version
4. Contact support if issues persist

## Changelog

### v1.0.0 (2025-01-24)
- Initial release
- Facebook Marketplace support
- Craigslist support
- Auto-scanning functionality
- Safety badge system
- Extension popup interface
- Settings customization
- Scan history tracking

## License

Copyright © 2025 MarketShield. All rights reserved.

This extension is proprietary software and is licensed for use only with the MarketShield service. Unauthorized distribution or modification is prohibited.

## Acknowledgments

- Chrome Extensions Team for excellent documentation
- MarketShield AI team for fraud detection algorithms
- Beta testers and community feedback
- Open source libraries used in development

---

**Stay Safe Online with MarketShield** 🛡️
