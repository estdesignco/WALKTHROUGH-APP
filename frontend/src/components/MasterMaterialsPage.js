import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Upload, Image, X, Check, 
  Package, Tag, DollarSign, Ruler, Clock, Building2, Grid3X3
} from 'lucide-react';
import BackButton from './BackButton';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const MasterMaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'fabric',
    manufacturer: '',
    vendor: '',
    sku: '',
    color: '',
    color_code: '',
    pattern: '',
    width: '',
    height: '',
    repeat: '',
    price_per_unit: '',
    unit: 'yard',
    lead_time: '',
    notes: '',
    tags: ''
  });

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API}/master/materials`;
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (filterCategory) params.push(`category=${encodeURIComponent(filterCategory)}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url);
      setMaterials(response.data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory]);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/master/materials/categories/list`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadCategories();
  }, [loadMaterials]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add photo if selected
      if (selectedPhoto) {
        formDataToSend.append('photo', selectedPhoto);
      }
      
      if (editingMaterial) {
        // For editing, use PUT with JSON
        const updateData = {...formData};
        if (updateData.width) updateData.width = parseFloat(updateData.width);
        if (updateData.height) updateData.height = parseFloat(updateData.height);
        if (updateData.repeat) updateData.repeat = parseFloat(updateData.repeat);
        if (updateData.price_per_unit) updateData.price_per_unit = parseFloat(updateData.price_per_unit);
        if (updateData.tags) updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(t => t);
        
        await axios.put(`${API}/master/materials/${editingMaterial.id}`, updateData);
        
        // Upload photo separately if changed
        if (selectedPhoto) {
          const photoData = new FormData();
          photoData.append('photo', selectedPhoto);
          await axios.post(`${API}/master/materials/${editingMaterial.id}/photo`, photoData);
        }
      } else {
        // For creating, use POST with form data
        await axios.post(`${API}/master/materials/with-photo`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      loadMaterials();
      resetForm();
    } catch (error) {
      alert('Error saving material: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name || '',
      category: material.category || 'fabric',
      manufacturer: material.manufacturer || '',
      vendor: material.vendor || '',
      sku: material.sku || '',
      color: material.color || '',
      color_code: material.color_code || '',
      pattern: material.pattern || '',
      width: material.width || '',
      height: material.height || '',
      repeat: material.repeat || '',
      price_per_unit: material.price_per_unit || '',
      unit: material.unit || 'yard',
      lead_time: material.lead_time || '',
      notes: material.notes || '',
      tags: (material.tags || []).join(', ')
    });
    setPhotoPreview(material.photo_url || '');
    setShowForm(true);
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await axios.delete(`${API}/master/materials/${materialId}`);
      loadMaterials();
    } catch (error) {
      alert('Error deleting material: ' + error.message);
    }
  };

  const viewMaterialPhoto = async (material) => {
    try {
      const response = await axios.get(`${API}/master/materials/${material.id}/photo`);
      setViewingMaterial({
        ...material,
        photo_data: response.data.photo_data
      });
    } catch (error) {
      console.error('Error loading photo:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'fabric',
      manufacturer: '',
      vendor: '',
      sku: '',
      color: '',
      color_code: '',
      pattern: '',
      width: '',
      height: '',
      repeat: '',
      price_per_unit: '',
      unit: 'yard',
      lead_time: '',
      notes: '',
      tags: ''
    });
    setEditingMaterial(null);
    setSelectedPhoto(null);
    setPhotoPreview('');
    setShowForm(false);
  };

  const categoryLabels = {
    fabric: '🧵 Fabric',
    wallpaper: '🎨 Wallpaper',
    paint: '🖌️ Paint',
    tile: '🔲 Tile',
    flooring: '🪵 Flooring',
    stone: '🪨 Stone',
    wood: '🌳 Wood',
    metal: '⚙️ Metal',
    glass: '🪟 Glass',
    hardware: '🔩 Hardware',
    lighting: '💡 Lighting',
    trim: '📏 Trim',
    molding: '🖼️ Molding',
    countertop: '🍽️ Countertop',
    backsplash: '🧱 Backsplash',
    carpet: '🟫 Carpet',
    rug: '🟤 Rug',
    window_treatment: '🪟 Window Treatment',
    upholstery: '🛋️ Upholstery',
    leather: '👜 Leather',
    accessory: '✨ Accessory',
    other: '📦 Other'
  };

  return (
    <div className="min-h-screen bg-black text-stone-300 p-6">
      <BackButton />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#6b5745] flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-[#D4C5A9]">Master Materials</h1>
              <p className="text-stone-500">Global materials library with photo uploads</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b7355] to-[#a08060] text-white rounded-lg hover:from-[#9b8365] hover:to-[#b09070] transition-all shadow-lg"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Add Material'}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search materials by name, SKU, manufacturer, color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355] min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl text-[#D4C5A9] mb-4">
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Photo Upload */}
                <div className="md:col-span-2 lg:col-span-1 lg:row-span-3">
                  <label className="block text-sm text-stone-500 mb-1">Photo/Swatch</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-stone-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#8b7355] transition-colors overflow-hidden"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-stone-600 mb-2" />
                        <span className="text-stone-500 text-sm">Click to upload photo</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setSelectedPhoto(null); setPhotoPreview(''); }}
                      className="mt-2 text-sm text-red-400 hover:text-red-300"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                
                {/* Form Fields */}
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Name *</label>
                      <input
                        type="text"
                        placeholder="Material Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">SKU</label>
                      <input
                        type="text"
                        placeholder="Product SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Manufacturer</label>
                      <input
                        type="text"
                        placeholder="Brand/Manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Vendor</label>
                      <input
                        type="text"
                        placeholder="Supplier/Vendor"
                        value={formData.vendor}
                        onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Color</label>
                      <input
                        type="text"
                        placeholder="Color Name"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Pattern</label>
                      <input
                        type="text"
                        placeholder="Pattern Name"
                        value={formData.pattern}
                        onChange={(e) => setFormData({...formData, pattern: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Price per Unit</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      >
                        <option value="yard">Yard</option>
                        <option value="sqft">Sq. Ft.</option>
                        <option value="roll">Roll</option>
                        <option value="each">Each</option>
                        <option value="linear_ft">Linear Ft.</option>
                        <option value="gallon">Gallon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Width (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Width"
                        value={formData.width}
                        onChange={(e) => setFormData({...formData, width: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Repeat (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Pattern Repeat"
                        value={formData.repeat}
                        onChange={(e) => setFormData({...formData, repeat: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-500 mb-1">Lead Time</label>
                      <input
                        type="text"
                        placeholder="e.g., 2-3 weeks"
                        value={formData.lead_time}
                        onChange={(e) => setFormData({...formData, lead_time: e.target.value})}
                        className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-stone-500 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., modern, neutral, durable"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#8b7355] to-[#a08060] text-white rounded-lg hover:from-[#9b8365] hover:to-[#b09070] transition-all"
                >
                  <Check className="w-4 h-4" />
                  {editingMaterial ? 'Update Material' : 'Save Material'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-stone-700 text-stone-300 rounded-lg hover:bg-stone-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Materials Grid */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-stone-700 mb-4" />
            <p className="text-stone-500">No materials found</p>
            <p className="text-stone-600 text-sm">Add your first material to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {materials.map(material => (
              <div
                key={material.id}
                className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden hover:border-[#8b7355] transition-all group"
              >
                {/* Photo/Thumbnail */}
                <div 
                  className="w-full h-40 bg-stone-800 flex items-center justify-center cursor-pointer"
                  onClick={() => viewMaterialPhoto(material)}
                >
                  {material.photo_url ? (
                    <img src={material.photo_url} alt={material.name} className="w-full h-full object-cover" />
                  ) : material.has_photo ? (
                    <div className="text-center">
                      <Image className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                      <span className="text-xs text-stone-500">Click to view photo</span>
                    </div>
                  ) : (
                    <div className="text-6xl">
                      {categoryLabels[material.category]?.split(' ')[0] || '📦'}
                    </div>
                  )}
                </div>
                
                {/* Material Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[#D4C5A9] font-medium">{material.name}</h3>
                      <span className="text-xs text-stone-500">{categoryLabels[material.category] || material.category}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-1.5 text-stone-500 hover:text-[#8b7355] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-stone-400">
                    {material.manufacturer && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {material.manufacturer}
                      </div>
                    )}
                    {material.sku && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        SKU: {material.sku}
                      </div>
                    )}
                    {material.color && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: material.color_code || '#888'}} />
                        {material.color}
                      </div>
                    )}
                    {material.price_per_unit && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${material.price_per_unit}/{material.unit}
                      </div>
                    )}
                    {material.width && (
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {material.width}" wide
                      </div>
                    )}
                    {material.lead_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {material.lead_time}
                      </div>
                    )}
                  </div>
                  
                  {material.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-stone-800 text-stone-500 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {viewingMaterial && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingMaterial(null)}
        >
          <div className="bg-stone-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-700 flex items-center justify-between">
              <h3 className="text-[#D4C5A9] font-medium">{viewingMaterial.name}</h3>
              <button onClick={() => setViewingMaterial(null)} className="text-stone-500 hover:text-stone-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {viewingMaterial.photo_data ? (
                <img src={viewingMaterial.photo_data} alt={viewingMaterial.name} className="w-full rounded-lg" />
              ) : (
                <div className="text-center py-12 text-stone-500">No photo available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterMaterialsPage;
