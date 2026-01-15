import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { media, profile as profileApi, getStreamUrl } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProfile, isAdmin } = useAuth();
  const videoRef = useRef(null);
  const [mediaData, setMediaData] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [id]);

  useEffect(() => {
    if (mediaData && videoRef.current) {
      loadProgress();
    }
  }, [mediaData]);

  const loadMedia = async () => {
    try {
      const response = await media.getById(id);
      setMediaData(response.data);

      // If this is an episode, load all episodes from the series
      if (response.data.type === 'episode' && response.data.series_id) {
        try {
          const seriesResponse = await media.getById(response.data.series_id);
          setSeriesData(seriesResponse.data);

          // Get all episodes for this series
          const allEpisodesResponse = await media.getAll({
            type: 'episode',
            limit: 1000
          });

          // Filter episodes that belong to this series
          const episodes = allEpisodesResponse.data.media.filter(
            ep => ep.series_id === response.data.series_id
          ).sort((a, b) => {
            if (a.season !== b.season) return a.season - b.season;
            return a.episode - b.episode;
          });

          setAllEpisodes(episodes);
        } catch (error) {
          console.error('Failed to load series data:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await profileApi.getWatchProgress(currentProfile.id, id);
      if (response.data && response.data.progress > 0) {
        videoRef.current.currentTime = response.data.progress;
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const completed = currentTime / duration > 0.9;

    try {
      await profileApi.updateWatchProgress(currentProfile.id, id, {
        progress: currentTime,
        completed
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handlePause = () => {
    saveProgress();
  };

  const handleEnded = async () => {
    await saveProgress();

    // Auto-play next episode if available
    if (mediaData.type === 'episode' && mediaData.series_id) {
      try {
        const response = await media.getById(mediaData.series_id);
        const episodes = response.data.episodes || [];
        const currentIndex = episodes.findIndex(ep => ep.id === parseInt(id));

        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
          const nextEpisode = episodes[currentIndex + 1];
          navigate(`/watch/${nextEpisode.id}`);
        }
      } catch (error) {
        console.error('Failed to load next episode:', error);
      }
    }
  };

  const getNextEpisode = () => {
    if (mediaData.type === 'episode' && mediaData.series_id) {
      try {
        // This would need to be populated from series data
        // For now, return null and handle in the component
        return null;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const interval = setInterval(saveProgress, 10000); // Save every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!mediaData) {
    return (
      <div className="empty-state">
        <h2>Media not found</h2>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </button>

      <div className="video-container">
        <VideoPlayer
          videoRef={videoRef}
          streamUrl={getStreamUrl(id)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          hasNextEpisode={mediaData.type === 'episode' && mediaData.series_id}
          subtitles={mediaData.subtitle_tracks ? JSON.parse(mediaData.subtitle_tracks) : []}
          mediaData={mediaData}
        />
      </div>

      {/* Episode Navigation for TV Shows */}
      {allEpisodes.length > 0 && (
        <div className="episodes-section">
          <div className="episodes-header">
            <h2>Episodes</h2>
            <button
              className="episodes-toggle"
              onClick={() => setShowEpisodes(!showEpisodes)}
            >
              {showEpisodes ? 'Hide' : 'Show'} Episodes
              <svg viewBox="0 0 24 24" fill="currentColor" style={{
                transform: showEpisodes ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </div>

          {showEpisodes && (
            <div className="episodes-list">
              {/* Group by seasons */}
              {Object.entries(
                allEpisodes.reduce((acc, ep) => {
                  const season = ep.season || 1;
                  if (!acc[season]) acc[season] = [];
                  acc[season].push(ep);
                  return acc;
                }, {})
              ).map(([season, episodes]) => (
                <div key={season} className="season-group">
                  <h3 className="season-title">Season {season}</h3>
                  <div className="season-episodes">
                    {episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className={`episode-item ${ep.id === parseInt(id) ? 'current' : ''}`}
                        onClick={() => {
                          if (ep.id !== parseInt(id)) {
                            navigate(`/watch/${ep.id}`);
                          }
                        }}
                      >
                        <div className="episode-number">
                          {ep.episode}
                        </div>
                        <div className="episode-info">
                          <h4>{ep.title}</h4>
                          {ep.description && (
                            <p>{ep.description.slice(0, 120)}...</p>
                          )}
                        </div>
                        {ep.id === parseInt(id) && (
                          <div className="episode-playing">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="watch-info">
        <div className="watch-info-header">
          <div>
            <h1>{mediaData.title}</h1>
            {mediaData.year && <p className="watch-year">{mediaData.year}</p>}
            {mediaData.season && mediaData.episode && (
              <p className="watch-episode">Season {mediaData.season} • Episode {mediaData.episode}</p>
            )}
          </div>
          {isAdmin && (
            <button
              className="btn-edit-media"
              onClick={() => navigate(`/upload?edit=${mediaData.id}`)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Edit
            </button>
          )}
        </div>
        {mediaData.description && <p className="watch-description">{mediaData.description}</p>}
        {mediaData.genres && <p className="watch-genres">Genres: {mediaData.genres}</p>}
      </div>
    </div>
  );
};

export default Watch;
