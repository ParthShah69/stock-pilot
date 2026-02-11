import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for existing token and user data on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // Check localStorage for token and remember me preference
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const rememberMePref = localStorage.getItem('rememberMe') === 'true';
        
        console.log('Found token:', !!token);
        console.log('Remember me preference:', rememberMePref);
        
        if (token) {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Set axios authorization header');
          
          // Try to get current user data
          try {
            const response = await axios.get('/api/auth/me');
            console.log('User data received:', response.data);
            setUser(response.data);
            setRememberMe(rememberMePref);
            console.log('User authenticated from stored token');
          } catch (error) {
            console.log('Token expired or invalid, clearing auth data');
            console.error('Auth error:', error.response?.data || error.message);
            // Token is invalid, clear everything
            clearAuthData();
          }
        } else {
          console.log('No token found, user not authenticated');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        console.log('Authentication initialization complete');
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    // Clear from both localStorage and sessionStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('rememberMe');
    
    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    setRememberMe(false);
  };

  const login = async (email, password, remember = false) => {
    try {
      console.log('Attempting login with remember me:', remember);
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      console.log('Login successful, token received:', !!token);
      console.log('User data:', userData);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store token based on remember me preference
      if (remember) {
        console.log('Storing token in localStorage (remember me enabled)');
        localStorage.setItem('authToken', token);
        localStorage.setItem('rememberMe', 'true');
      } else {
        console.log('Storing token in sessionStorage (remember me disabled)');
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('rememberMe', 'false');
      }
      
      setUser(userData);
      setRememberMe(remember);
      
      console.log('Login complete, user state updated');
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password });
      const { token, user: userData } = response.data;
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store token in session storage for new registrations
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('rememberMe', 'false');
      
      setUser(userData);
      setRememberMe(false);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    rememberMe,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
