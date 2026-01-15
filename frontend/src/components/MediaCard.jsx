import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profile as profileApi, getPosterUrl } from '../services/api';
import './MediaCard.css';

const MediaCard = ({ media, inList, onListUpdate }) => {
  const navigate = useNavigate();
  const { currentProfile } = useAuth();
  const [isInList, setIsInList] = useState(inList);
  const [showDetails, setShowDetails] = useState(false);

  const posterUrl = getPosterUrl(media.poster_path);
  const placeholderUrl = `https://via.placeholder.com/300x450/141414/e50914?text=${encodeURIComponent(media.title)}`;

  const handlePlay = () => {
    navigate(`/watch/${media.id}`);
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

  return (
    <div
      className="media-card"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onClick={handlePlay}
    >
      <img
        src={posterUrl || placeholderUrl}
        alt={media.title}
        className="media-poster"
        onError={(e) => e.target.src = placeholderUrl}
      />

      {showDetails && (
        <div className="media-details">
          <h3>{media.title}</h3>
          {media.year && <p className="media-year">{media.year}</p>}
          {media.genres && <p className="media-genres">{media.genres}</p>}

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
          </div>
        </div>
      )}

      <div className="media-title">{media.title}</div>
    </div>
  );
};

export default MediaCard;
