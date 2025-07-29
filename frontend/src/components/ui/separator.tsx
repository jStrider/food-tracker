import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ 
  orientation = 'horizontal', 
  className = '' 
}) => {
  const baseClasses = orientation === 'horizontal' 
    ? 'w-full h-px bg-gray-200' 
    : 'h-full w-px bg-gray-200';
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
};

export { Separator };