import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  hover?: boolean;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function Card({
  children,
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary-600',
  hover = true,
  className = '',
  padding = 'md',
  onClick,
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl shadow-lg transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-2 cursor-pointer' : '';
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const classes = `${baseStyles} ${hoverStyles} ${paddingStyles[padding]} ${className}`;
  
  return (
    <div className={classes} onClick={onClick}>
      {Icon && (
        <Icon className={`w-12 h-12 ${iconColor} mb-4`} />
      )}
      
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-gray-600 mb-4">
          {description}
        </p>
      )}
      
      {children}
    </div>
  );
}
