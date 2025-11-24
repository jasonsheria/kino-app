  import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import WebSocketService from '../services/webSocketService';
import { io } from 'socket.io-client';
import { config } from '../config/api.config';
import axios from 'axios';
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(authService.getToken());
  
  // Additional state for page data
  const [userId, setUserId] = useState(null);
  const [pageDataLoading, setPageDataLoading] = useState(false);
  const [usersites, setUsersites] = useState([]);
  const [settings, setSettings] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [texts, setTexts] = useState([]);
  const [userthemes, setUserthemes] = useState([]);
  const [userarticles, setUserarticles] = useState([]);
  const [userprojects, setUserprojects] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();
        // If we have both token and user in localStorage, restore them immediately (optimistic)
        if (storedToken && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          setToken(storedToken);
          // connect socket immediately so UI remains realtime after reload
          WebSocketService.connect(storedToken);
        }

        // In background, validate/refresh the user from server
        if (storedToken) {
          const refreshed = await authService.refreshUser();
          if (refreshed) {
            setUser(refreshed);
            setIsAuthenticated(true);
            setToken(storedToken);
            // ensure socket connected with refreshed token
            if (!WebSocketService.isConnected()) {
              WebSocketService.connect(storedToken);
            }
          } else {
            // token invalid/expired -> clear
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            setToken(null);
            WebSocketService.disconnect();
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
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_APP_URL}/api/auth/google/login`,
        { token: credential },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Extract data from response
      const { accessToken, user } = response.data;
      
      // Save user and token in authService
      authService.setAuthToken(accessToken);
      authService.setUser(user);
      
      // Update context state
      setUser(user);
      setIsAuthenticated(true);
      setToken(accessToken);
      
      // Connect WebSocket and ensure it's properly connected
      WebSocketService.connect(accessToken);
      
      // Wait a bit to ensure WebSocket connection is established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (WebSocketService.isConnected()) {
        console.log('WebSocket connected successfully after Google login');
        WebSocketService.socket.emit('identify', { userId: user._id });
      } else {
        console.warn('WebSocket connection not established after Google login');
      }
      
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    }
  }, []);

  const register = useCallback(async (name, email, password, phoneNumber, profileImage) => {
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('username', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('telephone', phoneNumber);
      formData.append('isGoogleAuth', false); // default role
      if (profileImage) {
        formData.append('profileUrl', profileImage);
      }

      const response = await authService.register(formData);
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

  // Listen for global logout events (dispatched by UI components)
  useEffect(() => {
    const handleAppLogout = () => {
      // call logout safely; if logout isn't available due to initialization order,
      // defer the call to the next tick as a fallback.
      try {
        logout({ notify: true }).catch(() => {});
      } catch (e) {
        setTimeout(() => { try { logout({ notify: true }).catch(() => {}); } catch (_) {} }, 0);
      }
    };
    window.addEventListener('appLogout', handleAppLogout);
    return () => window.removeEventListener('appLogout', handleAppLogout);
  }, [logout]);



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
    logout,
    userId,
    pageDataLoading,
    usersites,
    settings,
    configs,
    texts,
    userthemes,
    userarticles,
    userprojects,
    comments,
    setComments
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
