import React, { useState } from 'react';

const CanvaBoardImporter = ({ isOpen, onClose, onImportComplete, projectId, roomName }) => {
  const [canvaUrl, setCanvaUrl] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [autoClipToHouzz, setAutoClipToHouzz] = useState(true);

  const handleCanvaImport = async () => {
    if (!canvaUrl || !canvaUrl.includes('canva.com')) {
      setImportError('Please enter a valid Canva board URL');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportResults(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      
      console.log('🎨 STARTING CANVA IMPORT:', canvaUrl);
      
      const response = await fetch(`${backendUrl}/api/import-canva-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          board_url: canvaUrl,
          project_id: projectId,
          room_name: roomName,
          auto_clip_to_houzz: autoClipToHouzz,
          page_number: pageNumber ? parseInt(pageNumber) : null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const results = await response.json();
      console.log('🎨 CANVA IMPORT RESULTS:', results);
      
      setImportResults(results);
      
      if (results.success && results.successful_imports > 0) {
        // Notify parent component of successful import
        if (onImportComplete) {
          onImportComplete(results);
        }
      }
      
    } catch (error) {
      console.error('❌ Canva import failed:', error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCanvaUrl('');
    setImportError('');
    setImportResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>🎨</span>
            <span>Import from Canva Board</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!importResults ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">📋 How to Import:</h3>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Copy the URL of your Canva board with furniture product links</li>
                <li>Paste it below and click "Import Products"</li>
                <li>All product links will be automatically scraped and added to your checklist</li>
                <li>Optionally auto-clip to Houzz Pro for unified catalog integration</li>
              </ol>
            </div>

            {/* Canva URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Canva Board URL
              </label>
              <input
                type="url"
                value={canvaUrl}
                onChange={(e) => setCanvaUrl(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="https://www.canva.com/design/your-board-id..."
              />
            </div>

            {/* Page Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specific Page (Optional)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="w-24 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="1"
                  min="1"
                />
                <span className="text-sm text-gray-400">Leave empty to import entire project, or specify page number (e.g., 1, 2, 3)</span>
              </div>
            </div>

            {/* Houzz Pro Auto-Clip Toggle */}
            <div className="flex items-center space-x-3 bg-gray-700 p-4 rounded-lg">
              <input
                type="checkbox"
                id="canva-auto-clip-houzz"
                checked={autoClipToHouzz}
                onChange={(e) => setAutoClipToHouzz(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <label htmlFor="canva-auto-clip-houzz" className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                <span>🏠 Auto-clip all products to Houzz Pro</span>
                <span className="text-xs text-gray-400">(Recommended for unified catalog)</span>
              </label>
            </div>

            {/* Import Settings */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-gray-300 font-medium mb-2">Import Settings:</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>📁 Project: <span className="text-gray-300">{projectId}</span></div>
                <div>🏠 Room: <span className="text-gray-300">{roomName}</span></div>
              </div>
            </div>

            {/* Error Display */}
            {importError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400">❌ {importError}</p>
              </div>
            )}

            {/* Import Status */}
            {isImporting && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <p className="text-blue-400">🎨 Importing products from Canva board...</p>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  This may take a few minutes depending on the number of products.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCanvaImport}
                disabled={isImporting || !canvaUrl}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {isImporting ? '🎨 Importing...' : '🎨 Import Products'}
              </button>
              <button
                onClick={handleClose}
                disabled={isImporting}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Import Results */
          <div className="space-y-6">
            <div className={`rounded-lg p-4 ${
              importResults.success 
                ? 'bg-green-900/20 border border-green-500/30' 
                : 'bg-red-900/20 border border-red-500/30'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                importResults.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {importResults.success ? '✅ Import Complete!' : '❌ Import Failed'}
              </h3>
              <p className={importResults.success ? 'text-green-300' : 'text-red-300'}>
                {importResults.message}
              </p>
            </div>

            {importResults.success && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-3">📊 Import Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Found:</span>
                    <span className="text-white ml-2">{importResults.total_found}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Successfully Imported:</span>
                    <span className="text-green-400 ml-2">{importResults.successful_imports}</span>
                  </div>
                </div>
                
                {autoClipToHouzz && (
                  <div className="mt-3 text-sm text-blue-400">
                    🏠 All products were also auto-clipped to Houzz Pro for unified catalog integration!
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                ✅ Done
              </button>
              <button
                onClick={() => {
                  setImportResults(null);
                  setCanvaUrl('');
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Import Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvaBoardImporter;
