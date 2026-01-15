import React from 'react';
import { MediaCard } from './MediaCard';
import { SkeletonCard } from './SkeletonCard';
import './ContentRow.css';

export const ContentRow = ({ title, items, loading = false, emptyMessage, onDelete }) => {
  if (loading) {
    return (
      <div className="content-row fade-in">
        <div className="skeleton-row-title"></div>
        <div className="content-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    if (emptyMessage) {
      return (
        <div className="content-row fade-in">
          <h2>{title}</h2>
          <div className="empty-row-message">
            <p>{emptyMessage}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="content-row fade-in">
      <h2>{title}</h2>
      <div className="content-grid">
        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            media={item}
            style={{ animationDelay: `${index * 0.05}s` }}
            progress={item.progress}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
