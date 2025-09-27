import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

// Import components
import StudioLandingPage from "./components/StudioLandingPage";
import CustomerLandingPage from "./components/CustomerLandingPage";
import CustomerfacingQuestionnaire from "./components/CustomerfacingQuestionnaire";
import ProjectList from "./components/ProjectList";
import ProjectDetailPage from "./components/ProjectDetailPage";
import WalkthroughDashboard from "./components/WalkthroughDashboard";
import ChecklistDashboard from "./components/ChecklistDashboard";
import FFEDashboard from "./components/FFEDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// API functions for other components to use
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

const App = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        <Routes>
          {/* Studio Routes */}
          <Route 
            path="/" 
            element={<ProjectList onSelectProject={setCurrentProject} isOffline={isOffline} />}
          />
          <Route 
            path="/studio" 
            element={<ProjectList onSelectProject={setCurrentProject} isOffline={isOffline} />}
          />
          <Route 
            path="/projects" 
            element={<ProjectList onSelectProject={setCurrentProject} isOffline={isOffline} />}
          />
          
          {/* Project Detail Routes */}
          <Route 
            path="/project/:projectId" 
            element={<ProjectDetailPage />}
          />
          <Route 
            path="/project/:projectId/detail" 
            element={<ProjectDetailPage />}
          />
          
          {/* Workflow Routes */}
          <Route 
            path="/project/:projectId/walkthrough" 
            element={<WalkthroughDashboard isOffline={isOffline} />}
          />
          <Route 
            path="/project/:projectId/checklist" 
            element={<ChecklistDashboard isOffline={isOffline} />}
          />
          <Route 
            path="/project/:projectId/ffe" 
            element={<FFEDashboard isOffline={isOffline} />}
          />
          
          {/* Customer Routes */}
          <Route 
            path="/customer" 
            element={<CustomerLandingPage />}
          />
          <Route 
            path="/customer/questionnaire" 
            element={<CustomerfacingQuestionnaire />}
          />
          <Route 
            path="/questionnaire" 
            element={<CustomerfacingQuestionnaire />}
          />
          
          {/* Legacy Studio Search (for Houzz integration) */}
          <Route 
            path="/studio-search" 
            element={<StudioLandingPage />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;