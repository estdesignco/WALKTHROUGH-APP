// Enhanced Canva Integration with Project & Sheet Assignment

import React, { useState } from 'react';

const CanvaProjectModal = ({ product, onClose, onAssign }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [customSheetName, setCustomSheetName] = useState('');

  // Sample projects (would come from your actual projects)
  const projects = [
    { id: 'proj_1', name: 'Greene Project - Living Room Redesign' },
    { id: 'proj_2', name: 'Johnson House - Full Home Design' },
    { id: 'proj_3', name: 'Smith Condo - Kitchen & Bath' }
  ];

  // Sample sheet types for each project
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

    const assignment = {
      product: product,
      projectId: selectedProject,
      projectName: projects.find(p => p.id === selectedProject)?.name,
      sheetName: sheetName,
      timestamp: new Date().toISOString()
    };

    // This would integrate with Canva API
    await assignToCanvaBoard(assignment);
    
    onAssign(assignment);
  };

  const assignToCanvaBoard = async (assignment) => {
    try {
      // Canva API Integration would go here
      console.log('🎨 Assigning to Canva:', assignment);
      
      // Mock API call for demo
      const canvaResponse = await mockCanvaAPI({
        action: 'add_product_to_board',
        project_id: assignment.projectId,
        board_name: assignment.sheetName,
        product: {
          name: assignment.product.name,
          image_url: assignment.product.image_url,
          vendor_link: assignment.product.vendor_url,
          price: assignment.product.price,
          sku: assignment.product.vendor_sku
        }
      });

      if (canvaResponse.success) {
        alert(`✅ SUCCESS! 
${assignment.product.name} added to:
📁 Project: ${assignment.projectName}
📋 Sheet: ${assignment.sheetName}
🔗 Canva Board: ${canvaResponse.board_url}`);
      }

    } catch (error) {
      console.error('Canva integration error:', error);
      alert('❌ Error adding to Canva. Please try again.');
    }
  };

  // Mock Canva API for demonstration
  const mockCanvaAPI = async (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          board_url: `https://canva.com/design/project-${params.project_id}/${params.board_name.toLowerCase().replace(/\s+/g, '-')}`,
          message: 'Product added successfully'
        });
      }, 1000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-black/90 to-gray-900/95 rounded-3xl p-8 w-full max-w-2xl mx-4 border border-[#B49B7E]/30 shadow-2xl">
        <h3 className="text-3xl font-bold text-[#B49B7E] mb-2 text-center">
          🎨 Add to Canva Board
        </h3>
        <p className="text-lg text-center mb-8" style={{ color: '#F5F5DC', opacity: '0.8' }}>
          Assign "{product.name}" to a project and sheet
        </p>

        <div className="space-y-6">
          {/* Project Selection */}
          <div>
            <label className="block text-xl font-bold text-[#B49B7E] mb-3">
              📁 Select Project:
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-4 bg-black/60 border-2 border-[#B49B7E]/50 rounded-lg text-lg focus:outline-none focus:border-[#B49B7E] transition-all"
              style={{ color: '#F5F5DC' }}
            >
              <option value="">Choose Project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sheet Selection */}
          <div>
            <label className="block text-xl font-bold text-[#B49B7E] mb-3">
              📋 Select Sheet/Board:
            </label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full px-4 py-4 bg-black/60 border-2 border-[#B49B7E]/50 rounded-lg text-lg focus:outline-none focus:border-[#B49B7E] transition-all"
              style={{ color: '#F5F5DC' }}
              disabled={!selectedProject}
            >
              <option value="">Choose Sheet Type...</option>
              {sheetTypes.map(sheet => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Sheet Name */}
          {selectedSheet === 'custom' && (
            <div>
              <label className="block text-xl font-bold text-[#B49B7E] mb-3">
                ✏️ Custom Sheet Name:
              </label>
              <input
                type="text"
                value={customSheetName}
                onChange={(e) => setCustomSheetName(e.target.value)}
                placeholder="Enter custom sheet name..."
                className="w-full px-4 py-4 bg-black/60 border-2 border-[#B49B7E]/50 rounded-lg text-lg focus:outline-none focus:border-[#B49B7E] transition-all"
                style={{ color: '#F5F5DC' }}
              />
            </div>
          )}

          {/* Product Preview */}
          <div className="bg-[#B49B7E]/10 border border-[#B49B7E]/30 rounded-lg p-4">
            <h4 className="text-lg font-bold text-[#B49B7E] mb-2">Product to Add:</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center text-2xl">
                🪑
              </div>
              <div>
                <p className="font-bold" style={{ color: '#F5F5DC' }}>{product.name}</p>
                <p style={{ color: '#F5F5DC', opacity: '0.7' }}>
                  {product.vendor} • ${product.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-8">
          <button
            onClick={handleAssign}
            disabled={!selectedProject || !selectedSheet || (selectedSheet === 'custom' && !customSheetName)}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105"
            style={{ color: '#F5F5DC' }}
          >
            🎨 ADD TO CANVA BOARD
          </button>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300"
            style={{ color: '#F5F5DC' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Product Card with Project Assignment
const EnhancedProductCard = ({ product }) => {
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const handleCanvaAssignment = (assignment) => {
    setAssignments([...assignments, assignment]);
    setShowCanvaModal(false);
  };

  return (
    <div className="bg-black/60 border-2 border-[#B49B7E]/30 rounded-lg p-6 hover:border-[#B49B7E]/60 transition-all duration-300">
      {/* Product content... */}
      
      {/* Enhanced Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => alert(`Adding "${product.name}" to checklist!`)}
            className="flex-1 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] px-4 py-3 text-lg font-bold rounded"
            style={{ color: '#F5F5DC' }}
          >
            ✅ ADD TO CHECKLIST
          </button>
          <button
            onClick={() => setShowCanvaModal(true)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-lg font-bold rounded"
            style={{ color: '#F5F5DC' }}
          >
            🎨 ASSIGN TO PROJECT
          </button>
        </div>

        {/* Show existing assignments */}
        {assignments.length > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
            <p className="text-sm font-bold text-green-400 mb-2">
              ✅ Assigned to Canva:
            </p>
            {assignments.map((assignment, index) => (
              <div key={index} className="text-xs" style={{ color: '#F5F5DC' }}>
                📁 {assignment.projectName} → 📋 {assignment.sheetName}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canva Assignment Modal */}
      {showCanvaModal && (
        <CanvaProjectModal
          product={product}
          onClose={() => setShowCanvaModal(false)}
          onAssign={handleCanvaAssignment}
        />
      )}
    </div>
  );
};

export { CanvaProjectModal, EnhancedProductCard };