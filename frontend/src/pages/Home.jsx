import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { media, profile as profileApi, getBackgroundUrl } from '../services/api';
import MediaCard from '../components/MediaCard';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { currentProfile } = useAuth();
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const loadData = async () => {
    try {
      const [continueRes, recentRes, trendingRes] = await Promise.all([
        profileApi.getContinueWatching(currentProfile.id),
        media.getRecent(),
        media.getTrending()
      ]);

      setContinueWatching(continueRes.data);
      setRecentlyAdded(recentRes.data);
      setTrending(trendingRes.data);

      // Set featured to first item in trending or recent
      setFeatured(trendingRes.data[0] || recentRes.data[0] || null);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {featured && (
        <div className="hero-section">
          {featured.background_path && (
            <img
              src={getBackgroundUrl(featured.background_path)}
              alt=""
              className="hero-background"
            />
          )}

          <div className="hero-content">
            <h1 className="hero-title">{featured.title}</h1>
            <p className="hero-description">
              {featured.description || 'Start watching this amazing content now.'}
            </p>
            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/watch/${featured.id}`)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </button>
              <button className="btn btn-secondary">
                More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {continueWatching.length > 0 && (
        <div className="content-row">
          <h2>Continue Watching</h2>
          <div className="content-grid">
            {continueWatching.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                onListUpdate={loadData}
              />
            ))}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="content-row">
          <h2>Trending Now</h2>
          <div className="content-grid">
            {trending.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                onListUpdate={loadData}
              />
            ))}
          </div>
        </div>
      )}

      {recentlyAdded.length > 0 && (
        <div className="content-row">
          <h2>Recently Added</h2>
          <div className="content-grid">
            {recentlyAdded.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                onListUpdate={loadData}
              />
            ))}
          </div>
        </div>
      )}

      {!featured && recentlyAdded.length === 0 && (
        <div className="empty-state">
          <h2>Welcome to Zeloz Streaming</h2>
          <p>Your personal streaming service is ready.</p>
          <p>Start by uploading some content!</p>
        </div>
      )}
    </div>
  );
};

export default Home;
