import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Percent, Building2, Plus, Search, Edit2, Trash2, 
  Save, X, Filter, ArrowUpDown, Tag, Calculator, TrendingUp,
  CheckCircle, AlertCircle, Clock, Star, FileText, Download
} from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Trade Discount Manager
 * Manage vendor discounts, trade pricing, and calculate savings
 * Features:
 * - Track discount percentages per vendor
 * - Calculate savings on items
 * - Expiration tracking
 * - Discount tiers (Bronze, Silver, Gold, Platinum)
 */
export default function TradeDiscountManager({ projectId }) {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('vendor');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_id: '',
    discount_percent: 20,
    tier: 'trade',
    account_number: '',
    rep_name: '',
    rep_email: '',
    rep_phone: '',
    expiration_date: '',
    notes: '',
    categories: [],
    min_order: 0,
    terms: 'Net 30'
  });

  // Calculator state
  const [calcRetailPrice, setCalcRetailPrice] = useState('');
  const [calcSelectedVendor, setCalcSelectedVendor] = useState('');

  // Tier definitions
  const tiers = [
    { id: 'trade', name: 'Trade', color: '#10B981', discount: '20-30%', icon: '🏷️' },
    { id: 'bronze', name: 'Bronze', color: '#CD7F32', discount: '25-35%', icon: '🥉' },
    { id: 'silver', name: 'Silver', color: '#C0C0C0', discount: '30-40%', icon: '🥈' },
    { id: 'gold', name: 'Gold', color: '#FFD700', discount: '35-45%', icon: '🥇' },
    { id: 'platinum', name: 'Platinum', color: '#E5E4E2', discount: '40-50%', icon: '💎' }
  ];

  // Load discounts
  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const response = await fetch(`${API_URL}/trade-discounts`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts || []);
      } else {
        // Load from localStorage as fallback
        const saved = localStorage.getItem('trade-discounts');
        if (saved) {
          setDiscounts(JSON.parse(saved));
        } else {
          // Default sample discounts
          setDiscounts([
            {
              id: '1',
              vendor_name: 'Restoration Hardware',
              discount_percent: 40,
              tier: 'gold',
              account_number: 'RH-2024-1234',
              rep_name: 'Sarah Johnson',
              rep_email: 'sarah@rh.com',
              rep_phone: '(555) 123-4567',
              expiration_date: '2025-12-31',
              notes: 'Annual renewal in December',
              categories: ['Furniture', 'Lighting', 'Decor'],
              min_order: 5000,
              terms: 'Net 30',
              status: 'active'
            },
            {
              id: '2',
              vendor_name: 'Visual Comfort',
              discount_percent: 50,
              tier: 'platinum',
              account_number: 'VC-8876',
              rep_name: 'Michael Chen',
              rep_email: 'mchen@visualcomfort.com',
              rep_phone: '(555) 987-6543',
              expiration_date: '2025-06-30',
              notes: 'Best pricing on chandeliers',
              categories: ['Lighting'],
              min_order: 2500,
              terms: 'Net 45',
              status: 'active'
            },
            {
              id: '3',
              vendor_name: 'Kravet',
              discount_percent: 35,
              tier: 'silver',
              account_number: 'KR-55621',
              rep_name: 'Lisa Park',
              rep_email: 'lpark@kravet.com',
              rep_phone: '(555) 456-7890',
              expiration_date: '2025-03-15',
              notes: 'Fabric and trim specialist',
              categories: ['Fabric', 'Trim', 'Wallcovering'],
              min_order: 1000,
              terms: 'Net 30',
              status: 'active'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save discount
  const saveDiscount = async () => {
    try {
      const discountData = {
        ...formData,
        id: editingDiscount?.id || Date.now().toString(),
        status: 'active',
        created_at: editingDiscount?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try API first
      const response = await fetch(`${API_URL}/trade-discounts`, {
        method: editingDiscount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData)
      });

      if (response.ok) {
        loadDiscounts();
      } else {
        // Save locally
        const updated = editingDiscount
          ? discounts.map(d => d.id === editingDiscount.id ? discountData : d)
          : [...discounts, discountData];
        setDiscounts(updated);
        localStorage.setItem('trade-discounts', JSON.stringify(updated));
      }

      setShowAddModal(false);
      setEditingDiscount(null);
      resetForm();
    } catch (error) {
      console.error('Error saving discount:', error);
      // Save locally on error
      const discountData = {
        ...formData,
        id: editingDiscount?.id || Date.now().toString(),
        status: 'active'
      };
      const updated = editingDiscount
        ? discounts.map(d => d.id === editingDiscount.id ? discountData : d)
        : [...discounts, discountData];
      setDiscounts(updated);
      localStorage.setItem('trade-discounts', JSON.stringify(updated));
      setShowAddModal(false);
      setEditingDiscount(null);
      resetForm();
    }
  };

  // Delete discount
  const deleteDiscount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      await fetch(`${API_URL}/trade-discounts/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting:', error);
    }
    
    const updated = discounts.filter(d => d.id !== id);
    setDiscounts(updated);
    localStorage.setItem('trade-discounts', JSON.stringify(updated));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vendor_name: '',
      vendor_id: '',
      discount_percent: 20,
      tier: 'trade',
      account_number: '',
      rep_name: '',
      rep_email: '',
      rep_phone: '',
      expiration_date: '',
      notes: '',
      categories: [],
      min_order: 0,
      terms: 'Net 30'
    });
  };

  // Edit discount
  const handleEdit = (discount) => {
    setFormData(discount);
    setEditingDiscount(discount);
    setShowAddModal(true);
  };

  // Check expiration status
  const getExpirationStatus = (date) => {
    if (!date) return { status: 'none', label: 'No expiration', color: '#6B7280' };
    const exp = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { status: 'expired', label: 'Expired', color: '#EF4444' };
    if (daysUntil <= 30) return { status: 'expiring', label: `${daysUntil} days left`, color: '#F59E0B' };
    return { status: 'active', label: 'Active', color: '#10B981' };
  };

  // Filter and sort discounts
  const filteredDiscounts = useMemo(() => {
    let result = [...discounts];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.vendor_name?.toLowerCase().includes(search) ||
        d.rep_name?.toLowerCase().includes(search) ||
        d.account_number?.toLowerCase().includes(search) ||
        d.categories?.some(c => c.toLowerCase().includes(search))
      );
    }
    
    // Tier filter
    if (filterTier !== 'all') {
      result = result.filter(d => d.tier === filterTier);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(d => {
        const expStatus = getExpirationStatus(d.expiration_date);
        return expStatus.status === filterStatus;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'vendor':
          aVal = a.vendor_name || '';
          bVal = b.vendor_name || '';
          break;
        case 'discount':
          aVal = a.discount_percent || 0;
          bVal = b.discount_percent || 0;
          break;
        case 'expiration':
          aVal = a.expiration_date || '9999-12-31';
          bVal = b.expiration_date || '9999-12-31';
          break;
        default:
          aVal = a.vendor_name || '';
          bVal = b.vendor_name || '';
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [discounts, searchTerm, filterTier, filterStatus, sortBy, sortOrder]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const active = discounts.filter(d => getExpirationStatus(d.expiration_date).status === 'active').length;
    const expiring = discounts.filter(d => getExpirationStatus(d.expiration_date).status === 'expiring').length;
    const avgDiscount = discounts.length > 0 
      ? Math.round(discounts.reduce((sum, d) => sum + (d.discount_percent || 0), 0) / discounts.length)
      : 0;
    const topTier = discounts.reduce((max, d) => {
      const tierOrder = { trade: 1, bronze: 2, silver: 3, gold: 4, platinum: 5 };
      return tierOrder[d.tier] > tierOrder[max] ? d.tier : max;
    }, 'trade');
    
    return { active, expiring, avgDiscount, topTier, total: discounts.length };
  }, [discounts]);

  // Calculate trade price
  const calculateTradePrice = (retailPrice, discountPercent) => {
    const retail = parseFloat(retailPrice) || 0;
    const discount = parseFloat(discountPercent) || 0;
    const tradePrice = retail * (1 - discount / 100);
    const savings = retail - tradePrice;
    return { tradePrice, savings };
  };

  // Export discounts
  const exportDiscounts = () => {
    const csv = [
      ['Vendor', 'Discount %', 'Tier', 'Account #', 'Rep Name', 'Rep Email', 'Rep Phone', 'Expiration', 'Min Order', 'Terms', 'Categories', 'Notes'].join(','),
      ...discounts.map(d => [
        `"${d.vendor_name}"`,
        d.discount_percent,
        d.tier,
        `"${d.account_number}"`,
        `"${d.rep_name}"`,
        d.rep_email,
        d.rep_phone,
        d.expiration_date,
        d.min_order,
        d.terms,
        `"${(d.categories || []).join('; ')}"`,
        `"${d.notes}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade-discounts.csv';
    a.click();
  };

  const getTierInfo = (tierId) => tiers.find(t => t.id === tierId) || tiers[0];

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
            <Percent size={28} />
            Trade Discount Manager
          </h2>
          <p className="text-gray-400 mt-1">Manage your vendor discounts and trade pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-600/30"
          >
            <Calculator size={18} />
            Price Calculator
          </button>
          <button
            onClick={exportDiscounts}
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
            Add Vendor Discount
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A574]/20 flex items-center justify-center">
              <Building2 size={20} className="text-[#D4A574]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm">Total Vendors</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-gray-400 text-sm">Active</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiring}</p>
              <p className="text-gray-400 text-sm">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgDiscount}%</p>
              <p className="text-gray-400 text-sm">Avg Discount</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-yellow-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Star size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white capitalize">{stats.topTier}</p>
              <p className="text-gray-400 text-sm">Top Tier</p>
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
              placeholder="Search vendors, reps, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier.id} value={tier.id}>{tier.icon} {tier.name}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white"
          >
            <option value="vendor">Vendor Name</option>
            <option value="discount">Discount %</option>
            <option value="expiration">Expiration</option>
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-gray-400 hover:text-white"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Discounts List */}
      <div className="space-y-4">
        {filteredDiscounts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Percent size={48} className="mx-auto mb-4 opacity-50" />
            <p>No discounts found. Add your first vendor discount!</p>
          </div>
        ) : (
          filteredDiscounts.map(discount => {
            const tierInfo = getTierInfo(discount.tier);
            const expStatus = getExpirationStatus(discount.expiration_date);
            
            return (
              <div
                key={discount.id}
                className="p-4 rounded-xl bg-black/30 border-l-4 hover:bg-black/40 transition-colors"
                style={{ borderLeftColor: tierInfo.color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Tier badge */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${tierInfo.color}20` }}
                    >
                      {tierInfo.icon}
                    </div>
                    
                    {/* Main info */}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{discount.vendor_name}</h3>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${tierInfo.color}30`, color: tierInfo.color }}
                        >
                          {tierInfo.name}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                          style={{ backgroundColor: `${expStatus.color}20`, color: expStatus.color }}
                        >
                          {expStatus.status === 'active' && <CheckCircle size={12} />}
                          {expStatus.status === 'expiring' && <Clock size={12} />}
                          {expStatus.status === 'expired' && <AlertCircle size={12} />}
                          {expStatus.label}
                        </span>
                      </div>
                      
                      {/* Account & Rep */}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                        {discount.account_number && (
                          <span>Account: {discount.account_number}</span>
                        )}
                        {discount.rep_name && (
                          <span>Rep: {discount.rep_name}</span>
                        )}
                        {discount.terms && (
                          <span>Terms: {discount.terms}</span>
                        )}
                      </div>
                      
                      {/* Categories */}
                      {discount.categories?.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {discount.categories.map((cat, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-xs bg-[#D4A574]/20 text-[#D4A574]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Notes */}
                      {discount.notes && (
                        <p className="mt-2 text-sm text-gray-500 italic">{discount.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Right side - Discount % and actions */}
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: tierInfo.color }}>
                      {discount.discount_percent}%
                    </div>
                    <div className="text-gray-400 text-sm">off retail</div>
                    
                    {discount.min_order > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Min: ${discount.min_order.toLocaleString()}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 justify-end">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteDiscount(discount.id)}
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
                {editingDiscount ? 'Edit Vendor Discount' : 'Add Vendor Discount'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingDiscount(null); resetForm(); }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Vendor Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Vendor Name *</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    placeholder="e.g., Restoration Hardware"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    placeholder="e.g., RH-2024-1234"
                  />
                </div>
              </div>
              
              {/* Discount & Tier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Discount Percentage *</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white pr-8"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Discount Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  >
                    {tiers.map(tier => (
                      <option key={tier.id} value={tier.id}>{tier.icon} {tier.name} ({tier.discount})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Rep Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Rep Name</label>
                  <input
                    type="text"
                    value={formData.rep_name}
                    onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Rep Email</label>
                  <input
                    type="email"
                    value={formData.rep_email}
                    onChange={(e) => setFormData({ ...formData, rep_email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Rep Phone</label>
                  <input
                    type="tel"
                    value={formData.rep_phone}
                    onChange={(e) => setFormData({ ...formData, rep_phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
              </div>
              
              {/* Terms & Min Order */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Payment Terms</label>
                  <select
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">COD</option>
                    <option value="Prepaid">Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Minimum Order ($)</label>
                  <input
                    type="number"
                    value={formData.min_order}
                    onChange={(e) => setFormData({ ...formData, min_order: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  />
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <label className="text-gray-400 text-sm">Categories (comma-separated)</label>
                <input
                  type="text"
                  value={(formData.categories || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  placeholder="e.g., Furniture, Lighting, Decor"
                />
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-gray-400 text-sm">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white h-20"
                  placeholder="Any special notes about this discount..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveDiscount}
                disabled={!formData.vendor_name}
                className="flex-1 py-3 rounded-lg bg-[#D4A574] text-white font-bold hover:bg-[#B49B7E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingDiscount ? 'Update Discount' : 'Save Discount'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setEditingDiscount(null); resetForm(); }}
                className="px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border-2 border-purple-500 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                <Calculator size={24} />
                Trade Price Calculator
              </h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Select Vendor</label>
                <select
                  value={calcSelectedVendor}
                  onChange={(e) => setCalcSelectedVendor(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-white"
                >
                  <option value="">-- Select Vendor --</option>
                  {discounts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.vendor_name} ({d.discount_percent}% off)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">Retail Price ($)</label>
                <input
                  type="number"
                  value={calcRetailPrice}
                  onChange={(e) => setCalcRetailPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-white text-xl"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              
              {calcSelectedVendor && calcRetailPrice && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-purple-800/50 border border-purple-500/30">
                  {(() => {
                    const vendor = discounts.find(d => d.id === calcSelectedVendor);
                    const { tradePrice, savings } = calculateTradePrice(calcRetailPrice, vendor?.discount_percent);
                    return (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Retail Price:</span>
                          <span className="text-gray-400 line-through">${parseFloat(calcRetailPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300">Discount:</span>
                          <span className="text-green-400">-{vendor?.discount_percent}%</span>
                        </div>
                        <div className="border-t border-purple-500/30 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white">Trade Price:</span>
                            <span className="text-2xl font-bold text-purple-400">${tradePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-400 text-sm">You Save:</span>
                            <span className="text-green-400 font-medium">${savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowCalculator(false)}
              className="w-full mt-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700"
            >
              Close Calculator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
