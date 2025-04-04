import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

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

async function checkDeploymentReadiness() {
  console.log('=== Checking Deployment Readiness ===');
  
  // Admin credentials
  const adminEmail = 'admin@atomhr.com';
  const adminPassword = 'admin123';
  
  try {
    // Sign in as admin
    console.log(`1. Attempting to sign in with admin credentials: ${adminEmail}`);
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const adminUID = userCredential.user.uid;
    console.log(`✅ Admin login successful with UID: ${adminUID}`);
    
    // Check admin user exists in database
    console.log(`\n2. Checking admin user exists in database...`);
    const adminUserRef = ref(db, `users/${adminUID}`);
    const adminSnapshot = await get(adminUserRef);
    
    if (adminSnapshot.exists()) {
      console.log(`✅ Admin user exists in database`);
      console.log(`Admin data: ${JSON.stringify(adminSnapshot.val(), null, 2)}`);
    } else {
      console.log(`❌ WARNING: Admin user does not exist in database!`);
      console.log(`Run 'node src/scripts/initAdmin.js' to create the admin user.`);
    }
    
    // Check other database nodes to ensure they're empty
    console.log(`\n3. Checking that all other database nodes are empty...`);
    
    const dbNodes = ['employees', 'goals', 'feedbacks', 'notifications', 'performance_metrics'];
    let hasTestData = false;
    
    for (const node of dbNodes) {
      const nodeRef = ref(db, node);
      const snapshot = await get(nodeRef);
      
      if (snapshot.exists()) {
        console.log(`❌ WARNING: Test data found in '${node}' node!`);
        console.log(`Run 'node src/scripts/cleanupForDeployment.js' to clean up test data.`);
        hasTestData = true;
      } else {
        console.log(`✅ No test data in '${node}' node`);
      }
    }
    
    // Check users node to ensure only admin exists
    console.log(`\n4. Checking users node to ensure only admin exists...`);
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userCount = Object.keys(users).length;
      
      if (userCount === 1) {
        console.log(`✅ Users node contains exactly 1 user (admin)`);
      } else {
        console.log(`❌ WARNING: Found ${userCount} users in the database!`);
        console.log(`Run 'node src/scripts/cleanupForDeployment.js' to clean up test users.`);
        hasTestData = true;
      }
    } else {
      console.log(`❌ WARNING: Users node does not exist!`);
      console.log(`Run 'node src/scripts/initAdmin.js' to create the admin user.`);
    }
    
    // Summary
    console.log(`\n=== Deployment Readiness Summary ===`);
    if (!hasTestData && adminSnapshot.exists()) {
      console.log(`✅ SUCCESS: Your database is clean and ready for deployment!`);
      console.log(`\nAdmin credentials for production:`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log(`❌ WARNING: Your database is not ready for deployment.`);
      console.log(`Follow the warnings above to clean up your database.`);
    }
    
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    console.log(`\nPossible causes:`);
    console.log(`- Admin user doesn't exist: Run 'node src/scripts/initAdmin.js'`);
    console.log(`- Network error: Check your internet connection`);
    console.log(`- Firebase configuration: Check your Firebase credentials in src/config/firebase.ts`);
  }
}

// Run the check
checkDeploymentReadiness(); 