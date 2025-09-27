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
  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={<StudioLandingPage />}
            />
            <Route 
              path="/studio" 
              element={<StudioLandingPage />}
            />
            <Route 
              path="/customer" 
              element={<CustomerLandingPage />}
            />
            <Route 
              path="/customer/questionnaire" 
              element={<CustomerfacingQuestionnaire />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;