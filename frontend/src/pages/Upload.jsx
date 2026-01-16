import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { media } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Upload.css';

const Upload = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef(null);

  const [batchSettings, setBatchSettings] = useState({
    type: 'episode',
    seriesTitle: '',
    year: new Date().getFullYear(),
    genres: '',
    description: ''
  });

  useEffect(() => {
    loadUploadedMedia();

    // Check if edit parameter exists
    const editId = searchParams.get('edit');
    if (editId) {
      loadMediaForEdit(editId);
    }
  }, [searchParams]);

  const loadMediaForEdit = async (mediaId) => {
    try {
      const response = await media.getById(mediaId);
      setEditingMedia({
        ...response.data,
        genres: response.data.genres || '',
        description: response.data.description || ''
      });
      setShowEditModal(true);
      // Remove edit parameter from URL
      setSearchParams({});
    } catch (error) {
      console.error('Failed to load media for editing:', error);
      alert('Failed to load media for editing');
    }
  };

  const loadUploadedMedia = async () => {
    try {
      setLoading(true);
      const response = await media.getAll({ sort: 'recent' });
      const mediaData = response.data.media || response.data || [];
      setUploadedMedia(mediaData);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractMetadata = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Try to match S01E01 or 1x01 pattern
    const episodeMatch = nameWithoutExt.match(/S(\d+)E(\d+)|(\d+)x(\d+)/i);

    // Try to match year (YYYY)
    const yearMatch = nameWithoutExt.match(/[(\[]?(19|20)\d{2}[)\]]?/);

    // Extract title (everything before season/episode or year)
    let title = nameWithoutExt;
    if (episodeMatch) {
      title = nameWithoutExt.substring(0, episodeMatch.index).trim();
    } else if (yearMatch) {
      title = nameWithoutExt.substring(0, yearMatch.index).trim();
    }

    // Clean up title
    title = title.replace(/[._-]/g, ' ').trim();

    return {
      title: title || 'Untitled',
      season: episodeMatch ? parseInt(episodeMatch[1] || episodeMatch[3]) : null,
      episode: episodeMatch ? parseInt(episodeMatch[2] || episodeMatch[4]) : null,
      year: yearMatch ? parseInt(yearMatch[0].replace(/[(\[\])]/g, '')) : null,
      type: episodeMatch ? 'episode' : 'movie'
    };
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset the input value so the same files can be selected again
      e.target.value = '';
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const newQueue = fileArray.map((file, index) => {
      const metadata = extractMetadata(file.name);
      return {
        id: Date.now() + index,
        file,
        filename: file.name,
        ...metadata,
        type: metadata.type || batchSettings.type,
        seriesTitle: batchSettings.seriesTitle || metadata.title,
        year: metadata.year || batchSettings.year,
        genres: batchSettings.genres,
        description: batchSettings.description,
        status: 'pending',
        progress: 0,
        error: null
      };
    });

    setUploadQueue([...uploadQueue, ...newQueue]);
  };

  const updateQueueItem = (id, updates) => {
    setUploadQueue(queue =>
      queue.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeFromQueue = (id) => {
    setUploadQueue(queue => queue.filter(item => item.id !== id));
  };

  const uploadFile = async (queueItem) => {
    updateQueueItem(queueItem.id, { status: 'uploading', progress: 0 });

    try {
      const data = new FormData();
      data.append('video', queueItem.file);
      data.append('title', queueItem.title);
      data.append('type', queueItem.type);
      if (queueItem.seriesTitle) data.append('seriesTitle', queueItem.seriesTitle);
      if (queueItem.year) data.append('year', queueItem.year);
      if (queueItem.season) data.append('season', queueItem.season);
      if (queueItem.episode) data.append('episode', queueItem.episode);
      if (queueItem.genres) data.append('genres', queueItem.genres);
      if (queueItem.description) data.append('description', queueItem.description);

      const response = await media.upload(data, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        updateQueueItem(queueItem.id, { progress: percentCompleted });

        // When upload reaches 100%, show converting status
        if (percentCompleted === 100) {
          updateQueueItem(queueItem.id, { status: 'converting' });
        }
      });

      updateQueueItem(queueItem.id, { status: 'completed', progress: 100 });

      // Reload media list
      loadUploadedMedia();

      // Remove from queue after 2 seconds
      setTimeout(() => removeFromQueue(queueItem.id), 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      updateQueueItem(queueItem.id, {
        status: 'failed',
        error: error.response?.data?.error || error.message
      });
    }
  };

  const uploadAll = async () => {
    const pendingItems = uploadQueue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
      await uploadFile(item);
    }
  };

  const handleEdit = (mediaItem) => {
    setEditingMedia({
      ...mediaItem,
      genres: mediaItem.genres || '',
      description: mediaItem.description || '',
      year: mediaItem.year || '',
      season: mediaItem.season || '',
      episode: mediaItem.episode || ''
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      await media.update(editingMedia.id, {
        title: editingMedia.title,
        type: editingMedia.type,
        year: editingMedia.year || null,
        season: editingMedia.season || null,
        episode: editingMedia.episode || null,
        genres: editingMedia.genres,
        description: editingMedia.description
      });

      setShowEditModal(false);
      setEditingMedia(null);
      loadUploadedMedia();
    } catch (error) {
      alert('Failed to update: ' + (error.response?.data?.error || error.message));
    }
  };

  const organizeBySeasons = () => {
    const shows = {};

    uploadedMedia.forEach(item => {
      if (item.type === 'episode' && item.season) {
        const showTitle = item.title;
        if (!shows[showTitle]) {
          shows[showTitle] = {};
        }
        const seasonKey = `S${String(item.season).padStart(2, '0')}`;
        if (!shows[showTitle][seasonKey]) {
          shows[showTitle][seasonKey] = [];
        }
        shows[showTitle][seasonKey].push(item);
      }
    });

    // Sort episodes within seasons
    Object.keys(shows).forEach(showTitle => {
      Object.keys(shows[showTitle]).forEach(season => {
        shows[showTitle][season].sort((a, b) => (a.episode || 0) - (b.episode || 0));
      });
    });

    return shows;
  };

  const organizedShows = organizeBySeasons();
  const movies = uploadedMedia.filter(item => item.type === 'movie');

  return (
    <div className="page-container upload-page">
      <div className="upload-header">
        <h1>Upload & Manage Content</h1>
        <p>Add multiple files at once - seasons and episodes are auto-detected</p>
      </div>

      {/* Batch Settings */}
      <div className="batch-settings">
        <h3>Batch Settings (applied to all uploads)</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Default Type</label>
            <select
              value={batchSettings.type}
              onChange={(e) => setBatchSettings({ ...batchSettings, type: e.target.value })}
              className="form-input"
            >
              <option value="movie">Movie</option>
              <option value="series">TV Series</option>
              <option value="episode">TV Episode</option>
            </select>
          </div>

          {batchSettings.type === 'episode' && (
            <div className="form-group">
              <label>Series/Show Title <span style={{ color: 'var(--primary)' }}>*</span></label>
              <input
                type="text"
                value={batchSettings.seriesTitle}
                onChange={(e) => setBatchSettings({ ...batchSettings, seriesTitle: e.target.value })}
                placeholder="e.g., Breaking Bad"
                className="form-input"
              />
              <small style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                All episodes will be grouped under this show
              </small>
            </div>
          )}

          <div className="form-group">
            <label>Default Year</label>
            <input
              type="number"
              value={batchSettings.year}
              onChange={(e) => setBatchSettings({ ...batchSettings, year: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Genres</label>
            <input
              type="text"
              value={batchSettings.genres}
              onChange={(e) => setBatchSettings({ ...batchSettings, genres: e.target.value })}
              placeholder="e.g., Action, Sci-Fi"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={batchSettings.description}
            onChange={(e) => setBatchSettings({ ...batchSettings, description: e.target.value })}
            placeholder="Optional description for all files"
            rows="2"
            className="form-input"
          />
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`drop-zone-large ${dragActive ? 'active' : ''}`}
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
          multiple
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <svg className="upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
        </svg>
        <h3>Drop Multiple Videos Here</h3>
        <p>or click to select files</p>
        <p className="upload-hint">Auto-detects: Season 1 Episode 2 from "ShowName.S01E02.mp4"</p>
        <p className="upload-hint">Supports: MP4, MKV, AVI, MOV, WebM • Max 10GB per file</p>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <h2>Upload Queue ({uploadQueue.length} files)</h2>
            <button
              className="btn btn-primary"
              onClick={uploadAll}
              disabled={uploadQueue.every(item => item.status !== 'pending')}
            >
              Upload All
            </button>
          </div>

          <div className="queue-list">
            {uploadQueue.map((item) => (
              <div key={item.id} className={`queue-item ${item.status}`}>
                <div className="queue-item-info">
                  <h4>{item.title}</h4>
                  <p className="queue-item-details">
                    {item.type === 'episode' && item.season && item.episode && (
                      <span className="badge">S{String(item.season).padStart(2, '0')}E{String(item.episode).padStart(2, '0')}</span>
                    )}
                    <span>{item.filename}</span>
                  </p>
                </div>

                <div className="queue-item-status">
                  {item.status === 'pending' && (
                    <>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                        className="inline-edit"
                        placeholder="Title"
                      />
                      <button
                        className="btn-icon btn-small"
                        onClick={() => uploadFile(item)}
                        title="Upload Now"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-small btn-delete"
                        onClick={() => removeFromQueue(item.id)}
                        title="Remove"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </>
                  )}

                  {item.status === 'uploading' && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                      <span className="progress-text">{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'converting' && (
                    <div className="status-badge processing">
                      <div className="spinner-small"></div>
                      <span>Converting to MP4... (check server logs for progress)</span>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <span className="status-badge success">✓ Uploaded</span>
                  )}

                  {item.status === 'failed' && (
                    <>
                      <span className="status-badge error">✗ Failed</span>
                      <button
                        className="btn-icon btn-small"
                        onClick={() => uploadFile(item)}
                        title="Retry"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Content - Organized by Show/Season */}
      {!loading && (
        <div className="uploaded-content">
          <h2>Manage Uploaded Content</h2>

          {/* TV Shows organized by season */}
          {Object.keys(organizedShows).length > 0 && (
            <div className="shows-section">
              <h3>TV Shows</h3>
              {Object.keys(organizedShows).sort().map(showTitle => (
                <div key={showTitle} className="show-group">
                  <h4>{showTitle}</h4>
                  {Object.keys(organizedShows[showTitle]).sort().map(season => (
                    <div key={season} className="season-group">
                      <div className="season-header">
                        <h5>{season} ({organizedShows[showTitle][season].length} episodes)</h5>
                      </div>
                      <div className="episodes-list">
                        {organizedShows[showTitle][season].map(episode => (
                          <div key={episode.id} className="episode-item">
                            <span className="episode-number">
                              E{String(episode.episode).padStart(2, '0')}
                            </span>
                            <span className="episode-title">{episode.title}</span>
                            {isAdmin && (
                              <button
                                className="btn-icon btn-small"
                                onClick={() => handleEdit(episode)}
                                title="Edit"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Movies */}
          {movies.length > 0 && (
            <div className="movies-section">
              <h3>Movies ({movies.length})</h3>
              <div className="movies-list">
                {movies.map(movie => (
                  <div key={movie.id} className="movie-item">
                    <span className="movie-title">{movie.title}</span>
                    {movie.year && <span className="movie-year">({movie.year})</span>}
                    {isAdmin && (
                      <button
                        className="btn-icon btn-small"
                        onClick={() => handleEdit(movie)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMedia && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Content</h2>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editingMedia.title}
                onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={editingMedia.type}
                  onChange={(e) => setEditingMedia({ ...editingMedia, type: e.target.value })}
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
                  value={editingMedia.year}
                  onChange={(e) => setEditingMedia({ ...editingMedia, year: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {editingMedia.type === 'episode' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Season</label>
                  <input
                    type="number"
                    value={editingMedia.season}
                    onChange={(e) => setEditingMedia({ ...editingMedia, season: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Episode</label>
                  <input
                    type="number"
                    value={editingMedia.episode}
                    onChange={(e) => setEditingMedia({ ...editingMedia, episode: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Genres</label>
              <input
                type="text"
                value={editingMedia.genres}
                onChange={(e) => setEditingMedia({ ...editingMedia, genres: e.target.value })}
                placeholder="e.g., Action, Sci-Fi"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editingMedia.description}
                onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                rows="4"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Subtitles</label>
              <div className="subtitle-section">
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Language (e.g., English, Spanish)"
                      id="subtitle-language"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="file"
                      accept=".srt,.vtt,.ass,.ssa"
                      id="subtitle-file"
                      className="form-input"
                      style={{ padding: '10px' }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    const langInput = document.getElementById('subtitle-language');
                    const fileInput = document.getElementById('subtitle-file');

                    if (!langInput.value || !fileInput.files[0]) {
                      alert('Please provide both language and subtitle file');
                      return;
                    }

                    const formData = new FormData();
                    formData.append('subtitle', fileInput.files[0]);
                    formData.append('mediaId', editingMedia.id);
                    formData.append('language', langInput.value);
                    formData.append('label', langInput.value);

                    try {
                      await api.post('/media/upload-subtitle', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      alert('Subtitle uploaded successfully!');
                      langInput.value = '';
                      fileInput.value = '';
                    } catch (error) {
                      alert('Failed to upload subtitle: ' + error.message);
                    }
                  }}
                >
                  Upload Subtitle
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
