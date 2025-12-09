import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar as CalendarIcon, Mail, CheckSquare } from 'lucide-react';

const ExportsDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [teamsCalendarConnected, setTeamsCalendarConnected] = useState(false);
  const [showGoogleSheetsImport, setShowGoogleSheetsImport] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [showCustomerSheets, setShowCustomerSheets] = useState(false);
  const [customerSheetCategories, setCustomerSheetCategories] = useState({
    tile: true,
    flooring: true,
    appliances: true,
    paint: true,
    wallpaper: true,
    lighting: true,
    furniture: true,
    window_treatments: true,
    plumbing: true,
    hardware: true,
    accessories: true,
    artwork: true,
    rugs: true,
    outdoor: true,
    other: true
  });
  const [customerSheetRooms, setCustomerSheetRooms] = useState({});

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    // Initialize room selections when project loads
    if (project && project.rooms) {
      const roomSelections = {};
      project.rooms.forEach(room => {
        roomSelections[room.name || room.id] = true;
      });
      setCustomerSheetRooms(roomSelections);
    }
  }, [project]);

  const loadProjectData = async () => {
    try {
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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

  const importFromGoogleSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('Please enter a Google Sheets URL');
      return;
    }
    
    try {
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
      const response = await fetch(`${BACKEND_URL}/api/imports/google-sheets/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets_url: googleSheetsUrl })
      });
      
      if (response.ok) {
        alert('✅ Google Sheets imported successfully!');
        setShowGoogleSheetsImport(false);
        setGoogleSheetsUrl('');
      } else {
        alert('Failed to import Google Sheets');
      }
    } catch (error) {
      console.error('Error importing Google Sheets:', error);
      alert('Failed to import Google Sheets');
    }
  };

  const generateCustomerSheets = async () => {
    try {
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
      
      // Get selected categories and rooms
      const selectedCategories = Object.entries(customerSheetCategories)
        .filter(([_, selected]) => selected)
        .map(([category]) => category);
      
      const selectedRooms = Object.entries(customerSheetRooms)
        .filter(([_, selected]) => selected)
        .map(([room]) => room);
      
      const response = await fetch(`${BACKEND_URL}/api/exports/${projectId}/customer-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          rooms: selectedRooms
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        alert('✅ Customer sheets generated!');
        setShowCustomerSheets(false);
      } else {
        alert('Failed to generate customer sheets');
      }
    } catch (error) {
      console.error('Error generating customer sheets:', error);
      alert('Failed to generate customer sheets');
    }
  };

  const toggleAllCategories = (checked) => {
    const newCategories = {};
    Object.keys(customerSheetCategories).forEach(cat => {
      newCategories[cat] = checked;
    });
    setCustomerSheetCategories(newCategories);
  };

  const toggleAllRooms = (checked) => {
    const newRooms = {};
    Object.keys(customerSheetRooms).forEach(room => {
      newRooms[room] = checked;
    });
    setCustomerSheetRooms(newRooms);
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
          <div className="rounded-lg border border-[#D4A574]/50 p-6" style={{
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

          {/* Customer Sheets */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6" style={{
            background: 'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(0,0,0,0.9) 50%, rgba(244,114,182,0.2) 100%)'
          }}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📋</div>
              <h4 className="text-xl font-bold text-[#D4A574] mb-2">Customer Sheets</h4>
              <p className="text-sm text-[#B49B7E]">Select categories to print for client close & install</p>
            </div>
            <button
              onClick={() => setShowCustomerSheets(true)}
              className="w-full bg-[#F472B6] hover:bg-[#EC4899] text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-5 h-5" />
              Select & Print
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR SYNC */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📥 Import & Sync</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Google Sheets Import */}
          <div className="rounded-lg border border-[#D4A574]/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📊</div>
              <div>
                <h4 className="text-xl font-bold text-[#D4C5A9]">Google Sheets</h4>
                <p className="text-sm text-[#B49B7E]">Import FFE data</p>
              </div>
            </div>
            <ul className="text-sm text-gray-300 mb-4 space-y-1">
              <li>• Import items from spreadsheet</li>
              <li>• Auto-create rooms & categories</li>
              <li>• Bulk data entry</li>
            </ul>
            <button
              onClick={() => setShowGoogleSheetsImport(true)}
              className="w-full bg-[#34A853] hover:bg-[#2D8E47] text-white px-6 py-3 rounded-lg font-bold"
            >
              Import from Google Sheets
            </button>
          </div>

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

      {/* GOOGLE SHEETS IMPORT MODAL */}
      {showGoogleSheetsImport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">📊 Import from Google Sheets</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Google Sheets URL</label>
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <div className="text-xs text-gray-400 mt-2">
                  Make sure your sheet is shared with "Anyone with the link can view"
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg">
                <div className="text-sm text-blue-300 mb-2"><strong>Expected Format:</strong></div>
                <div className="text-xs text-gray-300">
                  <p>• Column A: Room</p>
                  <p>• Column B: Category</p>
                  <p>• Column C: Item Name</p>
                  <p>• Column D: Quantity</p>
                  <p>• Column E: Vendor</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={importFromGoogleSheets}
                className="flex-1 bg-[#34A853] hover:bg-[#2D8E47] text-white px-6 py-3 rounded-lg font-bold"
              >
                Import Data
              </button>
              <button
                onClick={() => setShowGoogleSheetsImport(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportsDashboard;