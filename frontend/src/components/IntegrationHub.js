import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Mail, MessageSquare, Search, 
  Upload, Download, RefreshCw, Settings, 
  CheckCircle, AlertCircle, Clock, Wifi
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState({
    houzz: { status: 'connected', lastSync: '2024-09-27T10:30:00Z', itemsAdded: 45 },
    canva: { status: 'pending', lastSync: null, boardsCreated: 0 },
    teams: { status: 'connected', lastSync: '2024-09-27T09:15:00Z', notificationsSent: 12 },
    mobile: { status: 'synced', lastSync: '2024-09-27T11:00:00Z', offlineItems: 3 },
    email: { status: 'connected', lastSync: '2024-09-27T08:45:00Z', emailsSent: 5 }
  });

  const [syncInProgress, setSyncInProgress] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'syncing':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'synced':
        return 'border-green-500';
      case 'pending':
      case 'error':
        return 'border-red-500';
      case 'syncing':
        return 'border-yellow-500';
      default:
        return 'border-gray-500';
    }
  };

  const handleSync = async (integration) => {
    try {
      setSyncInProgress(true);
      setIntegrations(prev => ({
        ...prev,
        [integration]: { ...prev[integration], status: 'syncing' }
      }));

      const response = await fetch(`${BACKEND_URL}/api/integrations/${integration}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        setIntegrations(prev => ({
          ...prev,
          [integration]: { 
            ...prev[integration], 
            status: 'synced',
            lastSync: new Date().toISOString()
          }
        }));
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      setIntegrations(prev => ({
        ...prev,
        [integration]: { ...prev[integration], status: 'error' }
      }));
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncInProgress(true);
    for (const integration of Object.keys(integrations)) {
      await handleSync(integration);
      // Add delay between syncs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setSyncInProgress(false);
  };

  const IntegrationCard = ({ 
    name, 
    title, 
    description, 
    icon: Icon, 
    status, 
    lastSync, 
    metrics,
    onSync,
    onConfigure 
  }) => (
    <div className={`bg-[#2D3748] rounded-lg p-6 shadow-xl border-l-4 ${getStatusColor(status)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="w-8 h-8 text-[#B49B7E]" />
          <div>
            <h3 className="text-lg font-bold text-[#F5F5DC]">{title}</h3>
            <p className="text-[#F5F5DC] text-sm opacity-80">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(status)}
          <span className="text-sm text-[#F5F5DC] capitalize">{status}</span>
        </div>
      </div>

      {metrics && (
        <div className="bg-[#1E293B] rounded p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key}>
                <div className="text-2xl font-bold text-[#B49B7E]">{value}</div>
                <div className="text-xs text-[#F5F5DC] opacity-80 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastSync && (
        <div className="text-xs text-[#F5F5DC] opacity-60 mb-4">
          Last sync: {new Date(lastSync).toLocaleString()}
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onSync(name)}
          disabled={syncInProgress}
          className="flex-1 bg-[#B49B7E] hover:bg-[#A08B6F] disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Sync
        </button>
        <button
          onClick={() => onConfigure(name)}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1E293B] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#B49B7E] mb-2">Integration Hub</h1>
            <p className="text-[#F5F5DC] text-lg">Manage all your connected services</p>
          </div>
          
          <button
            onClick={handleSyncAll}
            disabled={syncInProgress}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#B49B7E] to-[#8B6914] hover:from-[#A08B6F] hover:to-[#7A5A0F] disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            <RefreshCw className={`w-5 h-5 ${syncInProgress ? 'animate-spin' : ''}`} />
            <span>{syncInProgress ? 'Syncing All...' : 'Sync All'}</span>
          </button>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Houzz Pro Integration */}
          <IntegrationCard
            name="houzz"
            title="Houzz Pro"
            description="Product clipper & automation"
            icon={Search}
            status={integrations.houzz.status}
            lastSync={integrations.houzz.lastSync}
            metrics={{
              itemsAdded: integrations.houzz.itemsAdded,
              automation: 'Active'
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />

          {/* Canva Integration */}
          <IntegrationCard
            name="canva"
            title="Canva"
            description="Project board creation"
            icon={Upload}
            status={integrations.canva.status}
            lastSync={integrations.canva.lastSync}
            metrics={{
              boardsCreated: integrations.canva.boardsCreated,
              status: 'Setup Required'
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />

          {/* Teams Integration */}
          <IntegrationCard
            name="teams"
            title="Microsoft Teams"
            description="Task notifications & updates"
            icon={MessageSquare}
            status={integrations.teams.status}
            lastSync={integrations.teams.lastSync}
            metrics={{
              notificationsSent: integrations.teams.notificationsSent,
              webhooks: 'Active'
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />

          {/* Mobile App Integration */}
          <IntegrationCard
            name="mobile"
            title="Mobile App"
            description="Offline walkthrough sync"
            icon={Smartphone}
            status={integrations.mobile.status}
            lastSync={integrations.mobile.lastSync}
            metrics={{
              offlineItems: integrations.mobile.offlineItems,
              devices: 2
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />

          {/* Email Integration */}
          <IntegrationCard
            name="email"
            title="Email System"
            description="Questionnaire delivery"
            icon={Mail}
            status={integrations.email.status}
            lastSync={integrations.email.lastSync}
            metrics={{
              emailsSent: integrations.email.emailsSent,
              deliveryRate: '98%'
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />

          {/* Furniture Search Integration */}
          <IntegrationCard
            name="furniture"
            title="Furniture Search"
            description="Multi-vendor product search"
            icon={Search}
            status="connected"
            lastSync="2024-09-27T11:30:00Z"
            metrics={{
              vendors: 5,
              products: '10K+'
            }}
            onSync={handleSync}
            onConfigure={setSelectedIntegration}
          />
        </div>

        {/* Configuration Modal would go here */}
        {selectedIntegration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2D3748] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-[#B49B7E] mb-4">
                Configure {selectedIntegration}
              </h2>
              <p className="text-[#F5F5DC] mb-6">
                Integration configuration options will be available here.
              </p>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="w-full bg-[#B49B7E] hover:bg-[#A08B6F] text-white py-2 px-4 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationHub;