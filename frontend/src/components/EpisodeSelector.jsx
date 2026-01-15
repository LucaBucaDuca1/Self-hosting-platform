import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosterUrl } from '../services/api';
import './EpisodeSelector.css';

const EpisodeSelector = ({ series, episodes, onClose }) => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasons, setSeasons] = useState({});

  useEffect(() => {
    // Organize episodes by season
    const organized = {};
    episodes.forEach(ep => {
      const season = ep.season || 1;
      if (!organized[season]) {
        organized[season] = [];
      }
      organized[season].push(ep);
    });

    // Sort episodes within each season
    Object.keys(organized).forEach(season => {
      organized[season].sort((a, b) => (a.episode || 0) - (b.episode || 0));
    });

    setSeasons(organized);

    // Set first season as selected
    if (Object.keys(organized).length > 0) {
      setSelectedSeason(parseInt(Object.keys(organized)[0]));
    }
  }, [episodes]);

  const handleEpisodeClick = (episodeId) => {
    navigate(`/watch/${episodeId}`);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'episode-selector-backdrop') {
      onClose();
    }
  };

  const currentSeasonEpisodes = seasons[selectedSeason] || [];
  const seasonNumbers = Object.keys(seasons).map(Number).sort((a, b) => a - b);

  return (
    <div className="episode-selector-backdrop" onClick={handleBackdropClick}>
      <div className="episode-selector-modal">
        <div className="episode-selector-header">
          <div className="episode-selector-title">
            <h2>{series.title}</h2>
            <p>{episodes.length} Episodes</p>
          </div>
          <button className="episode-selector-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="episode-selector-controls">
          <div className="season-selector">
            <label>Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
              className="season-dropdown"
            >
              {seasonNumbers.map(season => (
                <option key={season} value={season}>
                  Season {season} ({seasons[season].length} episodes)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="episode-selector-list">
          {currentSeasonEpisodes.map((episode, index) => (
            <div
              key={episode.id}
              className="episode-selector-item"
              onClick={() => handleEpisodeClick(episode.id)}
            >
              <div className="episode-selector-number">
                {episode.episode}
              </div>
              <div className="episode-selector-poster">
                <img
                  src={getPosterUrl(episode.poster_path) || `https://via.placeholder.com/300x169/141414/e50914?text=E${episode.episode}`}
                  alt={episode.title}
                  onError={(e) => e.target.src = `https://via.placeholder.com/300x169/141414/e50914?text=E${episode.episode}`}
                />
                <div className="episode-selector-play-overlay">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="episode-selector-info">
                <div className="episode-selector-info-header">
                  <h4>{episode.title}</h4>
                  {episode.year && <span className="episode-year">{episode.year}</span>}
                </div>
                {episode.description && (
                  <p className="episode-description">
                    {episode.description.length > 150
                      ? `${episode.description.slice(0, 150)}...`
                      : episode.description}
                  </p>
                )}
                {episode.genres && (
                  <p className="episode-genres">{episode.genres}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EpisodeSelector;
