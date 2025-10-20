import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar as CalendarIcon, Mail } from 'lucide-react';

const ExportsDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [teamsCalendarConnected, setTeamsCalendarConnected] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      if (response.ok) {
        setProject(await response.json());
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateElectricianSheet = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/exports/${projectId}/electrician-sheet`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        alert('✅ Electrician sheet generated!');
      }
    } catch (error) {
      console.error('Error generating electrician sheet:', error);
      alert('Failed to generate electrician sheet');
    }
  };

  const generateLoadInSheets = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/exports/${projectId}/load-in-sheets`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        alert('✅ Load-in room sheets generated!');
      }
    } catch (error) {
      console.error('Error generating load-in sheets:', error);
      alert('Failed to generate load-in sheets');
    }
  };

  const generateMoversFFE = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/exports/${projectId}/movers-ffe`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        alert('✅ Mover\'s FFE generated!');
      }
    } catch (error) {
      console.error('Error generating mover\'s FFE:', error);
      alert('Failed to generate mover\'s FFE');
    }
  };

  const syncToGoogleCalendar = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/calendar/google/sync/${projectId}`, {
        method: 'POST'
      });
      alert('✅ Synced to Google Calendar!');
      setGoogleCalendarConnected(true);
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      alert('Failed to sync to Google Calendar');
    }
  };

  const syncToTeamsCalendar = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/calendar/teams/sync/${projectId}`, {
        method: 'POST'
      });
      alert('✅ Synced to Teams Calendar!');
      setTeamsCalendarConnected(true);
    } catch (error) {
      console.error('Error syncing to Teams Calendar:', error);
      alert('Failed to sync to Teams Calendar');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading exports...</div>;
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      <h2 className="text-3xl font-bold text-[#D4A574] mb-6">📄 Print & Export Center</h2>

      {/* SPEC SHEETS */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📋 Spec Sheets & Install Guides</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Electrician Sheet */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6" style={{
            background: 'linear-gradient(135deg, rgba(139,69,19,0.2) 0%, rgba(0,0,0,0.9) 50%, rgba(139,69,19,0.2) 100%)'
          }}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚡</div>
              <h4 className="text-xl font-bold text-[#D4A574] mb-2">Electrician Sheet</h4>
              <p className="text-sm text-[#B49B7E]">All lighting items with specs, photos, and installation notes</p>
            </div>
            <button
              onClick={generateElectricianSheet}
              className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Generate & Print
            </button>
          </div>

          {/* Load-In Room Sheets */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6" style={{
            background: 'linear-gradient(135deg, rgba(107,70,193,0.2) 0%, rgba(0,0,0,0.9) 50%, rgba(107,70,193,0.2) 100%)'
          }}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📦</div>
              <h4 className="text-xl font-bold text-[#D4A574] mb-2">Load-In Room Sheets</h4>
              <p className="text-sm text-[#B49B7E]">Pictures by room (2-4 per page) to post on doors for movers</p>
            </div>
            <button
              onClick={generateLoadInSheets}
              className="w-full bg-[#6B46C1] hover:bg-[#7B56D1] text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Generate & Print
            </button>
          </div>

          {/* Mover's Simplified FFE */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6" style={
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(0,0,0,0.9) 50%, rgba(16,185,129,0.2) 100%)'
          }}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🚚</div>
              <h4 className="text-xl font-bold text-[#D4A574] mb-2">Mover's FFE Sheet</h4>
              <p className="text-sm text-[#B49B7E]">Simplified spreadsheet (no pricing) - just item, room, quantity</p>
            </div>
            <button
              onClick={generateMoversFFE}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Generate & Print
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR SYNC */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📅 Calendar Integration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Calendar */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📅</div>
              <div>
                <h4 className="text-xl font-bold text-[#D4C5A9]">Google Calendar</h4>
                <p className="text-sm text-[#B49B7E]">
                  {googleCalendarConnected ? 'Connected ✓' : 'Not connected'}
                </p>
              </div>
            </div>
            <ul className="text-sm text-gray-300 mb-4 space-y-1">
              <li>• Auto-create install date events</li>
              <li>• Sync delivery dates</li>
              <li>• Send calendar invites to clients</li>
              <li>• Reminder notifications</li>
            </ul>
            <button
              onClick={syncToGoogleCalendar}
              className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 py-3 rounded-lg font-bold"
            >
              {googleCalendarConnected ? 'Re-Sync' : 'Connect'} Google Calendar
            </button>
          </div>

          {/* Teams Calendar */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📅</div>
              <div>
                <h4 className="text-xl font-bold text-[#D4C5A9]">Microsoft Teams Calendar</h4>
                <p className="text-sm text-[#B49B7E]">
                  {teamsCalendarConnected ? 'Connected ✓' : 'Not connected'}
                </p>
              </div>
            </div>
            <ul className="text-sm text-gray-300 mb-4 space-y-1">
              <li>• Sync with team calendars</li>
              <li>• Installation scheduling</li>
              <li>• Team availability tracking</li>
              <li>• Meeting coordination</li>
            </ul>
            <button
              onClick={syncToTeamsCalendar}
              className="w-full bg-[#6264A7] hover:bg-[#464775] text-white px-6 py-3 rounded-lg font-bold"
            >
              {teamsCalendarConnected ? 'Re-Sync' : 'Connect'} Teams Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportsDashboard;