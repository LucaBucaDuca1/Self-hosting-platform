import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/api';
import { SkeletonCard } from '../components/SkeletonCard';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');

  useEffect(() => {
    if (activeTab === 'devices') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await auth.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (sessionId) => {
    if (!confirm('Are you sure you want to log out this device?')) return;

    try {
      await auth.logoutDevice(sessionId);
      loadSessions();
    } catch (error) {
      console.error('Failed to logout device:', error);
      alert('Failed to logout device');
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to log out from all devices? You will be logged out.')) return;

    try {
      await auth.logoutAll();
      logout();
    } catch (error) {
      console.error('Failed to logout all devices:', error);
      alert('Failed to logout all devices');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="page-container settings-page">
      <div className="settings-header fade-in">
        <h1>Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </div>

      <div className="settings-tabs fade-in">
        <button
          className={`settings-tab ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          Devices & Sessions
        </button>
        <button
          className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {activeTab === 'devices' && (
        <div className="settings-content fade-in">
          <div className="settings-section">
            <div className="section-header">
              <h2>Logged In Devices</h2>
              {sessions.length > 1 && (
                <button className="btn-danger" onClick={handleLogoutAll}>
                  Logout All Devices
                </button>
              )}
            </div>

            {loading ? (
              <div className="devices-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="device-skeleton">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="devices-grid">
                {sessions.map((session) => (
                  <div key={session.id} className={`device-card ${session.is_current ? 'current' : ''}`}>
                    <div className="device-icon">
                      {session.device_name.includes('iPhone') || session.device_name.includes('Android') ? '📱' : '💻'}
                    </div>
                    <div className="device-info">
                      <h3>{session.device_name}</h3>
                      {session.is_current && <span className="current-badge">Current Device</span>}
                      <p className="device-ip">{session.ip_address}</p>
                      <p className="device-time">Last active: {formatDate(session.last_active)}</p>
                      <p className="device-time">Logged in: {formatDate(session.created_at)}</p>
                    </div>
                    {!session.is_current && (
                      <button
                        className="btn-logout-device"
                        onClick={() => handleLogoutDevice(session.id)}
                      >
                        Logout
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No active sessions found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="settings-content fade-in">
          <div className="settings-section">
            <h2>Account Information</h2>
            <div className="account-info">
              <div className="info-row">
                <label>Email</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-row">
                <label>Username</label>
                <span>{user?.username}</span>
              </div>
              <div className="info-row">
                <label>Role</label>
                <span className="role-badge">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
