import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const BudgetTracker = ({ projectId }) => {
  const [budgetData, setBudgetData] = useState({ items: [], summary: {} });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: projectId,
    category: 'furniture',
    item_name: '',
    estimated_cost: '',
    actual_cost: '',
    quantity: 1,
    notes: '',
    status: 'pending'
  });

  const categories = [
    'furniture', 'fabric', 'wallpaper', 'paint', 'flooring',
    'lighting', 'labor', 'hardware', 'accessories', 'other'
  ];

  const statuses = ['pending', 'ordered', 'received', 'paid'];

  useEffect(() => {
    if (projectId) loadBudget();
  }, [projectId]);

  const loadBudget = async () => {
    try {
      const res = await axios.get(`${API}/budget/${projectId}`);
      setBudgetData(res.data);
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/budget`, formData);
      loadBudget();
      resetForm();
    } catch (error) {
      alert('Error adding budget item: ' + (error.response?.data?.detail || error.message));
    }
  };

  const updateItemStatus = async (itemId, status) => {
    try {
      await axios.put(`${API}/budget/${itemId}`, { status });
      loadBudget();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this budget item?')) return;
    try {
      await axios.delete(`${API}/budget/${itemId}`);
      loadBudget();
    } catch (error) {
      alert('Error deleting item');
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      category: 'furniture',
      item_name: '',
      estimated_cost: '',
      actual_cost: '',
      quantity: 1,
      notes: '',
      status: 'pending'
    });
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffa726',
      'ordered': '#42a5f5',
      'received': '#66bb6a',
      'paid': '#26a69a'
    };
    return colors[status] || '#999';
  };

  const { items = [], summary = {} } = budgetData;
  const isOverBudget = (summary.total_actual || 0) > (summary.total_estimated || 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>💰 Budget Tracker</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          {showForm ? '❌ Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Budget Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Estimated Total</div>
          <div style={styles.summaryValue}>
            ${(summary.total_estimated || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Actual Total</div>
          <div style={{...styles.summaryValue, color: isOverBudget ? '#f44336' : '#4caf50'}}>
            ${(summary.total_actual || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Difference</div>
          <div style={{...styles.summaryValue, color: isOverBudget ? '#f44336' : '#4caf50'}}>
            {isOverBudget ? '+' : ''}${Math.abs(summary.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{fontSize: '12px', color: '#b0b0b0', marginTop: '5px'}}>
            {isOverBudget ? 'Over Budget' : 'Under Budget'}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Items</div>
          <div style={styles.summaryValue}>{summary.item_count || 0}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Item Name *"
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
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
              type="number"
              step="0.01"
              placeholder="Estimated Cost *"
              value={formData.estimated_cost}
              onChange={(e) => setFormData({...formData, estimated_cost: parseFloat(e.target.value)})}
              required
              style={styles.input}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Actual Cost (optional)"
              value={formData.actual_cost}
              onChange={(e) => setFormData({...formData, actual_cost: parseFloat(e.target.value)})}
              style={styles.input}
            />
          </div>

          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              style={styles.input}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={styles.select}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={styles.textarea}
            rows="2"
          />

          <button type="submit" style={styles.saveButton}>
            ➕ Add Budget Item
          </button>
        </form>
      )}

      {/* Budget Items List */}
      <div style={styles.itemsList}>
        {items.map(item => (
          <div key={item._id} style={styles.itemCard}>
            <div style={styles.itemHeader}>
              <div>
                <h4 style={styles.itemName}>{item.item_name}</h4>
                <span style={styles.itemCategory}>{item.category}</span>
              </div>
              <div
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(item.status)
                }}
              >
                {item.status}
              </div>
            </div>

            <div style={styles.itemDetails}>
              <div style={styles.costRow}>
                <div style={styles.costItem}>
                  <span style={styles.costLabel}>Estimated:</span>
                  <span style={styles.costValue}>
                    ${(item.estimated_cost * item.quantity).toFixed(2)}
                  </span>
                </div>
                {item.actual_cost && (
                  <div style={styles.costItem}>
                    <span style={styles.costLabel}>Actual:</span>
                    <span style={styles.costValue}>
                      ${(item.actual_cost * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={styles.costItem}>
                  <span style={styles.costLabel}>Qty:</span>
                  <span style={styles.costValue}>{item.quantity}</span>
                </div>
              </div>

              {item.notes && (
                <div style={styles.itemNotes}>
                  📝 {item.notes}
                </div>
              )}
            </div>

            <div style={styles.itemActions}>
              <select
                value={item.status}
                onChange={(e) => updateItemStatus(item._id, e.target.value)}
                style={styles.statusSelect}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button onClick={() => deleteItem(item._id)} style={styles.deleteButton}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            💰 No budget items yet. Add your first item to start tracking!
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
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
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
    color: '#4caf50',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    border: '2px solid #333'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#b0b0b0',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  summaryValue: {
    fontSize: '28px',
    color: '#ffffff',
    fontWeight: 'bold'
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
    boxSizing: 'border-box'
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
    backgroundColor: '#4caf50',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%'
  },
  itemsList: {
    display: 'grid',
    gap: '15px'
  },
  itemCard: {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid #333'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #444'
  },
  itemName: {
    fontSize: '18px',
    color: '#ffffff',
    margin: '0 0 5px 0'
  },
  itemCategory: {
    fontSize: '12px',
    color: '#b0b0b0',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  itemDetails: {
    marginBottom: '15px'
  },
  costRow: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap'
  },
  costItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  costLabel: {
    fontSize: '12px',
    color: '#b0b0b0',
    fontWeight: 'bold'
  },
  costValue: {
    fontSize: '20px',
    color: '#ffffff',
    fontWeight: 'bold'
  },
  itemNotes: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#e0e0e0',
    lineHeight: '1.6'
  },
  itemActions: {
    display: 'flex',
    gap: '10px',
    paddingTop: '15px',
    borderTop: '1px solid #444'
  },
  statusSelect: {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    border: '2px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '10px 20px',
    backgroundColor: '#d32f2f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
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

export default BudgetTracker;
