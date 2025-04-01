import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { loginUser, logoutUser } from '../services/firebaseService';
import { getUserById } from '../services/realtimeDbService';
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
          
          // Get the user data from Realtime Database
          const userData = await getUserById(authUser.uid);
          console.log('User data from Realtime Database:', userData);
          
          if (userData) {
            setUser(userData);
            console.log('User authenticated with role:', userData.role);
          } else {
            // Handle the case where a user exists in Firebase Auth but not in Realtime Database
            console.warn('User exists in Auth but not in Realtime Database:', authUser.uid);
            setUser(null);
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