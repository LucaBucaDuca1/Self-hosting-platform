import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedProfile = localStorage.getItem('currentProfile');

    if (token) {
      loadUser();
      if (savedProfile) {
        setCurrentProfile(JSON.parse(savedProfile));
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const [userRes, profilesRes] = await Promise.all([
        auth.getMe(),
        auth.getProfiles()
      ]);

      setUser(userRes.data);
      setProfiles(profilesRes.data);

      // Auto-select first profile if none selected
      const savedProfile = localStorage.getItem('currentProfile');
      if (!savedProfile && profilesRes.data.length > 0) {
        selectProfile(profilesRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await auth.login({ email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);

    const profilesRes = await auth.getProfiles();
    setProfiles(profilesRes.data);

    if (profilesRes.data.length > 0) {
      selectProfile(profilesRes.data[0]);
    }

    return response.data;
  };

  const register = async (email, password, username) => {
    const response = await auth.register({ email, password, username });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);

    const profilesRes = await auth.getProfiles();
    setProfiles(profilesRes.data);

    if (profilesRes.data.length > 0) {
      selectProfile(profilesRes.data[0]);
    }

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentProfile');
    setUser(null);
    setProfiles([]);
    setCurrentProfile(null);
  };

  const selectProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentProfile', JSON.stringify(profile));
  };

  const value = {
    user,
    profiles,
    currentProfile,
    loading,
    login,
    register,
    logout,
    selectProfile,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
