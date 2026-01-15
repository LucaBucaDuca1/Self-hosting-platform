import React, { useState, useEffect } from 'react';
import { media } from '../services/api';
import { MediaCard } from '../components/MediaCard';
import { SkeletonCard } from '../components/SkeletonCard';
import './Browse.css';

const Browse = ({ type }) => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [year, setYear] = useState('all');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [type, search, genre, year, sort]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = {
        type: type || 'all',
        search: search || undefined,
        genre: genre !== 'all' ? genre : undefined,
        year: year !== 'all' ? year : undefined,
        sort
      };
      const response = await media.getAll(params);
      // Handle both array response and object response with media array
      if (response.data.media) {
        setItems(response.data.media);
        setTotal(response.data.total || response.data.media.length);
      } else {
        setItems(response.data);
        setTotal(response.data.length);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="page-container browse-page">
      <div className="browse-header fade-in">
        <h1>
          {type === 'movie' ? 'Movies' : type === 'series' || type === 'episode' ? 'TV Shows' : 'Browse All'}
        </h1>
        {total > 0 && !loading && (
          <p className="results-count">{total} {total === 1 ? 'title' : 'titles'} found</p>
        )}

        <div className="browse-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search titles, descriptions, genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </form>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Recently Added</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="year-desc">Year (Newest)</option>
            <option value="year-asc">Year (Oldest)</option>
          </select>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Genres</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Documentary">Documentary</option>
            <option value="Animation">Animation</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Years</option>
            {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="content-grid fade-in">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="content-grid fade-in">
          {items.map((item, index) => (
            <MediaCard
              key={item.id}
              media={item}
              onListUpdate={loadMedia}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state fade-in">
          <h2>No {type === 'movie' ? 'movies' : type ? 'TV shows' : 'content'} found</h2>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

export default Browse;
