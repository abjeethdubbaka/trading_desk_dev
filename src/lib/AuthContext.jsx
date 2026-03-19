import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const navigateToLogin = () => {
    console.log('Navigate to login');
  };

  useEffect(() => {
    // Initialize auth state
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthError(null);
  }, []);

  const value = {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
