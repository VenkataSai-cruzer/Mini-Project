/**
 * Authentication context.
 * Provides user state, login, and logout to the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while rehydrating from localStorage

  // Rehydrate session on mount
  useEffect(() => {
    const stored = localStorage.getItem('ztg_user');
    const token  = localStorage.getItem('ztg_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('ztg_user');
        localStorage.removeItem('ztg_token');
      }
    }
    setLoading(false);
  }, []);

  // Listen for 401 events dispatched by the axios interceptor
  useEffect(() => {
    function handleExpiry() {
      setUser(null);
    }
    window.addEventListener('ztg:session-expired', handleExpiry);
    return () => window.removeEventListener('ztg:session-expired', handleExpiry);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: userData } = await api.login(email, password);
    localStorage.setItem('ztg_token', token);
    localStorage.setItem('ztg_user',  JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ztg_token');
    localStorage.removeItem('ztg_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
