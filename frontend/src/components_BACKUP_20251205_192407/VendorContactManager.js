import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const VendorContactManager = ({ projectId }) => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    notes: '',
    category: 'furniture',
    project_id: projectId || null
  });

  const categories = [
    'furniture', 'fabric', 'wallpaper', 'lighting', 'flooring', 
    'paint', 'hardware', 'accessories', 'other'
  ];

  useEffect(() => {
    loadVendors();
  }, [projectId]);

  const loadVendors = async () => {
    try {
      const params = projectId ? `?project_id=${projectId}` : '';
      const res = await axios.get(`${API}/vendors${params}`);
      setVendors(res.data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await axios.put(`${API}/vendors/${editingVendor._id}`, formData);
      } else {
        await axios.post(`${API}/vendors`, formData);
      }
      loadVendors();
      resetForm();
    } catch (error) {
      alert('Error saving vendor: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowForm(true);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await axios.delete(`${API}/vendors/${vendorId}`);
      loadVendors();
    } catch (error) {
      alert('Error deleting vendor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      notes: '',
      category: 'furniture',
      project_id: projectId || null
    });
    setEditingVendor(null);
    setShowForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📞 Vendor Contact Manager</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={styles.addButton}
        >
          {showForm ? '❌ Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Vendor Name *"
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
          <input
            type="url"
            placeholder="Website URL"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            style={styles.input}
          />
          <div style={styles.formRow}>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Login Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Login Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={styles.textarea}
            rows="3"
          />
          <button type="submit" style={styles.saveButton}>
            {editingVendor ? '✅ Update Vendor' : '➕ Add Vendor'}
          </button>
        </form>
      )}

      <div style={styles.vendorGrid}>
        {vendors.map(vendor => (
          <div key={vendor._id} style={styles.vendorCard}>
            <div style={styles.vendorHeader}>
              <h3 style={styles.vendorName}>{vendor.name}</h3>
              <span style={styles.categoryBadge}>{vendor.category}</span>
            </div>
            
            {vendor.website && (
              <div style={styles.vendorInfo}>
                <span style={styles.label}>🌐 Website:</span>
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {vendor.website}
                </a>
              </div>
            )}
            
            {vendor.email && (
              <div style={styles.vendorInfo}>
                <span style={styles.label}>📧 Email:</span>
                <span>{vendor.email}</span>
              </div>
            )}
            
            {vendor.phone && (
              <div style={styles.vendorInfo}>
                <span style={styles.label}>📞 Phone:</span>
                <span>{vendor.phone}</span>
              </div>
            )}
            
            {vendor.username && (
              <div style={styles.loginInfo}>
                <div style={styles.vendorInfo}>
                  <span style={styles.label}>👤 Username:</span>
                  <span>{vendor.username}</span>
                </div>
                <div style={styles.vendorInfo}>
                  <span style={styles.label}>🔑 Password:</span>
                  <span>{vendor.password ? '••••••••' : 'Not set'}</span>
                </div>
              </div>
            )}
            
            {vendor.notes && (
              <div style={styles.notes}>
                <span style={styles.label}>📝 Notes:</span>
                <p style={styles.notesText}>{vendor.notes}</p>
              </div>
            )}
            
            <div style={styles.vendorActions}>
              <button onClick={() => handleEdit(vendor)} style={styles.editButton}>
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(vendor._id)} style={styles.deleteButton}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && !showForm && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>📦 No vendors yet. Add your first vendor to get started!</p>
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
    marginBottom: '30px',
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
  vendorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  vendorCard: {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid #333'
  },
  vendorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #444'
  },
  vendorName: {
    fontSize: '20px',
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
  vendorInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#e0e0e0'
  },
  label: {
    fontWeight: 'bold',
    color: '#b0b0b0',
    marginRight: '10px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none'
  },
  loginInfo: {
    backgroundColor: '#1a1a1a',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    marginBottom: '15px'
  },
  notes: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px'
  },
  notesText: {
    margin: '8px 0 0 0',
    color: '#e0e0e0',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  vendorActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '15px',
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

export default VendorContactManager;
