import React from 'react';

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning-700 border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

export default Badge;
