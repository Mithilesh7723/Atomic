import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        
        {/* Inner ring */}
        <div className="w-10 h-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        
        {/* Core */}
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>
      
      {/* Pulse waves */}
      <div className="absolute w-20 h-20 rounded-full border border-indigo-400/20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
      <div className="absolute w-28 h-28 rounded-full border border-purple-400/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }}></div>
    </div>
  );
};

export default LoadingSpinner; 