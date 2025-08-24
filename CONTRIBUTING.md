# Contributing to MarketShield Chrome Extension

Thank you for your interest in contributing to the MarketShield Chrome Extension! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Google Chrome browser (latest version)
- Node.js 16+ and npm
- Basic knowledge of JavaScript and Chrome Extension APIs
- MarketShield web application running locally for testing

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/marketshield-extension.git
   cd marketshield-extension
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

## Development Workflow

### Making Changes
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test thoroughly on supported marketplace sites
4. Lint your code:
   ```bash
   npm run lint
   ```
5. Commit with descriptive messages

### Testing
- Test on Facebook Marketplace and Craigslist
- Verify popup functionality works correctly
- Check that content scripts don't interfere with page functionality
- Test with different screen sizes and Chrome versions

## Code Style Guidelines

### JavaScript
- Use ES6+ features
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Prefer async/await over Promises where possible

### CSS
- Use consistent naming conventions
- Follow existing class naming patterns
- Ensure styles don't conflict with marketplace sites
- Use CSS variables for theming

### Example Code Style
```javascript
/**
 * Scans a marketplace listing for potential fraud indicators
 * @param {string} url - The listing URL to scan
 * @returns {Promise<Object>} Scan result with safety rating
 */
async function scanListing(url) {
  try {
    const response = await this.sendScanRequest(url);
    return this.processScanResult(response);
  } catch (error) {
    console.error('Scan failed:', error);
    throw new Error(`Failed to scan listing: ${error.message}`);
  }
}
```

## Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation if needed
3. Add/update comments for complex logic
4. Verify extension works with latest Chrome version

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Facebook Marketplace
- [ ] Tested on Craigslist
- [ ] Tested popup functionality
- [ ] Verified no conflicts with page content

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex areas
- [ ] Documentation updated
```

## Bug Reports

### Creating Issues
Use the bug report template and include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots or screen recordings

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Screenshots**
Add screenshots if applicable

**Environment:**
- Chrome Version: [e.g. 122.0.6261.94]
- Extension Version: [e.g. 1.0.0]
- Operating System: [e.g. macOS 14.0]
- Marketplace Site: [e.g. Facebook Marketplace]
```

## Feature Requests

### Proposing Features
1. Check existing issues for similar requests
2. Create detailed feature request with:
   - Problem description
   - Proposed solution
   - Alternative solutions considered
   - Additional context

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Detailed description of the solution

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

## Architecture Guidelines

### Extension Structure
```
chrome-extension/
├── manifest.json              # Extension configuration
├── background.js             # Service worker (main logic)
├── popup/                    # Extension popup UI
├── content-scripts/          # Page injection scripts
├── icons/                    # Extension icons
└── scripts/                  # Build and utility scripts
```

### Key Components

#### Background Script
- Handles API communication
- Manages extension state
- Processes messages from content scripts
- Handles context menus and notifications

#### Content Scripts
- Inject protection features into marketplace pages
- Scan visible listings automatically
- Add safety badges and warnings
- Handle user interactions on pages

#### Popup Interface
- Provides quick access to extension features
- Shows user stats and recent activity
- Allows manual URL scanning
- Manages extension settings

### API Integration
The extension integrates with the MarketShield web application:
- Authentication via cookies
- RESTful API endpoints
- WebSocket connections for real-time updates
- Proper error handling and retry logic

## Security Considerations

### Data Handling
- Never store sensitive data in extension storage
- Validate all user inputs
- Use HTTPS for all API communications
- Follow principle of least privilege for permissions

### Content Script Security
- Avoid eval() and innerHTML where possible
- Sanitize any dynamic content
- Use Content Security Policy restrictions
- Isolate extension code from page scripts

## Release Process

### Version Numbering
Follow semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Checklist
1. Update version in manifest.json
2. Update CHANGELOG.md
3. Test on all supported browsers
4. Create release notes
5. Tag release in Git
6. Submit to Chrome Web Store

## Support Channels

### Getting Help
- **Documentation**: Check README.md and code comments
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: MarketShieldFraudProtection@gmail.com

### Code Review
- All PRs require review from maintainers
- Address feedback promptly
- Keep PRs focused and atomic
- Be receptive to suggestions

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (Proprietary - MarketShield).

## Recognition

Contributors will be acknowledged in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Extension credits (for major features)

Thank you for helping make MarketShield better!
