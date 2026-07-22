import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass = "text-primary-500", bgClass = "bg-primary-50", trend, trendValue }) => {
  return (
    <div className="bg-white overflow-hidden shadow-card hover:shadow-card-hover rounded-xl border border-gray-100/60 transition-all duration-200 group hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <div className={`p-2.5 rounded-lg ${bgClass} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`h-5 w-5 ${colorClass}`} aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline">
          <dd className="text-3xl font-bold text-gray-900 tracking-tight">{value}</dd>
          
          {trend && (
            <div className={`ml-3 flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-gray-400'
            }`}>
              {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
              {trend === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
