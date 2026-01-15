import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { media, profile as profileApi, getStreamUrl } from '../services/api';
import './Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProfile } = useAuth();
  const videoRef = useRef(null);
  const [mediaData, setMediaData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

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
        <video
          ref={videoRef}
          controls
          autoPlay
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          className="video-player"
        >
          <source src={getStreamUrl(id)} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="watch-info">
        <h1>{mediaData.title}</h1>
        {mediaData.year && <p className="watch-year">{mediaData.year}</p>}
        {mediaData.season && mediaData.episode && (
          <p className="watch-episode">Season {mediaData.season} • Episode {mediaData.episode}</p>
        )}
        {mediaData.description && <p className="watch-description">{mediaData.description}</p>}
        {mediaData.genres && <p className="watch-genres">Genres: {mediaData.genres}</p>}
      </div>
    </div>
  );
};

export default Watch;
