import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already authenticated
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && refreshToken) {
        try {
          // Validate token or refresh if expired
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expired, try refreshing
            await refreshAccessToken();
          } else {
            // Token valid, set auth state
            setAuthState({
              user: decoded,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };
    
    initAuth();
  }, []);
  
  const login = async (username, password) => {
    try {
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      const response = await authService.login(username, password);
      const { access, refresh, user_id, username: user_name, email, role, lab } = response;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      setAuthState({
        user: { id: user_id, username: user_name, email, role, lab },
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.detail || 'Authentication failed'
      }));
      return false;
    }
  };
  
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authService.refreshToken(refreshToken);
      const { access } = response;
      
      localStorage.setItem('token', access);
      
      // Update auth state with new token
      const decoded = jwtDecode(access);
      
      setAuthState(prev => ({
        ...prev,
        user: decoded,
        token: access,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    navigate('/login');
  };
  
  const value = {
    authState,
    login,
    logout,
    refreshAccessToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};