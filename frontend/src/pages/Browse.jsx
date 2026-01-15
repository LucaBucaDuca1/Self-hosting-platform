import React, { useState, useEffect } from 'react';
import { media } from '../services/api';
import MediaCard from '../components/MediaCard';
import './Browse.css';

const Browse = ({ type }) => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [type, search, genre, year]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = { type, search, genre, year };
      const response = await media.getAll(params);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="page-container browse-page">
      <div className="browse-header">
        <h1>{type === 'movie' ? 'Movies' : 'TV Shows'}</h1>

        <div className="browse-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </form>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="filter-select"
          >
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Documentary">Documentary</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option value="">All Years</option>
            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ margin: '100px auto' }}></div>
      ) : items.length > 0 ? (
        <div className="content-grid">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onListUpdate={loadMedia}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No {type === 'movie' ? 'movies' : 'TV shows'} found</h2>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default Browse;
