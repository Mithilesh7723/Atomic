import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, ArrowUp, ArrowDown, Minus, AlertCircle, Loader2 } from 'lucide-react';
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
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Performance Leaderboard
        </h3>
        
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

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
        Performance Leaderboard
      </h3>
      
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
            {sortedEmployees.map((employee, index) => {
              const trend = getPerformanceTrend(employee.id);
              const isCurrentEmployee = employee.id === currentEmployeeId;
              const score = employee.performanceScore || 0;
              
              return (
                <tr 
                  key={employee.id} 
                  className={`
                    border-t border-white/5 hover:bg-white/5
                    ${isCurrentEmployee ? 'bg-indigo-500/10' : ''}
                  `}
                >
                  <td className="py-3">
                    <div className="flex justify-center items-center">
                      {getMedal(index)}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 overflow-hidden">
                        {employee.photoURL ? (
                          <img 
                            src={employee.photoURL} 
                            alt={employee.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-4 h-4 text-indigo-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {employee.name}
                          {isCurrentEmployee && (
                            <span className="ml-2 text-xs bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">You</span>
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
                        {score === 0 && <span className="text-xs text-white/60 ml-1">(Not rated)</span>}
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
                      {score === 0 ? (
                        <span className="text-white/40 text-xs">New</span>
                      ) : (
                        <>
                          {trend === 'up' && <ArrowUp className="w-5 h-5 text-emerald-400" />}
                          {trend === 'down' && <ArrowDown className="w-5 h-5 text-red-400" />}
                          {trend === 'same' && <Minus className="w-5 h-5 text-gray-400" />}
                        </>
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