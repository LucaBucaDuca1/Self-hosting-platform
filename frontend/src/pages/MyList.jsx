import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profile as profileApi } from '../services/api';
import { MediaCard } from '../components/MediaCard';
import { SkeletonCard } from '../components/SkeletonCard';

const MyList = () => {
  const { currentProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyList();
  }, [currentProfile]);

  const loadMyList = async () => {
    setLoading(true);
    try {
      const response = await profileApi.getMyList(currentProfile.id);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load my list:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container browse-page">
      <div className="browse-header fade-in">
        <h1>My List</h1>
        {!loading && items.length > 0 && (
          <p className="results-count">{items.length} {items.length === 1 ? 'title' : 'titles'} saved</p>
        )}
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
              inList={true}
              onListUpdate={loadMyList}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state fade-in">
          <h2>Your list is empty</h2>
          <p>Add movies and shows to your list to watch them later</p>
        </div>
      )}
    </div>
  );
};

export default MyList;
