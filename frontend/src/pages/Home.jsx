import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { media, profile as profileApi, collections as collectionsApi, getBackgroundUrl } from '../services/api';
import { ContentRow } from '../components/ContentRow';
import { SkeletonHero, SkeletonRow } from '../components/SkeletonCard';
import EpisodeSelector from '../components/EpisodeSelector';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { currentProfile } = useAuth();
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [trending, setTrending] = useState([]);
  const [myList, setMyList] = useState([]);
  const [collections, setCollections] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [continueRes, recentRes, trendingRes, myListRes, collectionsRes, recommendedRes] = await Promise.all([
        profileApi.getContinueWatching(currentProfile.id).catch(() => ({ data: [] })),
        media.getRecent().catch(() => ({ data: [] })),
        media.getTrending().catch(() => ({ data: [] })),
        profileApi.getMyList(currentProfile.id).catch(() => ({ data: [] })),
        collectionsApi.getAll().catch(() => ({ data: [] })),
        media.getRecommended(currentProfile.id).catch(() => ({ data: [] }))
      ]);

      const continueData = continueRes.data.map(item => ({ ...item, progress: item.progress }));
      setContinueWatching(continueData);
      setRecentlyAdded(recentRes.data);
      setTrending(trendingRes.data);
      setMyList(myListRes.data);
      setCollections(collectionsRes.data);
      setRecommended(recommendedRes.data);

      // Set featured to first item in trending or recent
      setFeatured(trendingRes.data[0] || recentRes.data[0] || null);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturedPlay = async () => {
    if (!featured) return;

    // If this is a series, show episode selector
    if (featured.type === 'series') {
      try {
        const seriesResponse = await media.getById(featured.id);
        const fetchedEpisodes = seriesResponse.data.episodes || [];

        if (fetchedEpisodes.length > 0) {
          setSeriesData(featured);
          setEpisodes(fetchedEpisodes);
          setShowEpisodeSelector(true);
        } else {
          alert('No episodes found for this series');
        }
      } catch (error) {
        console.error('Failed to load series episodes:', error);
        alert('Failed to load series');
      }
    } else {
      // For movies and episodes, navigate directly
      navigate(`/watch/${featured.id}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <SkeletonHero />
        <SkeletonRow count={6} />
        <SkeletonRow count={6} />
        <SkeletonRow count={6} />
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
                onClick={handleFeaturedPlay}
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

      <ContentRow
        title="Continue Watching"
        items={continueWatching}
        emptyMessage="Start watching something to see it here!"
        onDelete={loadData}
      />

      <ContentRow
        title="My List"
        items={myList}
        emptyMessage="Add titles to your list to watch them later"
        onDelete={loadData}
      />

      {recommended.length > 0 && (
        <ContentRow
          title="Recommended For You"
          items={recommended}
          onDelete={loadData}
        />
      )}

      <ContentRow
        title="Trending Now"
        items={trending}
        onDelete={loadData}
      />

      <ContentRow
        title="Recently Added"
        items={recentlyAdded}
        onDelete={loadData}
      />

      {collections.map((collection) => (
        <ContentRow
          key={collection.id}
          title={collection.name}
          items={collection.items || []}
          onDelete={loadData}
        />
      ))}

      {!featured && recentlyAdded.length === 0 && (
        <div className="empty-state fade-in">
          <h2>Welcome to Zeloz Streaming</h2>
          <p>Your personal streaming service is ready.</p>
          <p>Start by uploading some content!</p>
        </div>
      )}

      {showEpisodeSelector && seriesData && (
        <EpisodeSelector
          series={seriesData}
          episodes={episodes}
          onClose={() => setShowEpisodeSelector(false)}
        />
      )}
    </div>
  );
};

export default Home;
