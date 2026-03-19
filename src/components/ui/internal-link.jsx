import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const InternalLink = ({ 
  to, 
  children, 
  className, 
  onClick,
  ...props 
}) => {
  const handleClick = (e) => {
    // Prevent default browser behavior for Ctrl+click
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Use navigate instead of opening new tab
      window.location.href = to;
    }
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      to={to}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};

export default InternalLink;
