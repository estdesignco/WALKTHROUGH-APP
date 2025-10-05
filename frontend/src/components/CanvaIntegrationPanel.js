import React, { useState, useEffect } from 'react';

const CanvaIntegrationPanel = ({ projectId, onSync }) => {
  const [canvaStatus, setCanvaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  useEffect(() => {
    checkCanvaStatus();
  }, []);

  const checkCanvaStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/canva/status`);
      const data = await response.json();
      setCanvaStatus(data);
    } catch (error) {
      console.error('Error checking Canva status:', error);
      setCanvaStatus({ connected: false, message: 'Error checking connection' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/canva/auth`);
      const data = await response.json();
      
      // Open Canva OAuth in new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        data.authorization_url,
        'Canva Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Check if popup was blocked
      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        alert('⚠️ Popup blocked!\n\nPlease allow popups for this site and try again.\n\nOr use this link directly:\n' + data.authorization_url);
        return;
      }

      // Poll for window close and check status
      const checkAuth = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(checkAuth);
            await checkCanvaStatus();
          }
        } catch (e) {
          // Window might be cross-origin, ignore errors
          clearInterval(checkAuth);
        }
      }, 1000);
    } catch (error) {
      console.error('Error initiating Canva auth:', error);
      alert('Failed to connect to Canva. Please try again.');
    }
  };

  const handleSyncFromCanva = async () => {
    setSyncing(true);
    try {
      // This will be implemented to pull data from Canva boards
      const response = await fetch(`${BACKEND_URL}/api/canva/sync-from-board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully synced ${result.items_synced || 0} items from Canva!`);
        if (onSync) onSync();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing from Canva:', error);
      alert('Failed to sync from Canva. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-100 via-stone-100 to-amber-50 border border-amber-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
          <span className="text-sm text-gray-600">Checking Canva connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-100 via-stone-100 to-amber-50 border border-amber-300 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.7 8.2c0-1.1.9-2 2-2h5.6c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2H9.7c-1.1 0-2-.9-2-2V8.2zm10.6 0c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2zM1.3 8.2c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2z"/>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Canva Integration</h3>
        </div>
        {canvaStatus?.connected && (
          <span className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Connected
          </span>
        )}
      </div>

      {canvaStatus?.connected ? (
        <div className="space-y-3">
          <div className="bg-white bg-opacity-70 rounded-lg p-3 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold">Connected as:</span> {canvaStatus.canva_user}
            </p>
            {canvaStatus.email && (
              <p className="text-gray-600 text-xs mt-1">{canvaStatus.email}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSyncFromCanva}
              disabled={syncing}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync from Canva</span>
                </>
              )}
            </button>
            
            <button
              onClick={checkCanvaStatus}
              className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">💡 Tip:</p>
            <p>Add product links in your Canva boards, then click "Sync from Canva" to automatically import them into your checklist!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Connect your Canva account to sync design boards with your project checklist.
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.7 8.2c0-1.1.9-2 2-2h5.6c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2H9.7c-1.1 0-2-.9-2-2V8.2zm10.6 0c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2zM1.3 8.2c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2z"/>
            </svg>
            <span>Connect to Canva</span>
          </button>
          <p className="text-xs text-gray-500 text-center">
            You'll be redirected to Canva to authorize this app
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvaIntegrationPanel;