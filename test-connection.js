/**
 * Simple connection test for Windows desktop app
 * Tests if the app can reach Firebase endpoints
 */

import https from 'https';

function testFirebaseConnectivity() {
  console.log('🔥 Testing Firebase connectivity...\n');

  // Test 1: Check Firebase project accessibility
  const firebaseUrl = `https://firestore.googleapis.com/v1/projects/tradedesk-ea98a/databases/(default)/documents`;
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  const req = https.request(firebaseUrl, options, (res) => {
    console.log('📡 Firebase Response:');
    console.log('- Status:', res.statusCode);
    console.log('- Status Message:', res.statusMessage);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('- Response:', result);
        
        if (res.statusCode === 200) {
          console.log('\n✅ Firebase is accessible!');
          console.log('✅ Project "tradedesk-ea98a" is reachable');
          console.log('✅ Firestore API is responding');
        } else if (res.statusCode === 403) {
          console.log('\n⚠️ Firebase accessible but authentication required');
          console.log('✅ This is expected for Firestore operations');
        } else {
          console.log('\n❌ Unexpected response:', res.statusCode);
        }
      } catch (e) {
        console.log('- Raw Response:', data);
        console.log('\n✅ Connection successful (non-JSON response)');
      }
      
      console.log('\n🎯 Next steps:');
      console.log('1. If you see 403: Firebase is working, just needs auth');
      console.log('2. If you see 200: Firebase is fully accessible');
      console.log('3. If you see other errors: Check network/Firewall');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Check firewall settings');
    console.log('3. Verify Firebase project exists');
    console.log('4. Check if Firebase API is blocked');
  });

  req.setTimeout(10000, () => {
    req.destroy();
    console.error('❌ Request timed out (10 seconds)');
    console.log('🔧 Check internet connection or firewall');
  });

  req.end();
}

// Run the test
testFirebaseConnectivity();
