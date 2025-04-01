import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PerformanceMetric } from '../types/models';

interface PerformanceOverviewProps {
  metrics: PerformanceMetric[];
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ metrics }) => {
  // Create a simplified dataset for the chart
  const hasMetrics = metrics && metrics.length > 0;
  
  // If we have metrics, use them; otherwise use placeholder data
  const chartData = hasMetrics 
    ? metrics.map(metric => ({
        label: metric.metric,
        value: metric.value,
        color: getMetricColor(metric.value)
      })).slice(0, 6) // Limit to 6 metrics for display
    : [
        { label: 'Teamwork', value: 85, color: 'bg-indigo-500' },
        { label: 'Problem Solving', value: 92, color: 'bg-purple-500' },
        { label: 'Communication', value: 78, color: 'bg-blue-500' },
        { label: 'Technical Skills', value: 95, color: 'bg-emerald-500' },
        { label: 'Adaptability', value: 88, color: 'bg-amber-500' },
        { label: 'Leadership', value: 72, color: 'bg-pink-500' }
      ];

  return (
    <div className="glass-card h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-300" />
            Performance Overview
          </h2>
          {!hasMetrics && (
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">Placeholder Data</span>
          )}
        </div>
        
        <div className="space-y-5">
          {chartData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white/80">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.value}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
          </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine the color based on performance value
function getMetricColor(value: number): string {
  if (value >= 90) return 'bg-emerald-500';
  if (value >= 80) return 'bg-blue-500';
  if (value >= 70) return 'bg-indigo-500';
  if (value >= 60) return 'bg-amber-500';
  if (value >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

export default PerformanceOverview;