import axios from 'axios';

// Dynamic API URL configuration
// When accessed from external devices, connect directly to backend server
// When accessed locally, use Vite proxy for development
const getApiBaseUrl = () => {
  // In production or when accessing from external device
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development: check if accessing from external device
  const hostname = window.location.hostname;

  // If accessing via IP address (not localhost), connect directly to backend
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Use same hostname but port 5000 (backend port)
    return `http://${hostname}:5000/api`;
  }

  // If on localhost, use Vite proxy
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getProfiles: () => api.get('/auth/profiles'),
  createProfile: (data) => api.post('/auth/profiles', data),
  getSessions: () => api.get('/auth/sessions'),
  logoutDevice: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  logoutAll: () => api.post('/auth/logout-all')
};

// Media endpoints
export const media = {
  getAll: (params) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  upload: (formData, onProgress) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  uploadImage: (formData, type) => api.post(`/media/upload-image?type=${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
  getRecent: () => api.get('/media/featured/recent'),
  getTrending: () => api.get('/media/featured/trending'),
  getRecommended: (profileId) => api.get(`/media/recommended/${profileId}`)
};

// Profile endpoints
export const profile = {
  getContinueWatching: (profileId) => api.get(`/profile/${profileId}/continue-watching`),
  getMyList: (profileId) => api.get(`/profile/${profileId}/my-list`),
  addToMyList: (profileId, mediaId) => api.post(`/profile/${profileId}/my-list/${mediaId}`),
  removeFromMyList: (profileId, mediaId) => api.delete(`/profile/${profileId}/my-list/${mediaId}`),
  checkInMyList: (profileId, mediaId) => api.get(`/profile/${profileId}/my-list/${mediaId}/check`),
  updateWatchProgress: (profileId, mediaId, data) => api.post(`/profile/${profileId}/watch-progress/${mediaId}`, data),
  getWatchProgress: (profileId, mediaId) => api.get(`/profile/${profileId}/watch-progress/${mediaId}`)
};

// Collections endpoints
export const collections = {
  getAll: () => api.get('/collections'),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
  addItem: (collectionId, mediaId, sortOrder = 0) =>
    api.post(`/collections/${collectionId}/items`, { mediaId, sortOrder }),
  removeItem: (collectionId, mediaId) =>
    api.delete(`/collections/${collectionId}/items/${mediaId}`)
};

// Stream endpoints
export const getStreamUrl = (mediaId) => {
  const token = localStorage.getItem('token');
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/stream/video/${mediaId}${token ? `?token=${token}` : ''}`;
};
export const getPosterUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/stream/poster/${filename}`;
};
export const getBackgroundUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/stream/background/${filename}`;
};

export default api;
