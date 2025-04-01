import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loading indicator while auth state is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/70">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to landing page
  if (!user) {
    console.log('User not authenticated, redirecting to landing page');
    return <Navigate to="/" replace />;
  }

  // Log user information for debugging
  console.log('User authenticated:', { 
    uid: user.uid,
    role: user.role, 
    displayName: user.displayName,
    allowedRoles
  });

  // Normalize roles for comparison (convert to lowercase)
  const userRole = user.role?.toLowerCase() || '';
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

  // If user doesn't have the required role, redirect to landing page
  if (!normalizedAllowedRoles.includes(userRole)) {
    console.log(`User role "${user.role}" not in allowed roles: [${allowedRoles.join(', ')}], redirecting to landing page`);
    return <Navigate to="/" replace />;
  }

  // If user is authenticated and has the required role, render the protected component
  console.log(`User has required role: ${user.role}, rendering protected component`);
  return <>{children}</>;
};

export default PrivateRoute;