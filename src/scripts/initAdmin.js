import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2YDryE-5hfAyS5JVKnqCiMameKIuentQ",
  authDomain: "project-x-be8bd.firebaseapp.com",
  databaseURL: "https://project-x-be8bd-default-rtdb.firebaseio.com",
  projectId: "project-x-be8bd",
  storageBucket: "project-x-be8bd.firebasestorage.app",
  messagingSenderId: "596759015739",
  appId: "1:596759015739:web:db12eeba2ca6872127471e",
  measurementId: "G-17Z5WGMVRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const realtimeDb = getDatabase(app);

const createAdminUser = async () => {
  try {
    // Admin credentials - in a real application, these would be environment variables
    const adminEmail = 'admin@atomhr.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    
    console.log('=== Starting Admin User Creation ===');
    console.log('Checking if admin already exists in Auth...');
    
    try {
      // Check if user already exists by trying to sign in
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;
        console.log('Admin user already exists in Auth:', user.uid);
        
        // Now check if the user exists in the Realtime Database
        console.log('Checking if admin exists in Realtime Database...');
        const userRef = ref(realtimeDb, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          console.log('Admin user exists in Realtime Database:');
          console.log(userSnapshot.val());
        } else {
          console.log('Admin user exists in Auth but NOT in Realtime Database. Creating database entry...');
          
          // Create the admin user in Realtime Database
          const userData = {
            uid: user.uid,
            email: user.email || adminEmail,
            displayName: adminName,
            role: 'admin',
            photoURL: '',
          };
          
          await set(userRef, userData);
          console.log('Admin user created in Realtime Database successfully!');
        }
        
        // Return early since user exists
        console.log('\nYou can use the following admin credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        return;
      } catch (signInError) {
        // If sign-in fails, user doesn't exist
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          console.log('Admin user does not exist in Auth. Creating new admin user...');
        } else {
          throw signInError;
        }
      }
      
      // Create the user in Firebase Auth
      console.log('Creating admin user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      console.log('Admin user created in Auth successfully:', user.uid);
      
      // Create admin profile in Realtime Database
      console.log('Creating admin profile in Realtime Database...');
      const userData = {
        uid: user.uid,
        email: user.email || adminEmail,
        displayName: adminName,
        role: 'admin',
        photoURL: '',
      };
      
      // Store in Firebase Realtime Database
      const userRef = ref(realtimeDb, `users/${user.uid}`);
      await set(userRef, userData);
      
      console.log('Admin user created successfully!');
      console.log('\nYou can use the following admin credentials:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('User ID:', user.uid);
      
    } catch (error) {
      console.error('Error in admin user creation process:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        console.log('\nAdmin user already exists. You can use the following credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
      } else {
        throw error;
      }
    }
    
    console.log('\nIMPORTANT: Make sure your Firebase Realtime Database rules are set to:');
    console.log(`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`);
    console.log('You can set these rules in the Firebase Console: https://console.firebase.google.com/project/project-x-be8bd/database/project-x-be8bd-default-rtdb/rules');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the function
createAdminUser();

/*
 * To run this script:
 * Execute: node src/scripts/initAdmin.js
 * 
 * This will create an admin user with:
 * Email: admin@atomhr.com
 * Password: admin123
 */ 