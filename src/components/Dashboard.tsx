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
  CheckCircle
} from 'lucide-react';
import { 
  getEmployeeByUserId, 
  getEmployeeByUserIdFallback,
  subscribeToFeedbacks, 
  subscribeToGoals,
  subscribeToPerformanceMetrics,
  getAllEmployees,
  updateEmployee
} from '../services/realtimeDbService';
import { Employee, Feedback, Goal, Metric, PerformanceMetric } from '../types/models';
import FeedbackSection from './FeedbackSection';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
      } catch (err: any) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load your profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [user]);

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingPhoto(true);
    console.log("Starting photo upload...");
    
    try {
      // Skip Firebase Storage due to CORS issues and use base64 encoding directly
      console.log("Using direct base64 encoding for image upload");
      
      // Use canvas to compress the image before converting to base64
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (!event.target?.result) {
              reject(new Error("Failed to read file"));
              return;
            }
            
            const img = new Image();
            img.onload = () => {
              // Create canvas for resizing
              const canvas = document.createElement('canvas');
              
              // Set maximum dimensions
              let width = img.width;
              let height = img.height;
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              
              // Resize if needed
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to base64 with reduced quality
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(dataUrl);
            };
            
            img.onerror = () => {
              reject(new Error("Failed to load image"));
            };
            
            img.src = event.target.result as string;
          };
          
          reader.onerror = () => {
            reject(reader.error || new Error("Error reading file"));
          };
          
          reader.readAsDataURL(file);
        });
      };
      
      try {
        // Compress and convert image to base64
        console.log("Compressing image...");
        const base64Image = await compressImage(file);
        console.log("Compression complete. Base64 length:", base64Image.length);
        
        // Update employee with compressed base64 image
        console.log("Updating employee record with compressed image...");
        await updateEmployee(employee.id, { photoURL: base64Image });
        
        // Update local state
        setEmployee(prev => {
          console.log("Updating local state with compressed image");
          return prev ? { ...prev, photoURL: base64Image } : null;
        });
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Profile photo updated successfully!',
          type: 'success'
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
        
      } catch (error) {
        console.error("Failed during image compression:", error);
        setNotification({
          show: true,
          message: 'Failed to process image. Please try a smaller image.',
          type: 'error'
        });
      } finally {
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error in photo upload process:', error);
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      setNotification({
        show: true,
        message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/70">Loading your dashboard...</p>
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
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000" />
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {notification.message}
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
            <button
              onClick={handleLogout}
              className="flex items-center text-white/80 hover:text-white glass-button py-1.5 px-3 rounded-lg my-auto text-sm"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="glass p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-white font-medium mb-1">{goal.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{goal.description}</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Progress</span>
                      <span 
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          goal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          goal.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div 
                        className={`h-full rounded-full ${
                          goal.status === 'completed' ? 'bg-emerald-500' :
                          goal.status === 'in-progress' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}
                        style={{ 
                          width: `${goal.status === 'completed' ? 100 : goal.status === 'in-progress' ? 50 : 10}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <FeedbackSection feedbacks={feedbacks} />
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
    </div>
  );
};

export default Dashboard;