// MarketShield Chrome Extension - Connection Test Script
// Run this in Chrome DevTools Console to test connectivity

const MARKETSHIELD_API_BASE = 'http://localhost:5000';

async function testConnection() {
  console.log('🔍 Testing MarketShield Chrome Extension Connectivity...\n');
  
  // Test 1: Basic fetch to test endpoint
  console.log('Test 1: Testing basic API connectivity...');
  try {
    const response = await fetch(`${MARKETSHIELD_API_BASE}/api/auth/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connection successful!');
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ User is authenticated!');
    } else if (response.status === 401) {
      const data = await response.json();
      console.log('⚠️ User not authenticated (expected):', data.message);
      console.log('✅ API communication working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Make sure MarketShield server is running at http://localhost:5000');
      console.log('2. Check Chrome extension permissions in chrome://extensions/');
      console.log('3. Verify host_permissions includes "http://localhost:5000/*" in manifest.json');
      console.log('4. Try refreshing the extension or reloading it');
    }
    return false;
  }
  
  // Test 2: Check extension permissions
  console.log('\nTest 2: Checking Chrome extension permissions...');
  try {
    if (chrome && chrome.runtime) {
      console.log('✅ Chrome extension context available');
      console.log('Extension ID:', chrome.runtime.id);
    } else {
      console.log('❌ Chrome extension context not available');
      console.log('This script must be run from within the extension context');
    }
  } catch (error) {
    console.log('❌ Extension context error:', error);
  }
  
  // Test 3: Storage access test
  console.log('\nTest 3: Testing Chrome storage access...');
  try {
    if (chrome && chrome.storage) {
      await chrome.storage.sync.get(['userAuthenticated']);
      console.log('✅ Chrome storage access working');
    } else {
      console.log('❌ Chrome storage not available');
    }
  } catch (error) {
    console.log('❌ Storage access error:', error);
  }
  
  console.log('\n🎉 Connection test completed!');
  return true;
}

// Run the test
testConnection();
