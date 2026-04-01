/**
 * @file src/lib/performance.jsx
 *
 * Performance monitoring utilities.
 */

import React from 'react';

// Performance metrics monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Silently monitor performance metrics
      getCLS(() => {});
      getFID(() => {});
      getFCP(() => {});
      getLCP(() => {});
      getTTFB(() => {});
    }).catch(() => {
      // web-vitals not available, silently fail
    });

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        
        if (usedMB > 50) { // Alert if using more than 50MB
          // Silently monitor high memory usage
        }
      }, 30000); // Check every 30 seconds
    }
  }
}

// Component performance wrapper
export function withPerformanceTracking(WrappedComponent, componentName) {
  return function TrackedComponent(props) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than one frame
          // Silently monitor slow renders
        }
    });

    return <WrappedComponent {...props} />;
  };
}

// Debounced function utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttled function utility
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}


