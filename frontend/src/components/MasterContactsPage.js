import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Phone, Mail, Building2, 
  User, Globe, MapPin, Tag, X, Check, Users 
} from 'lucide-react';
import BackButton from './BackButton';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const MasterContactsPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [roles, setRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'contacts', 'vendors'
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    address: '',
    website: '',
    notes: '',
    tags: [],
    type: '' // 'contact' or 'vendor'
  });

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API}/master/contacts`;
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (filterRole) params.push(`role=${encodeURIComponent(filterRole)}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url);
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole]);

  const loadRoles = async () => {
    try {
      const response = await axios.get(`${API}/master/contacts/roles/list`);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  useEffect(() => {
    loadContacts();
    loadRoles();
  }, [loadContacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await axios.put(`${API}/master/contacts/${editingContact.id}`, formData);
      } else {
        await axios.post(`${API}/master/contacts`, formData);
      }
      loadContacts();
      resetForm();
    } catch (error) {
      alert('Error saving contact: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      company: contact.company || '',
      role: contact.role || '',
      address: contact.address || '',
      website: contact.website || '',
      notes: contact.notes || '',
      tags: contact.tags || []
    });
    setShowForm(true);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await axios.delete(`${API}/master/contacts/${contactId}`);
      loadContacts();
    } catch (error) {
      alert('Error deleting contact: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      role: '',
      address: '',
      website: '',
      notes: '',
      tags: []
    });
    setEditingContact(null);
    setShowForm(false);
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-black text-stone-300 p-6">
      <BackButton />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#6b5745] flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-[#D4C5A9]">Master Contacts</h1>
              <p className="text-stone-500">Global contact database with predictive text</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b7355] to-[#a08060] text-white rounded-lg hover:from-[#9b8365] hover:to-[#b09070] transition-all shadow-lg"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Add Contact'}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search contacts by name, company, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355] min-w-[200px]"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl text-[#D4C5A9] mb-4">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-stone-500 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="555-555-5555"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">Website</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm text-stone-500 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm text-stone-500 mb-1">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355] resize-none"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#8b7355] to-[#a08060] text-white rounded-lg hover:from-[#9b8365] hover:to-[#b09070] transition-all"
                >
                  <Check className="w-4 h-4" />
                  {editingContact ? 'Update Contact' : 'Save Contact'}
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

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-stone-700 mb-4" />
            <p className="text-stone-500">No contacts found</p>
            <p className="text-stone-600 text-sm">Add your first contact to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="bg-stone-900 border border-stone-700 rounded-xl p-5 hover:border-[#8b7355] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b7355] to-[#6b5745] flex items-center justify-center text-white font-medium">
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="text-[#D4C5A9] font-medium">{contact.name}</h3>
                      {contact.role && (
                        <span className="text-xs text-stone-500">{contact.role}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 text-stone-500 hover:text-[#8b7355] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-stone-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {contact.company && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <Building2 className="w-4 h-4 text-stone-600" />
                      {contact.company}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <Phone className="w-4 h-4 text-stone-600" />
                      <a href={`tel:${contact.phone}`} className="hover:text-[#8b7355]">
                        {formatPhone(contact.phone)}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <Mail className="w-4 h-4 text-stone-600" />
                      <a href={`mailto:${contact.email}`} className="hover:text-[#8b7355] truncate">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <Globe className="w-4 h-4 text-stone-600" />
                      <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#8b7355] truncate">
                        {contact.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <MapPin className="w-4 h-4 text-stone-600" />
                      <span className="truncate">{contact.address}</span>
                    </div>
                  )}
                </div>
                
                {contact.used_in_projects?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-800">
                    <span className="text-xs text-stone-600">
                      Used in {contact.used_in_projects.length} project(s)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterContactsPage;
