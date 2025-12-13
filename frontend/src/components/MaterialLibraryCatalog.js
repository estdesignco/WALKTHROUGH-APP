import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Search, Filter, Grid, List, Upload, Image, X, Edit2, Trash2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Material Library - Catalog Style with Photo Upload
 * A Pinterest-style catalog view for materials with image upload support
 */
export default function MaterialLibraryCatalog({ projectId, onBack }) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'fabric',
    manufacturer: '',
    sku: '',
    color: '',
    color_code: '',
    pattern: '',
    width: null,
    repeat: null,
    price_per_unit: null,
    unit: 'yard',
    swatch_url: '',
    photo_data: '',
    notes: '',
    tags: [],
    project_id: projectId || null
  });

  const categories = [
    { id: 'fabric', name: 'Fabric', icon: '🧵', color: 'from-purple-500 to-purple-700' },
    { id: 'wallpaper', name: 'Wallpaper', icon: '🎨', color: 'from-pink-500 to-pink-700' },
    { id: 'paint', name: 'Paint', icon: '🖌️', color: 'from-blue-500 to-blue-700' },
    { id: 'tile', name: 'Tile', icon: '🔲', color: 'from-cyan-500 to-cyan-700' },
    { id: 'flooring', name: 'Flooring', icon: '🪵', color: 'from-amber-500 to-amber-700' },
    { id: 'lighting', name: 'Lighting', icon: '💡', color: 'from-yellow-500 to-yellow-700' },
    { id: 'hardware', name: 'Hardware', icon: '🔧', color: 'from-gray-500 to-gray-700' },
    { id: 'accessory', name: 'Accessory', icon: '✨', color: 'from-emerald-500 to-emerald-700' },
    { id: 'other', name: 'Other', icon: '📦', color: 'from-stone-500 to-stone-700' }
  ];

  useEffect(() => {
    loadMaterials();
  }, [projectId, searchTerm, filterCategory]);

  const loadMaterials = async () => {
    try {
      let url = `${API}/materials`;
      const params = [];
      if (projectId) params.push(`project_id=${projectId}`);
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (searchTerm) params.push(`search=${searchTerm}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const res = await axios.get(url);
      setMaterials(res.data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setPreviewImage(base64);
        setFormData({ ...formData, photo_data: base64, swatch_url: '' });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      alert('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      if (editingMaterial) {
        await axios.put(`${API}/materials/${editingMaterial._id || editingMaterial.id}`, submitData);
      } else {
        await axios.post(`${API}/materials`, submitData);
      }
      loadMaterials();
      resetForm();
    } catch (error) {
      alert('Error saving material: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData(material);
    setPreviewImage(material.photo_data || material.swatch_url || null);
    setShowForm(true);
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await axios.delete(`${API}/materials/${materialId}`);
      loadMaterials();
    } catch (error) {
      alert('Error deleting material');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'fabric',
      manufacturer: '',
      sku: '',
      color: '',
      color_code: '',
      pattern: '',
      width: null,
      repeat: null,
      price_per_unit: null,
      unit: 'yard',
      swatch_url: '',
      photo_data: '',
      notes: '',
      tags: [],
      project_id: projectId || null
    });
    setEditingMaterial(null);
    setShowForm(false);
    setPreviewImage(null);
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[categories.length - 1];
  };

  const getImageUrl = (material) => {
    return material.photo_data || material.swatch_url || null;
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,25,0.95) 100%)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#D4A574]">Material Library</h1>
              <p className="text-gray-400 text-sm">Your curated collection of fabrics, finishes & more</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            Add Material
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search materials, SKUs, manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1 border border-[#B49B7E]/30">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#D4A574] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#D4A574] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterCategory === '' 
                ? 'bg-[#D4A574] text-white' 
                : 'bg-black/30 text-gray-400 hover:text-white border border-[#B49B7E]/30'
            }`}
          >
            All ({materials.length})
          </button>
          {categories.map(cat => {
            const count = materials.filter(m => m.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === cat.id 
                    ? 'bg-[#D4A574] text-white' 
                    : 'bg-black/30 text-gray-400 hover:text-white border border-[#B49B7E]/30'
                }`}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#D4A574]/30">
            <div className="sticky top-0 bg-[#1a1a2e] px-6 py-4 border-b border-[#B49B7E]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#D4A574]">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo Upload Section */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Material Photo</label>
                <div className="flex gap-4 items-start">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-40 h-40 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-colors ${
                      previewImage ? 'border-[#D4A574]' : 'border-[#B49B7E]/30 hover:border-[#D4A574]'
                    }`}
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : uploadingImage ? (
                      <div className="text-[#D4A574] animate-pulse">Uploading...</div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Camera size={32} className="mx-auto mb-2" />
                        <span className="text-sm">Click to upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm mb-2">Or paste image URL:</p>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.swatch_url}
                      onChange={(e) => {
                        setFormData({ ...formData, swatch_url: e.target.value, photo_data: '' });
                        setPreviewImage(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm focus:border-[#D4A574] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Material Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">SKU / Product Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Pattern</label>
                  <input
                    type="text"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit || ''}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  >
                    <option value="yard">Yard</option>
                    <option value="roll">Roll</option>
                    <option value="sqft">Sq Ft</option>
                    <option value="gallon">Gallon</option>
                    <option value="each">Each</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Width (inches)</label>
                  <input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#B49B7E]/30 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  {editingMaterial ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials Catalog Grid */}
      <div className="max-w-7xl mx-auto">
        {materials.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterCategory ? 'No materials match your search' : 'Your Material Library is Empty'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterCategory 
                ? 'Try adjusting your search or filters'
                : 'Start building your collection of fabrics, finishes, and more'}
            </p>
            {!searchTerm && !filterCategory && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Add Your First Material
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Pinterest-style Masonry Grid */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {materials.map(material => {
              const catInfo = getCategoryInfo(material.category);
              const imageUrl = getImageUrl(material);
              
              return (
                <div
                  key={material._id || material.id}
                  className="break-inside-avoid mb-4 group"
                >
                  <div className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-[#B49B7E]/20 hover:border-[#D4A574]/50 transition-all hover:shadow-lg hover:shadow-[#D4A574]/10">
                    {/* Image Section */}
                    {imageUrl ? (
                      <div className="relative aspect-square overflow-hidden bg-black/30">
                        <img
                          src={imageUrl}
                          alt={material.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-6xl">${catInfo.icon}</div>`;
                          }}
                        />
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(material._id || material.id)}
                            className="p-2 rounded-full bg-red-500/50 hover:bg-red-500/70 text-white transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-black/50 to-black/30 flex items-center justify-center relative group">
                        <span className="text-6xl">{catInfo.icon}</span>
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(material._id || material.id)}
                            className="p-2 rounded-full bg-red-500/50 hover:bg-red-500/70 text-white transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Info Section */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-white text-lg leading-tight">{material.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${catInfo.color} text-white whitespace-nowrap`}>
                          {catInfo.name}
                        </span>
                      </div>
                      
                      {material.manufacturer && (
                        <p className="text-gray-400 text-sm mb-1">by {material.manufacturer}</p>
                      )}
                      
                      {material.color && (
                        <p className="text-gray-500 text-sm">
                          {material.color} {material.pattern && `• ${material.pattern}`}
                        </p>
                      )}
                      
                      {material.price_per_unit && (
                        <p className="text-[#D4A574] font-semibold mt-2">
                          ${material.price_per_unit.toFixed(2)} / {material.unit}
                        </p>
                      )}
                      
                      {material.sku && (
                        <p className="text-gray-600 text-xs mt-1">SKU: {material.sku}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {materials.map(material => {
              const catInfo = getCategoryInfo(material.category);
              const imageUrl = getImageUrl(material);
              
              return (
                <div
                  key={material._id || material.id}
                  className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-[#B49B7E]/20 hover:border-[#D4A574]/50 transition-all flex"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-24 flex-shrink-0 bg-black/30 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={material.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{catInfo.icon}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{material.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${catInfo.color} text-white`}>
                          {catInfo.name}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {material.manufacturer && `${material.manufacturer} • `}
                        {material.color && `${material.color} • `}
                        {material.sku && `SKU: ${material.sku}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {material.price_per_unit && (
                        <span className="text-[#D4A574] font-semibold">
                          ${material.price_per_unit.toFixed(2)}/{material.unit}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(material._id || material.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
