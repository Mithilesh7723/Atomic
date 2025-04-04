import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

// This component redirects based on user role
const RoleRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // After loading is complete and we have a user
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'employee') {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);

  // Show a proper skeleton loader while determining user role
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
        {/* Enhanced cosmic background with minimal elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        </div>
        
        {/* Centered loading spinner with better styling */}
        <div className="relative flex items-center justify-center h-screen z-10">
          <div className="glass-card p-6 backdrop-blur-lg max-w-sm w-full text-center rounded-xl animate-scale-in">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                
                {/* Inner ring */}
                <div className="w-10 h-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                
                {/* Core */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
              </div>
              
              <h3 className="text-xl font-medium text-white">Loading</h3>
              <p className="text-white/70">Setting up your experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no user, show landing page
  return <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoleRouter />} />
          
          {/* Employee routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute allowedRoles={['employee']}>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;