import React, { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, icon, trend }) => {
  const isTrendPositive = trend.startsWith('+');

  return (
    <div className="glass-card p-6 hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
          {icon}
        </div>
        <div className={`text-sm rounded-full px-2 py-0.5 flex items-center ${
          isTrendPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
        }`}>
          {trend}
            </div>
          </div>
          <div className="mt-4">
        <div className="text-sm text-white/70">{title}</div>
        <div className="text-3xl font-semibold text-white mt-1">{value}</div>
      </div>
    </div>
  );
};

export default MetricsCard;