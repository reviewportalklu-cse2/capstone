import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  id, 
  type = 'text', 
  error, 
  icon: Icon,
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`
            block w-full rounded-lg sm:text-sm transition-colors duration-200
            ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 
            border 
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400'
            }
            focus:outline-none focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 font-medium animate-fade-in" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
