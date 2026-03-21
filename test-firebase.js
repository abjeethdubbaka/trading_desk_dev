/**
 * Firebase connection test for Windows desktop app
 * Run this with Node.js: node test-firebase.js
 */

// Import Firebase modules for ES modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration (same as in firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyCJKKDmmDsK0ihtvTJxDlq9MAbKPgRbTaw",
  authDomain: "tradedesk-ea98a.firebaseapp.com",
  projectId: "tradedesk-ea98a",
  storageBucket: "tradedesk-ea98a.firebasestorage.app",
  messagingSenderId: "839166731244",
  appId: "1:839166731244:web:18d7a2a6aa78f08d3a16c9",
  measurementId: "G-QG7H4HWKNK",
};

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection (Windows app)...\n');

  try {
    // 1. Initialize Firebase
    console.log('📋 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
    console.log('- Project ID:', firebaseConfig.projectId);
    console.log('');

    // 2. Test Firestore connection
    console.log('💾 Testing Firestore connection...');
    
    // Test reading trades collection
    const tradesRef = collection(db, 'trades');
    const tradesSnapshot = await getDocs(tradesRef);
    console.log('✅ Trades collection accessible:', tradesSnapshot.size, 'documents found');

    // Test reading settings collection
    const settingsRef = collection(db, 'settings');
    const settingsSnapshot = await getDocs(settingsRef);
    console.log('✅ Settings collection accessible:', settingsSnapshot.size, 'documents found');

    // Test write operation
    console.log('📝 Testing write operation...');
    const testDoc = {
      symbol: 'TEST',
      entryPrice: 100,
      shares: 100,
      timestamp: new Date().toISOString(),
      isTest: true
    };
    
    const createdDoc = await addDoc(tradesRef, testDoc);
    console.log('✅ Document created:', createdDoc.id);

    // Test delete operation
    await deleteDoc(doc(db, 'trades', createdDoc.id));
    console.log('✅ Test document deleted successfully');

    console.log('\n🎉 Firebase connection is working correctly!');
    console.log('✅ All operations completed successfully');

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Provide specific error guidance
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - Check Firebase Firestore rules');
    } else if (error.code === 'unavailable') {
      console.log('\n💡 Service unavailable - Check internet connection');
    } else if (error.code === 'unauthenticated') {
      console.log('\n💡 Unauthenticated - Firebase auth may be required');
    }
  }
}

// Run the test
testFirebaseConnection().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
