import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import WebSocketService from '../services/webSocketService';
import { io } from 'socket.io-client';
import { config } from '../config/api.config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(authService.getToken());

  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      try {
        const storedToken = authService.getToken();
        if (storedToken) {
          const user = await authService.refreshUser();
          if (user) {
            setUser(user);
            setIsAuthenticated(true);
            setToken(storedToken);
            WebSocketService.connect(storedToken);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      setToken(response.accessToken);
      WebSocketService.connect(response.accessToken);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const response = await authService.loginWithGoogle(credential);
      setUser(response.user);
      setIsAuthenticated(true);
      setToken(response.accessToken);
      WebSocketService.connect(response.accessToken);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      setIsAuthenticated(true);
      setToken(response.accessToken);
      WebSocketService.connect(response.accessToken);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    }
  }, []);

  const logout = useCallback(async (options = {}) => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    }
    WebSocketService.disconnect();
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    
    if (options.notify && window.enqueueSnackbar) {
      window.enqueueSnackbar('Vous avez été déconnecté(e) de la session.', { variant: 'info' });
    }
  }, []);

  // WebSocket connection for logout notifications
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(config.API_ENDPOINTS.WS_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket'],
    });

    socket.on('userLogout', ({ userId }) => {
      if (user && user._id === userId) {
        if (window.enqueueSnackbar) {
          window.enqueueSnackbar('Vous avez été déconnecté(e) de la session.', { variant: 'info' });
        }
        logout();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, logout]);

  const value = {
    user,
    setUser,
    token,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
