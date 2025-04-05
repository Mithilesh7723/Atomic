import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, ArrowUp, ArrowDown, Minus, AlertCircle, Loader2, DollarSign, Star } from 'lucide-react';
import { Employee } from '../types/models';
import { getAllEmployees } from '../services/realtimeDbService';

interface LeaderboardProps {
  employees: Employee[];
  currentEmployeeId?: string; // Optional - to highlight the current user in employee view
  limit?: number; // Optional - limit the number of employees shown
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  employees, 
  currentEmployeeId,
  limit = 10 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  const [showIncentiveInfo, setShowIncentiveInfo] = useState(false);
  
  // If no employees are provided via props, fetch them directly
  useEffect(() => {
    console.log("Leaderboard component received employees:", employees);
    if (employees && employees.length > 0) {
      setLocalEmployees(employees);
    } else {
      console.log("No employees passed to Leaderboard, fetching directly");
      setIsLoading(true);
      getAllEmployees()
        .then(data => {
          console.log("Leaderboard fetched employees directly:", data);
          setLocalEmployees(data);
        })
        .catch(err => {
          console.error("Error fetching employees in Leaderboard:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [employees]);

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Performance Leaderboard
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <p className="text-white/60">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  // For newly created systems, provide a placeholder employee if there are none
  if (localEmployees.length === 0) {
    const placeholderEmployees = [
      {
        id: 'placeholder1',
        name: 'New Employee',
        position: 'Your Position',
        department: 'Your Department',
        performanceScore: 0,
        email: '',
        createdAt: new Date()
      }
    ];
    
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Performance Leaderboard
          </div>
          <button
            onClick={() => setShowIncentiveInfo(!showIncentiveInfo)}
            className="text-xs bg-indigo-500/20 px-2 py-1 rounded-full text-indigo-300 hover:bg-indigo-500/30 flex items-center"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Incentives
          </button>
        </h3>
        
        {showIncentiveInfo && (
          <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-white text-sm">
            <h4 className="font-semibold mb-1 flex items-center">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              Performance Incentives Program
            </h4>
            <p className="text-white/70 mb-2">Top performers on the leaderboard qualify for special bonuses and recognition.</p>
            <ul className="text-white/60 text-xs space-y-1 ml-5 list-disc">
              <li>1st Place: 15% quarterly bonus & recognition award</li>
              <li>2nd Place: 10% quarterly bonus</li>
              <li>3rd Place: 5% quarterly bonus</li>
              <li>Top 10%: Special training opportunities & development budget</li>
            </ul>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-white/60 text-xs uppercase">
                <th className="py-3 text-left w-12">Rank</th>
                <th className="py-3 text-left">Employee</th>
                <th className="py-3 text-center">Performance</th>
                <th className="py-3 text-center w-16">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5">
                <td className="py-3">
                  <div className="flex justify-center items-center">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {placeholderEmployees[0].name}
                        <span className="ml-2 text-xs bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">New</span>
                      </div>
                      <div className="text-white/60 text-sm">{placeholderEmployees[0].position}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-col items-center">
                    <div className="font-medium text-white mb-1">
                      0%
                      <span className="text-xs text-white/60 ml-1">(Not rated)</span>
                    </div>
                    <div className="w-full max-w-[100px] bg-white/10 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-red-500" style={{ width: '0%' }} />
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex justify-center">
                    <span className="text-white/40 text-xs">New</span>
                  </div>
                </td>
              </tr>
              <tr className="border-t border-white/5 text-center">
                <td colSpan={4} className="py-6 text-white/50 text-sm">
                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-indigo-300" />
                  No employees with ratings yet.<br/>
                  Ratings will appear as admins review performance.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Sort employees by performance score (descending)
  const sortedEmployees = [...localEmployees]
    // Include all employees, even those without performance scores
    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
    .slice(0, limit);

  // Get performance change indicators (this would be more accurate with historical data in a real app)
  // Here we're just randomly assigning trends for demonstration
  const getPerformanceTrend = (employeeId: string) => {
    // In a real app, this would compare current rating with previous rating
    const random = Math.floor(Math.random() * 3); // 0, 1, or 2
    if (random === 0) return 'up';
    if (random === 1) return 'down';
    return 'same';
  };

  // Get ranking medal for top 3
  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-white/70 w-5 text-center">{index + 1}</span>;
  };

  // Get performance color based on score
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Check if current employee is eligible for incentive
  const isEligibleForIncentive = () => {
    if (!currentEmployeeId) return false;
    
    // Find current employee position
    const position = sortedEmployees.findIndex(emp => emp.id === currentEmployeeId);
    
    // Eligible if in top 3 or top 10% of employees
    return position < 3 || (position < sortedEmployees.length * 0.1);
  };

  // Get incentive information based on rank
  const getIncentiveInfo = (index: number) => {
    if (index === 0) return { bonus: '15%', badge: 'Gold' };
    if (index === 1) return { bonus: '10%', badge: 'Silver' };
    if (index === 2) return { bonus: '5%', badge: 'Bronze' };
    if (index < sortedEmployees.length * 0.1) return { bonus: 'Training', badge: 'Elite' };
    return null;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Performance Leaderboard
        </div>
        <button
          onClick={() => setShowIncentiveInfo(!showIncentiveInfo)}
          className="text-xs bg-indigo-500/20 px-2 py-1 rounded-full text-indigo-300 hover:bg-indigo-500/30 flex items-center"
        >
          <DollarSign className="w-3 h-3 mr-1" />
          Incentives
        </button>
      </h3>
      
      {showIncentiveInfo && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-white text-sm">
          <h4 className="font-semibold mb-1 flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            Performance Incentives Program
          </h4>
          <p className="text-white/70 mb-2">Top performers on the leaderboard qualify for special bonuses and recognition.</p>
          <ul className="text-white/60 text-xs space-y-1 ml-5 list-disc">
            <li>1st Place: 15% quarterly bonus & recognition award</li>
            <li>2nd Place: 10% quarterly bonus</li>
            <li>3rd Place: 5% quarterly bonus</li>
            <li>Top 10%: Special training opportunities & development budget</li>
          </ul>
        </div>
      )}
      
      {currentEmployeeId && isEligibleForIncentive() && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-white flex items-start">
          <div className="bg-yellow-400 p-1.5 rounded-full mr-3 flex-shrink-0 mt-0.5">
            <DollarSign className="w-4 h-4 text-indigo-900" />
          </div>
          <div>
            <h4 className="font-medium mb-0.5">Congratulations! You're eligible for incentives</h4>
            <p className="text-white/70 text-sm">
              {sortedEmployees.findIndex(emp => emp.id === currentEmployeeId) === 0 
                ? "You're currently in 1st place! Keep up the excellent work to secure your 15% bonus and recognition award."
                : sortedEmployees.findIndex(emp => emp.id === currentEmployeeId) === 1
                  ? "You're in 2nd place! You're on track to receive a 10% quarterly bonus."
                  : sortedEmployees.findIndex(emp => emp.id === currentEmployeeId) === 2
                    ? "You're in 3rd place! Continue your performance to earn a 5% quarterly bonus."
                    : "You're in the top 10%! You qualify for special training and development opportunities."
              }
            </p>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-white/60 text-xs uppercase">
              <th className="py-3 text-left w-12">Rank</th>
              <th className="py-3 text-left">Employee</th>
              <th className="py-3 text-center">Performance</th>
              <th className="py-3 text-center w-16">Trend</th>
              <th className="py-3 text-center w-24">Incentive</th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((employee, index) => {
              const trend = getPerformanceTrend(employee.id);
              const isCurrentEmployee = employee.id === currentEmployeeId;
              const score = employee.performanceScore || 0;
              const incentive = getIncentiveInfo(index);
              
              return (
                <tr 
                  key={employee.id} 
                  className={`
                    border-t border-white/5 hover:bg-white/5
                    ${isCurrentEmployee ? 'bg-indigo-500/10' : ''}
                    transition-colors
                  `}
                >
                  <td className="py-3">
                    <div className="flex justify-center items-center">
                      {getMedal(index)}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                        {employee.photoURL ? (
                          <img src={employee.photoURL} alt={employee.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-indigo-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {employee.name}
                          {isCurrentEmployee && (
                            <span className="ml-2 text-xs bg-indigo-500/40 px-2 py-0.5 rounded text-indigo-200">You</span>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">{employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col items-center">
                      <div className="font-medium text-white mb-1">
                        {score}%
                      </div>
                      <div className="w-full max-w-[100px] bg-white/10 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full ${getPerformanceColor(score)}`} 
                          style={{ width: `${score}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      {trend === 'up' && <ArrowUp className="w-5 h-5 text-emerald-400" />}
                      {trend === 'down' && <ArrowDown className="w-5 h-5 text-red-400" />}
                      {trend === 'same' && <Minus className="w-5 h-5 text-white/40" />}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      {incentive ? (
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full 
                          ${index === 0 ? 'bg-yellow-400/20 text-yellow-400' : 
                            index === 1 ? 'bg-gray-300/20 text-gray-300' : 
                              index === 2 ? 'bg-amber-700/20 text-amber-700' : 
                                'bg-indigo-500/20 text-indigo-300'}
                        `}>
                          {incentive.bonus}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 