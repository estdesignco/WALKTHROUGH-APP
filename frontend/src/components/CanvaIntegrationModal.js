import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CanvaIntegrationModal = ({ isOpen, onClose, onItemsExtracted, projectId }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [manualLinks, setManualLinks] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleManualLinkExtraction = async () => {
    if (!manualLinks.trim()) {
      setStatus('❌ Please enter product links');
      return;
    }

    setLoading(true);
    setStatus('🔄 Processing product links...');

    try {
      const links = manualLinks.split('\n').filter(link => link.trim());
      const extractedItems = [];

      for (const link of links) {
        try {
          const response = await axios.post(`${API}/scrape-product`, {
            url: link.trim()
          });

          if (response.data.success) {
            extractedItems.push({
              name: response.data.name || 'Unknown Item',
              vendor: response.data.vendor || 'Unknown Vendor',
              sku: response.data.sku || '',
              cost: response.data.cost || '',
              finish_color: response.data.finish_color || '',
              image_url: response.data.image_url || '',
              link: link.trim(),
              source: 'manual_canva_links'
            });
          }
        } catch (error) {
          console.error('Failed to scrape link:', link, error);
          // Add basic item even if scraping fails
          extractedItems.push({
            name: 'Item from Canva',
            vendor: 'Unknown Vendor',
            sku: '',
            cost: '',
            finish_color: '',
            image_url: '',
            link: link.trim(),
            source: 'manual_canva_links'
          });
        }
      }

      setStatus(`✅ Extracted ${extractedItems.length} items from ${links.length} links`);
      onItemsExtracted(extractedItems);
      
      // Clear form
      setManualLinks('');
      
    } catch (error) {
      setStatus('❌ Failed to process links: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvaUrlExtraction = async () => {
    if (!canvaUrl.trim()) {
      setStatus('❌ Please enter a Canva URL');
      return;
    }

    setLoading(true);
    setStatus('🔄 Extracting products from Canva board...');

    try {
      const response = await axios.post(`${API}/canva/extract-board`, {
        canva_url: canvaUrl.trim()
      });

      if (response.data.success) {
        const extractedItems = response.data.products || [];
        setStatus(`✅ Found ${extractedItems.length} products on Canva board`);
        onItemsExtracted(extractedItems);
        setCanvaUrl('');
      } else {
        setStatus('❌ Failed to extract from Canva: ' + response.data.error);
      }
    } catch (error) {
      setStatus('❌ Canva extraction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      setStatus('❌ Please select a PDF file');
      return;
    }

    setLoading(true);
    setStatus('🔄 Processing PDF file...');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('project_id', projectId);

      const response = await axios.post(`${API}/canva/extract-pdf-links`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const extractedItems = response.data.products || [];
        setStatus(`✅ Extracted ${extractedItems.length} items from PDF`);
        onItemsExtracted(extractedItems);
        setPdfFile(null);
      } else {
        setStatus('❌ PDF processing failed: ' + response.data.error);
      }
    } catch (error) {
      setStatus('❌ PDF upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            🎨 Import from Canva
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4">
          {[
            { id: 'manual', name: '📝 Manual Links', desc: 'Paste product links' },
            { id: 'canva', name: '🎨 Canva URL', desc: 'Extract from Canva board' },
            { id: 'pdf', name: '📄 PDF Upload', desc: 'Upload Canva PDF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="text-center">
                <div>{tab.name}</div>
                <div className="text-xs opacity-75">{tab.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-4">
          {activeTab === 'manual' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Paste Product Links (one per line):
              </label>
              <textarea
                value={manualLinks}
                onChange={(e) => setManualLinks(e.target.value)}
                placeholder="https://fourhands.com/product/chair-123&#10;https://uttermost.com/lighting/lamp-456&#10;https://bernhardt.com/furniture/table-789"
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleManualLinkExtraction}
                disabled={loading || !manualLinks.trim()}
                className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
              >
                {loading ? '⏳ Processing Links...' : '🔍 Extract Products'}
              </button>
            </div>
          )}

          {activeTab === 'canva' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Canva Board URL:
              </label>
              <input
                type="url"
                value={canvaUrl}
                onChange={(e) => setCanvaUrl(e.target.value)}
                placeholder="https://www.canva.com/design/..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleCanvaUrlExtraction}
                disabled={loading || !canvaUrl.trim()}
                className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
              >
                {loading ? '⏳ Extracting from Canva...' : '🎨 Extract from Board'}
              </button>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Upload Canva PDF:
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-600 file:text-white hover:file:bg-amber-700"
              />
              <button
                onClick={handlePdfUpload}
                disabled={loading || !pdfFile}
                className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-md font-medium transition-colors"
              >
                {loading ? '⏳ Processing PDF...' : '📄 Extract from PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Status Display */}
        {status && (
          <div className={`p-3 rounded-md mb-4 ${
            status.includes('✅') ? 'bg-green-800 text-green-200' :
            status.includes('❌') ? 'bg-red-800 text-red-200' :
            'bg-blue-800 text-blue-200'
          }`}>
            {status}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900 p-4 rounded border border-gray-600">
          <h4 className="text-amber-400 font-semibold mb-2">💡 How to Use:</h4>
          <div className="text-gray-300 text-sm space-y-2">
            <p><strong>Manual Links:</strong> Copy product URLs from your Canva board and paste them here. Each link will be scraped for product details.</p>
            <p><strong>Canva URL:</strong> Share your Canva design and paste the URL. The system will extract embedded product links.</p>
            <p><strong>PDF Upload:</strong> Export your Canva board as PDF and upload it. The system will extract clickable links from the PDF.</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvaIntegrationModal;