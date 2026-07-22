import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = "No data found", 
  description = "Get started by creating a new record.",
  actionText,
  onAction,
  useLogo = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-dashed border-gray-300 hover:border-primary-400 transition-colors duration-300 shadow-sm">
      <div className="mb-6 relative">
        {useLogo ? (
           <div className="bg-primary-50 rounded-full p-4 flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100">
             <img src="/logo.png" alt="KL CSE Capstone Portal" className="h-10 w-auto opacity-80 mix-blend-multiply" />
           </div>
        ) : (
          <div className="bg-gray-50 rounded-full p-5 shadow-sm border border-gray-100">
            <Icon className="h-10 w-10 text-gray-400" aria-hidden="true" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm font-medium leading-relaxed">{description}</p>
      
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
