import React from 'react';
import Card from './Card';

const KpiCard = ({ title, value, subtitle, icon: Icon, color = 'primary', trend, trendUp }) => {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-sky-50 text-sky-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  const bgClass = colorMap[color] || colorMap.primary;

  return (
    <Card className="bg-white border-l-4 shadow-sm h-full" style={{ borderLeftColor: `var(--color-${color}-500, #4f46e5)` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          
          {subtitle && !trend && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
              {subtitle && <span className="text-gray-400 ml-1 font-normal">{subtitle}</span>}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg ${bgClass}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default KpiCard;
