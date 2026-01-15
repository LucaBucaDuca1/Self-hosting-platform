import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProfileSelect.css';

const ProfileSelect = () => {
  const { profiles, selectProfile } = useAuth();
  const navigate = useNavigate();

  const handleSelectProfile = (profile) => {
    selectProfile(profile);
    navigate('/');
  };

  return (
    <div className="profile-select-page">
      <div className="profile-select-container">
        <h1>Who's watching?</h1>

        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="profile-card"
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="profile-avatar-large">
                {profile.name[0].toUpperCase()}
              </div>
              <p className="profile-card-name">{profile.name}</p>
            </div>
          ))}
        </div>

        <p className="profile-info">Crafted by Zeloz</p>
      </div>
    </div>
  );
};

export default ProfileSelect;
