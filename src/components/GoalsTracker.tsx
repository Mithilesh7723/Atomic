import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, AlertCircle, CheckCheck, Award } from 'lucide-react';
import { Goal } from '../types/models';

interface GoalsTrackerProps {
  goals: Goal[];
  onMarkAsComplete?: (goalId: string) => Promise<void>;
}

const GoalsTracker: React.FC<GoalsTrackerProps> = ({ goals, onMarkAsComplete }) => {
  // Add state for local goals to enable optimistic UI updates
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState<string | null>(null);

  // Update local goals when props change
  useEffect(() => {
    setLocalGoals(goals || []);
  }, [goals]);

  // Sort goals by status
  const sortedGoals = [...localGoals].sort((a, b) => {
    const statusOrder = {
      'in-progress': 1,
      'pending': 2,
      'completed': 3,
      'overdue': 4
    };
    return (statusOrder[a.status as keyof typeof statusOrder] || 5) - 
           (statusOrder[b.status as keyof typeof statusOrder] || 5);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Target className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'overdue':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-indigo-500/20 text-indigo-300';
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Handle marking a goal as complete
  const handleMarkAsComplete = async (goalId: string) => {
    if (!onMarkAsComplete || actionInProgress) return;
    
    setActionInProgress(goalId);
    
    // Optimistic UI update
    setLocalGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, status: 'completed', updatedAt: new Date().toISOString() }
          : goal
      )
    );
    
    // Trigger confetti animation
    setShowConfetti(goalId);
    setTimeout(() => setShowConfetti(null), 2000);
    
    try {
      // Call the parent handler
      await onMarkAsComplete(goalId);
    } catch (error) {
      console.error("Failed to mark goal as complete:", error);
      // Revert the optimistic update on error
      setLocalGoals(prev => 
        prev.map(goal => 
          goal.id === goalId && goal.status === 'completed'
            ? { ...goal, status: 'in-progress' }
            : goal
        )
      );
    } finally {
      setActionInProgress(null);
    }
  };

  // Generate percentage completion for progress indicator
  const getCompletionPercentage = (goal: Goal) => {
    switch (goal.status) {
      case 'completed': return 100;
      case 'in-progress': return 60;
      case 'pending': return 10;
      case 'overdue': return 80;
      default: return 0;
    }
  };

  return (
    <div className="glass-card h-full overflow-hidden">
      <div className="p-6 relative">
        {/* Decorative elements */}
        <div className="absolute -top-10 right-10 w-20 h-20 rounded-full bg-indigo-500/10 animate-pulse-slow" />
        <div className="absolute -bottom-10 left-10 w-16 h-16 rounded-full bg-purple-500/10 animate-pulse-slow animation-delay-1000" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-semibold text-white flex items-center group">
            <Target className="w-5 h-5 mr-2 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
            <span className="group-hover:text-indigo-200 transition-colors">Goals Tracker</span>
          </h2>
        </div>
        
        {sortedGoals.length === 0 ? (
          <div className="glass p-6 rounded-xl text-center animate-fade-in">
            <p className="text-white/70">No goals set yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGoals.slice(0, 5).map((goal) => (
              <div 
                key={goal.id} 
                className={`glass rounded-xl p-4 overflow-hidden relative transition-all duration-300 ${
                  hoveredGoal === goal.id 
                    ? 'bg-white/10 transform scale-[1.01] shadow-lg shadow-indigo-500/5' 
                    : 'hover:bg-white/5'
                }`}
                onMouseEnter={() => setHoveredGoal(goal.id)}
                onMouseLeave={() => setHoveredGoal(null)}
              >
                {/* Confetti animation for completed goals */}
                {showConfetti === goal.id && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute rounded-full animate-confetti"
                        style={{
                          width: `${Math.random() * 10 + 3}px`,
                          height: `${Math.random() * 10 + 3}px`,
                          backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDuration: `${Math.random() * 2 + 1}s`,
                          animationDelay: `${Math.random() * 0.5}s`
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 bg-indigo-500/10 animate-pulse-out pointer-events-none" />
                  </div>
                )}
                
                {goal.status === 'completed' && (
                  <div className="absolute top-2 right-2">
                    <Award className="w-5 h-5 text-emerald-300 animate-pulse-slow" />
                  </div>
                )}
                
                <div className="flex items-start justify-between relative z-0">
                  <div className="flex-1">
                    <h3 className="text-white font-medium flex items-center">
                      {goal.title}
                    </h3>
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">{goal.description}</p>
                    
                    {/* Progress bar */}
                    <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          goal.status === 'completed' ? 'bg-emerald-500' : 
                          goal.status === 'in-progress' ? 'bg-blue-500' :
                          goal.status === 'overdue' ? 'bg-red-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${getCompletionPercentage(goal)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-white/50">Due: {formatDate(goal.targetDate)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                        <span className="ml-1 capitalize">{goal.status.replace('-', ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Mark as Complete button */}
                {(goal.status === 'in-progress' || goal.status === 'pending') && (
                  <div className={`mt-3 flex justify-end transition-opacity duration-300 ${
                    hoveredGoal === goal.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <button
                      onClick={() => handleMarkAsComplete(goal.id)}
                      disabled={actionInProgress === goal.id || !onMarkAsComplete}
                      className={`
                        glass-button text-xs flex items-center py-1 px-3 rounded-lg
                        ${actionInProgress === goal.id 
                          ? 'opacity-70 cursor-wait' 
                          : 'hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors'
                        }
                      `}
                    >
                      {actionInProgress === goal.id ? (
                        <>
                          <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white/80 animate-spin mr-1" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Mark as Complete
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {sortedGoals.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-indigo-300 hover:text-indigo-200 text-sm transition-colors hover:underline">
              View All Goals ({sortedGoals.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsTracker;