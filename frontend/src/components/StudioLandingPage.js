import React, { useState } from 'react';

// Canva Project Assignment Modal
const CanvaProjectModal = ({ product, onClose, onAssign }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [customSheetName, setCustomSheetName] = useState('');

  const projects = [
    { id: 'greene', name: 'Greene Project - Living Room Redesign' },
    { id: 'johnson', name: 'Johnson House - Full Home Design' },
    { id: 'smith', name: 'Smith Condo - Kitchen & Bath' },
    { id: 'demo', name: 'Demo Project - Sample Client' }
  ];

  const sheetTypes = [
    { id: 'inspiration', name: 'Inspiration Board' },
    { id: 'living_room', name: 'Living Room Selection' },
    { id: 'bedroom', name: 'Bedroom Selection' },
    { id: 'kitchen', name: 'Kitchen Selection' },
    { id: 'lighting', name: 'Lighting Plan' },
    { id: 'presentation', name: 'Client Presentation Board' },
    { id: 'custom', name: 'Custom Sheet Name' }
  ];

  const handleAssign = async () => {
    const sheetName = selectedSheet === 'custom' ? customSheetName : 
                     sheetTypes.find(s => s.id === selectedSheet)?.name;
    
    const projectName = projects.find(p => p.id === selectedProject)?.name;

    // Simulate Canva API integration
    const canvaUrl = `https://canva.com/design/project-${selectedProject}/${sheetName?.toLowerCase().replace(/\s+/g, '-')}`;
    
    alert(`🎉 SUCCESS! "${product.name}" added to:
📁 Project: ${projectName}
📋 Sheet: ${sheetName}
🔗 Canva Board: ${canvaUrl}

✅ Product image uploaded with vendor link
✅ Organized by ${product.category} category
✅ Ready for client presentation!`);
    
    onAssign({ project: projectName, sheet: sheetName, url: canvaUrl });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-black/95 to-gray-900/98 rounded-3xl p-8 w-full max-w-2xl mx-4 border-2 border-[#B49B7E]/50 shadow-2xl">
        <h3 className="text-3xl font-bold text-[#B49B7E] mb-2 text-center">
          🎨 ASSIGN TO CANVA PROJECT
        </h3>
        <p className="text-lg text-center mb-8" style={{ color: '#F5F5DC', opacity: '0.8' }}>
          Add "{product.name}" to a project board
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-xl font-bold text-[#B49B7E] mb-3">📁 Select Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-4 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-lg text-[#F5F5DC] focus:border-[#B49B7E]"
            >
              <option value="">Choose Project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xl font-bold text-[#B49B7E] mb-3">📋 Select Board:</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full px-4 py-4 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-lg text-[#F5F5DC] focus:border-[#B49B7E]"
              disabled={!selectedProject}
            >
              <option value="">Choose Board Type...</option>
              {sheetTypes.map(sheet => (
                <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
              ))}
            </select>
          </div>

          {selectedSheet === 'custom' && (
            <div>
              <label className="block text-xl font-bold text-[#B49B7E] mb-3">✏️ Custom Name:</label>
              <input
                type="text"
                value={customSheetName}
                onChange={(e) => setCustomSheetName(e.target.value)}
                placeholder="Enter board name..."
                className="w-full px-4 py-4 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-lg text-[#F5F5DC] focus:border-[#B49B7E]"
              />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 pt-8">
          <button
            onClick={handleAssign}
            disabled={!selectedProject || !selectedSheet || (selectedSheet === 'custom' && !customSheetName)}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105"
            style={{ color: '#F5F5DC' }}
          >
            🎨 ADD TO CANVA
          </button>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-6 py-4 text-xl font-bold rounded-full transition-all duration-300"
            style={{ color: '#F5F5DC' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const UnifiedFurnitureSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [products] = useState([
    {
      id: '1',
      name: 'Four Hands Modern Chair',
      vendor: 'Four Hands',
      vendor_sku: 'FH-CHAIR-001',
      price: 299.99,
      category: 'Seating',
      room_type: 'Living Room'
    },
    {
      id: '2',
      name: 'Hudson Valley Pendant Light',
      vendor: 'Hudson Valley Lighting',
      vendor_sku: 'HVL-LIGHT-001', 
      price: 459.99,
      category: 'Lighting',
      room_type: 'Dining Room'
    }
  ]);

  const [savedCredentials] = useState([
    { id: '1', vendor_name: 'Four Hands', username: 'demo_user' },
    { id: '2', vendor_name: 'Hudson Valley Lighting', username: 'demo_user' }
  ]);

  const handleSearch = () => {
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm my-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#B49B7E] tracking-wide mb-6">
          🔍 UNIFIED FURNITURE SEARCH ENGINE
        </h2>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-6"></div>
        <p className="text-xl font-medium" style={{ color: '#F5F5DC' }}>
          🎯 THE DREAM IS REAL! Search ALL vendor products in ONE place!
        </p>
      </div>

      {/* Vendor Credentials */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">✅ VENDOR CREDENTIALS SAVED</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedCredentials.map((cred) => (
            <div key={cred.id} className="bg-[#B49B7E]/20 border border-[#B49B7E]/50 p-4 rounded-lg">
              <h4 className="text-[#B49B7E] font-bold text-lg mb-2">{cred.vendor_name}</h4>
              <p style={{ color: '#F5F5DC' }} className="font-medium">
                ✅ Connected: {cred.username}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6 mb-8">
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">🔍 SEARCH PRODUCTS</h3>
        
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lamps, chairs, tables..."
            className="flex-1 bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-6 py-4 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-[#B49B7E]/50 focus:border-[#B49B7E]"
          />
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
            style={{ color: '#F5F5DC' }}
          >
            🔍 SEARCH NOW!
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg">
            <option>All Vendors</option>
            <option>Four Hands</option>
            <option>Hudson Valley</option>
          </select>
          <select className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg">
            <option>All Categories</option>
            <option>Seating</option>
            <option>Lighting</option>
          </select>
          <input
            type="number"
            placeholder="Min Price $"
            className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg"
          />
          <input
            type="number"
            placeholder="Max Price $"
            className="bg-black/40 border-2 border-[#B49B7E]/50 text-[#F5F5DC] px-4 py-3 rounded-lg text-lg"
          />
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-6">
        <h3 className="text-2xl font-bold text-[#B49B7E] mb-6">
          🎯 PRODUCTS FOUND ({products.length} items)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-black/60 border-2 border-[#B49B7E]/30 rounded-lg p-6 hover:border-[#B49B7E]/60 transition-all duration-300 hover:scale-105">
              {/* Product Image Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🪑</span>
              </div>

              {/* Product Info */}
              <h4 className="text-[#B49B7E] font-bold text-xl mb-2">{product.name}</h4>
              
              <p className="text-lg mb-2" style={{ color: '#F5F5DC' }}>
                <strong>Vendor:</strong> {product.vendor}
              </p>
              
              <p className="text-lg mb-2" style={{ color: '#F5F5DC' }}>
                <strong>SKU:</strong> {product.vendor_sku}
              </p>
              
              <p className="text-2xl font-bold text-green-400 mb-4">
                ${product.price.toFixed(2)}
              </p>
              
              <div className="flex gap-2 mb-4">
                <span className="bg-[#B49B7E]/30 text-[#B49B7E] px-3 py-1 rounded font-bold">
                  {product.category}
                </span>
                <span className="bg-blue-500/30 text-blue-400 px-3 py-1 rounded font-bold">
                  {product.room_type}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`Adding "${product.name}" to checklist!`)}
                    className="flex-1 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-4 py-3 text-lg font-bold rounded transition-all duration-300"
                    style={{ color: '#F5F5DC' }}
                  >
                    ✅ ADD TO CHECKLIST
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowCanvaModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-3 text-lg font-bold rounded transition-all duration-300"
                    style={{ color: '#F5F5DC' }}
                  >
                    🎨 ASSIGN TO PROJECT
                  </button>
                </div>

                {/* Show Assignment Status */}
                {assignments.filter(a => a.productId === product.id).length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <p className="text-sm font-bold text-green-400 mb-1">✅ Assigned to Canva:</p>
                    {assignments
                      .filter(a => a.productId === product.id)
                      .map((assignment, idx) => (
                        <div key={idx} className="text-xs" style={{ color: '#F5F5DC' }}>
                          📁 {assignment.project} → 📋 {assignment.sheet}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canva Project Assignment Modal */}
      {showCanvaModal && selectedProduct && (
        <CanvaProjectModal
          product={selectedProduct}
          onClose={() => {
            setShowCanvaModal(false);
            setSelectedProduct(null);
          }}
          onAssign={(assignment) => {
            setAssignments([...assignments, {
              ...assignment,
              productId: selectedProduct.id,
              timestamp: new Date().toISOString()
            }]);
            setShowCanvaModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

const StudioLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Logo Header */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center py-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-black tracking-wider">
            ESTABLISHED DESIGN CO.
          </h1>
          <p className="text-2xl font-medium text-black/80 mt-2">
            Interior Design Studio
          </p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="max-w-4xl mx-auto p-8 text-center my-8">
        <h2 className="text-4xl font-bold text-[#B49B7E] mb-4">
          🎉 UNIFIED SEARCH ENGINE IS LIVE!
        </h2>
        <p className="text-2xl" style={{ color: '#F5F5DC' }}>
          No more 1,000,000 tabs open! Search ALL vendor products below!
        </p>
      </div>

      {/* Unified Furniture Search Engine */}
      <UnifiedFurnitureSearch />
      
      {/* Bottom Spacer */}
      <div className="h-16"></div>
    </div>
  );
};

export default StudioLandingPage;