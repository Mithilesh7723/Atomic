import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, enableLogging } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Enable more verbose logging for development environments
if (process.env.NODE_ENV !== 'production') {
  enableLogging(console.log);
  console.log('Firebase verbose logging enabled in development mode');
}

// Initialize Firebase services
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);

// Set database connection settings
const dbRef = realtimeDb;

// Configure connection - these settings improve real-time performance
dbRef.ref = (path) => {
  const originalRef = dbRef.ref(path);
  
  // Add enhanced logging for debugging
  const originalOnValue = originalRef.on;
  originalRef.on = function(eventType, callback, cancelCallback, context) {
    console.log(`Setting up listener for path: ${path}, event: ${eventType}`);
    return originalOnValue.call(this, eventType, (snapshot) => {
      console.log(`Received data for path: ${path}`, snapshot.exists() ? 'Data exists' : 'No data');
      callback(snapshot);
    }, cancelCallback, context);
  };
  
  return originalRef;
};

export const analytics = getAnalytics(app);
export const storage = getStorage(app);

export default app; 