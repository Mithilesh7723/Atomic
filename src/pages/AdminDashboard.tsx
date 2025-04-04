import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, setEmployeeCreationFlag } from '../context/AuthContext';
import { 
  Users, 
  LogOut, 
  Star, 
  X, 
  PlusCircle, 
  LineChart, 
  BarChart4, 
  UserCircle, 
  MessageSquare, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Loader2,
  FileText,
  Calendar,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Info
} from 'lucide-react';
import { Employee as EmployeeType, Feedback as FeedbackType, Goal as GoalType, Notification } from '../types/models';
import { 
  getAllEmployees, 
  updateEmployee, 
  createFeedback,
  createEmployee,
  createGoal,
  createPerformanceMetric,
  deleteEmployee as deleteEmployeeFunction,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/realtimeDbService';
import { registerUser, deleteUserAccount } from '../services/firebaseService';
import Leaderboard from '../components/Leaderboard';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import NotificationBell from '../components/NotificationBell';

// Add this near the top of the file, before the component declaration
declare global {
  interface Window {
    notificationTimeout: ReturnType<typeof setTimeout> | undefined;
  }
}

interface Employee {
  id: string;
  name: string;
  position: string;
  performance: number;
  lastReview: string;
}

interface ReviewModalProps {
  employee: Employee;
  onClose: () => void;
  onSubmit: (ratings: {
    overall: number;
    communication: number; 
    teamwork: number;
    technicalSkills: number;
  }, comment: string) => void;
}

interface FeedbackModalProps {
  employee: Employee;
  onClose: () => void;
  onSubmit: (type: string, feedback: string, isResponse: boolean, requestDescription: string) => void;
}

interface AddEmployeeModalProps {
  onClose: () => void;
  onSubmit: (employeeData: {
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
  }) => void;
}

interface GoalModalProps {
  employee: Employee;
  onClose: () => void;
  onSubmit: (title: string, description: string, targetDate: string, status: string) => void;
}

interface EmployeeDetailsModalProps {
  employee: EmployeeType;
  onClose: () => void;
}

interface DeleteConfirmationModalProps {
  employee: EmployeeType;
  onClose: () => void;
  onConfirm: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ employee, onClose, onSubmit }) => {
  const [overallRating, setOverallRating] = useState(3);
  const [communicationRating, setCommunicationRating] = useState(3);
  const [teamworkRating, setTeamworkRating] = useState(3);
  const [technicalRating, setTechnicalRating] = useState(3);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      overall: overallRating,
      communication: communicationRating,
      teamwork: teamworkRating,
      technicalSkills: technicalRating
    }, comment);
    onClose();
  };

  const renderRatingStars = (value: number, onChange: (value: number) => void, label: string) => (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
              value >= star ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Star className={`w-4 h-4 ${value >= star ? 'fill-yellow-400' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <UserCircle className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">360Â° Review for {employee.name}</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-white/60 text-sm mb-4">
              Rate the employee across multiple dimensions to provide comprehensive feedback.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="glass p-4 rounded-xl">
                {renderRatingStars(overallRating, setOverallRating, "Overall Performance")}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="glass p-4 rounded-xl">
                  {renderRatingStars(communicationRating, setCommunicationRating, "Communication")}
                </div>
                
                <div className="glass p-4 rounded-xl">
                  {renderRatingStars(teamworkRating, setTeamworkRating, "Teamwork")}
                </div>
                
                <div className="glass p-4 rounded-xl">
                  {renderRatingStars(technicalRating, setTechnicalRating, "Technical Skills")}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Review Comments</label>
                <div className="relative">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input focus:scale-[1.01] transition-all duration-300"
                    rows={4}
                    placeholder="Provide detailed feedback on performance..."
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 glass-button rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary rounded-lg flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit 360Â° Review
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ employee, onClose, onSubmit }) => {
  const [type, setType] = useState('praise');
  const [feedback, setFeedback] = useState('');
  const [isResponse, setIsResponse] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(type, feedback, isResponse, requestDescription);
    onClose();
  };

  useEffect(() => {
    // Check if this employee has any pending feedback requests
    // If they do, pre-populate the form for responding
    const checkPendingRequests = async () => {
      try {
        const feedbacksRef = ref(realtimeDb, 'feedbacks');
        const requestQuery = query(
          feedbacksRef, 
          orderByChild('employeeId'), 
          equalTo(employee.id)
        );
        
        const snapshot = await get(requestQuery);
        if (snapshot.exists()) {
          const feedbacks = snapshot.val();
          const pendingRequests = Object.values(feedbacks)
            .filter((fb: any) => fb.category && fb.category.startsWith('request-') && fb.status === 'pending');
          
          if (pendingRequests.length > 0) {
            // Use the most recent request
            const latestRequest = pendingRequests.reduce((latest: any, current: any) => {
              return new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current;
            });
            
            // Set the form to respond to this request
            setIsResponse(true);
            setRequestDescription(latestRequest.requestDescription || latestRequest.content);
            setType(latestRequest.category.replace('request-', ''));
          }
        }
      } catch (error) {
        console.error("Error checking for feedback requests:", error);
      }
    };
    
    checkPendingRequests();
  }, [employee.id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in" style={{
        backgroundColor: 'rgba(30, 27, 75, 0.85)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center mr-3">
                  <MessageSquare className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {isResponse ? 'Respond to Feedback Request' : `Feedback for ${employee.name}`}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isResponse && (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                <h4 className="text-sm font-medium text-white/80 mb-2">Employee's Request:</h4>
                <p className="text-white/70 text-sm">{requestDescription}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Feedback Type</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:scale-[1.01] transition-all duration-300 appearance-none bg-indigo-900/50 text-white border border-indigo-500/20"
                  >
                    <option value="praise" className="bg-gray-800 text-white">Praise</option>
                    <option value="improvement" className="bg-gray-800 text-white">Area for Improvement</option>
                    <option value="general" className="bg-gray-800 text-white">General Feedback</option>
                    <option value="performance" className="bg-gray-800 text-white">Performance Review</option>
                    <option value="project" className="bg-gray-800 text-white">Project Specific</option>
                    <option value="career" className="bg-gray-800 text-white">Career Development</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-white/50 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Feedback Message</label>
                <div className="relative">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:scale-[1.01] transition-all duration-300 bg-indigo-900/50 text-white border border-indigo-500/20"
                    rows={4}
                    placeholder="Share your constructive feedback..."
                    required
                  />
                  </div>
                </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isResponse ? 'Send Response' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent any form submission and navigation
    e.preventDefault();
    e.stopPropagation();
    
    // Force stay on current page
    window.history.pushState(null, '', window.location.href);
    
    // Validate password length (Firebase requires at least 6 characters)
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }
    
    setValidationError(null);
    setIsLoading(true);
    
    try {
      // Call onSubmit but catch any errors that might cause navigation
      await onSubmit({ name, email, password, position, department });
      // The parent component will handle closing the modal on success
    } catch (error) {
      console.error("Error in form submission:", error);
      setValidationError("An error occurred while adding the employee. Please try again.");
      
      // Ensure we stay on the admin page even after error
      if (window.location.pathname !== '/admin') {
        navigate('/admin', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Design', 'Operations'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <PlusCircle className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Add New Employee</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {validationError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Enter employee's full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Enter employee's email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Create a temporary password (min. 6 characters)"
                  required
                />
                <p className="text-xs text-white/50 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Enter employee's position"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input appearance-none"
                  required
                >
                  <option value="" className="bg-gray-800 text-white">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-gray-800 text-white">{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 glass-button rounded-lg"
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Employee
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

const GoalModal: React.FC<GoalModalProps> = ({ employee, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, description, targetDate, status);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                  <FileText className="w-6 h-6 text-emerald-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Set Goal for {employee.name}</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  placeholder="Enter goal title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input"
                  rows={3}
                  placeholder="Describe the goal in detail"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Target Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input text-white"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-input appearance-none"
                  required
                >
                  <option value="pending" className="bg-gray-800 text-white">Pending</option>
                  <option value="in-progress" className="bg-gray-800 text-white">In Progress</option>
                  <option value="completed" className="bg-gray-800 text-white">Completed</option>
                  <option value="overdue" className="bg-gray-800 text-white">Overdue</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 glass-button rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary rounded-lg flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ employee, onClose }) => {
  // Debug log to check employee object
  console.log("Employee details in modal:", employee);
  console.log("Email value:", employee.email);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-4xl w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <UserCircle className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Employee Details</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile photo and basic info */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-indigo-500/30 flex items-center justify-center overflow-hidden border-2 border-indigo-500/50">
                  {employee.photoURL ? (
                    <img 
                      src={employee.photoURL} 
                      alt={employee.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-16 h-16 text-white" />
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-white mt-4">{employee.name}</h3>
                <p className="text-white/70 mb-1">{employee.position}</p>
                <p className="text-white/50 text-sm">{employee.department}</p>
                
                {/* Performance score */}
                <div className="mt-6 w-full max-w-[200px]">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">Overall Performance</span>
                    <span className="text-white">{employee.performanceScore || 'N/A'}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-full rounded-full bg-indigo-500" 
                      style={{ width: `${employee.performanceScore || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Detailed information */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Mail className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">Email</h4>
                    </div>
                    <div className="ml-6 bg-indigo-500/10 px-3 py-2 rounded text-white inline-block">
                      {employee?.email || 'Email not available'}
                    </div>
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
                  
                  <div className="glass p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Info className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">User ID</h4>
                    </div>
                    <p className="text-white ml-6 text-sm break-all">{employee.userId || 'Not available'}</p>
                  </div>
                  
                  <div className="glass p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">Join Date</h4>
                    </div>
                    <p className="text-white ml-6">
                      {employee.createdAt 
                        ? new Date(employee.createdAt).toLocaleDateString() 
                        : 'Not available'}
                    </p>
                  </div>
                </div>
                
                {/* Bio information if available */}
                {employee.bio && (
                  <div className="glass p-4 rounded-xl mt-4">
                    <div className="flex items-center mb-2">
                      <UserCircle className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">Bio</h4>
                    </div>
                    <p className="text-white ml-6">{employee.bio}</p>
                  </div>
                )}
                
                {/* Emergency contact if available */}
                {employee.emergencyContact && (
                  <div className="glass p-4 rounded-xl mt-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">Emergency Contact</h4>
                    </div>
                    <p className="text-white ml-6">{employee.emergencyContact}</p>
                  </div>
                )}
                
                {/* Performance metrics if available */}
                {employee.metrics && (
                  <div className="glass p-4 rounded-xl mt-4">
                    <div className="flex items-center mb-3">
                      <BarChart4 className="w-4 h-4 text-indigo-300 mr-2" />
                      <h4 className="text-sm font-medium text-white/80">Performance Metrics</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-6">
                      {Object.entries(employee.metrics).map(([key, value]) => (
                        <div key={key} className="bg-white/5 p-3 rounded-lg">
                          <p className="text-white/70 text-xs capitalize mb-1">{key}</p>
                          <div className="flex justify-between items-center">
                            <div className="w-full bg-white/10 rounded-full h-1.5 mr-2">
                              <div 
                                className="h-full rounded-full bg-indigo-500" 
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-white text-xs whitespace-nowrap">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="glass-button px-6 py-2 rounded-lg text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ employee, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const confirmationPhrase = `delete ${employee.name}`;
  
  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== confirmationPhrase.toLowerCase()) return;
    
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Employee</h3>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-white">
                <strong>Warning:</strong> This action is permanent and cannot be undone. 
                Deleting this employee will remove all their data from the system, including:
              </p>
              <ul className="text-white/80 text-sm mt-2 ml-5 list-disc space-y-1">
                <li>Personal information and profile data</li>
                <li>Performance metrics and reviews</li>
                <li>Goals and feedback history</li>
                <li>User account (they will no longer be able to log in)</li>
              </ul>
            </div>
            
            <p className="text-white/80 mb-4">
              To confirm, please type <span className="font-medium text-white">{confirmationPhrase}</span> below:
            </p>
            
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input mb-6"
              placeholder="Type the confirmation phrase"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 glass-button rounded-lg"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={confirmText.toLowerCase() !== confirmationPhrase.toLowerCase() || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<{
    type: 'review' | 'feedback' | 'employee' | 'goal' | 'request';
    message: string;
    timestamp: Date;
    employeeName: string;
    employeeId?: string;
    requestContent?: string;
  }[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Log selected employee when it changes
  useEffect(() => {
    if (selectedEmployee) {
      console.log("Selected employee updated:", selectedEmployee);
      console.log("Selected employee email:", selectedEmployee.email);
    }
  }, [selectedEmployee]);

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

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const employeesData = await getAllEmployees();
      console.log("Fetched employees data:", employeesData, "Length:", employeesData.length);
      
      setEmployees(employeesData);

      // Check for pending feedback requests
      await fetchPendingFeedbackRequests(employeesData);

      // Remove the demo data generation - we'll only show real activities now
    } catch (err: any) {
      console.error('Error fetching employees', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch pending feedback requests
  const fetchPendingFeedbackRequests = async (employeesData: EmployeeType[]) => {
    try {
      const feedbacksRef = ref(realtimeDb, 'feedbacks');
      const snapshot = await get(feedbacksRef);
      
      if (snapshot.exists()) {
        const feedbacks = snapshot.val();
        const pendingRequests = Object.values(feedbacks)
          .filter((fb: any) => 
            fb.category && 
            fb.category.startsWith('request-') && 
            fb.status === 'pending'
          );
        
        if (pendingRequests.length > 0) {
          // Map requests to activities
          const requestActivities = pendingRequests.map((request: any) => {
            // Find the employee name
            const employee = employeesData.find(emp => emp.id === request.employeeId);
            
            return {
              type: 'request' as 'request',
              message: `${request.requestedBy || 'An employee'} requested ${request.category.replace('request-', '')} feedback`,
              timestamp: new Date(request.createdAt),
              employeeName: employee?.name || 'Unknown',
              employeeId: request.employeeId,
              requestContent: request.requestDescription || request.content
            };
          });
          
          // Add requests to recent activities - ensure proper sorting by time
          setRecentActivity(prev => {
            // Filter out duplicate requests (by employeeId and message)
            const uniqueRequests = requestActivities.filter(req => 
              !prev.some(existing => 
                existing.type === 'request' && 
                existing.employeeId === req.employeeId &&
                existing.message === req.message
              )
            );
            
            // Combine with real activities only, no demo data
            const combinedActivities = [...uniqueRequests, ...prev];
            
            // Ensure all timestamps are actual Date objects
            combinedActivities.forEach(activity => {
              if (!(activity.timestamp instanceof Date)) {
                activity.timestamp = new Date(activity.timestamp);
              }
            });
            
            // Sort by timestamp, newest first
            return combinedActivities
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 10);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching feedback requests:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    // Clear existing timeout if there is one
    if (window.notificationTimeout) {
      clearTimeout(window.notificationTimeout);
    }
    // Set timeout to clear notification after 5 seconds
    window.notificationTimeout = setTimeout(() => setNotification(null), 5000);
  };

  const handleReviewSubmit = async (ratings: {
    overall: number;
    communication: number;
    teamwork: number;
    technicalSkills: number;
  }, comment: string) => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      // Calculate overall score as percentage (average of all ratings * 20)
      const overallScore = Math.round(
        (ratings.overall + ratings.communication + ratings.teamwork + ratings.technicalSkills) / 4 * 20
      );
      
      // Update employee with overall performance score
      const updatedEmployee = {
        ...selectedEmployee,
        performanceScore: overallScore,
        // Store detailed metrics
        metrics: {
          communication: ratings.communication * 20,
          teamwork: ratings.teamwork * 20,
          technicalSkills: ratings.technicalSkills * 20
        }
      };
      
      // Update employee record with overall score and metrics
      await updateEmployee(selectedEmployee.id, {
        performanceScore: updatedEmployee.performanceScore,
        metrics: updatedEmployee.metrics
      });
      
      // Create performance metrics for each dimension
      const timestamp = new Date();
      await Promise.all([
        createPerformanceMetric({
          employeeId: selectedEmployee.id,
          metric: 'communication',
          value: ratings.communication * 20,
          date: timestamp
        }),
        createPerformanceMetric({
          employeeId: selectedEmployee.id,
          metric: 'teamwork',
          value: ratings.teamwork * 20,
          date: timestamp
        }),
        createPerformanceMetric({
          employeeId: selectedEmployee.id,
          metric: 'technicalSkills',
          value: ratings.technicalSkills * 20,
          date: timestamp
        })
      ]);
      
      // Add feedback for the review
      await createFeedback({
        employeeId: selectedEmployee.id,
        reviewerId: user?.uid || '',
        reviewerName: user?.displayName || 'Admin',
        content: comment,
        rating: ratings.overall,
        category: 'performance review',
        createdAt: timestamp
      });
      
      // Update local state
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === selectedEmployee.id ? updatedEmployee : emp
        )
      );
      
      // Add to recent activity
      setRecentActivity(prev => [{
        type: 'review',
        message: `You submitted a 360Â° performance review for ${selectedEmployee.name}`,
        timestamp: new Date(),
        employeeName: selectedEmployee.name
      }, ...prev.slice(0, 4)]);
      
      showNotification('success', `360Â° review for ${selectedEmployee.name} submitted successfully`);
      
    } catch (err: any) {
      console.error('Error submitting review', err);
      showNotification('error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (type: string, feedback: string, isResponse: boolean = false, requestDescription: string = '') => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      // Create the feedback entry
      await createFeedback({
        employeeId: selectedEmployee.id,
        reviewerId: user?.uid || '',
        reviewerName: user?.displayName || 'Admin',
        content: feedback,
        rating: 0, // Not applicable for general feedback
        category: type,
        createdAt: new Date(),
        isResponseToRequest: isResponse
      });
      
      // If this is a response to a request, update the request status
      if (isResponse && requestDescription) {
        // Find the request and update its status
        const feedbacksRef = ref(realtimeDb, 'feedbacks');
        const requestQuery = query(
          feedbacksRef, 
          orderByChild('employeeId'), 
          equalTo(selectedEmployee.id)
        );
        
        const snapshot = await get(requestQuery);
        if (snapshot.exists()) {
          const feedbacks = snapshot.val();
          const pendingRequests = Object.entries(feedbacks)
            .filter(([_, fb]: [string, any]) => 
              fb.category && 
              fb.category.startsWith('request-') && 
              fb.status === 'pending' &&
              (fb.requestDescription === requestDescription || fb.content === requestDescription)
            );
          
          if (pendingRequests.length > 0) {
            // Update the status of the request
            const [requestId] = pendingRequests[0];
            const requestRef = ref(realtimeDb, `feedbacks/${requestId}`);
            await update(requestRef, { status: 'responded' });
          }
        }
      }
      
      // Add to recent activity - ensure newest is at the top
      const newActivity = {
        type: 'feedback' as const,
        message: isResponse 
          ? `You responded to a feedback request from ${selectedEmployee.name}`
          : `You provided ${type} feedback to ${selectedEmployee.name}`,
        timestamp: new Date(),
        employeeName: selectedEmployee.name
      };
      
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
      
      showNotification('success', isResponse 
        ? 'Response sent successfully'
        : 'Feedback submitted successfully'
      );
      
    } catch (err: any) {
      console.error('Error submitting feedback', err);
      showNotification('error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (employeeData: {
    name: string;
    email: string;
    password: string;
    position: string;
    department: string;
  }) => {
    // Lock navigation to admin dashboard
    const lockToAdminPage = () => {
      if (window.location.pathname !== '/admin') {
        console.log("Forcing navigation back to admin dashboard");
        navigate('/admin', { replace: true });
      }
    };

    // Prevent any navigation that might be triggered
    window.history.pushState(null, '', window.location.href);
    
    // Store the current auth state to prevent automatic authentication change
    const currentAuthState = auth.currentUser;
    
    // Detect navigation attempts
    const handlePopState = () => {
      console.log("PopState detected - forcing admin view");
      lockToAdminPage();
    };
    window.addEventListener('popstate', handlePopState);
    
    setLoading(true);
    
    // Set the employee creation flag to true to prevent redirects
    setEmployeeCreationFlag(true);
    console.log("Starting employee creation process - navigation redirects disabled");
    
    // Set up auth change detection
    let authChangeOccurred = false;
    let authDetector: () => void = () => {};
    
    try {
      // Set up auth detection
      authDetector = onAuthStateChanged(auth, (user) => {
        if (user && user.uid !== currentAuthState?.uid) {
          authChangeOccurred = true;
          console.log("Auth state changed during employee creation");
        }
      });
      
      // 1. Register user in Firebase Auth and create profile in Realtime DB
      const userData = await registerUser(
        employeeData.email,
        employeeData.password,
        'employee',
        employeeData.name
      );
      
      // 2. Create employee record in the Realtime DB
      const newEmployee = await createEmployee({
        name: employeeData.name,
        position: employeeData.position,
        department: employeeData.department,
        performanceScore: 0,
        userId: userData.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 3. Update the employees list with the new employee
      setEmployees(prev => [...prev, newEmployee]);
      
      // 4. Add to recent activity
      setRecentActivity(prev => [{
        type: 'employee',
        message: `You added ${employeeData.name} as a new employee`,
        timestamp: new Date(),
        employeeName: employeeData.name
      }, ...prev.slice(0, 4)]);
      
      // 5. Close the modal
      setShowAddEmployeeModal(false);
      
      // Show success message
      showNotification('success', `Employee ${employeeData.name} added successfully`);
      
      // Force stay on admin dashboard if auth change was detected
      if (authChangeOccurred) {
        lockToAdminPage();
      }
      
    } catch (err: any) {
      console.error('Error adding employee', err);
      
      // Provide user-friendly error messages
      let errorMessage = `Failed to add employee: ${err.message}`;
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid. Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact the administrator.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      showNotification('error', errorMessage);
    } finally {
      // Clean up all listeners
      authDetector();
      window.removeEventListener('popstate', handlePopState);
      
      setLoading(false);
      
      // Reset the employee creation flag
      setEmployeeCreationFlag(false);
      console.log("Employee creation process complete - navigation redirects enabled");
      
      // Final check to ensure we're still on the admin page
      setTimeout(() => lockToAdminPage(), 100);
    }
  };

  const handleGoalSubmit = async (title: string, description: string, targetDate: string, status: string) => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      // Create a new goal in the Realtime DB
      const newGoal = await createGoal({
        employeeId: selectedEmployee.id,
        title,
        description,
        targetDate: new Date(targetDate),
        status: status as 'pending' | 'in-progress' | 'completed' | 'overdue',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add to recent activity
      setRecentActivity(prev => [{
        type: 'goal',
        message: `You set a goal "${title}" for ${selectedEmployee.name}`,
        timestamp: new Date(),
        employeeName: selectedEmployee.name
      }, ...prev.slice(0, 4)]);
      
      // Show success message
      showNotification('success', `Goal created successfully for ${selectedEmployee.name}`);
      
    } catch (err: any) {
      console.error('Error setting goal', err);
      showNotification('error', 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee || !selectedEmployee.userId) return;
    
    setLoading(true);
    try {
      // First delete the employee data from the Realtime Database
      await deleteEmployeeFunction(selectedEmployee.id);
      
      // Then delete the user account
      await deleteUserAccount(selectedEmployee.userId);
      
      // Update local state
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      
      // Add to recent activity
      setRecentActivity(prev => [{
        type: 'employee',
        message: `You removed ${selectedEmployee.name} from the system`,
        timestamp: new Date(),
        employeeName: selectedEmployee.name
      }, ...prev.slice(0, 4)]);
      
      // Show success notification
      showNotification('success', `Employee ${selectedEmployee.name} has been deleted`);
      
    } catch (err: any) {
      console.error('Error deleting employee', err);
      showNotification('error', `Failed to delete employee: ${err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Generate a performance color based on score
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
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

  // Replace the loading screen with a skeleton loader
  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 pb-10">
        {/* Animated cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Include some basic cosmic background elements */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        </div>

        {/* Skeleton loading UI */}
        <div className="relative z-10">
          {/* Header skeleton */}
          <div className="glass border-b border-white/10 py-4 px-8 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                <div className="ml-4 h-6 w-48 bg-white/10 rounded animate-pulse"></div>
              </div>
              <div className="flex space-x-4">
                <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse"></div>
                <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-6 h-48">
                  <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-white/10 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table skeleton */}
            <div className="glass-card p-6 mb-8">
              <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-6"></div>
              <div className="overflow-x-auto">
                <div className="w-full divide-y divide-white/10">
                  <div className="flex border-b border-white/10 pb-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-1/4 h-6 bg-white/10 rounded animate-pulse mr-4"></div>
                    ))}
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex py-3">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="w-1/4 h-6 bg-white/10 rounded animate-pulse mr-4"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 pb-10">
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
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${notification.type === 'error' ? 'bg-red-500/90' : 'bg-emerald-500/90'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-white">Admin Dashboard</span>
              {user && (
                <span className="ml-4 text-sm text-white/60">Welcome, {user.displayName || 'Admin'}</span>
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

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {loading && !employees.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-white/70">Loading dashboard data...</p>
          </div>
        ) : (
          <>
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="text-sm text-white/70">Total Employees</div>
              <div className="text-2xl font-semibold text-white">{employees.length}</div>
            </div>
          </div>
          
          <div className="glass-card p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mr-4">
              <BarChart4 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-sm text-white/70">Average Performance</div>
              <div className="text-2xl font-semibold text-white">
                    {employees.length > 0 
                      ? Math.round(employees.reduce((sum, emp) => sum + (emp.performanceScore || 0), 0) / employees.length)
                      : 0}%
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mr-4">
              <LineChart className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="text-sm text-white/70">Reviews Completed</div>
              <div className="text-2xl font-semibold text-white">
                    {employees.filter(emp => emp.performanceScore !== undefined).length}
              </div>
            </div>
          </div>
        </div>

            {/* Employee Overview and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="glass-card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-300" />
                Employee Overview
              </h2>
                      <button 
                        onClick={() => setShowAddEmployeeModal(true)}
                        className="glass-button-primary px-4 py-2 rounded-lg text-sm flex items-center"
                      >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Employee
              </button>
            </div>
            
                    {loading && employees.length > 0 ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      </div>
                    ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                            {employees.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-white/70">
                                  No employees found. Add your first employee to get started.
                                </td>
                              </tr>
                            ) : (
                              employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 overflow-hidden">
                                        {employee.photoURL ? (
                                          <img src={employee.photoURL} alt={employee.name} className="w-full h-full object-cover" />
                                        ) : (
                            <UserCircle className="w-5 h-5 text-indigo-300" />
                                        )}
                          </div>
                          <div className="text-sm font-medium text-white">{employee.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white/80">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-white/10 rounded-full h-2 mr-2 max-w-[100px]">
                            <div
                                          className="h-full rounded-full bg-indigo-500" 
                                          style={{ width: `${employee.performanceScore || 0}%` }}
                            />
                          </div>
                                      <span className="text-sm text-white/80">{employee.performanceScore || 'N/A'}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                    {employee.department}
                      </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                    <div className="flex space-x-2">
                        <button
                          onClick={() => {
                                          setSelectedEmployee({
                                            ...employee,
                                            email: employee.email || '' // Ensure email is populated
                                          });
                            setShowReviewModal(true);
                          }}
                                        className="glass-button p-1.5 rounded-lg text-white/80 hover:text-white group"
                                        title="Submit Performance Review"
                        >
                                        <Star className="w-4 h-4 group-hover:fill-yellow-400 transition-colors" />
                        </button>
                                      
                        <button
                          onClick={() => {
                                          setSelectedEmployee({
                                            ...employee,
                                            email: employee.email || '' // Ensure email is populated
                                          });
                            setShowFeedbackModal(true);
                          }}
                                        className="glass-button p-1.5 rounded-lg text-white/80 hover:text-white"
                                        title="Send Feedback"
                        >
                                        <MessageSquare className="w-4 h-4" />
                        </button>
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedEmployee({
                                            ...employee,
                                            email: employee.email || '' // Ensure email is populated
                                          });
                                          setShowGoalModal(true);
                                        }}
                                        className="glass-button p-1.5 rounded-lg text-white/80 hover:text-white"
                                        title="Set Goal"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedEmployee({
                                            ...employee,
                                            email: employee.email || '' // Ensure email is populated
                                          });
                                          setShowEmployeeDetails(true);
                                        }}
                                        className="glass-button p-1.5 rounded-lg text-white/80 hover:text-white"
                                        title="View Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedEmployee({
                                            ...employee,
                                            email: employee.email || '' // Ensure email is populated
                                          });
                                          setShowDeleteConfirmation(true);
                                        }}
                                        className="glass-button p-1.5 rounded-lg text-white/80 hover:text-white hover:text-red-400"
                                        title="Delete Employee"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                      </td>
                    </tr>
                              ))
                            )}
                </tbody>
              </table>
                      </div>
                    )}
            </div>
          </div>
        </div>
        
              <div className="lg:col-span-1">
                <Leaderboard employees={employees} limit={5} />
              </div>
            </div>

        <div className="glass-card">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-indigo-300" />
              Recent Activities
            </h2>
                {recentActivity.length === 0 ? (
                  <div className="glass p-8 rounded-xl text-center text-white/70">
                    No recent activities found. Activities will appear here as you interact with employees.
                  </div>
                ) : (
            <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                <div key={i} className="glass p-4 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-start">
                          <div className="flex flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              activity.type === 'review' ? 'bg-blue-500/20' : 
                              activity.type === 'feedback' ? 'bg-purple-500/20' : 
                              activity.type === 'goal' ? 'bg-emerald-500/20' :
                              activity.type === 'request' ? 'bg-amber-500/20' :
                              'bg-indigo-500/20'
                            }`}>
                              {activity.type === 'review' && <Star className="w-5 h-5 text-blue-300" />}
                              {activity.type === 'feedback' && <MessageSquare className="w-5 h-5 text-purple-300" />}
                              {activity.type === 'employee' && <UserCircle className="w-5 h-5 text-indigo-300" />}
                              {activity.type === 'goal' && <FileText className="w-5 h-5 text-emerald-300" />}
                              {activity.type === 'request' && <AlertCircle className="w-5 h-5 text-amber-300" />}
                    </div>
                            <div className="flex-1">
                              <p className="text-white/90">{activity.message}</p>
                      <p className="text-white/50 text-sm mt-1">
                                {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                          
                          {activity.type === 'request' && (
                            <button
                              onClick={() => {
                                // Find the employee
                                const employee = employees.find(emp => emp.id === activity.employeeId);
                                if (employee) {
                                  setSelectedEmployee({
                                    ...employee,
                                    email: employee.email || '' // Ensure email is populated
                                  });
                                  setShowFeedbackModal(true);
                                }
                              }}
                              className="px-4 py-1.5 glass-button-primary rounded-lg text-xs flex items-center"
                            >
                              <MessageSquare className="w-3 h-3 mr-1.5" />
                              Respond
                            </button>
                          )}
                        </div>
                        
                        {activity.type === 'request' && activity.requestContent && (
                          <div className="mt-2 ml-13 text-sm bg-white/5 p-2 rounded text-white/70">
                            "{activity.requestContent}"
                          </div>
                        )}
                </div>
              ))}
            </div>
                )}
          </div>
        </div>
          </>
        )}
      </main>

      {showReviewModal && selectedEmployee && (
        <ReviewModal
          employee={selectedEmployee}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {showFeedbackModal && selectedEmployee && (
        <FeedbackModal
          employee={selectedEmployee}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {showAddEmployeeModal && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployeeModal(false)}
          onSubmit={handleAddEmployee}
        />
      )}

      {showGoalModal && selectedEmployee && (
        <GoalModal
          employee={selectedEmployee}
          onClose={() => setShowGoalModal(false)}
          onSubmit={handleGoalSubmit}
        />
      )}

      {showDeleteConfirmation && selectedEmployee && (
        <DeleteConfirmationModal
          employee={selectedEmployee}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteEmployee}
        />
      )}

      {showEmployeeDetails && selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setShowEmployeeDetails(false)}
        />
      )}
    </div>
  );
};

// Helper function to format timestamps
const formatRelativeTime = (date: Date) => {
  try {
    if (!date) return 'Recently';
    
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(targetDate.getTime())) {
      return 'Recently';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
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
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Recently';
  }
};

export default AdminDashboard;
