import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profile as profileApi } from '../services/api';
import MediaCard from '../components/MediaCard';

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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container browse-page">
      <div className="browse-header">
        <h1>My List</h1>
      </div>

      {items.length > 0 ? (
        <div className="content-grid">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              inList={true}
              onListUpdate={loadMyList}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your list is empty</h2>
          <p>Add movies and shows to your list to watch them later</p>
        </div>
      )}
    </div>
  );
};

export default MyList;
