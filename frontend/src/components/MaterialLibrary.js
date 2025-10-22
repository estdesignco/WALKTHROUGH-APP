import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const MaterialLibrary = ({ projectId }) => {
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
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
    notes: '',
    tags: [],
    project_id: projectId || null
  });

  const categories = [
    'fabric', 'wallpaper', 'paint', 'tile', 'flooring', 
    'lighting', 'hardware', 'accessory', 'other'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await axios.put(`${API}/materials/${editingMaterial._id}`, formData);
      } else {
        await axios.post(`${API}/materials`, formData);
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
      notes: '',
      tags: [],
      project_id: projectId || null
    });
    setEditingMaterial(null);
    setShowForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎨 Material Library</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={styles.addButton}
        >
          {showForm ? '❌ Cancel' : '+ Add Material'}
        </button>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Search materials, SKUs, manufacturers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Material Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={styles.input}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={styles.select}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="SKU / Product Code"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              style={styles.input}
            />
          </div>

          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Color Name"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Color Code (hex, RGB, etc.)"
              value={formData.color_code}
              onChange={(e) => setFormData({...formData, color_code: e.target.value})}
              style={styles.input}
            />
          </div>

          <input
            type="text"
            placeholder="Pattern Name"
            value={formData.pattern}
            onChange={(e) => setFormData({...formData, pattern: e.target.value})}
            style={styles.input}
          />

          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Width (inches)"
              value={formData.width || ''}
              onChange={(e) => setFormData({...formData, width: parseFloat(e.target.value)})}
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Pattern Repeat (inches)"
              value={formData.repeat || ''}
              onChange={(e) => setFormData({...formData, repeat: parseFloat(e.target.value)})}
              style={styles.input}
            />
          </div>

          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Price per Unit"
              value={formData.price_per_unit || ''}
              onChange={(e) => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})}
              style={styles.input}
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              style={styles.select}
            >
              <option value="yard">Yard</option>
              <option value="roll">Roll</option>
              <option value="sqft">Square Foot</option>
              <option value="gallon">Gallon</option>
              <option value="each">Each</option>
            </select>
          </div>

          <input
            type="url"
            placeholder="Swatch/Image URL"
            value={formData.swatch_url}
            onChange={(e) => setFormData({...formData, swatch_url: e.target.value})}
            style={styles.input}
          />

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={styles.textarea}
            rows="3"
          />

          <button type="submit" style={styles.saveButton}>
            {editingMaterial ? '✅ Update Material' : '➕ Add Material'}
          </button>
        </form>
      )}

      <div style={styles.materialGrid}>
        {materials.map(material => (
          <div key={material._id} style={styles.materialCard}>
            {material.swatch_url && (
              <div style={styles.swatchContainer}>
                <img 
                  src={material.swatch_url} 
                  alt={material.name}
                  style={styles.swatch}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            
            <div style={styles.materialHeader}>
              <h3 style={styles.materialName}>{material.name}</h3>
              <span style={styles.categoryBadge}>{material.category}</span>
            </div>
            
            {material.manufacturer && (
              <div style={styles.materialInfo}>
                <span style={styles.label}>🏭 Manufacturer:</span>
                <span>{material.manufacturer}</span>
              </div>
            )}
            
            {material.sku && (
              <div style={styles.materialInfo}>
                <span style={styles.label}>📊 SKU:</span>
                <span>{material.sku}</span>
              </div>
            )}
            
            {material.color && (
              <div style={styles.materialInfo}>
                <span style={styles.label}>🎨 Color:</span>
                <span>{material.color} {material.color_code && `(${material.color_code})`}</span>
              </div>
            )}
            
            {material.pattern && (
              <div style={styles.materialInfo}>
                <span style={styles.label}>🔶 Pattern:</span>
                <span>{material.pattern}</span>
              </div>
            )}
            
            {(material.width || material.repeat) && (
              <div style={styles.specs}>
                {material.width && (
                  <div style={styles.spec}>
                    <span style={styles.specLabel}>Width:</span>
                    <span>{material.width}"</span>
                  </div>
                )}
                {material.repeat && (
                  <div style={styles.spec}>
                    <span style={styles.specLabel}>Repeat:</span>
                    <span>{material.repeat}"</span>
                  </div>
                )}
              </div>
            )}
            
            {material.price_per_unit && (
              <div style={styles.price}>
                <span style={styles.priceLabel}>Price:</span>
                <span style={styles.priceValue}>
                  ${material.price_per_unit.toFixed(2)} / {material.unit}
                </span>
              </div>
            )}
            
            {material.notes && (
              <div style={styles.notes}>
                <span style={styles.label}>📝 Notes:</span>
                <p style={styles.notesText}>{material.notes}</p>
              </div>
            )}
            
            <div style={styles.materialActions}>
              <button onClick={() => handleEdit(material)} style={styles.editButton}>
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(material._id)} style={styles.deleteButton}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {searchTerm || filterCategory 
              ? '🔍 No materials match your search'
              : '🎨 No materials yet. Add your first material to get started!'}
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderRadius: '15px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px'
  },
  title: {
    fontSize: '28px',
    color: '#ffffff',
    margin: 0
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  filterBar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '15px',
    marginBottom: '20px'
  },
  searchInput: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    fontSize: '16px'
  },
  filterSelect: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    fontSize: '16px',
    minWidth: '200px'
  },
  form: {
    backgroundColor: '#2a2a2a',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '15px'
  },
  select: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '15px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  saveButton: {
    padding: '15px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%'
  },
  materialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  materialCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '10px',
    border: '2px solid #333',
    overflow: 'hidden'
  },
  swatchContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a'
  },
  swatch: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  materialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #444'
  },
  materialName: {
    fontSize: '18px',
    color: '#ffffff',
    margin: 0
  },
  categoryBadge: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  materialInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 20px',
    fontSize: '14px',
    color: '#e0e0e0'
  },
  label: {
    fontWeight: 'bold',
    color: '#b0b0b0',
    marginRight: '10px'
  },
  specs: {
    display: 'flex',
    gap: '20px',
    padding: '15px 20px',
    backgroundColor: '#1a1a1a',
    margin: '10px 0'
  },
  spec: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  specLabel: {
    fontSize: '12px',
    color: '#b0b0b0',
    fontWeight: 'bold'
  },
  price: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#667eea20',
    margin: '10px 0'
  },
  priceLabel: {
    fontSize: '14px',
    color: '#b0b0b0',
    fontWeight: 'bold'
  },
  priceValue: {
    fontSize: '20px',
    color: '#667eea',
    fontWeight: 'bold'
  },
  notes: {
    padding: '15px 20px'
  },
  notesText: {
    margin: '8px 0 0 0',
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  materialActions: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    borderTop: '1px solid #444'
  },
  editButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#d32f2f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#2a2a2a',
    borderRadius: '10px'
  },
  emptyText: {
    fontSize: '18px',
    color: '#b0b0b0',
    margin: 0
  }
};

export default MaterialLibrary;
