import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  User, 
  FileText, 
  BarChart4, 
  PieChart, 
  AlertCircle, 
  HelpCircle, 
  MessageSquare, 
  Users, 
  Upload, 
  Edit, 
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Save,
  CheckCircle,
  Send,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  getEmployeeByUserId, 
  getEmployeeByUserIdFallback,
  subscribeToFeedbacks, 
  subscribeToGoals,
  subscribeToPerformanceMetrics,
  getAllEmployees,
  updateEmployee,
  createFeedback,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteFeedback,
  updateGoal
} from '../services/realtimeDbService';
import { Employee, Feedback, Goal, Metric, PerformanceMetric, Notification } from '../types/models';
import FeedbackSection from './FeedbackSection';
import { ref as storageRef, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import Leaderboard from './Leaderboard';
import NotificationBell from './NotificationBell';
import GoalsTracker from './GoalsTracker';

// Add this near the top of the file, before the component declarations
declare global {
  interface Window {
    notificationTimeout: ReturnType<typeof setTimeout> | undefined;
  }
}

// Component to display a metric with a progress bar
const MetricsCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const getColorClass = (value: number) => {
    if (value >= 90) return "from-emerald-500 to-emerald-400";
    if (value >= 75) return "from-blue-500 to-blue-400";
    if (value >= 60) return "from-amber-500 to-amber-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center mb-2">
        {metric.name === 'Communication' && <MessageSquare className="w-4 h-4 text-blue-300 mr-2" />}
        {metric.name === 'Technical Skills' && <FileText className="w-4 h-4 text-emerald-300 mr-2" />}
        {metric.name === 'Teamwork' && <Users className="w-4 h-4 text-purple-300 mr-2" />}
        {!['Communication', 'Technical Skills', 'Teamwork'].includes(metric.name) && 
          <BarChart4 className="w-4 h-4 text-indigo-300 mr-2" />
        }
        <h3 className="text-sm font-medium text-white">{metric.name}</h3>
      </div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-white/70">Current</span>
        <span className="text-white/70">{metric.value}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getColorClass(metric.value)}`} 
          style={{ width: `${metric.value}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs">
        <span className="text-white/50">Target: {metric.target}%</span>
        <span className="text-white/50">
          {metric.value >= metric.target ? 'Achieved' : `${metric.target - metric.value}% to goal`}
        </span>
      </div>
    </div>
  );
};

// Profile Edit Modal Component
const ProfileEditModal = ({ employee, onClose, onSave }) => {
  const [address, setAddress] = useState(employee.address || '');
  const [phoneNumber, setPhoneNumber] = useState(employee.phoneNumber || '');
  const [birthDate, setBirthDate] = useState(employee.birthDate || '');
  const [emergencyContact, setEmergencyContact] = useState(employee.emergencyContact || '');
  const [bio, setBio] = useState(employee.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedData = {
        address,
        phoneNumber,
        birthDate,
        emergencyContact,
        bio,
      };
      
      await onSave(updatedData);
      
      setNotification({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        show: true,
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-lg w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
    <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <Edit className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {notification.show && (
              <div className={`mb-4 p-3 ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg text-white text-sm flex items-center`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                )}
                <span>{notification.message}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Your address"
                />
              </div>
              
          <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Your phone number"
                />
          </div>
          
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Emergency Contact</label>
              <input 
                type="text" 
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Name and contact number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  rows={3}
                  placeholder="Tell us about yourself"
              />
            </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 glass-button rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary rounded-lg flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// RequestFeedbackModal Component
const RequestFeedbackModal = ({ employee, onClose, onSubmit }) => {
  const [feedbackType, setFeedbackType] = useState('general');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Clear notification function
  const clearNotification = () => {
    setNotification({ show: false, message: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(feedbackType, description);
      
      setNotification({
        show: true,
        message: 'Feedback request sent successfully!',
        type: 'success'
      });
      
      // Clear existing timeout
      if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
      }
      
      // Close after a short delay
      window.notificationTimeout = setTimeout(() => {
        clearNotification();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting feedback:', error);
      setNotification({
        show: true,
        message: 'Failed to send feedback request',
        type: 'error'
      });
      
      // Clear error notification after 5 seconds
      if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
      }
      window.notificationTimeout = setTimeout(clearNotification, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  <MessageSquare className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Request Feedback</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {notification.show && (
              <div className={`mb-4 p-3 ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg text-white text-sm flex items-center`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                )}
                <span>{notification.message}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Feedback Type</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                >
                  <option value="general" className="bg-gray-800 text-white">General Feedback</option>
                  <option value="performance" className="bg-gray-800 text-white">Performance Review</option>
                  <option value="project" className="bg-gray-800 text-white">Project Specific</option>
                  <option value="career" className="bg-gray-800 text-white">Career Development</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  rows={4}
                  placeholder="Describe what you would like feedback on..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 glass-button rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary rounded-lg flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Request Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [showRequestFeedback, setShowRequestFeedback] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) return;
      
      try {
        // Fetch employee data
        let employeeData = null;
        try {
          // Try to get employee by userId first
          employeeData = await getEmployeeByUserId(user.uid);
        } catch (indexError) {
          console.error('Error with indexed query:', indexError);
          
          // If index error occurs, use our fallback function
          if (indexError.message && indexError.message.includes('Index not defined')) {
            console.log('Using fallback method to retrieve employee data...');
            employeeData = await getEmployeeByUserIdFallback(user.uid);
          } else {
            // Re-throw other errors
            throw indexError;
          }
        }
        
        setEmployee(employeeData);
        
        if (employeeData) {
          // Set up real-time listeners for goals and feedbacks
          const unsubscribeGoals = subscribeToGoals(employeeData.id, (goalsData) => {
            setGoals(goalsData);
          });
          
          const unsubscribeFeedbacks = subscribeToFeedbacks(employeeData.id, (feedbacksData) => {
            setFeedbacks(feedbacksData);
          });
          
          // Subscribe to performance metrics for 360-degree feedback
          const unsubscribeMetrics = subscribeToPerformanceMetrics(employeeData.id, (metricsData) => {
            setPerformanceMetrics(metricsData);
            
            // Process metrics data to get latest values for each metric type
            const latestMetrics = new Map<string, PerformanceMetric>();
            metricsData.forEach(metric => {
              const existing = latestMetrics.get(metric.metric);
              if (!existing || new Date(metric.date) > new Date(existing.date)) {
                latestMetrics.set(metric.metric, metric);
              }
            });
            
            // Convert to our Metric format for display
            const processedMetrics: Metric[] = Array.from(latestMetrics.values()).map(metric => ({
              name: metric.metric.charAt(0).toUpperCase() + metric.metric.slice(1), // Capitalize
              value: metric.value,
              target: getTargetForMetric(metric.metric)
            }));
            
            // If we have metrics from the employee record, use those
            if (employeeData.metrics) {
              const metricsFromEmployee = [
                { 
                  name: 'Communication', 
                  value: employeeData.metrics.communication || 0, 
                  target: 90 
                },
                { 
                  name: 'Technical Skills', 
                  value: employeeData.metrics.technicalSkills || 0, 
                  target: 95 
                },
                { 
                  name: 'Teamwork', 
                  value: employeeData.metrics.teamwork || 0, 
                  target: 85 
                }
              ];
              setMetrics(metricsFromEmployee);
            } else if (processedMetrics.length > 0) {
              // Use metrics from performance metrics collection
              setMetrics(processedMetrics);
            } else {
              // Fallback to example metrics if no data is available
              setMetrics([
                { name: 'Communication', value: 70, target: 90 },
                { name: 'Technical Skills', value: 75, target: 95 },
                { name: 'Teamwork', value: 65, target: 85 }
              ]);
            }
          });
          
          // Clean up listeners on unmount
          return () => {
            unsubscribeGoals();
            unsubscribeFeedbacks();
            unsubscribeMetrics();
          };
        }

        // Fetch all employees for the leaderboard
        try {
          console.log("Fetching all employees for leaderboard...");
          const employeesData = await getAllEmployees();
          console.log("Got employeesData for leaderboard:", employeesData, "length:", employeesData.length);
          setAllEmployees(employeesData);
          console.log("State updated with all employees");
        } catch (error) {
          console.error('Error fetching all employees for leaderboard:', error);
          // Not critical, so just log the error and continue
        }
        
      } catch (err: any) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load your profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [user]);

  // Add a new useEffect for notifications
  useEffect(() => {
    let unsubscribeNotifications = () => {};

    if (user) {
      // Subscribe to notifications for this user
      unsubscribeNotifications = subscribeToNotifications(user.uid, (notificationsData) => {
        setNotifications(notificationsData);
      });
    }

    return () => {
      unsubscribeNotifications();
    };
  }, [user]);

  // Update user profile photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !employee || !user) return;
    
    const file = e.target.files[0];
    
    // Basic validation
    if (!file.type.includes('image')) {
      handleSetNotification('error', 'Please select an image file');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      
      // Create a storage reference
      const storage = getStorage();
      const fileRef = storageRef(storage, `profile_photos/${user.uid}`);
      
      // Upload the file
      await uploadBytes(fileRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update the user's photoURL
      await updateProfile(user, { photoURL: downloadURL });
      
      // Update the employee record
      await updateEmployee(employee.id, { photoURL: downloadURL });
      
      // Update local state
      setEmployee(prev => {
        console.log("Updating local state with new image");
        return prev ? { ...prev, photoURL: downloadURL } : null;
      });
      
      handleSetNotification('success', 'Profile photo updated!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      handleSetNotification('error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (profileData) => {
    if (!employee) return;
    
    try {
      // Update employee with the new profile data
      await updateEmployee(employee.id, profileData);
      
      // Update local state
      setEmployee(prev => prev ? { ...prev, ...profileData } : null);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Helper to get target values for different metrics
  const getTargetForMetric = (metricName: string): number => {
    switch(metricName.toLowerCase()) {
      case 'communication': return 90;
      case 'technicalskills': return 95;
      case 'teamwork': return 85;
      default: return 80;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  const handleRequestFeedback = async (feedbackType: string, description: string) => {
    if (!employee || !user) return;
    
    try {
      // Create a feedback request
      await createFeedback({
        employeeId: employee.id,
        reviewerId: "", // Will be filled by admin who responds
        reviewerName: "", // Will be filled by admin who responds
        content: description,
        rating: 0, // Not applicable for feedback requests
        category: `request-${feedbackType}`, // Mark as a request
        createdAt: new Date(),
        requestedBy: user.displayName || 'Employee',
        requestDescription: description,
        status: 'pending' // Status for tracking requests
      });
      
      // Show success notification using the new function
      handleSetNotification('success', 'Your feedback request has been submitted!');
      
      // Close modal immediately after success
      setShowRequestFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback request:', error);
      handleSetNotification('error', 'Failed to submit feedback request. Please try again.');
    }
  };

  // Notification handling functions
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      // The state will be updated via the subscription
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      // The state will be updated via the subscription
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleSetNotification = (type, message) => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Clear existing timeout
    if (window.notificationTimeout) {
      clearTimeout(window.notificationTimeout);
    }
    
    // Auto-hide notification after 5 seconds
    window.notificationTimeout = setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 5000);
  };

  useEffect(() => {
    // Save profile updates
    if (saveSuccess) {
      handleSetNotification('success', 'Profile updated successfully!');
      setSaveSuccess(false);
    }
  }, [saveSuccess]);

  // Handler for clearing feedback
  const handleClearFeedback = async (feedbackId: string) => {
    try {
      await deleteFeedback(feedbackId);
      
      // Optimistically update the UI
      setFeedbacks(prev => prev.filter(feedback => feedback.id !== feedbackId));
      
      // Show success notification
      handleSetNotification('success', 'Feedback removed successfully');
    } catch (error) {
      console.error('Error removing feedback:', error);
      handleSetNotification('error', 'Failed to remove feedback');
    }
  };

  // Handler for marking a goal as complete
  const handleMarkGoalAsComplete = async (goalId: string) => {
    try {
      await updateGoal(goalId, { 
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Success notification 
      handleSetNotification('success', 'Goal marked as complete!');
      
      // We don't need to update the state here as the subscription should handle it
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating goal:', error);
      handleSetNotification('error', 'Failed to update goal');
      return Promise.reject(error);
    }
  };

  // Add handler for clearing all feedback
  const handleClearAllFeedback = async () => {
    try {
      // Get all feedback IDs
      const feedbackIds = feedbacks.map(feedback => feedback.id);
      
      // Delete each feedback one by one
      const deletePromises = feedbackIds.map(id => deleteFeedback(id));
      await Promise.all(deletePromises);
      
      // Update local state
      setFeedbacks([]);
      
      // Show success notification
      handleSetNotification('success', 'All feedback cleared successfully');
    } catch (error) {
      console.error('Error clearing all feedback:', error);
      handleSetNotification('error', 'Failed to clear all feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
        {/* Enhanced cosmic background with minimal elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        </div>
        
        {/* Skeleton loading UI */}
        <div className="relative z-10">
          {/* Header skeleton */}
          <nav className="glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                  <div className="ml-3 h-5 w-40 bg-white/10 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse"></div>
                  <div className="h-8 w-20 bg-white/10 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Profile card skeleton */}
            <div className="glass-card p-6 mb-8">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6"></div>
              
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-white/10 animate-pulse"></div>
                  <div className="h-5 w-24 bg-white/10 rounded animate-pulse mt-4 mb-1"></div>
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="glass p-4 rounded-xl">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse mr-2"></div>
                          <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
                        </div>
                        <div className="h-5 w-full bg-white/10 rounded animate-pulse ml-6"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance overview skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2 glass-card p-6">
                <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-4"></div>
                <div className="glass p-4 rounded-xl">
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-4 w-10 bg-white/10 rounded animate-pulse"></div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="h-full rounded-full bg-indigo-500/50 animate-pulse" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse mr-2"></div>
                      <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                    </div>
                    <div className="mb-1.5 flex justify-between">
                      <div className="h-3 w-12 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-3 w-8 bg-white/10 rounded animate-pulse"></div>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500/50 animate-pulse" style={{ width: `${65 + i * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals and Feedback skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass-card p-6">
                    <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="glass p-4 rounded-xl">
                          <div className="h-5 w-full bg-white/10 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse mb-3"></div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 animate-pulse">
                            <div className="h-full rounded-full bg-indigo-500/50" style={{ width: `${30 + j * 30}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="md:col-span-1 glass-card p-6">
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center py-2 border-b border-white/10">
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse mr-3"></div>
                      <div>
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
                      </div>
                      <div className="ml-auto">
                        <div className="h-5 w-10 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-4">Error Loading Dashboard</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button 
            onClick={handleLogout}
            className="glass-button-primary px-6 py-2 rounded-xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <HelpCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-4">Profile Not Found</h2>
          <p className="text-white/70 mb-6">
            We couldn't find your employee profile. Please contact your administrator.
          </p>
          <button 
            onClick={handleLogout}
            className="glass-button-primary px-6 py-2 rounded-xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      {/* Enhanced cosmic background with more visual elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated blobs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000" />
        
        {/* Large cosmic elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-70 animate-cosmic-wave" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl opacity-60 animate-nebula-pulse" />
        
        {/* Galaxy/nebula elements with glow effect */}
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-600/5 filter blur-3xl opacity-40 animate-galaxy-spin animate-glow"></div>
        <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-500/10 to-purple-600/5 filter blur-3xl opacity-30 animate-galaxy-spin animation-delay-3000 animate-glow"></div>
        
        {/* Light rays */}
        <div className="absolute top-0 left-1/4 w-2 h-[100vh] bg-gradient-to-b from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 blur-lg animate-light-ray"></div>
        <div className="absolute top-0 right-1/3 w-1 h-[100vh] bg-gradient-to-b from-purple-500/0 via-purple-500/5 to-purple-500/0 blur-lg animate-light-ray animation-delay-3000"></div>
        <div className="absolute top-0 left-2/3 w-1.5 h-[100vh] bg-gradient-to-b from-blue-500/0 via-blue-500/5 to-blue-500/0 blur-lg animate-light-ray animation-delay-5000"></div>
        
        {/* Twinkling stars - many different sizes and animations */}
        <div className="absolute inset-0">
          {/* Original stars */}
          <div className="absolute top-1/5 left-1/4 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse-slow" />
          <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse-slow animation-delay-4000" />
          <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse-slow animation-delay-6000" />
          <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/6 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse-slow animation-delay-8000" />
          
          {/* Additional twinkling stars */}
          <div className="absolute top-[15%] left-[10%] w-1.5 h-1.5 bg-white rounded-full opacity-90 animate-twinkle" />
          <div className="absolute top-[25%] left-[35%] w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-twinkle animation-delay-1000" />
          <div className="absolute top-[40%] left-[85%] w-1 h-1 bg-white rounded-full opacity-90 animate-twinkle animation-delay-2500" />
          <div className="absolute top-[60%] left-[22%] w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-twinkle-slow" />
          <div className="absolute top-[75%] left-[65%] w-1 h-1 bg-white rounded-full opacity-90 animate-twinkle animation-delay-1500" />
          <div className="absolute top-[10%] left-[75%] w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-twinkle-slow animation-delay-3500" />
          <div className="absolute top-[50%] left-[54%] w-1 h-1 bg-white rounded-full opacity-80 animate-twinkle animation-delay-5000" />
          <div className="absolute top-[30%] left-[90%] w-1.5 h-1.5 bg-white rounded-full opacity-90 animate-twinkle-slow animation-delay-7000" />
          <div className="absolute top-[85%] left-[40%] w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-twinkle animation-delay-3000" />
          <div className="absolute top-[20%] left-[60%] w-1 h-1 bg-white rounded-full opacity-80 animate-twinkle-slow animation-delay-9000" />
          
          {/* Glowing stars with halo effect */}
          <div className="absolute top-[45%] left-[15%] w-1.5 h-1.5 bg-blue-200 rounded-full opacity-90 shadow-lg shadow-blue-500/50 animate-twinkle"></div>
          <div className="absolute top-[15%] left-[45%] w-2 h-2 bg-purple-200 rounded-full opacity-90 shadow-lg shadow-purple-500/50 animate-twinkle-slow animation-delay-2000"></div>
          <div className="absolute top-[65%] left-[80%] w-1.5 h-1.5 bg-indigo-200 rounded-full opacity-90 shadow-lg shadow-indigo-500/50 animate-twinkle animation-delay-4000"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute top-[30%] left-[20%] w-1 h-1 bg-white/20 rounded-full animate-float-particle"></div>
        <div className="absolute top-[60%] left-[70%] w-0.5 h-0.5 bg-white/30 rounded-full animate-float-particle animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[50%] w-1.5 h-1.5 bg-white/10 rounded-full animate-float-particle animation-delay-5000"></div>
        <div className="absolute top-[20%] left-[80%] w-0.5 h-0.5 bg-white/20 rounded-full animate-float-particle animation-delay-3000"></div>
        <div className="absolute top-[70%] left-[30%] w-1 h-1 bg-white/20 rounded-full animate-float-particle animation-delay-1500"></div>
        
        {/* Subtle cosmic waves */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-30 animate-aurora bg-size-200"></div>
        
        {/* Comet effect */}
        <div className="absolute -top-20 -left-20 w-20 h-1 bg-white/40 rounded-full blur-sm transform rotate-45 animate-comet"></div>
        <div className="absolute -bottom-20 -right-20 w-30 h-1.5 bg-blue-100/30 rounded-full blur-sm transform -rotate-45 animate-comet animation-delay-7000"></div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed z-50 top-5 right-5 p-4 rounded-xl shadow-lg max-w-md transform transition-all animate-fade-in ${
          notification.type === 'success' ? 'bg-green-900/90' : 
          notification.type === 'error' ? 'bg-red-900/90' : 
          'bg-blue-900/90'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 mr-2" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 mr-2" />}
            <p className="text-white">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({...prev, show: false}))}
              className="ml-4 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-white">Employee Dashboard</span>
              {user && (
                <span className="ml-4 text-sm text-white/60">
                  Welcome, {user.displayName || employee.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell 
                notifications={notifications} 
                onMarkAsRead={handleMarkNotificationAsRead} 
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              />
              <button
                onClick={handleLogout}
                className="flex items-center text-white/80 hover:text-white glass-button py-1.5 px-3 rounded-lg text-sm"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Profile section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-300" />
            My Profile
          </h2>
          
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile photo */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-indigo-500/30 flex items-center justify-center overflow-hidden border-2 border-indigo-500/50">
                  {employee.photoURL ? (
                    <img 
                      src={employee.photoURL} 
                      alt={employee.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-colors shadow-lg"
                >
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
          />
        </div>

              <h3 className="text-lg font-medium text-white mt-4">{employee.name}</h3>
              <p className="text-white/70 mb-1">{employee.position}</p>
              <p className="text-white/50 text-sm">{employee.department}</p>
            </div>
            
            {/* Profile details */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Mail className="w-4 h-4 text-indigo-300 mr-2" />
                    <h4 className="text-sm font-medium text-white/80">Email</h4>
                  </div>
                  <p className="text-white ml-6" style={{ color: "white !important", opacity: 1, visibility: "visible", textShadow: "0 0 0 white", fontWeight: "normal" }}>
                    {employee?.email || user?.email || 'Email not available'}
                  </p>
                </div>
                
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Phone className="w-4 h-4 text-indigo-300 mr-2" />
                    <h4 className="text-sm font-medium text-white/80">Phone Number</h4>
                  </div>
                  <p className="text-white ml-6">{employee.phoneNumber || 'Not provided'}</p>
                </div>
                
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-indigo-300 mr-2" />
                    <h4 className="text-sm font-medium text-white/80">Address</h4>
                  </div>
                  <p className="text-white ml-6">{employee.address || 'Not provided'}</p>
                </div>
                
                <div className="glass p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-indigo-300 mr-2" />
                    <h4 className="text-sm font-medium text-white/80">Birth Date</h4>
                  </div>
                  <p className="text-white ml-6">{employee.birthDate || 'Not provided'}</p>
                </div>
              </div>
              
              {/* Bio */}
              {employee.bio && (
                <div className="glass p-4 rounded-xl mt-6">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-indigo-300 mr-2" />
                    <h4 className="text-sm font-medium text-white/80">Bio</h4>
                  </div>
                  <p className="text-white">{employee.bio}</p>
                </div>
              )}
              
              {/* Edit profile button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="glass-button-primary px-4 py-2 rounded-lg text-sm flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          
          {/* Add Request Feedback button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowRequestFeedback(true)}
              className="glass-button-primary px-4 py-2 rounded-lg text-sm flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Request Feedback
            </button>
          </div>
        </div>

        {/* Employee profile summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2 glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart4 className="w-5 h-5 mr-2 text-indigo-300" />
              Performance Overview
            </h2>
            
            <div className="glass p-4 rounded-xl">
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Overall Performance</span>
                  <span className="text-white font-medium">{employee.performanceScore}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="h-full rounded-full bg-indigo-500" 
                    style={{ width: `${employee.performanceScore || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metrics cards */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <MetricsCard key={metric.name} metric={metric} />
            ))}
          </div>
        </div>

        {/* Goals and Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-300" />
                Goals & Objectives
              </h2>
              
              {goals.length === 0 ? (
                <div className="glass p-6 rounded-xl text-center">
                  <p className="text-white/70">No active goals found. Your manager will assign goals soon.</p>
                </div>
              ) : (
                <GoalsTracker 
                  goals={goals} 
                  onMarkAsComplete={handleMarkGoalAsComplete}
                />
              )}
            </div>
            
            <FeedbackSection 
              feedbacks={feedbacks} 
              onClearFeedback={handleClearFeedback}
              onClearAllFeedback={handleClearAllFeedback}
          />
        </div>

          <div className="md:col-span-1">
            {console.log("Rendering leaderboard with employees:", allEmployees)}
            <Leaderboard 
              employees={allEmployees} 
              currentEmployeeId={employee?.id} 
              limit={5}
            />
          </div>
        </div>
      </main>
      
      {/* Profile Edit Modal */}
      {showEditProfile && (
        <ProfileEditModal 
          employee={employee}
          onClose={() => setShowEditProfile(false)}
          onSave={handleProfileUpdate}
        />
      )}

      {/* Request Feedback Modal */}
      {showRequestFeedback && (
        <RequestFeedbackModal 
          employee={employee}
          onClose={() => setShowRequestFeedback(false)}
          onSubmit={handleRequestFeedback}
        />
      )}
    </div>
  );
};

export default Dashboard;