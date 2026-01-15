import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, currentProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            ZELOZ
          </Link>

          <div className="navbar-links">
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
            <Link to="/movies" className={isActive('/movies') ? 'active' : ''}>
              Movies
            </Link>
            <Link to="/series" className={isActive('/series') ? 'active' : ''}>
              TV Shows
            </Link>
            <Link to="/my-list" className={isActive('/my-list') ? 'active' : ''}>
              My List
            </Link>
            {isAdmin && (
              <Link to="/upload" className={isActive('/upload') ? 'active' : ''}>
                Upload
              </Link>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <div className="profile-menu">
            <button
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar">
                {currentProfile?.name?.[0] || 'U'}
              </div>
              <span className="profile-name">{currentProfile?.name || 'User'}</span>
              <svg className="dropdown-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <Link to="/profiles" onClick={() => setShowProfileMenu(false)}>
                  Switch Profile
                </Link>
                <button onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
