import React from 'react';
import { Target, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Goal } from '../types/models';

interface GoalsTrackerProps {
  goals: Goal[];
}

const GoalsTracker: React.FC<GoalsTrackerProps> = ({ goals }) => {
  // Sort goals by status: in-progress first, then pending, completed, and overdue
  const sortedGoals = [...(goals || [])].sort((a, b) => {
    const statusOrder = {
      'in-progress': 1,
      'pending': 2,
      'completed': 3,
      'overdue': 4
    };
    return (statusOrder[a.status as keyof typeof statusOrder] || 5) - 
           (statusOrder[b.status as keyof typeof statusOrder] || 5);
  });

  // Display placeholder data if no goals are available
  const displayGoals = sortedGoals.length > 0 
    ? sortedGoals 
    : [
    {
          id: 'placeholder-1',
          employeeId: '',
          title: 'Complete project documentation',
          description: 'Finish all required documentation for the current project',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in-progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
    },
    {
          id: 'placeholder-2',
          employeeId: '',
          title: 'Attend leadership training',
          description: 'Complete the scheduled leadership training workshop',
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
    },
    {
          id: 'placeholder-3',
          employeeId: '',
          title: 'Learn new technology stack',
          description: 'Complete online courses for the new technology stack',
          targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ] as Goal[];

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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="glass-card h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-300" />
            Goals Tracker
          </h2>
          {sortedGoals.length === 0 && (
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">Placeholder Data</span>
          )}
          </div>
          
          <div className="space-y-4">
          {displayGoals.slice(0, 5).map((goal) => (
            <div key={goal.id} className="glass rounded-xl p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                  <div className="flex-1">
                      <h3 className="text-white font-medium">{goal.title}</h3>
                  <p className="text-white/60 text-sm mt-1 line-clamp-2">{goal.description}</p>
                  <div className="flex items-center mt-3 text-xs text-white/50">
                    <span>Due: {formatDate(goal.targetDate.toString())}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(goal.status)}`}>
                    {getStatusIcon(goal.status)}
                    <span className="ml-1 capitalize">{goal.status.replace('-', ' ')}</span>
                  </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
        
        {displayGoals.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-indigo-300 hover:text-indigo-200 text-sm">
              View All Goals ({displayGoals.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsTracker;