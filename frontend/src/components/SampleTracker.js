import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, Save, X, Filter, 
  ArrowUpDown, Clock, CheckCircle, AlertCircle, Truck, MapPin,
  Calendar, Building2, Tag, Eye, RotateCcw, Send, Download
} from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Sample Tracking
 * Track fabric, material, and finish samples
 * Features:
 * - Track sample orders and deliveries
 * - Status tracking (Requested, Shipped, Received, Returned)
 * - Link samples to rooms/projects
 * - Due date reminders
 */
export default function SampleTracker({ projectId }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [viewingSample, setViewingSample] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    type: 'fabric',
    sku: '',
    color: '',
    room: '',
    status: 'requested',
    request_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    received_date: '',
    returned_date: '',
    tracking_number: '',
    notes: '',
    image_url: '',
    cost: 0,
    return_required: false
  });

  // Sample types
  const sampleTypes = [
    { id: 'fabric', name: 'Fabric', icon: '🧵', color: '#8B5CF6' },
    { id: 'wallcovering', name: 'Wallcovering', icon: '🎨', color: '#EC4899' },
    { id: 'tile', name: 'Tile', icon: '🔲', color: '#06B6D4' },
    { id: 'stone', name: 'Stone', icon: '🪨', color: '#78716C' },
    { id: 'wood', name: 'Wood', icon: '🪵', color: '#D97706' },
    { id: 'carpet', name: 'Carpet', icon: '🟫', color: '#B45309' },
    { id: 'hardware', name: 'Hardware', icon: '🔩', color: '#6B7280' },
    { id: 'paint', name: 'Paint', icon: '🖌️', color: '#10B981' },
    { id: 'other', name: 'Other', icon: '📦', color: '#64748B' }
  ];

  // Status definitions
  const statuses = [
    { id: 'requested', name: 'Requested', color: '#F59E0B', icon: Clock },
    { id: 'shipped', name: 'Shipped', color: '#3B82F6', icon: Truck },
    { id: 'received', name: 'Received', color: '#10B981', icon: CheckCircle },
    { id: 'in_use', name: 'In Use', color: '#8B5CF6', icon: Eye },
    { id: 'returned', name: 'Returned', color: '#6B7280', icon: RotateCcw },
    { id: 'overdue', name: 'Overdue', color: '#EF4444', icon: AlertCircle }
  ];

  // Load samples
  useEffect(() => {
    loadSamples();
  }, [projectId]);

  const loadSamples = async () => {
    try {
      const response = await fetch(`${API_URL}/samples${projectId ? `?project_id=${projectId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setSamples(data.samples || []);
      } else {
        // Load from localStorage as fallback
        const saved = localStorage.getItem(`samples-${projectId || 'all'}`);
        if (saved) {
          setSamples(JSON.parse(saved));
        } else {
          // Default sample data
          setSamples([
            {
              id: '1',
              name: 'Crypton Performance Velvet - Navy',
              vendor: 'Kravet',
              type: 'fabric',
              sku: 'KR-35785.50',
              color: 'Navy Blue',
              room: 'Living Room',
              status: 'received',
              request_date: '2024-12-01',
              expected_date: '2024-12-08',
              received_date: '2024-12-06',
              tracking_number: '1Z999AA10123456784',
              notes: 'For sofa upholstery - client approved',
              cost: 0,
              return_required: true,
              return_by: '2025-01-06'
            },
            {
              id: '2',
              name: 'Calacatta Gold Marble',
              vendor: 'ABC Stone',
              type: 'stone',
              sku: 'CGM-001',
              color: 'White/Gold',
              room: 'Kitchen',
              status: 'shipped',
              request_date: '2024-12-05',
              expected_date: '2024-12-12',
              tracking_number: 'FX123456789',
              notes: 'For kitchen island counter',
              cost: 25,
              return_required: false
            },
            {
              id: '3',
              name: 'Benjamin Moore White Dove',
              vendor: 'Local Paint Store',
              type: 'paint',
              sku: 'BM-OC-17',
              color: 'White',
              room: 'Master Bedroom',
              status: 'requested',
              request_date: '2024-12-10',
              expected_date: '2024-12-15',
              notes: 'Paint chip for wall color',
              cost: 0,
              return_required: false
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading samples:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save sample
  const saveSample = async () => {
    try {
      const sampleData = {
        ...formData,
        id: editingSample?.id || Date.now().toString(),
        project_id: projectId,
        created_at: editingSample?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Determine status based on dates
      if (formData.returned_date) {
        sampleData.status = 'returned';
      } else if (formData.received_date) {
        sampleData.status = 'received';
      } else if (formData.tracking_number && formData.status === 'requested') {
        sampleData.status = 'shipped';
      }

      // Check for overdue
      if (sampleData.return_required && sampleData.return_by) {
        const returnBy = new Date(sampleData.return_by);
        const now = new Date();
        if (now > returnBy && sampleData.status !== 'returned') {
          sampleData.status = 'overdue';
        }
      }

      // Try API first
      const response = await fetch(`${API_URL}/samples`, {
        method: editingSample ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });

      if (response.ok) {
        loadSamples();
      } else {
        // Save locally
        const updated = editingSample
          ? samples.map(s => s.id === editingSample.id ? sampleData : s)
          : [...samples, sampleData];
        setSamples(updated);
        localStorage.setItem(`samples-${projectId || 'all'}`, JSON.stringify(updated));
      }

      setShowAddModal(false);
      setEditingSample(null);
      resetForm();
    } catch (error) {
      console.error('Error saving sample:', error);
      // Save locally on error
      const sampleData = {
        ...formData,
        id: editingSample?.id || Date.now().toString(),
        project_id: projectId
      };
      const updated = editingSample
        ? samples.map(s => s.id === editingSample.id ? sampleData : s)
        : [...samples, sampleData];
      setSamples(updated);
      localStorage.setItem(`samples-${projectId || 'all'}`, JSON.stringify(updated));
      setShowAddModal(false);
      setEditingSample(null);
      resetForm();
    }
  };

  // Delete sample
  const deleteSample = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sample?')) return;
    
    try {
      await fetch(`${API_URL}/samples/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting:', error);
    }
    
    const updated = samples.filter(s => s.id !== id);
    setSamples(updated);
    localStorage.setItem(`samples-${projectId || 'all'}`, JSON.stringify(updated));
  };

  // Mark as received
  const markAsReceived = async (sample) => {
    const updated = {
      ...sample,
      status: 'received',
      received_date: new Date().toISOString().split('T')[0]
    };
    
    const newSamples = samples.map(s => s.id === sample.id ? updated : s);
    setSamples(newSamples);
    localStorage.setItem(`samples-${projectId || 'all'}`, JSON.stringify(newSamples));
  };

  // Mark as returned
  const markAsReturned = async (sample) => {
    const updated = {
      ...sample,
      status: 'returned',
      returned_date: new Date().toISOString().split('T')[0]
    };
    
    const newSamples = samples.map(s => s.id === sample.id ? updated : s);
    setSamples(newSamples);
    localStorage.setItem(`samples-${projectId || 'all'}`, JSON.stringify(newSamples));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      vendor: '',
      type: 'fabric',
      sku: '',
      color: '',
      room: '',
      status: 'requested',
      request_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      received_date: '',
      returned_date: '',
      tracking_number: '',
      notes: '',
      image_url: '',
      cost: 0,
      return_required: false
    });
  };

  // Edit sample
  const handleEdit = (sample) => {
    setFormData(sample);
    setEditingSample(sample);
    setShowAddModal(true);
  };

  // Get type info
  const getTypeInfo = (typeId) => sampleTypes.find(t => t.id === typeId) || sampleTypes[8];
  
  // Get status info
  const getStatusInfo = (statusId) => statuses.find(s => s.id === statusId) || statuses[0];

  // Filter and sort samples
  const filteredSamples = useMemo(() => {
    let result = [...samples];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(search) ||
        s.vendor?.toLowerCase().includes(search) ||
        s.sku?.toLowerCase().includes(search) ||
        s.room?.toLowerCase().includes(search) ||
        s.color?.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }
    
    // Type filter
    if (filterType !== 'all') {
      result = result.filter(s => s.type === filterType);
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'due_date':
          aVal = a.expected_date || a.return_by || '9999-12-31';
          bVal = b.expected_date || b.return_by || '9999-12-31';
          break;
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'vendor':
          aVal = a.vendor || '';
          bVal = b.vendor || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [samples, searchTerm, filterStatus, filterType, sortBy, sortOrder]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const requested = samples.filter(s => s.status === 'requested').length;
    const shipped = samples.filter(s => s.status === 'shipped').length;
    const received = samples.filter(s => s.status === 'received' || s.status === 'in_use').length;
    const overdue = samples.filter(s => {
      if (s.return_required && s.return_by && s.status !== 'returned') {
        return new Date() > new Date(s.return_by);
      }
      return false;
    }).length;
    
    return { requested, shipped, received, overdue, total: samples.length };
  }, [samples]);

  // Export samples
  const exportSamples = () => {
    const csv = [
      ['Name', 'Vendor', 'Type', 'SKU', 'Color', 'Room', 'Status', 'Request Date', 'Expected Date', 'Received Date', 'Tracking #', 'Notes'].join(','),
      ...samples.map(s => [
        `"${s.name}"`,
        `"${s.vendor}"`,
        s.type,
        s.sku,
        `"${s.color}"`,
        `"${s.room}"`,
        s.status,
        s.request_date,
        s.expected_date,
        s.received_date,
        s.tracking_number,
        `"${s.notes}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-tracking.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4A574] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#D4A574] flex items-center gap-3">
            <Package size={28} />
            Sample Tracking
          </h2>
          <p className="text-gray-400 mt-1">Track fabric, material, and finish samples</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportSamples}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574] text-white hover:bg-[#B49B7E]"
          >
            <Plus size={18} />
            Add Sample
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A574]/20 flex items-center justify-center">
              <Package size={20} className="text-[#D4A574]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm">Total Samples</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.requested}</p>
              <p className="text-gray-400 text-sm">Requested</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Truck size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.shipped}</p>
              <p className="text-gray-400 text-sm">In Transit</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.received}</p>
              <p className="text-gray-400 text-sm">Received</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              <p className="text-gray-400 text-sm">Overdue Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-black/20 border border-[#D4A574]/20">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search samples, vendors, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="all">All Types</option>
            {sampleTypes.map(type => (
              <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="due_date">Due Date</option>
            <option value="name">Name</option>
            <option value="vendor">Vendor</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-gray-400 hover:text-white"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Samples List */}
      <div className="space-y-4">
        {filteredSamples.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No samples found. Add your first sample!</p>
          </div>
        ) : (
          filteredSamples.map(sample => {
            const typeInfo = getTypeInfo(sample.type);
            const statusInfo = getStatusInfo(sample.status);
            const StatusIcon = statusInfo.icon;
            const isOverdue = sample.return_required && sample.return_by && 
              new Date() > new Date(sample.return_by) && sample.status !== 'returned';
            
            return (
              <div
                key={sample.id}
                className={`rounded-xl bg-black/30 border-l-4 hover:bg-black/40 transition-colors overflow-hidden ${
                  isOverdue ? 'border-red-500' : ''
                }`}
                style={{ borderLeftColor: isOverdue ? '#EF4444' : typeInfo.color }}
              >
                {/* LARGE SAMPLE IMAGE */}
                <div className="relative">
                  {sample.image_url ? (
                    <img 
                      src={sample.image_url} 
                      alt={sample.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-48 flex items-center justify-center text-6xl bg-gradient-to-br from-stone-800 to-stone-900 ${sample.image_url ? 'hidden' : ''}`}
                    style={{ display: sample.image_url ? 'none' : 'flex' }}
                  >
                    {typeInfo.icon}
                  </div>
                  
                  {/* Status badge on image */}
                  <div className="absolute top-3 right-3">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                      style={{ backgroundColor: statusInfo.color, color: 'white' }}
                    >
                      <StatusIcon size={12} />
                      {statusInfo.name}
                    </span>
                  </div>
                  
                  {isOverdue && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white flex items-center gap-1 shadow-lg">
                        <AlertCircle size={12} />
                        OVERDUE
                      </span>
                    </div>
                  )}
                </div>
                
                {/* SAMPLE NAME - Large */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">{sample.name}</h3>
                  
                  {/* SWATCH IDENTIFIER / SKU */}
                  {sample.sku && (
                    <div className="mt-1 text-sm text-amber-400 font-mono font-bold">
                      SKU: {sample.sku}
                    </div>
                  )}
                  
                  {/* Color/Finish */}
                  {sample.color && sample.color !== sample.name && (
                    <div className="mt-1 text-sm text-cyan-400">
                      Color: {sample.color}
                    </div>
                  )}
                  
                  {/* Vendor & Room */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} />
                      {sample.vendor || 'Unknown Vendor'}
                    </span>
                    {sample.room && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {sample.room}
                      </span>
                    )}
                  </div>
                  
                  {/* From Item info */}
                  {sample.item_name && (
                    <div className="mt-2 text-xs text-gray-500">
                      From item: {sample.item_name}. Category: {sample.notes?.split('Category:')[1]?.trim() || 'N/A'}
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {sample.request_date && (
                          <span>Requested: {sample.request_date}</span>
                        )}
                        {sample.expected_date && (
                          <span>Expected: {sample.expected_date}</span>
                        )}
                        {sample.received_date && (
                          <span className="text-green-400">Received: {sample.received_date}</span>
                        )}
                        {sample.return_required && sample.return_by && (
                          <span className={isOverdue ? 'text-red-400' : 'text-yellow-400'}>
                            Return by: {sample.return_by}
                          </span>
                        )}
                      </div>
                      
                      {/* Tracking */}
                      {sample.tracking_number && (
                        <div className="mt-2 text-xs text-blue-400">
                          Tracking: {sample.tracking_number}
                        </div>
                      )}
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center gap-2 border-t border-stone-700 pt-3">
                    {/* Quick actions based on status */}
                    {sample.status === 'shipped' && (
                      <button
                        onClick={() => markAsReceived(sample)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
                      >
                        <CheckCircle size={14} />
                        Mark Received
                      </button>
                    )}
                    {(sample.status === 'received' || sample.status === 'in_use') && sample.return_required && (
                      <button
                        onClick={() => markAsReturned(sample)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm"
                      >
                        <RotateCcw size={14} />
                        Mark Returned
                      </button>
                    )}
                    
                    <div className="flex-1" />
                    
                    <button
                      onClick={() => setViewingSample(sample)}
                      className="p-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                      </button>
                      <button
                        onClick={() => handleEdit(sample)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSample(sample.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#D4A574]">
                {editingSample ? 'Edit Sample' : 'Add Sample'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingSample(null); resetForm(); }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Sample Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    placeholder="e.g., Crypton Performance Velvet"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Vendor *</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    placeholder="e.g., Kravet"
                  />
                </div>
              </div>
              
              {/* Type & SKU */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Sample Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  >
                    {sampleTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">SKU / Item #</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
              </div>
              
              {/* Room & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    placeholder="e.g., Living Room"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Request Date</label>
                  <input
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Expected Arrival</label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Received Date</label>
                  <input
                    type="date"
                    value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
              </div>
              
              {/* Tracking */}
              <div>
                <label className="text-gray-400 text-sm">Tracking Number</label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  placeholder="e.g., 1Z999AA10123456784"
                />
              </div>
              
              {/* Return Info */}
              <div className="p-4 rounded-lg bg-black/30 border border-[#B49B7E]/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.return_required}
                    onChange={(e) => setFormData({ ...formData, return_required: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300">Return Required</span>
                </label>
                
                {formData.return_required && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Return By Date</label>
                      <input
                        type="date"
                        value={formData.return_by || ''}
                        onChange={(e) => setFormData({ ...formData, return_by: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Returned Date</label>
                      <input
                        type="date"
                        value={formData.returned_date}
                        onChange={(e) => setFormData({ ...formData, returned_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-gray-400 text-sm">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white h-20"
                  placeholder="Any notes about this sample..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveSample}
                disabled={!formData.name || !formData.vendor}
                className="flex-1 py-3 rounded-lg bg-[#D4A574] text-white font-bold hover:bg-[#B49B7E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingSample ? 'Update Sample' : 'Save Sample'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setEditingSample(null); resetForm(); }}
                className="px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingSample && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#D4A574]">Sample Details</h3>
              <button
                onClick={() => setViewingSample(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${getTypeInfo(viewingSample.type).color}20` }}
                >
                  {getTypeInfo(viewingSample.type).icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{viewingSample.name}</h4>
                  <p className="text-gray-400">{viewingSample.vendor}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="text-white">{getTypeInfo(viewingSample.type).name}</p>
                </div>
                <div>
                  <p className="text-gray-500">SKU</p>
                  <p className="text-white">{viewingSample.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Color</p>
                  <p className="text-white">{viewingSample.color || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Room</p>
                  <p className="text-white">{viewingSample.room || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p style={{ color: getStatusInfo(viewingSample.status).color }}>
                    {getStatusInfo(viewingSample.status).name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tracking</p>
                  <p className="text-blue-400">{viewingSample.tracking_number || '-'}</p>
                </div>
              </div>
              
              {viewingSample.notes && (
                <div>
                  <p className="text-gray-500 text-sm">Notes</p>
                  <p className="text-gray-300">{viewingSample.notes}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setViewingSample(null)}
              className="w-full mt-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
