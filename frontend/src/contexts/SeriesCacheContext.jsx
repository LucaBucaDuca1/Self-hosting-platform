import React, { createContext, useContext, useState, useCallback } from 'react';
import { media } from '../services/api';

const SeriesCacheContext = createContext();

export const useSeriesCache = () => {
  const context = useContext(SeriesCacheContext);
  if (!context) {
    throw new Error('useSeriesCache must be used within SeriesCacheProvider');
  }
  return context;
};

export const SeriesCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});

  const getSeriesEpisodes = useCallback(async (seriesId) => {
    // Return cached data if available
    if (cache[seriesId]) {
      return cache[seriesId];
    }

    // If already loading, wait for it
    if (loading[seriesId]) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (cache[seriesId]) {
            clearInterval(checkInterval);
            resolve(cache[seriesId]);
          }
        }, 100);
      });
    }

    // Mark as loading
    setLoading(prev => ({ ...prev, [seriesId]: true }));

    try {
      const response = await media.getById(seriesId);
      const episodes = response.data.episodes || [];

      // Cache the result
      setCache(prev => ({ ...prev, [seriesId]: episodes }));
      setLoading(prev => ({ ...prev, [seriesId]: false }));

      return episodes;
    } catch (error) {
      setLoading(prev => ({ ...prev, [seriesId]: false }));
      throw error;
    }
  }, [cache, loading]);

  const clearCache = useCallback((seriesId) => {
    if (seriesId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[seriesId];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  const value = {
    getSeriesEpisodes,
    clearCache,
    isLoading: (seriesId) => loading[seriesId] || false,
    isCached: (seriesId) => !!cache[seriesId]
  };

  return (
    <SeriesCacheContext.Provider value={value}>
      {children}
    </SeriesCacheContext.Provider>
  );
};
