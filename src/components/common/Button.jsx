import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false, 
  className = '', 
  icon: Icon = null,
  fullWidth = false
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-primary-500",
    danger: "bg-danger text-white hover:bg-red-600 shadow-sm focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed transform-none' : 'hover:-translate-y-0.5'}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
      ) : Icon ? (
        <Icon className={`-ml-1 mr-2 ${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
