import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from 'sonner';
import SimpleLogin, { isAuthenticated, logout } from './components/SimpleLogin';
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
import EditQuestionnairePage from "./components/EditQuestionnairePage";

import CustomerfacingLandingPage from './components/CustomerfacingLandingPage';
import CustomerLandingPage from './components/CustomerLandingPage';
import CustomerfacingQuestionnaire from './components/CustomerfacingQuestionnaire';
import CustomerfacingProjectDetailPage from './components/CustomerfacingProjectDetailPage';
import QuestionnaireTestPage from './components/QuestionnaireTestPage';
import AdvancedFeaturesDashboard from './components/AdvancedFeaturesDashboard';
import EmailPreview from './components/EmailPreview';
import BuilderPortal from './components/BuilderPortal';
import TradePortal from './components/TradePortal';
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
import PowerFeaturesDashboard from './components/PowerFeaturesDashboard';
import MasterContactsPage from './components/MasterContactsPage';
import MasterMaterialsPage from './components/MasterMaterialsPage';
import MasterToDoList from './components/MasterToDoList';
import GlobalToDoModal from './components/GlobalToDoModal';
import CalculatorsPage from './components/CalculatorsPage';
// REMOVED: SourcingCatalog - too many missing images
import VendorMirror from './components/VendorMirror';
import AIDesignDashboard from './components/AIDesignDashboard';
import RoomRenderingStudio from './components/RoomRenderingStudio';
import DesignToolsHub from './components/DesignToolsHub';
import FurnitureLayoutPlanner from './components/FurnitureLayoutPlanner';
import ColorPaletteExtractor from './components/ColorPaletteExtractor';
import ARFurniturePreview from './components/ARFurniturePreview';
import LightingSimulator from './components/LightingSimulator';
import RoomScanner3D from './components/RoomScanner3D';
import PinterestIntegration from './components/PinterestIntegration';
import PaintCatalogPage from './components/PaintCatalogPage';

const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

// Ensure window.ENV is set for all components
if (!window.ENV) {
  window.ENV = { REACT_APP_BACKEND_URL: BACKEND_URL };
}

// VERIFY CONFIG
console.log('🌐 APP INITIALIZATION - BACKEND_URL:', BACKEND_URL);

// Create axios instance with default config - NO CACHING
console.log('🌐 API configured:', { BACKEND_URL, API });
const api = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Add request interceptor - ADD CACHE BUSTER TO ALL GET REQUESTS
api.interceptors.request.use(request => {
  // Add timestamp to prevent caching issues
  if (request.method === 'get') {
    request.params = request.params || {};
    request.params._t = Date.now();
  }
  console.log('🚀 API Request:', request.method.toUpperCase(), request.url);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

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
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [showGlobalTodo, setShowGlobalTodo] = useState(false);

  // Auto-redirect mobile/tablet to mobile app - fires on mount AND after login
  useEffect(() => {
    const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || 
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const isOnMobilePage = window.location.pathname.startsWith('/mobile-app');
    const isCustomerPage = window.location.pathname.startsWith('/customer');
    if (isMobile && !isOnMobilePage && !isCustomerPage) {
      window.location.href = '/mobile-app';
    }
  }, [authenticated]);

  // Global keyboard shortcut for To-Do (Ctrl/Cmd + T)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setShowGlobalTodo(prev => !prev);
      }
      // Escape to close
      if (e.key === 'Escape' && showGlobalTodo) {
        setShowGlobalTodo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGlobalTodo]);

  // Expose global function to open To-Do from anywhere
  useEffect(() => {
    window.openGlobalTodo = () => setShowGlobalTodo(true);
    return () => { delete window.openGlobalTodo; };
  }, []);

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
      {/* GLOBAL TO-DO MODAL - Available from ANY page */}
      <GlobalToDoModal 
        isOpen={showGlobalTodo} 
        onClose={() => setShowGlobalTodo(false)} 
      />
      
      <BrowserRouter>
        {/* Public Routes - Customer-facing pages (NO LOGIN REQUIRED) */}
        <Routes>
          <Route 
            path="/customer/questionnaire" 
            element={<CustomerfacingQuestionnaire />}
          />
          <Route 
            path="/test-questionnaire" 
            element={<QuestionnaireTestPage />}
          />
          <Route 
            path="/customer" 
            element={<CustomerLandingPage />}
          />
          <Route 
            path="/customer/project/:projectId" 
            element={<CustomerfacingProjectDetailPage />}
          />
          <Route 
            path="/builder/:accessCode" 
            element={<BuilderPortal />}
          />
          <Route 
            path="/trade/:accessCode" 
            element={<TradePortal />}
          />
          
          {/* Protected Routes - Require Login */}
          <Route 
            path="*" 
            element={
              !authenticated ? (
                <SimpleLogin onLogin={() => setAuthenticated(true)} />
              ) : (
                <Routes>
                  <Route 
                    path="/mobile-app" 
                    element={<MobileAppSimulator />}
                  />
                  <Route 
                    path="/ai-assistant" 
                    element={<AIDesignDashboard />}
                  />
                  <Route 
                    path="/room-studio" 
                    element={<RoomRenderingStudio />}
                  />
                  {/* Design Tools Suite - Full Screen Experiences */}
                  <Route 
                    path="/project/:projectId/design-tools" 
                    element={<DesignToolsHub />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/layout-planner" 
                    element={<FurnitureLayoutPlanner />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/color-extractor" 
                    element={<ColorPaletteExtractor />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/ar-preview" 
                    element={<ARFurniturePreview />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/lighting-simulator" 
                    element={<LightingSimulator />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/room-scanner" 
                    element={<RoomScanner3D />}
                  />
                  <Route 
                    path="/project/:projectId/design-tools/pinterest" 
                    element={<PinterestIntegration />}
                  />
                  <Route 
                    path="*" 
                    element={
                      <>
                        <Navigation 
                          currentProject={currentProject} 
                          isOffline={isOffline}
                          onLogout={logout}
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
                      element={<MainDashboard />}
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
                    <Route 
                      path="/master-todo" 
                      element={<MasterToDoList />}
                    />
                    {/* Generic project detail route - MUST be AFTER specific routes */}
                    <Route 
                      path="/project/:projectId" 
                      element={<ProjectDetailPage />}
                    />
                    <Route 
                      path="/project/:projectId/edit-questionnaire" 
                      element={<CustomerfacingQuestionnaire isEditMode={true} />}
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
                    <Route 
                      path="/questionnaire" 
                      element={<CustomerfacingQuestionnaire />}
                    />
                    <Route 
                      path="/project/:projectId/detail" 
                      element={<CustomerfacingProjectDetailPage />}
                    />
                    <Route 
                      path="/power-features" 
                      element={<PowerFeaturesDashboard />}
                    />
                    <Route 
                      path="/power-features/:projectId" 
                      element={<PowerFeaturesDashboard />}
                    />
                    <Route 
                      path="/master-contacts" 
                      element={<MasterContactsPage />}
                    />
                    <Route 
                      path="/master-materials" 
                      element={<MasterMaterialsPage />}
                    />
                    <Route 
                      path="/paint-catalog" 
                      element={<PaintCatalogPage />}
                    />
                    <Route 
                      path="/calculators" 
                      element={<CalculatorsPage />}
                    />
                    {/* REMOVED: Sourcing Catalog - too many missing images */}
                    <Route 
                      path="/vendor-mirror" 
                      element={<VendorMirror />}
                    />
                  </Routes>
                </main>
              </>
            }
          />
                </Routes>
              )
            }
          />
        </Routes>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </div>
  );
};

export default App;