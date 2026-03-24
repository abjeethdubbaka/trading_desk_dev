import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationTracker = () => {
  const location = useLocation();

  useEffect(() => {
    
  }, [location]);

  return null;
};

export default NavigationTracker;
