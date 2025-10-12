import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://designflow-master.preview.emergentagent.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens (if needed in future)
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Projects
  getProjects: () => api.get('/projects'),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (projectId, data) => api.put(`/projects/${projectId}`, data),
  
  // Rooms
  getRooms: (projectId) => api.get(`/projects/${projectId}/rooms`),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  createRoom: (data) => api.post('/rooms', data),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  
  // Items
  createItem: (data) => api.post('/items', data),
  updateItem: (itemId, data) => api.put(`/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/items/${itemId}`),
  
  // Photos
  uploadPhoto: async (projectId, roomId, photoData) => {
    try {
      return await api.post('/photos/upload', {
        project_id: projectId,
        room_id: roomId,
        photo_data: photoData.base64,
        file_name: photoData.fileName,
        metadata: photoData.metadata || {},
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  },
  
  getPhotosByRoom: (projectId, roomId) => 
    api.get(`/photos/by-room/${projectId}/${roomId}`),
  
  deletePhoto: (photoId) => api.delete(`/photos/${photoId}`),
  
  // Measurements (Leica D5)
  saveMeasurement: (data) => api.post('/measurements', data),
  getMeasurements: (projectId, roomId) => 
    api.get(`/measurements/${projectId}/${roomId}`),
};

export default apiService;