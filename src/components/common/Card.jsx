import React from 'react';

const Card = ({ children, className = '', title, subtitle, action, hoverEffect = false, padding = 'p-6' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-card border border-gray-100/60 overflow-hidden transition-all duration-200 ${hoverEffect ? 'hover:shadow-card-hover hover:-translate-y-1' : ''} ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-5 border-b border-gray-100/50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <div>
            {title && <h3 className="text-[1.05rem] font-semibold tracking-tight text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`${padding}`}>{children}</div>
    </div>
  );
};

export default Card;
