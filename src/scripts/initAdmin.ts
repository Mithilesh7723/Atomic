import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { User } from '../types/models';

const createAdminUser = async () => {
  try {
    const auth = getAuth();
    
    // Admin credentials - in a real application, these would be environment variables
    const adminEmail = 'admin@atomhr.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    
    try {
      // Create the user in Firebase Auth
      console.log('Creating admin user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Create admin profile in Realtime Database
      console.log('Creating admin profile in Realtime Database...');
      const userData: User = {
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
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('User ID:', user.uid);
      
    } catch (error: any) {
      // If the user already exists, we'll get an error code 'auth/email-already-in-use'
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists. You can use the following credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the function
createAdminUser();

/*
 * To run this script:
 * 1. Compile it with TypeScript: npx tsc src/scripts/initAdmin.ts --outDir dist
 * 2. Run the compiled JavaScript: node dist/scripts/initAdmin.js
 * 
 * This will create an admin user with:
 * Email: admin@atomhr.com
 * Password: admin123
 */ 