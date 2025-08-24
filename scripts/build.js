#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Building MarketShield Chrome Extension...');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy extension files to build directory
const filesToCopy = [
  'manifest.json',
  'background.js',
  'popup/',
  'content-scripts/',
  'icons/',
  'README.md'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const sourceDir = path.join(__dirname, '..');

filesToCopy.forEach(file => {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(buildDir, file);
  
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`✓ Copied ${file}`);
  }
});

// Update API endpoints for production if environment variable is set
const prodApiUrl = process.env.PROD_API_URL;
if (prodApiUrl) {
  console.log(`Updating API endpoints to: ${prodApiUrl}`);
  
  const jsFiles = [
    path.join(buildDir, 'background.js'),
    path.join(buildDir, 'popup', 'popup.js'),
    path.join(buildDir, 'content-scripts', 'facebook-marketplace.js'),
    path.join(buildDir, 'content-scripts', 'craigslist.js')
  ];
  
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace(/http:\/\/localhost:5000/g, prodApiUrl);
      fs.writeFileSync(file, content);
      console.log(`✓ Updated API endpoints in ${path.basename(file)}`);
    }
  });
}

console.log('✓ Build completed successfully!');
console.log(`Build output: ${buildDir}`);
