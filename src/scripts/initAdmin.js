import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase configuration
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
const realtimeDb = getDatabase(app);

const createAdminUser = async () => {
  try {
    // Admin credentials
    const adminEmail = 'admin@atomhr.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    
    console.log('=== Creating Admin User for Deployment ===');
    
    try {
      // Check if admin user already exists
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
        .then(async (userCredential) => {
          const user = userCredential.user;
          console.log('Admin user already exists:', user.uid);
          
          // Ensure admin exists in database
          const userRef = ref(realtimeDb, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (!snapshot.exists()) {
            // Admin exists in Auth but not in database, create the entry
            await set(userRef, {
              uid: user.uid,
              email: adminEmail,
              displayName: adminName,
              role: 'admin',
              photoURL: null,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              active: true
            });
            console.log('Admin user data created in database');
          }
        })
        .catch(async (error) => {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            // Create new admin user
            console.log('Admin user does not exist. Creating new admin user...');
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;
            
            // Create admin profile in database
            const userRef = ref(realtimeDb, `users/${user.uid}`);
            await set(userRef, {
              uid: user.uid,
              email: adminEmail,
              displayName: adminName,
              role: 'admin',
              photoURL: null,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              active: true
            });
            
            console.log('Admin user created successfully with UID:', user.uid);
          } else {
            throw error;
          }
        });
      
      console.log('\nAdmin setup complete.');
      console.log('You can use the following credentials to log in:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      
    } catch (error) {
      console.error('Error in admin setup:', error);
    }
  } catch (error) {
    console.error('Error in admin user creation:', error);
  }
};

// Run the function
createAdminUser(); 