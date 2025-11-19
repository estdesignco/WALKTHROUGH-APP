import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactSheet = ({ projectId }) => {
  const [contacts, setContacts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedContacts, setSavedContacts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', role: '', company: '', address: '', notes: '', save_to_library: false
  });

  const API = ((window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin) + '/api';

  useEffect(() => {
    loadContacts();
    loadRoles();
    loadSavedContacts();
  }, [projectId]);

  const loadSavedContacts = async () => {
    try {
      const saved = localStorage.getItem('saved_contacts');
      if (saved) {
        setSavedContacts(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading saved contacts:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await axios.get(`${API}/contacts/project/${projectId}`);
      setContacts(res.data);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await axios.get(`${API}/contacts/roles`);
      setRoles(res.data.roles);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (editingContact) {
        await axios.put(`${API}/contacts/${editingContact.id}`, formData);
      } else {
        await axios.post(`${API}/contacts`, { ...formData, project_id: projectId });
        
        // Save to library if checkbox is checked
        if (formData.save_to_library) {
          const newSaved = [...savedContacts, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            role: formData.role,
            company: formData.company,
            address: formData.address
          }];
          setSavedContacts(newSaved);
          localStorage.setItem('saved_contacts', JSON.stringify(newSaved));
        }
      }
      loadContacts();
      setShowAddContact(false);
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', role: '', company: '', address: '', notes: '', save_to_library: false });
    } catch (err) {
      alert('Error saving contact: ' + err.message);
    }
  };

  const loadFromLibrary = (savedContact) => {
    setFormData({
      ...formData,
      name: savedContact.name,
      phone: savedContact.phone,
      email: savedContact.email || '',
      role: savedContact.role,
      company: savedContact.company || '',
      address: savedContact.address || ''
    });
    setShowLibrary(false);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await axios.delete(`${API}/contacts/${contactId}`);
      loadContacts();
    } catch (err) {
      alert('Error deleting contact: ' + err.message);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      role: contact.role,
      company: contact.company || '',
      address: contact.address || '',
      notes: contact.notes || ''
    });
    setShowAddContact(true);
  };

  const handleEmail = (contact) => {
    window.location.href = `mailto:${contact.email}`;
  };

  const handleCall = (contact) => {
    window.location.href = `tel:${contact.phone}`;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-8 rounded-2xl border border-[#8b7355]" style={{
          background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 30%, #2a2a2a 70%, #1a1a1a 100%)',
          boxShadow: '0 0 20px rgba(139, 115, 85, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)'
        }}>
          <h1 className="text-4xl font-light text-[#D4C5A9] text-center tracking-wide">📇 PROJECT CONTACTS</h1>
          <p className="text-center text-[#D4C5A9] mt-2">Manage all contacts for this project</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setShowAddContact(true); setEditingContact(null); setFormData({ name: '', phone: '', email: '', role: '', company: '', address: '', notes: '', save_to_library: false }); }}
            className="px-8 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #b8965c 0%, #a0845c 30%, #8b7355 70%, #6a5a4a 100%)',
              color: '#1a1a1a',
              border: '1px solid #8b7355',
              boxShadow: '0 0 20px rgba(139, 115, 85, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)'
            }}
          >
            + Add Contact
          </button>

          <button
            onClick={() => setShowLibrary(true)}
            className="px-8 py-3 rounded-lg font-bold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6A7A5A 0%, #7A8A6A 50%, #6A7A5A 100%)',
              color: '#1a1a1a',
              border: '1px solid #6A7A5A',
              boxShadow: '0 0 20px rgba(106, 122, 90, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)'
            }}
          >
            📚 Load from Library ({savedContacts.length})
          </button>
        </div>

        <div className="grid gap-4">
          {contacts.map(contact => (
            <div key={contact.id} className="p-6 rounded-xl border border-[#8b7355]/40" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
            }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-semibold text-[#D4A574]">{contact.name}</h3>
                    <span className="text-lg text-[#D4C5A9]">{contact.phone}</span>
                  </div>
                  <p className="text-[#8b7355] font-medium mb-2">{contact.role}</p>
                  {contact.company && <p className="text-[#D4C5A9] text-sm mb-1">Company: {contact.company}</p>}
                  {contact.email && <p className="text-[#D4C5A9] text-sm mb-1">Email: {contact.email}</p>}
                  {contact.address && <p className="text-[#D4C5A9] text-sm mb-1">Address: {contact.address}</p>}
                  {contact.notes && <p className="text-[#D4C5A9]/70 text-sm mt-2 italic">{contact.notes}</p>}
                </div>
                <div className="flex gap-2">
                  {contact.email && (
                    <button onClick={() => handleEmail(contact)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                      📧 Email
                    </button>
                  )}
                  <button onClick={() => handleCall(contact)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                    📞 Call
                  </button>
                  <button onClick={() => handleEdit(contact)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-12 text-[#D4C5A9]">
              <p className="text-2xl mb-2">📇</p>
              <p>No contacts yet. Click "Add Contact" to get started.</p>
            </div>
          )}
        </div>

        {showAddContact && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl border border-[#8b7355]">
              <h2 className="text-2xl font-bold text-[#D4A574] mb-6">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length >= 6) {
                        value = value.slice(0,3) + '-' + value.slice(3,6) + '-' + value.slice(6,10);
                      } else if (value.length >= 3) {
                        value = value.slice(0,3) + '-' + value.slice(3);
                      }
                      setFormData({...formData, phone: value});
                    }}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    placeholder="555-123-4567"
                    maxLength="12"
                  />
                </div>
                
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Role/Type *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    placeholder="ABC Construction"
                  />
                </div>
                
                <div>
                  <label className="block text-[#D4C5A9] mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    placeholder="123 Main St"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[#D4C5A9] mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-black/60 border border-[#8b7355] text-[#D4C5A9] rounded-lg"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                {!editingContact && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 text-[#D4C5A9] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.save_to_library}
                        onChange={(e) => setFormData({...formData, save_to_library: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span>💾 Save to Contact Library (reuse on future projects)</span>
                    </label>
                  </div>
                )}

              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => { setShowAddContact(false); setEditingContact(null); }}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.phone || !formData.role}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-bold"
                >
                  {editingContact ? 'Update' : 'Save'} Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


        {/* CONTACT LIBRARY MODAL */}
        {showLibrary && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-3xl border border-[#8b7355] max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#D4A574] mb-6">📚 Contact Library</h2>
              
              {savedContacts.length === 0 ? (
                <p className="text-[#D4C5A9] text-center py-8">No saved contacts yet. Check "Save to Library" when adding a contact.</p>
              ) : (
                <div className="space-y-3">
                  {savedContacts.map((contact, idx) => (
                    <div key={idx} className="p-4 bg-black/60 rounded-lg border border-[#8b7355]/40 flex justify-between items-center hover:bg-black/80 transition-all">
                      <div>
                        <p className="text-[#D4A574] font-semibold">{contact.name} - {contact.phone}</p>
                        <p className="text-[#D4C5A9] text-sm">{contact.role} {contact.company && `- ${contact.company}`}</p>
                      </div>
                      <button
                        onClick={() => loadFromLibrary(contact)}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
                      >
                        Use This Contact
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowLibrary(false)}
                className="mt-6 w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}

};

export default ContactSheet;
