import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profile as profileApi, media as mediaApi, getPosterUrl } from '../services/api';
import EpisodeSelector from './EpisodeSelector';
import './MediaCard.css';

const MediaCard = ({ media, inList, onListUpdate, onDelete, style, progress }) => {
  const navigate = useNavigate();
  const { currentProfile, isAdmin } = useAuth();
  const [isInList, setIsInList] = useState(inList);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  const posterUrl = getPosterUrl(media.poster_path);
  const placeholderUrl = `https://via.placeholder.com/300x450/141414/e50914?text=${encodeURIComponent(media.title)}`;

  const handlePlay = async (e) => {
    e.stopPropagation();

    // If this is a series, show episode selector
    if (media.type === 'series') {
      try {
        const seriesResponse = await mediaApi.getById(media.id);
        const fetchedEpisodes = seriesResponse.data.episodes || [];

        if (fetchedEpisodes.length > 0) {
          setSeriesData(media);
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
      navigate(`/watch/${media.id}`);
    }
  };

  const toggleMyList = async (e) => {
    e.stopPropagation();
    try {
      if (isInList) {
        await profileApi.removeFromMyList(currentProfile.id, media.id);
        setIsInList(false);
      } else {
        await profileApi.addToMyList(currentProfile.id, media.id);
        setIsInList(true);
      }
      onListUpdate?.();
    } catch (error) {
      console.error('Failed to update my list:', error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async (e) => {
    e.stopPropagation();
    try {
      await mediaApi.delete(media.id);
      setShowDeleteConfirm(false);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete: ' + (error.response?.data?.error || error.message));
    }
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Show progress bar if provided (for continue watching)
  const progressPercent = progress ? Math.round(progress * 100) : null;

  return (
    <div
      className="media-card smooth-hover"
      style={style}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className="media-poster-container" onClick={handlePlay}>
        <img
          src={posterUrl || placeholderUrl}
          alt={media.title}
          className="media-poster"
          onError={(e) => e.target.src = placeholderUrl}
        />
        {progressPercent !== null && (
          <div className="media-progress">
            <div className="media-progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="media-details fade-in">
          <h3>{media.title}</h3>
          {media.year && <p className="media-year">{media.year}</p>}
          {media.description && (
            <p className="media-description">{media.description.slice(0, 100)}...</p>
          )}
          {media.genres && <p className="media-genres">{media.genres}</p>}
          {progressPercent !== null && (
            <p className="media-watch-status">{progressPercent}% watched</p>
          )}

          <div className="media-actions">
            <button className="btn-play" onClick={handlePlay}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </button>

            <button
              className={`btn-icon ${isInList ? 'active' : ''}`}
              onClick={toggleMyList}
              title={isInList ? 'Remove from My List' : 'Add to My List'}
            >
              {isInList ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              )}
            </button>

            {isAdmin && (
              <button
                className="btn-icon btn-delete"
                onClick={handleDelete}
                title="Delete"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={cancelDelete}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete "{media.title}"?</h3>
            <p>This will permanently delete the video file and all associated data. This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showEpisodeSelector && seriesData && (
        <EpisodeSelector
          series={seriesData}
          episodes={episodes}
          onClose={() => setShowEpisodeSelector(false)}
        />
      )}

      <div className="media-title">{media.title}</div>
    </div>
  );
};

export default MediaCard;
export { MediaCard };
