import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
const API = `${BACKEND_URL}/api`;

const TeamsIntegration = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const configureTeamsWebhook = async () => {
    if (!webhookUrl.trim()) {
      setStatus('❌ Please enter a Teams webhook URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/teams/configure-webhook`, {
        webhook_url: webhookUrl
      });

      if (response.data.status === 'success') {
        setStatus('✅ Teams integration configured and tested successfully!');
      } else {
        setStatus('⚠️ Teams webhook configured but test message failed');
      }
    } catch (error) {
      console.error('Teams configuration failed:', error);
      setStatus('❌ Failed to configure Teams webhook: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/teams/test-notification`);
      
      if (response.data.status === 'success') {
        setStatus('✅ Test notification sent to Teams successfully!');
      } else {
        setStatus('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      setStatus('❌ Failed to send test notification: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">
        🔔 Microsoft Teams Integration
      </h3>
      
      <div className="mb-4">
        <p className="text-gray-300 mb-3">
          Connect your Interior Design Management System to Microsoft Teams to automatically 
          receive to-do notifications when furniture and fixture statuses change.
        </p>
        
        <div className="bg-gray-900 p-4 rounded border border-gray-600 mb-4">
          <h4 className="text-amber-400 font-semibold mb-2">📋 How to Set Up Teams Webhook:</h4>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. Open Microsoft Teams and go to your desired channel</li>
            <li>2. Click the "..." menu → "Connectors" → "Incoming Webhook"</li>
            <li>3. Name it "Interior Design Notifications" and create</li>
            <li>4. Copy the webhook URL and paste it below</li>
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Teams Webhook URL:
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://outlook.office.com/webhook/..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={configureTeamsWebhook}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            {isLoading ? '⏳ Configuring...' : '🔧 Configure & Test'}
          </button>

          <button
            onClick={sendTestNotification}
            disabled={isLoading || !webhookUrl}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            {isLoading ? '⏳ Sending...' : '🧪 Send Test'}
          </button>
        </div>

        {status && (
          <div className={`p-3 rounded-md ${
            status.includes('✅') ? 'bg-green-800 text-green-200' :
            status.includes('⚠️') ? 'bg-yellow-800 text-yellow-200' :
            'bg-red-800 text-red-200'
          }`}>
            {status}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-600">
        <h4 className="text-amber-400 font-semibold mb-2">🎯 What You'll Get:</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Automatic to-do cards when item status changes</li>
          <li>• Project details, room, vendor, and cost information</li>
          <li>• Priority levels based on status urgency</li>
          <li>• Direct links back to your project dashboard</li>
          <li>• Color-coded cards for different status types</li>
        </ul>
      </div>
    </div>
  );
};

export default TeamsIntegration;