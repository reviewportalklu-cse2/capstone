import React from 'react';
import logoImg from '@/assets/kl-logo.png';

/**
 * Official Centralized KL University Logo Component
 * Standardized branding component for Capstone ERP portal
 */
const SIZE_MAP = {
  sm: 'h-8 max-h-8',
  md: 'h-12 max-h-12',
  lg: 'h-16 max-h-16',
  xl: 'h-20 max-h-20',
  custom: ''
};

const Logo = ({ 
  size = 'md', 
  className = '', 
  alt = 'KL University Capstone ERP',
  bgVariant = 'auto' // 'auto', 'white', 'transparent'
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  
  let bgStyle = '';
  if (bgVariant === 'white') {
    bgStyle = 'bg-white rounded p-1 shadow-sm';
  } else if (bgVariant === 'auto') {
    bgStyle = 'bg-white/95 rounded p-1 backdrop-blur-sm shadow-sm border border-gray-100';
  }

  return (
    <img 
      src={logoImg} 
      alt={alt} 
      className={`object-contain w-auto transition-all ${sizeClass} ${bgStyle} ${className}`}
    />
  );
};

export default Logo;
