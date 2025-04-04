import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare, AlertCircle, MessageSquare, Target, BarChart2, Settings, Check } from 'lucide-react';
import { Notification } from '../types/models';
import ReactDOM from 'react-dom';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Sort notifications with newest first
  const sortedNotifications = React.useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [notifications]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current && 
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate position for the dropdown
  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, [isOpen]);
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'goal':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'review':
        return <BarChart2 className="w-5 h-5 text-yellow-400" />;
      case 'request':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'system':
        return <Settings className="w-5 h-5 text-indigo-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };
  
  // Format notification date
  const formatDate = (date: any) => {
    try {
      if (!date) return 'Recently';
      
      const now = new Date();
      const notificationDate = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(notificationDate.getTime())) {
        return 'Recently';
      }
      
      const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
      
      if (diffInSeconds < 5) return 'just now';
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
      
      // Format date more clearly for older dates
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Recently';
    }
  };
  
  // Notification dropdown component
  const NotificationDropdown = () => {
    // Create portal container if it doesn't exist
    const portalId = 'notification-portal';
    let portalContainer = document.getElementById(portalId);
    
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = portalId;
      document.body.appendChild(portalContainer);
    }
    
    const content = (
      <div 
        ref={dropdownRef}
        className="w-80 glass-card p-1 rounded-xl animate-fade-in"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
          zIndex: 999999,
          backgroundColor: 'rgba(30, 27, 75, 0.85)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="p-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAllAsRead()}
                className="text-xs glass-button-ghost px-2 py-1 rounded-md text-indigo-300 hover:bg-indigo-800/40"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {sortedNotifications.length === 0 ? (
              <div className="text-center py-6 text-white/60">
                <div className="flex justify-center mb-3">
                  <CheckSquare className="w-10 h-10 text-indigo-400/50" />
                </div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg relative transition-all duration-200 ${
                      notification.read 
                        ? 'bg-indigo-900/40 opacity-75' 
                        : 'bg-indigo-800/60'
                    }`}
                  >
                    <div className="flex">
                      <div className="mt-1 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-white text-sm font-medium">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded text-xs">New</span>
                            )}
                          </h4>
                          <span className="text-white/60 text-xs">{formatDate(notification.createdAt)}</span>
                        </div>
                        <p className="text-white/80 text-sm mt-1">{notification.message}</p>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="absolute bottom-2 right-2 text-indigo-300 hover:text-indigo-200 p-1 rounded-full hover:bg-indigo-500/30"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
    
    return ReactDOM.createPortal(content, portalContainer);
  };
  
  return (
    <div className="relative">
      <button
        ref={bellRef}
        className="relative glass-button-ghost p-2 rounded-full hover:bg-white/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && <NotificationDropdown />}
    </div>
  );
};

export default NotificationBell; 