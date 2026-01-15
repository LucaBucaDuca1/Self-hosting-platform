import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster"></div>
      <div className="skeleton-title"></div>
    </div>
  );
};

export const SkeletonRow = ({ count = 6 }) => {
  return (
    <div className="content-row">
      <div className="skeleton-row-title"></div>
      <div className="content-grid">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

export const SkeletonHero = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="skeleton-hero-title"></div>
        <div className="skeleton-hero-description"></div>
        <div className="skeleton-hero-description"></div>
        <div className="skeleton-hero-buttons">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};
