import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ProductClipperModal = ({ isOpen, onClose, scrapedData = {}, projects = [], mode = 'project' }) => {
  // mode can be 'project' (add to specific project) or 'catalog' (add to furniture catalog)
  const [formData, setFormData] = useState({
    productTitle: scrapedData.name || '',
    cost: scrapedData.cost || scrapedData.price || '',
    markup: '',
    taxable: true,
    clientDescription: scrapedData.description || '',
    category: '',
    vendor: scrapedData.vendor || '',
    projectId: '',
    room: '',
    manufacturer: scrapedData.vendor || '',
    sku: scrapedData.sku || '',
    dimensions: scrapedData.size || '',
    finishColor: scrapedData.finish_color || '',
    materials: '',
    msrp: scrapedData.cost || '',
    vendorDescription: '',
    internalNotes: '',
    tags: '',
    images: [scrapedData.image_url || ''],
    productUrl: scrapedData.link || ''
  });

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  // Load rooms when project is selected
  useEffect(() => {
    if (formData.projectId) {
      loadProjectRooms(formData.projectId);
    }
  }, [formData.projectId]);

  const loadProjectRooms = async (projectId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        setRooms(project.rooms || []);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleSaveToHouzzAndApp = async () => {
    // Validation based on mode
    if (mode === 'project') {
      if (!formData.productTitle || !formData.projectId || !formData.room || !formData.category) {
        alert('Please fill in required fields: Product Title, Project, Room, and Category');
        return;
      }
    } else {
      // Catalog mode - only need title, category, and vendor
      if (!formData.productTitle || !formData.category || !formData.vendor) {
        alert('Please fill in required fields: Product Title, Category, and Vendor');
        return;
      }
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      // Calculate retail price if markup exists
      const retailPrice = formData.markup ? parseFloat(formData.cost) * (1 + parseFloat(formData.markup) / 100) : parseFloat(formData.cost);

      // Prepare data
      const itemData = {
        name: formData.productTitle,
        vendor: formData.vendor || formData.manufacturer,
        manufacturer: formData.manufacturer,
        category: formData.category,
        cost: parseFloat(formData.cost) || 0,
        price: retailPrice,
        sku: formData.sku,
        dimensions: formData.dimensions,
        finish_color: formData.finishColor,
        image_url: formData.images[0],
        images: formData.images,
        product_url: formData.productUrl,
        remarks: formData.internalNotes,
        description: formData.clientDescription,
        materials: formData.materials,
        msrp: parseFloat(formData.msrp) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        taxable: formData.taxable
      };

      if (mode === 'catalog') {
        // CATALOG MODE: Save to furniture catalog only
        const catalogResponse = await fetch(`${backendUrl}/api/furniture-catalog/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });

        if (!catalogResponse.ok) {
          throw new Error('Failed to save to Furniture Catalog');
        }

        alert('✅ Furniture added to your searchable catalog!');
        onClose();
        window.location.reload();
        
      } else {
        // PROJECT MODE: Save to project AND catalog
        // 1. Save to our Furniture App
        const appResponse = await fetch(`${backendUrl}/api/clipper/save-to-app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: formData.projectId,
            roomName: formData.room,
            categoryName: formData.category,
            itemData: itemData
          })
        });

        if (!appResponse.ok) {
          throw new Error('Failed to save to Furniture App');
        }

        // 2. Also save to furniture catalog for future searches
        await fetch(`${backendUrl}/api/furniture-catalog/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });

        // 3. Save to Houzz Pro
        const houzzResponse = await fetch(`${backendUrl}/api/clipper/save-to-houzz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!houzzResponse.ok) {
          console.warn('Failed to save to Houzz Pro - continuing anyway');
        }

        alert('✅ Product saved successfully to Project, Catalog, and Houzz Pro!');
        onClose();
        window.location.reload(); // Refresh to show new item
      }

    } catch (error) {
      console.error('Error saving product:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#7AC142]">houzz</h2>
            <span className="text-gray-600">PRO</span>
            <button 
              onClick={onClose}
              className="ml-4 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Clear All
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Product Images */}
          <div className="flex gap-4">
            {formData.images[0] && (
              <img src={formData.images[0]} alt="Product" className="w-48 h-48 object-cover rounded border" />
            )}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                  +
                </div>
              ))}
            </div>
          </div>

          {/* Product Title */}
          <div>
            <input
              type="text"
              placeholder="Product Title (required)"
              value={formData.productTitle}
              onChange={(e) => setFormData({...formData, productTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7AC142] focus:border-transparent"
            />
          </div>

          {/* Cost and Markup */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Cost"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="relative">
              <input
                type="number"
                placeholder="Markup %"
                value={formData.markup}
                onChange={(e) => setFormData({...formData, markup: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">%</span>
            </div>
          </div>

          {/* Taxable */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.taxable}
              onChange={(e) => setFormData({...formData, taxable: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-gray-700">Taxable</span>
          </label>

          {/* Client Description */}
          <textarea
            placeholder="Client Description"
            value={formData.clientDescription}
            onChange={(e) => setFormData({...formData, clientDescription: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none"
          />

          {/* Category */}
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Category (required)</option>
            <option value="Furniture">Furniture</option>
            <option value="Lighting">Lighting</option>
            <option value="Accessories">Accessories</option>
            <option value="Art">Art</option>
            <option value="Rugs">Rugs</option>
            <option value="Window Treatments">Window Treatments</option>
          </select>

          {/* Vendor */}
          <input
            type="text"
            placeholder="Select a Vendor or Subcontractor"
            value={formData.vendor}
            onChange={(e) => setFormData({...formData, vendor: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />

          {/* Project */}
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({...formData, projectId: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          {/* Room */}
          <select
            value={formData.room}
            onChange={(e) => setFormData({...formData, room: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={!formData.projectId}
          >
            <option value="">Select Room</option>
            {rooms.map((room, idx) => (
              <option key={idx} value={room.name}>{room.name}</option>
            ))}
          </select>

          {/* Additional Details */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer font-semibold text-lg flex items-center gap-2">
              Additional Details
              <span className="text-xl">▼</span>
            </summary>
            <div className="mt-4 space-y-4">
              <input
                type="text"
                placeholder="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Finish/Color"
                value={formData.finishColor}
                onChange={(e) => setFormData({...formData, finishColor: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Materials"
                value={formData.materials}
                onChange={(e) => setFormData({...formData, materials: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="MSRP"
                value={formData.msrp}
                onChange={(e) => setFormData({...formData, msrp: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Description for the Vendor"
                value={formData.vendorDescription}
                onChange={(e) => setFormData({...formData, vendorDescription: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none"
              />
              <textarea
                placeholder="Internal Notes"
                value={formData.internalNotes}
                onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </details>

          {/* Save Button */}
          <button
            onClick={handleSaveToHouzzAndApp}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-lg text-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save to Houzz Pro & Furniture App'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductClipperModal;