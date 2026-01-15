import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { media, getPosterUrl } from '../services/api';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchMedia = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        setShowResults(false);
        return;
      }

      if (query.trim().length < 2) {
        return;
      }

      setLoading(true);
      try {
        const response = await media.getAll({ search: query, limit: 10 });
        setResults(response.data.media || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMedia, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (mediaItem) => {
    setQuery('');
    setShowResults(false);
    navigate(`/watch/${mediaItem.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      navigate(`/browse?search=${encodeURIComponent(query)}`);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query.trim() || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index}>{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search movies, TV shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
            onKeyDown={handleKeyDown}
            className="search-input"
            autoComplete="off"
          />
          {loading && (
            <div className="search-loading">
              <div className="spinner-small"></div>
            </div>
          )}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
              className="search-clear"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="search-results">
          <div className="search-results-header">
            <span>Search Results</span>
            <button
              onClick={() => navigate(`/browse?search=${encodeURIComponent(query)}`)}
              className="view-all-btn"
            >
              View All
            </button>
          </div>
          <div className="search-results-list">
            {results.map((item) => (
              <div
                key={item.id}
                className="search-result-item"
                onClick={() => handleResultClick(item)}
              >
                {item.poster_path && (
                  <img
                    src={getPosterUrl(item.poster_path)}
                    alt={item.title}
                    className="search-result-poster"
                  />
                )}
                <div className="search-result-info">
                  <h4 className="search-result-title">
                    {highlightMatch(item.title, query)}
                  </h4>
                  <div className="search-result-meta">
                    <span className="search-result-type">{item.type}</span>
                    {item.year && (
                      <>
                        <span className="search-result-separator">•</span>
                        <span className="search-result-year">{item.year}</span>
                      </>
                    )}
                    {item.genres && (
                      <>
                        <span className="search-result-separator">•</span>
                        <span className="search-result-genres">
                          {item.genres.split(',').slice(0, 2).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="search-results">
          <div className="search-no-results">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <h3>No results found</h3>
            <p>Try searching with different keywords</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
