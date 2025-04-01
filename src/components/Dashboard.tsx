import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, FileText, BarChart4, PieChart, AlertCircle, HelpCircle, MessageSquare, Users } from 'lucide-react';
import { 
  getEmployeeByUserId, 
  getEmployeeByUserIdFallback,
  subscribeToFeedbacks, 
  subscribeToGoals,
  subscribeToPerformanceMetrics,
  getAllEmployees
} from '../services/realtimeDbService';
import { Employee, Feedback, Goal, Metric, PerformanceMetric } from '../types/models';
import FeedbackSection from './FeedbackSection';

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
        {/* Employee profile summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2 glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-300" />
              Profile Overview
            </h2>
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-500/30 flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{employee.name}</h3>
                <p className="text-white/70">{employee.position}</p>
                <p className="text-white/50 text-sm">{employee.department}</p>
              </div>
            </div>
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
    </div>
  );
};

export default Dashboard;