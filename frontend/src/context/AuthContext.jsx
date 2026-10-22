import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cloudgov_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cloudgov_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, verify and refresh user profile
    if (token) {
      authAPI.getCurrentUser()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('cloudgov_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('cloudgov_token', access_token);
      localStorage.setItem('cloudgov_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authAPI.register(userData);
      // Auto-login after registration
      return await login(userData.email, userData.password);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (role) => {
    const creds = {
      admin: { email: 'admin@cloudgov.gov', password: 'Admin@123' },
      officer: { email: 'officer@cloudgov.gov', password: 'Officer@123' },
      clerk: { email: 'clerk@cloudgov.gov', password: 'Clerk@123' },
      citizen: { email: 'citizen@cloudgov.gov', password: 'Citizen@123' },
    };
    const c = creds[role] || creds.citizen;
    return await login(c.email, c.password);
  };

  const logout = () => {
    localStorage.removeItem('cloudgov_token');
    localStorage.removeItem('cloudgov_user');
    setToken(null);
    setUser(null);
  };

  const isCitizen = user?.role === 'citizen';
  const isOfficer = user?.role === 'officer';
  const isClerk = user?.role === 'clerk';
  const isAdmin = user?.role === 'admin';
  const isStaff = isOfficer || isClerk || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        quickDemoLogin,
        logout,
        isAuthenticated: !!token,
        isCitizen,
        isOfficer,
        isClerk,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
