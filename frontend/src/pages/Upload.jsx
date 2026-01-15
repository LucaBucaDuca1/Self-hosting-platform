import React, { useState, useRef } from 'react';
import { media } from '../services/api';
import './Upload.css';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    year: '',
    description: '',
    genres: '',
    season: '',
    episode: ''
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const file = files[0];

    if (!file) return;

    // Auto-fill title from filename if empty
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const titleMatch = nameWithoutExt.match(/^(.*?)(?:\s*\d{4}|\s*S\d+E\d+)?/i);
      if (titleMatch) {
        setFormData(prev => ({ ...prev, title: titleMatch[1].trim() }));
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const data = new FormData();
      data.append('video', file);
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      const response = await media.upload(data, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      setUploadedFiles([...uploadedFiles, { ...response.data, filename: file.name }]);

      // Reset form
      setFormData({
        title: '',
        type: 'movie',
        year: '',
        description: '',
        genres: '',
        season: '',
        episode: ''
      });
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="page-container upload-page">
      <h1>Upload Content</h1>

      <div className="upload-container">
        <div className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Auto-filled from filename or enter manually"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="movie">Movie</option>
                <option value="series">TV Series</option>
                <option value="episode">TV Episode</option>
              </select>
            </div>

            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="e.g., 2024"
                className="form-input"
              />
            </div>
          </div>

          {formData.type === 'episode' && (
            <div className="form-row">
              <div className="form-group">
                <label>Season</label>
                <input
                  type="number"
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                  placeholder="e.g., 1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Episode</label>
                <input
                  type="number"
                  name="episode"
                  value={formData.episode}
                  onChange={handleInputChange}
                  placeholder="e.g., 1"
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Genres (comma-separated)</label>
            <input
              type="text"
              name="genres"
              value={formData.genres}
              onChange={handleInputChange}
              placeholder="e.g., Action, Adventure, Sci-Fi"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the content"
              rows="4"
              className="form-input"
            />
          </div>
        </div>

        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p>{uploadProgress}% uploaded</p>
            </div>
          ) : (
            <>
              <svg className="upload-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
              <h3>Drag & Drop Video Here</h3>
              <p>or click to browse</p>
              <p className="upload-hint">Supports: MP4, MKV, AVI, MOV, WebM</p>
              <p className="upload-hint">Max size: 10GB</p>
            </>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h2>Recently Uploaded</h2>
          <div className="uploaded-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="uploaded-item">
                <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <div>
                  <h4>{file.title}</h4>
                  <p>{file.filename}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
