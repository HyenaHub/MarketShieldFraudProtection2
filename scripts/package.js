#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Packaging MarketShield Chrome Extension...');

const buildDir = path.join(__dirname, '..', 'build');
const packageDir = path.join(__dirname, '..', 'packages');

// Ensure build exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Create packages directory
if (!fs.existsSync(packageDir)) {
  fs.mkdirSync(packageDir, { recursive: true });
}

// Read version from manifest
const manifestPath = path.join(buildDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

// Create timestamp for unique filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const packageName = `marketshield-extension-v${version}-${timestamp}.zip`;
const packagePath = path.join(packageDir, packageName);

try {
  // Create zip package
  console.log('Creating zip package...');
  execSync(`cd "${buildDir}" && zip -r "${packagePath}" .`, { stdio: 'inherit' });
  
  const stats = fs.statSync(packagePath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✓ Package created: ${packageName}`);
  console.log(`  Size: ${fileSizeInMB} MB`);
  console.log(`  Path: ${packagePath}`);
  
  // Verify package contents
  console.log('\nPackage contents:');
  try {
    execSync(`unzip -l "${packagePath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('Could not list package contents (unzip not available)');
  }
  
} catch (error) {
  console.error('Failed to create package:', error.message);
  process.exit(1);
}

console.log('\n✓ Packaging completed successfully!');
console.log('\nNext steps:');
console.log('1. Test the extension by loading it unpacked in Chrome');
console.log('2. Upload to Chrome Web Store Developer Dashboard');
console.log('3. Submit for review');
