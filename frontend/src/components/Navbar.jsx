import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, currentProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              {showMobileMenu ? (
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              ) : (
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              )}
            </svg>
          </button>

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

        <div className="navbar-center">
          <SearchBar />
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
                <Link to="/settings" onClick={() => setShowProfileMenu(false)}>
                  Settings
                </Link>
                <button onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="profile-info">
                <div className="profile-avatar">
                  {currentProfile?.name?.[0] || 'U'}
                </div>
                <span className="profile-name">{currentProfile?.name || 'User'}</span>
              </div>
            </div>

            <div className="mobile-menu-links">
              <Link
                to="/"
                className={isActive('/') ? 'active' : ''}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Home
              </Link>

              <Link
                to="/movies"
                className={isActive('/movies') ? 'active' : ''}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
                Movies
              </Link>

              <Link
                to="/series"
                className={isActive('/series') ? 'active' : ''}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z" />
                </svg>
                TV Shows
              </Link>

              <Link
                to="/my-list"
                className={isActive('/my-list') ? 'active' : ''}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                My List
              </Link>

              {isAdmin && (
                <Link
                  to="/upload"
                  className={isActive('/upload') ? 'active' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                  </svg>
                  Upload
                </Link>
              )}
            </div>

            <div className="mobile-menu-footer">
              <Link
                to="/profiles"
                className="mobile-menu-item"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Switch Profile
              </Link>

              <Link
                to="/settings"
                className="mobile-menu-item"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                Settings
              </Link>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
