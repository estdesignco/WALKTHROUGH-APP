import React, { useState } from 'react';

const HouzzIntegrationModal = ({ product, onClose, onAssign }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [clientDescription, setClientDescription] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState(product.price || '');
  const [markup, setMarkup] = useState('30');
  const [taxable, setTaxable] = useState(true);
  const [addToSelectionBoard, setAddToSelectionBoard] = useState(true);

  // Sample projects for Houzz integration
  const houzzProjects = [
    { id: 'greene_houzz', name: 'Greene Project - Living Room Redesign' },
    { id: 'johnson_houzz', name: 'Johnson House - Full Home Design' },
    { id: 'smith_houzz', name: 'Smith Condo - Kitchen & Bath' }
  ];

  // Room options for Houzz
  const roomOptions = [
    'Living Room', 'Kitchen', 'Master Bedroom', 'Guest Bedroom',
    'Dining Room', 'Home Office', 'Bathroom', 'Entryway',
    'Family Room', 'Basement', 'Outdoor Space'
  ];

  // Category options for Houzz
  const categoryOptions = [
    'Furniture', 'Lighting', 'Rugs', 'Art & Accessories',
    'Window Treatments', 'Bedding & Bath', 'Outdoor Furniture',
    'Hardware', 'Appliances', 'Flooring', 'Paint & Wall Coverings'
  ];

  const handleHouzzSubmit = async () => {
    // Calculate final price with markup
    const baseCost = parseFloat(cost) || 0;
    const markupPercent = parseFloat(markup) || 0;
    const finalPrice = baseCost * (1 + markupPercent / 100);

    const houzzData = {
      product: product,
      projectId: selectedProject,
      projectName: houzzProjects.find(p => p.id === selectedProject)?.name,
      room: selectedRoom,
      clientDescription: clientDescription || product.name,
      category: category || product.category,
      cost: baseCost,
      markup: markupPercent,
      finalPrice: finalPrice,
      taxable: taxable,
      addToSelectionBoard: addToSelectionBoard,
      vendor: product.vendor,
      sku: product.vendor_sku,
      productUrl: product.vendor_url || '#',
      timestamp: new Date().toISOString()
    };

    // Show success message
    alert(`🎉 SUCCESS! Added to Houzz Pro:

📋 Project: ${houzzData.projectName}
🏠 Room: ${houzzData.room}
💰 Cost: $${houzzData.cost} (${houzzData.markup}% markup = $${houzzData.finalPrice.toFixed(2)})
🏷️ Category: ${houzzData.category}
${houzzData.addToSelectionBoard ? '✅ Added to Selection Board' : '📝 Added to Project Only'}

🔗 Houzz Pro Link: https://pro.houzz.com/project/${houzzData.projectId}/items`);
    
    onAssign(houzzData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-black/95 to-gray-900/98 rounded-3xl p-8 w-full max-w-3xl mx-4 border-2 border-[#B49B7E]/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-3xl font-bold text-[#B49B7E] mb-2 text-center">
          🏠 ADD TO HOUZZ PRO
        </h3>
        <p className="text-lg text-center mb-8" style={{ color: '#F5F5DC', opacity: '0.8' }}>
          Automated web clipper for "{product.name}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-[#B49B7E]/10 border border-[#B49B7E]/30 rounded-lg p-4">
              <h4 className="text-lg font-bold text-[#B49B7E] mb-2">Product Details:</h4>
              <p className="font-bold" style={{ color: '#F5F5DC' }}>{product.name}</p>
              <p style={{ color: '#F5F5DC', opacity: '0.7' }}>
                {product.vendor} • SKU: {product.vendor_sku}
              </p>
              <p className="text-lg font-bold text-green-400">${product.price}</p>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-lg font-bold text-[#B49B7E] mb-2">📁 Houzz Project:</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E]"
              >
                <option value="">Select Project...</option>
                {houzzProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-lg font-bold text-[#B49B7E] mb-2">🏠 Room:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E]"
              >
                <option value="">Select Room...</option>
                {roomOptions.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-lg font-bold text-[#B49B7E] mb-2">🏷️ Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E]"
              >
                <option value="">Select Category...</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Client Description */}
            <div>
              <label className="block text-lg font-bold text-[#B49B7E] mb-2">📝 Client Description:</label>
              <textarea
                value={clientDescription}
                onChange={(e) => setClientDescription(e.target.value)}
                placeholder={`${product.name} - ${product.category}`}
                className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E] h-20 resize-none"
              />
            </div>

            {/* Cost and Markup */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-lg font-bold text-[#B49B7E] mb-2">💰 Cost:</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E]"
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-[#B49B7E] mb-2">📈 Markup %:</label>
                <input
                  type="number"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  className="w-full px-3 py-3 bg-black/70 border-2 border-[#B49B7E]/50 rounded-lg text-[#F5F5DC] focus:border-[#B49B7E]"
                />
              </div>
            </div>

            {/* Final Price Display */}
            {cost && markup && (
              <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                <p className="text-lg font-bold text-green-400">
                  Final Price: ${(parseFloat(cost) * (1 + parseFloat(markup) / 100)).toFixed(2)}
                </p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={taxable}
                  onChange={(e) => setTaxable(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="taxable" className="text-lg font-bold text-[#B49B7E]">
                  💸 Taxable
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="selectionBoard"
                  checked={addToSelectionBoard}
                  onChange={(e) => setAddToSelectionBoard(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="selectionBoard" className="text-lg font-bold text-[#B49B7E]">
                  ✅ Add to Selection Board
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-8">
          <button
            onClick={handleHouzzSubmit}
            disabled={!selectedProject || !selectedRoom}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105"
            style={{ color: '#F5F5DC' }}
          >
            🏠 ADD TO HOUZZ PRO
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

export default HouzzIntegrationModal;