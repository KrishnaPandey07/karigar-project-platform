import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, setAccessToken, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on initial boot
  useEffect(() => {
    async function initAuth() {
      const storedToken = getAccessToken();
      try {
        if (storedToken) {
          const res = await apiClient('/auth/me');
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          }
        } else {
          // Attempt refresh using httpOnly cookie
          const refreshRes = await apiClient('/auth/refresh', { method: 'POST' });
          if (refreshRes.success && refreshRes.data?.accessToken) {
            setAccessToken(refreshRes.data.accessToken);
            setUser(refreshRes.data.user);
          }
        }
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    if (res.success && res.data) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await apiClient('/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (res.success && res.data) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token: getAccessToken(),
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
