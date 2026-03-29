/**
 * @file src/lib/AuthContext.jsx
 *
 * Firebase auth context. Replaces the old stub.
 * Wraps the entire app so any component can call useAuth().
 *
 * Usage:
 *   const { user, signIn, signUp, signInGoogle, signOut, loading } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firebaseAuth } from '@/lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const isBootstrappingRef = useRef(false);

  // Listen to Firebase auth state (only if auth is available)
  useEffect(() => {
    if (firebaseAuth && firebaseAuth.onAuthChange) {
      const unsub = firebaseAuth.onAuthChange(async (u) => {
        setUser(u);
        
        if (u) {
          setLoading(false);
          return;
        }

        // Keep the app on Firebase by creating an anonymous session
        // when no explicit user session exists.
        if (firebaseAuth.ensureAuth && !isBootstrappingRef.current) {
          isBootstrappingRef.current = true;
          try {
            await firebaseAuth.ensureAuth();
          } catch (e) {
            setError(e.message);
            setLoading(false);
          } finally {
            isBootstrappingRef.current = false;
          }
          return;
        }

        setLoading(false);
      });
      return unsub;
    } else {
      // No auth available (simple adapter)
      setLoading(false);
    }
  }, []);

  async function handleAsync(fn) {
    setError(null);
    try   { return await fn(); }
    catch (e) { setError(e.message); throw e; }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,

    signIn:      firebaseAuth ? (email, password) => handleAsync(() => firebaseAuth.signInEmail(email, password)) : () => Promise.reject(new Error('Auth not available')),
    signUp:      firebaseAuth ? (email, password) => handleAsync(() => firebaseAuth.signUpEmail(email, password)) : () => Promise.reject(new Error('Auth not available')),
    signInGoogle: firebaseAuth ? () => handleAsync(() => firebaseAuth.signInGoogle()) : () => Promise.reject(new Error('Auth not available')),
    signOut:     firebaseAuth ? () => handleAsync(() => firebaseAuth.signOut()) : () => Promise.resolve(),
    clearError:  () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Fallback: if used outside provider, return defaults
  if (!ctx) {
    
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      signIn: () => Promise.reject(new Error('Auth not available')),
      signUp: () => Promise.reject(new Error('Auth not available')),
      signInGoogle: () => Promise.reject(new Error('Auth not available')),
      signOut: () => Promise.resolve(),
      clearError: () => {},
    };
  }
  return ctx;
}


