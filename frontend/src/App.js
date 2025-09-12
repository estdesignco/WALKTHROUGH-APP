import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import FFEDashboard from "./components/FFEDashboard";
import ProjectList from "./components/ProjectList";
import Navigation from "./components/Navigation";
import ScrapingTestPage from "./components/ScrapingTestPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// API functions
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

export const roomAPI = {
  create: (data) => api.post('/rooms', data),
  getById: (id) => api.get(`/rooms/${id}`),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`)
};

export const categoryAPI = {
  create: (data) => api.post('/categories', data),
  getById: (id) => api.get(`/categories/${id}`),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const itemAPI = {
  create: (data) => api.post('/items', data),
  getById: (id) => api.get(`/items/${id}`),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
};

export const utilityAPI = {
  getRoomColors: () => api.get('/room-colors'),
  getCategoryColors: () => api.get('/category-colors'),
  getItemStatuses: () => api.get('/item-statuses'),
  getVendorTypes: () => api.get('/vendor-types'),
  getCarrierTypes: () => api.get('/carrier-types')
};

const App = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check online/offline status for jobsite work
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        <Navigation 
          currentProject={currentProject} 
          isOffline={isOffline}
        />
        
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProjectList 
                  onSelectProject={setCurrentProject}
                  isOffline={isOffline}
                />
              }
            />
            <Route 
              path="/project/:projectId/ffe" 
              element={
                <FFEDashboard 
                  isOffline={isOffline}
                />
              }
            />
            <Route 
              path="/scraping-test" 
              element={<ScrapingTestPage />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;