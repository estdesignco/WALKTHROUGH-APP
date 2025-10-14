import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import FFEDashboard from "./components/FFEDashboard";
import ProjectList from "./components/ProjectList";
import Navigation from "./components/Navigation";
import ScrapingTestPage from "./components/ScrapingTestPage";
import QuestionnaireSheet from "./components/QuestionnaireSheet";
import WalkthroughDashboard from "./components/WalkthroughDashboard";
import ChecklistDashboard from "./components/ChecklistDashboard";
import StudioLandingPage from "./components/StudioLandingPage";
import ComprehensiveQuestionnaire from "./components/ComprehensiveQuestionnaire";
import ProjectDetailPage from "./components/ProjectDetailPage";
import CustomerfacingLandingPage from './components/CustomerfacingLandingPage';
import CustomerLandingPage from './components/CustomerLandingPage';
import CustomerfacingQuestionnaire from './components/CustomerfacingQuestionnaire';
import CustomerfacingProjectDetailPage from './components/CustomerfacingProjectDetailPage';
import AdvancedFeaturesDashboard from './components/AdvancedFeaturesDashboard';
import EmailPreview from './components/EmailPreview';
import CompleteFurnitureSearch from './components/CompleteFurnitureSearch';
import FurnitureSearchPage from './components/FurnitureSearchPage';
import UnifiedFurnitureSearch from './components/UnifiedFurnitureSearch';
import WorkflowDashboard from './components/WorkflowDashboard';
import MainDashboard from './components/MainDashboard';
import ActualStudioLandingPage from './components/ActualStudioLandingPage';
import SimpleDashboard from './components/SimpleDashboard';
import BeautifulDashboard from './components/BeautifulDashboard';
import CorrectDashboard from './components/CorrectDashboard';
import ActualDashboard from './components/ActualDashboard';
import FinalDashboard from './components/FinalDashboard';
import ExactDashboard from './components/ExactDashboard';
import PerfectDashboard from './components/PerfectDashboard';
import MobileAppSimulator from './components/MobileAppSimulator';
import CanvaCallbackHandler from './components/CanvaCallbackHandler';

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

  // Component wrapper to handle project loading for direct FF&E navigation
  const FFEDashboardWrapper = () => {
    const location = useLocation();
    const [projectLoaded, setProjectLoaded] = useState(false);

    useEffect(() => {
      // Extract projectId from current path
      const pathMatch = location.pathname.match(/\/project\/([^\/]+)\/ffe/);
      const projectId = pathMatch ? pathMatch[1] : null;

      if (projectId && !currentProject) {
        // Load project data for navigation context
        const loadProject = async () => {
          try {
            const response = await projectAPI.getById(projectId);
            if (response.data) {
              setCurrentProject(response.data);
              setProjectLoaded(true);
            }
          } catch (error) {
            console.error('Failed to load project for navigation:', error);
            setProjectLoaded(true); // Still proceed even if project load fails
          }
        };
        loadProject();
      } else {
        setProjectLoaded(true);
      }
    }, [location.pathname]);

    // Show loading state while project is being loaded
    if (!projectLoaded) {
      return (
        <div className="text-center text-gray-400 py-8">
          <p className="text-lg">Loading project...</p>
        </div>
      );
    }

    return <FFEDashboard isOffline={isOffline} />;
  };

  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        {/* Mobile app gets full screen without navigation */}
        <Routes>
          <Route 
            path="/mobile-app" 
            element={<MobileAppSimulator />}
          />
          <Route 
            path="*" 
            element={
              <>
                <Navigation 
                  currentProject={currentProject} 
                  isOffline={isOffline}
                />
                
                <main className="container mx-auto px-4 py-6">
                  <Routes>
                    <Route 
                      path="/" 
                      element={<MainDashboard />}
                    />
                    <Route 
                      path="/canva/callback" 
                      element={<CanvaCallbackHandler />}
                    />
                    <Route 
                      path="/studio" 
                      element={<StudioLandingPage />}
                    />
                    <Route 
                      path="/customer/questionnaire" 
                      element={<CustomerfacingQuestionnaire />}
                    />
                    <Route 
                      path="/customer" 
                      element={<CustomerLandingPage />}
                    />
                    <Route 
                      path="/projects" 
                      element={
                        <ProjectList 
                          onSelectProject={setCurrentProject}
                          isOffline={isOffline}
                        />
                      }
                    />
                    <Route 
                      path="/questionnaire/new" 
                      element={<ComprehensiveQuestionnaire />}
                    />
                    <Route 
                      path="/questionnaire/demo" 
                      element={<ComprehensiveQuestionnaire />}
                    />
                    <Route 
                      path="/questionnaire/:clientEmail" 
                      element={<ComprehensiveQuestionnaire />}
                    />
                    {/* IMPORTANT: More specific routes MUST come before less specific ones */}
                    <Route 
                      path="/project/:projectId/questionnaire" 
                      element={<QuestionnaireSheet />}
                    />
                    <Route 
                      path="/project/:projectId/walkthrough" 
                      element={<WalkthroughDashboard isOffline={isOffline} />}
                    />
                    <Route 
                      path="/walkthrough/:projectId" 
                      element={<WalkthroughDashboard isOffline={isOffline} />}
                    />
                    <Route 
                      path="/project/:projectId/checklist" 
                      element={<ChecklistDashboard isOffline={isOffline} />}
                    />
                    <Route 
                      path="/checklist/:projectId" 
                      element={<ChecklistDashboard isOffline={isOffline} />}
                    />
                    <Route 
                      path="/project/:projectId/ffe" 
                      element={<FFEDashboardWrapper />}
                    />
                    <Route 
                      path="/ffe/:projectId" 
                      element={<FFEDashboard isOffline={isOffline} />}
                    />
                    {/* Generic project detail route - MUST be AFTER specific routes */}
                    <Route 
                      path="/project/:projectId" 
                      element={<ProjectDetailPage />}
                    />
                    <Route 
                      path="/scraping-test" 
                      element={<ScrapingTestPage />}
                    />
                    <Route 
                      path="/advanced-features" 
                      element={<AdvancedFeaturesDashboard />}
                    />
                    <Route 
                      path="/email-preview" 
                      element={<EmailPreview />}
                    />
                    <Route 
                      path="/furniture-search" 
                      element={<UnifiedFurnitureSearch currentProject={currentProject} />}
                    />
                    <Route 
                      path="/furniture-catalog" 
                      element={<UnifiedFurnitureSearch currentProject={currentProject} />}
                    />
                    <Route 
                      path="/workflow-dashboard" 
                      element={<WorkflowDashboard />}
                    />
                    {/* Customer-facing routes */}
                    <Route 
                      path="/customer/questionnaire" 
                      element={<CustomerfacingQuestionnaire />}
                    />
                    <Route 
                      path="/customer/project/:projectId" 
                      element={<CustomerfacingProjectDetailPage />}
                    />
                    <Route 
                      path="/questionnaire" 
                      element={<CustomerfacingQuestionnaire />}
                    />
                    <Route 
                      path="/project/:projectId/detail" 
                      element={<CustomerfacingProjectDetailPage />}
                    />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;