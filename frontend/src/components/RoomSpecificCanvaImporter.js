import React, { useState } from 'react';

const RoomSpecificCanvaImporter = ({ isOpen, onClose, onImportComplete, projectId, roomName, roomId }) => {
  const [canvaUrl, setCanvaUrl] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [autoClipToHouzz, setAutoClipToHouzz] = useState(true);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualItems, setManualItems] = useState([
    { name: '', vendor: '', cost: '', url: '' }
  ]);

  const handleManualImport = async () => {
    // Validate manual entries
    const validItems = manualItems.filter(item => item.name.trim());
    
    if (validItems.length === 0) {
      setImportError('Please enter at least one furniture item');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportResults(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      console.log(`🪑 MANUAL IMPORT - Room: ${roomName}, Items: ${validItems.length}`);
      
      const response = await fetch(`${backendUrl}/api/manual-furniture-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          project_id: projectId,
          room_name: roomName,
          room_id: roomId,
          auto_clip_to_houzz: autoClipToHouzz,
          items: validItems
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const results = await response.json();
      console.log(`🪑 MANUAL IMPORT RESULTS for ${roomName}:`, results);
      
      setImportResults(results);
      
      if (results.success && results.successful_imports > 0) {
        // Notify parent component of successful import
        if (onImportComplete) {
          onImportComplete(results);
        }
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
      
    } catch (error) {
      console.error(`❌ Manual import failed for ${roomName}:`, error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (useManualEntry) {
      return handleManualImport();
    }

    if (!canvaUrl || !canvaUrl.includes('canva.com')) {
      setImportError('Please enter a valid Canva board URL');
      return;
    }

    if (!pageNumber || pageNumber < 1) {
      setImportError('Please enter a valid page number (1 or higher)');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportResults(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      console.log(`🎨 IMPORTING FROM CANVA - Room: ${roomName}, Page: ${pageNumber}`);
      
      const response = await fetch(`${backendUrl}/api/import-canva-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          board_url: canvaUrl,
          project_id: projectId,
          room_name: roomName,
          room_id: roomId,
          auto_clip_to_houzz: autoClipToHouzz,
          page_number: pageNumber
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const results = await response.json();
      console.log(`🎨 CANVA IMPORT RESULTS for ${roomName}:`, results);
      
      setImportResults(results);
      
      if (results.success && results.successful_imports > 0) {
        // Notify parent component of successful import
        if (onImportComplete) {
          onImportComplete(results);
        }
        // Auto-close modal after 3 seconds on success
        setTimeout(() => {
          onClose();
        }, 3000);
      }
      
    } catch (error) {
      console.error(`❌ Canva import failed for ${roomName}:`, error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const addManualItem = () => {
    setManualItems([...manualItems, { name: '', vendor: '', cost: '', url: '' }]);
  };

  const removeManualItem = (index) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const updateManualItem = (index, field, value) => {
    const updated = [...manualItems];
    updated[index][field] = value;
    setManualItems(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🎨</span>
            Import to {roomName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Canva URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Canva Board URL
            </label>
            <input
              type="url"
              value={canvaUrl}
              onChange={(e) => setCanvaUrl(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              placeholder="https://www.canva.com/design/..."
            />
          </div>

          {/* Page Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Canva Page Number
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                className="w-24 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                min="1"
                placeholder="1"
              />
              <span className="text-sm text-gray-400">
                Which page contains {roomName} items?
              </span>
            </div>
          </div>

          {/* Auto-clip Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Auto-clip to Houzz Pro</span>
            <button
              onClick={() => setAutoClipToHouzz(!autoClipToHouzz)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoClipToHouzz ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoClipToHouzz ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Error Display */}
          {importError && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {importError}
            </div>
          )}

          {/* Success Results */}
          {importResults && importResults.success && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded">
              ✅ Successfully imported {importResults.successful_imports} items to {roomName}!
              {autoClipToHouzz && <div className="text-sm mt-1">Items also clipped to Houzz Pro</div>}
            </div>
          )}

          {/* Import Button */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !canvaUrl}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing... (may take 30-60s)
                </>
              ) : (
                `Import Page ${pageNumber}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSpecificCanvaImporter;