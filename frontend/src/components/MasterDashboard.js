import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Mail, FileText, Search, Smartphone, Users, 
  BarChart3, Settings, Download, Upload, RefreshCw,
  ShoppingCart, Package, Truck, CheckCircle,
  Calendar, Clock, DollarSign, Camera, Wifi, WifiOff
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const MasterDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalItems: 0,
    pendingItems: 0,
    orderedItems: 0,
    deliveredItems: 0
  });

  useEffect(() => {
    loadDashboardData();
    
    // Check online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load projects
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProjects(projectData);
        
        // Calculate stats
        calculateStats(projectData);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectData) => {
    let totalItems = 0;
    let pendingItems = 0;
    let orderedItems = 0;
    let deliveredItems = 0;
    
    projectData.forEach(project => {
      project.rooms?.forEach(room => {
        room.categories?.forEach(category => {
          category.subcategories?.forEach(subcategory => {
            subcategory.items?.forEach(item => {
              totalItems++;
              const status = item.status?.toLowerCase() || '';
              if (status.includes('pending') || status.includes('to be')) {
                pendingItems++;
              } else if (status.includes('ordered')) {
                orderedItems++;
              } else if (status.includes('delivered') || status.includes('installed')) {
                deliveredItems++;
              }
            });
          });
        });
      });
    });

    setStats({
      totalProjects: projectData.length,
      activeProjects: projectData.filter(p => p.status !== 'completed').length,
      completedProjects: projectData.filter(p => p.status === 'completed').length,
      totalItems,
      pendingItems,
      orderedItems,
      deliveredItems
    });
  };

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      
      // Sync with mobile app
      await fetch(`${BACKEND_URL}/api/sync/mobile`, { method: 'POST' });
      
      // Sync with integrations
      await fetch(`${BACKEND_URL}/api/sync/integrations`, { method: 'POST' });
      
      // Reload data
      await loadDashboardData();
      
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      console.error('Sync failed:', err);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className={`bg-[#2D3748] rounded-lg p-6 shadow-xl border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#F5F5DC] text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold text-[#F5F5DC] mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 opacity-80 ${color.includes('blue') ? 'text-blue-400' : 
                                              color.includes('green') ? 'text-green-400' : 
                                              color.includes('yellow') ? 'text-yellow-400' : 'text-purple-400'}`} />
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color, badge }) => (
    <div className={`bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${color}`}
         onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-8 h-8 text-[#B49B7E]" />
        {badge && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{badge}</span>
        )}
      </div>
      <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">{title}</h3>
      <p className="text-[#F5F5DC] text-sm opacity-80">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E293B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
          <p className="text-[#F5F5DC] mt-4">Loading Master Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E293B] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#B49B7E] mb-2">
              ESTABLISHEDDESIGN CO. Master Dashboard
            </h1>
            <p className="text-[#F5F5DC] text-lg">
              Complete Interior Design Management System
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Online/Offline Status */}
            <div className="flex items-center space-x-2">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-red-400" />
              ) : (
                <Wifi className="w-5 h-5 text-green-400" />
              )}
              <span className={`text-sm ${isOffline ? 'text-red-400' : 'text-green-400'}`}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
            
            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center space-x-2 bg-[#B49B7E] hover:bg-[#A08B6F] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'error' ? 'Sync Failed' : 'Sync All'}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={FileText}
            color="border-blue-500"
            trend={12}
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Clock}
            color="border-yellow-500"
            trend={5}
          />
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={Package}
            color="border-green-500"
            trend={-2}
          />
          <StatCard
            title="Items Delivered"
            value={stats.deliveredItems}
            icon={CheckCircle}
            color="border-purple-500"
            trend={18}
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          
          {/* Client Management */}
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/questionnaire/new'}>
            <div className="flex items-start justify-between mb-4">
              <Plus className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">New Client</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Start new project with questionnaire</p>
          </div>
          
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/'}>
            <div className="flex items-start justify-between mb-4">
              <Mail className="w-8 h-8 text-[#B49B7E]" />
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Email Client</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Send questionnaire via email</p>
          </div>
          
          {/* Project Management */}
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/'}>
            <div className="flex items-start justify-between mb-4">
              <FileText className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">View Projects</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Manage all active projects</p>
          </div>
          
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]">
            <div className="flex items-start justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Project Analytics</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">View project performance</p>
          </div>
          
          {/* Furniture Search & Houzz Integration */}
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/integrations'}>
            <div className="flex items-start justify-between mb-4">
              <Search className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Furniture Search</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Search & add to Houzz Pro</p>
          </div>
          
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/integrations'}>
            <div className="flex items-start justify-between mb-4">
              <ShoppingCart className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Houzz Automation</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Manage Houzz Pro integration</p>
          </div>
          
          {/* Mobile & Team */}
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]">
            <div className="flex items-start justify-between mb-4">
              <Smartphone className="w-8 h-8 text-[#B49B7E]" />
              {isOffline && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Offline</span>}
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Mobile Sync</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Sync with mobile walkthrough app</p>
          </div>
          
          <div className="bg-[#2D3748] rounded-lg p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer hover:bg-[#374151]"
               onClick={() => window.location.href = '/integrations'}>
            <div className="flex items-start justify-between mb-4">
              <Users className="w-8 h-8 text-[#B49B7E]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5DC] mb-2">Team Management</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">Teams integration & notifications</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-[#2D3748] rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#B49B7E]">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-[#B49B7E] hover:text-[#F5F5DC] transition-colors"
            >
              View All →
            </Link>
          </div>
          
          {error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : projects.length === 0 ? (
            <div className="text-[#F5F5DC] text-center py-8">
              No projects yet. Create your first project!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}/detail`}
                  className="bg-[#1E293B] p-4 rounded-lg hover:bg-[#374151] transition-colors"
                >
                  <h3 className="font-bold text-[#B49B7E] mb-2">{project.name}</h3>
                  <p className="text-[#F5F5DC] text-sm mb-1">
                    Client: {project.client_info?.full_name || 'Not specified'}
                  </p>
                  <p className="text-[#F5F5DC] text-sm mb-2">
                    Type: {project.project_type}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B49B7E]">
                      {project.rooms?.length || 0} rooms
                    </span>
                    <span className="text-gray-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;