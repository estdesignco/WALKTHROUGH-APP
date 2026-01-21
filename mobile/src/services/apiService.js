import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Use environment variable or fallback
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://app.estdesignco.com/api';

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
  
  // Questionnaire
  getQuestionnaire: (projectId) => api.get(`/questionnaire/${projectId}`),
  
  // Contacts
  getContacts: (projectId) => api.get(`/contacts/project/${projectId}`),
  
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
  duplicateItem: async (itemData) => {
    // Create a duplicate with (Copy) suffix
    const duplicateData = {
      ...itemData,
      name: itemData.name ? `${itemData.name} (Copy)` : '',
      status: '', // Reset status for duplicates
    };
    return api.post('/items', duplicateData);
  },
  
  // ===============================
  // TO-DO LIST ENDPOINTS
  // ===============================
  getTodos: (projectId) => api.get(`/todos/project/${projectId}`),
  
  createTodo: (data) => api.post('/todos', data),
  
  updateTodo: (todoId, data) => api.put(`/todos/${todoId}`, data),
  
  deleteTodo: (todoId) => api.delete(`/todos/${todoId}`),
  
  // To-Do Comments
  addTodoComment: (todoId, comment) => 
    api.post(`/todos/${todoId}/comments`, comment),
  
  // ===============================
  // PUNCH LIST ENDPOINTS
  // ===============================
  getPunchList: (projectId) => api.get(`/punch-list/project/${projectId}`),
  
  createPunchItem: (data) => api.post('/punch-list', data),
  
  updatePunchItem: (itemId, data) => api.put(`/punch-list/${itemId}`, data),
  
  deletePunchItem: (itemId) => api.delete(`/punch-list/${itemId}`),
  
  // Punch List Comments
  addPunchItemComment: (itemId, comment) => 
    api.post(`/punch-list/${itemId}/comments`, comment),
  
  // ===============================
  // SAMPLES LIBRARY ENDPOINTS
  // ===============================
  getSamples: (projectId) => api.get(`/samples/project/${projectId}`),
  
  updateSample: (sampleId, data) => api.put(`/samples/${sampleId}`, data),
  
  // Sync samples from checklist items (based on finish_color and vendor)
  syncSamples: (projectId) => api.post(`/samples/sync/${projectId}`),
  
  // ===============================
  // PHOTOS ENDPOINTS
  // ===============================
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
  
  // ===============================
  // MEASUREMENTS (Leica D5)
  // ===============================
  saveMeasurement: (data) => api.post('/measurements', data),
  getMeasurements: (projectId, roomId) => 
    api.get(`/measurements/${projectId}/${roomId}`),
    
  // ===============================
  // FFE (Furniture, Fixtures & Equipment)
  // ===============================
  getFFEItems: (projectId) => api.get(`/ffe/project/${projectId}`),
  
  // ===============================
  // CALENDAR INTEGRATION
  // ===============================
  getCalendarEvents: (projectId) => api.get(`/calendar/events/${projectId}`),
  
  // ===============================
  // EMAIL
  // ===============================
  sendQuestionnaireEmail: (data) => api.post('/questionnaire/email', data),
};

export default apiService;
