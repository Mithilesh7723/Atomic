import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Settings, Search, AlertCircle, X, Loader2 } from 'lucide-react';
import Dashboard from '../components/Dashboard';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Logout failed', err);
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000" />
        
        {/* Light beams */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 blur-lg" />
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-purple-500/0 via-purple-500/10 to-purple-500/0 blur-lg" />
      </div>
      
      {/* Show error message if any */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <nav className="glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">
                Welcome, {user?.displayName || 'Employee'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-indigo-900"></span>
                </button>
              </div>
              
              <div className="relative">
                <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center text-white/80 hover:text-white glass-button py-1.5 px-3 rounded-lg my-auto text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                <LogOut className="w-4 h-4 mr-1.5" />
                )}
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {user ? (
        <Dashboard userId={user.uid} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
          <p className="text-white/70">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;