import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, remove, get, set } from 'firebase/database';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2YDryE-5hfAyS5JVKnqCiMameKIuentQ",
  authDomain: "project-x-be8bd.firebaseapp.com",
  databaseURL: "https://project-x-be8bd-default-rtdb.firebaseio.com",
  projectId: "project-x-be8bd",
  storageBucket: "project-x-be8bd.appspot.com",
  messagingSenderId: "596759015739",
  appId: "1:596759015739:web:db12eeba2ca6872127471e",
  measurementId: "G-17Z5WGMVRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function cleanupDatabase() {
  console.log('Starting database cleanup for deployment...');
  
  // Admin credentials
  const adminEmail = 'admin@atomhr.com';
  const adminPassword = 'admin123';
  
  try {
    // Sign in as admin to ensure we have proper permissions
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const adminUID = userCredential.user.uid;
    console.log(`Successfully signed in as admin (${adminUID})`);
    
    // Get the admin user data before cleaning up
    const adminUserRef = ref(db, `users/${adminUID}`);
    const adminSnapshot = await get(adminUserRef);
    
    if (!adminSnapshot.exists()) {
      throw new Error('Admin user data not found! Aborting cleanup.');
    }
    
    const adminData = adminSnapshot.val();
    console.log('Retrieved admin user data:', adminData);
    
    // Clean up all database nodes
    console.log('Removing all employees...');
    await remove(ref(db, 'employees'));
    
    console.log('Removing all goals...');
    await remove(ref(db, 'goals'));
    
    console.log('Removing all feedback...');
    await remove(ref(db, 'feedbacks'));
    
    console.log('Removing all notifications...');
    await remove(ref(db, 'notifications'));
    
    console.log('Removing all performance metrics...');
    await remove(ref(db, 'performance_metrics'));
    
    console.log('Removing all users except admin...');
    await remove(ref(db, 'users'));
    
    // Restore the admin user
    console.log('Restoring admin user...');
    await set(adminUserRef, adminData);
    
    console.log('Database cleanup completed successfully!');
    console.log('');
    console.log('Ready for deployment with clean database.');
    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Admin UID: ${adminUID}`);
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

// Execute the cleanup function
cleanupDatabase(); 