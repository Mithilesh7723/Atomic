import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { loginUser, logoutUser } from '../services/firebaseService';
import { getUserById, createUser } from '../services/realtimeDbService';
import { User } from '../types/models';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Global flag to track employee creation process
// This is used to prevent redirects during employee creation
let isCreatingEmployee = false;

// Function to set the flag
export const setEmployeeCreationFlag = (value: boolean) => {
  isCreatingEmployee = value;
  console.log(`Employee creation flag set to: ${value}`);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      setError(null);
      
      try {
        if (authUser) {
          console.log('Firebase Auth user:', authUser.uid);
          
          // Check if we should stay on admin view (set during employee creation)
          const shouldStayOnAdminView = window.localStorage.getItem('adminView') === 'true';
          if (shouldStayOnAdminView) {
            console.log('Admin view flag detected - preventing redirection to employee dashboard');
            // Clear the flag after detecting it to ensure it's not persistent
            window.localStorage.removeItem('adminView');
          }
          
          // Get the user data from Realtime Database
          const userData = await getUserById(authUser.uid);
          console.log('User data from Realtime Database:', userData);
          
          if (userData) {
            // User exists in both Auth and Realtime DB - normal case
            // Only set the user if we're not supposed to stay on admin view
            // or if the user is an admin
            if (!shouldStayOnAdminView || userData.role === 'admin') {
              setUser(userData);
              console.log('User authenticated with role:', userData.role);
            } else {
              console.log('Not setting employee user to prevent redirection from admin view');
              // Don't set the user to prevent redirection
              // This ensures we stay on the admin page
            }
            
            // Optional: Update last login time
            // This would be a good place to update the user's last login time
          } else {
            // Handle the case where a user exists in Firebase Auth but not in Realtime Database
            console.error('User exists in Auth but not in Realtime Database:', authUser.uid);
            
            // Check if we're in the middle of employee creation process
            if (isCreatingEmployee) {
              console.log('Employee creation in progress - keeping current auth state');
              // Don't change the user state during employee creation
              // This prevents redirect loops
              return;
            }
            
            // If we have enough information, we could try to recreate the user in the database
            if (authUser.email && authUser.displayName) {
              console.log('Attempting to recreate user in database');
              try {
                // Create a basic user record to allow login to proceed
                await createUser(authUser.uid, {
                  uid: authUser.uid,
                  email: authUser.email,
                  displayName: authUser.displayName,
                  role: 'employee', // Default role - could be problematic if this was an admin
                  photoURL: authUser.photoURL || null,
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                  active: true
                });
                
                // Fetch the newly created user data
                const recreatedUser = await getUserById(authUser.uid);
                if (recreatedUser) {
                  console.log('Successfully recreated user data in Realtime Database');
                  
                  // Only set the user if we're not supposed to stay on admin view
                  if (!shouldStayOnAdminView || recreatedUser.role === 'admin') {
                    setUser(recreatedUser);
                  }
                } else {
                  console.error('Failed to recreate user data');
                  setUser(null);
                  setError('User profile could not be loaded. Please contact support.');
                }
              } catch (recreateErr) {
                console.error('Error recreating user in database:', recreateErr);
                setUser(null);
                setError('Failed to reload your user profile. Please try logging in again.');
              }
            } else {
              setUser(null);
              setError('User profile is incomplete. Please log out and log in again.');
            }
          }
        } else {
          console.log('No authenticated user');
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error in auth state change:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Authenticate with Firebase
      await loginUser(email, password);
      // The onAuthStateChanged listener will handle setting the user
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;