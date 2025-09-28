import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, Loader2, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// API functions
const Project = {
  create: async (data) => {
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return await response.json();
  }
};

const Room = {
  create: async (data) => {
    const response = await fetch(`${BACKEND_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create room');
    return await response.json();
  }
};

const Item = {
  bulkCreate: async (items) => {
    const response = await fetch(`${BACKEND_URL}/api/items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    if (!response.ok) throw new Error('Failed to create items');
    return await response.json();
  }
};

const CustomerfacingQuestionnaire = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  
  const [formData, setFormData] = useState({
    // Section 1: Client Information
    client_name: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_preferences: [],
    best_time_to_call: '',
    
    // Section 2: Project Overview
    property_type: '',
    project_type: '',
    timeline: '',
    budget_range: '',
    project_priority: [],
    
    // Section 3: Room Selection
    rooms_involved: [],
    
    // Section 4: Project Type Specific (Conditional)
    // New Build
    new_build_architect: '',
    new_build_builder: '',
    new_build_square_footage: '',
    
    // Renovation
    renovation_architect: '',
    renovation_builder: '',
    renovation_square_footage: '',
    renovation_layout_change: '',
    
    // Furniture Refresh
    furniture_refresh_square_footage: '',
    furniture_refresh_keeping_pieces: '',
    
    // Section 5: Design Preferences
    design_style_words: '',
    design_preferred_colors: '',
    design_disliked_colors: '',
    design_preferred_palette: [],
    design_styles_preference: [],
    design_styles_dislike: '',
    design_artwork_preference: [],
    finishes_patterns_preference: [],
    
    // Section 6: Lifestyle Questions
    family_info: '',
    pets_info: '',
    entertaining_style: '',
    hobbies: '',
    lifestyle: '',
    
    // Section 7: Additional Details
    worked_with_designer_before: '',
    primary_decision_maker: '',
    involvement_level: '',
    ideal_sofa_price: '',
    special_requests: '',
    
    // Section 8: How Did You Hear About Us
    how_heard_about_us: '',
    newsletter_signup: '',
    social_media_preferences: ''
  });

  const sections = [
    {
      title: 'Client Information',
      description: 'Let\'s start with your basic information so we can get to know you better.'
    },
    {
      title: 'Project Overview', 
      description: 'Tell us about your project scope, timeline, and priorities.'
    },
    {
      title: 'Room Selection',
      description: 'Which rooms or areas will be part of this design project?'
    },
    {
      title: 'Project Details',
      description: 'Let\'s dive deeper into the specifics of your project type.'
    },
    {
      title: 'Design Preferences',
      description: 'Help us understand your style preferences and design vision.'
    },
    {
      title: 'Lifestyle Questions',
      description: 'Tell us about how you live so we can design for your lifestyle.'
    },
    {
      title: 'Additional Details',
      description: 'A few more questions to help us serve you better.'
    },
    {
      title: 'How Did You Hear About Us',
      description: 'Help us understand how you discovered our services.'
    }
  ];

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      const onlyNums = value.replace(/[^\d]/g, '');
      let formatted = onlyNums;
      if (onlyNums.length > 3 && onlyNums.length <= 6) {
        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
      } else if (onlyNums.length > 6) {
        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleMultiSelect = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    setFormData(prev => ({ ...prev, [field]: newValues }));
  };

  const handleAddRoom = () => {
    if (newRoomName && !formData.rooms_involved.includes(newRoomName)) {
      setFormData(prev => ({
        ...prev,
        rooms_involved: [...prev.rooms_involved, newRoomName]
      }));
      setNewRoomName('');
    }
  };

  const handleRemoveRoom = (roomToRemove) => {
    setFormData(prev => ({
      ...prev,
      rooms_involved: prev.rooms_involved.filter(room => room !== roomToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create project
      const newProject = await Project.create({
        ...formData,
        client_info: {
          full_name: formData.client_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        }
      });

      // Create rooms with starter items
      if (formData.rooms_involved.length > 0) {
        for (const roomName of formData.rooms_involved) {
          const newRoom = await Room.create({
            project_id: newProject.id,
            name: roomName,
            notes: ''
          });

          // Generate starter items based on room type
          const basicItems = [
            { category: 'LIGHTING', sub_category: 'CEILING', name: 'Ceiling Light - Click to edit' },
            { category: 'FURNITURE', sub_category: 'SEATING', name: 'Seating - Click to edit' },
            { category: 'ACCESSORIES', sub_category: 'ART & DECOR', name: 'Art & Decor - Click to edit' },
            { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'WALL', name: 'Wall Finish - Click to edit' },
            { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'FLOORING', name: 'Flooring - Click to edit' }
          ];

          // Add room-specific items
          if (roomName.toLowerCase().includes('kitchen')) {
            basicItems.push(
              { category: 'APPLIANCES', sub_category: 'KITCHEN APPLIANCES', name: 'Refrigerator - Click to edit' },
              { category: 'PLUMBING', sub_category: 'KITCHEN SINKS & FAUCETS', name: 'Kitchen Sink - Click to edit' },
              { category: 'CABINETS', sub_category: 'LOWER', name: 'Lower Cabinets - Click to edit' },
              { category: 'COUNTERTOPS & TILE', sub_category: 'COUNTERTOPS', name: 'Countertops - Click to edit' }
            );
          } else if (roomName.toLowerCase().includes('bath')) {
            basicItems.push(
              { category: 'PLUMBING', sub_category: 'SHOWER & TUB', name: 'Shower/Tub - Click to edit' },
              { category: 'CABINETS', sub_category: 'VANITY', name: 'Vanity - Click to edit' },
              { category: 'COUNTERTOPS & TILE', sub_category: 'TILE', name: 'Floor Tile - Click to edit' }
            );
          } else if (roomName.toLowerCase().includes('bedroom')) {
            basicItems.push(
              { category: 'FURNITURE', sub_category: 'BEDS', name: 'Bed - Click to edit' },
              { category: 'TEXTILES', sub_category: 'BEDDING', name: 'Bedding - Click to edit' }
            );
          }

          const itemsToCreate = basicItems.map(item => ({
            project_id: newProject.id,
            room_id: newRoom.id,
            category: item.category,
            sub_category: item.sub_category,
            name: item.name,
            status: 'Walkthrough',
            quantity: 1
          }));

          await Item.bulkCreate(itemsToCreate);
        }
      }

      // Redirect to project detail page
      window.location.href = `/project/${newProject.id}`;
      
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Client Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Project Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Preferred Method of Communication</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Email', 'Phone Call', 'Text Message'].map(method => (
                  <div key={method} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={method}
                      checked={formData.contact_preferences.includes(method)}
                      onChange={() => handleMultiSelect('contact_preferences', method)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={method} className="text-white text-lg">{method}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Best Time to Call</label>
              <select
                value={formData.best_time_to_call}
                onChange={(e) => handleInputChange('best_time_to_call', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
              >
                <option value="">Select preferred time</option>
                <option value="Morning (9am-12pm)">Morning (9am-12pm)</option>
                <option value="Afternoon (12pm-5pm)">Afternoon (12pm-5pm)</option>
                <option value="Evening (5pm-8pm)">Evening (5pm-8pm)</option>
                <option value="Weekends">Weekends</option>
              </select>
            </div>
          </div>
        );
        
      case 1: // Project Overview
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  required
                >
                  <option value="">Select property type</option>
                  <option value="Single Family Home">Single Family Home</option>
                  <option value="Condo/Apartment">Condo/Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial Space">Commercial Space</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Project Type *</label>
                <select
                  value={formData.project_type}
                  onChange={(e) => handleInputChange('project_type', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  required
                >
                  <option value="">Select project type</option>
                  <option value="New Build">New Build</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Furniture Refresh">Furniture Refresh</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Timeline</label>
                <select
                  value={formData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="Immediately">Immediately</option>
                  <option value="Within 3 months">Within 3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="More than 1 year">More than 1 year</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Budget Range</label>
                <select
                  value={formData.budget_range}
                  onChange={(e) => handleInputChange('budget_range', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                >
                  <option value="">Select budget range</option>
                  <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                  <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                  <option value="$100,000 - $250,000">$100,000 - $250,000</option>
                  <option value="$250,000+">$250,000+</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Project Priorities (Select all that apply)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Functionality', 'Aesthetics', 'Comfort', 'Entertainment', 
                  'Storage', 'Natural Light', 'Privacy', 'Sustainability'
                ].map(priority => (
                  <div key={priority} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={priority}
                      checked={formData.project_priority.includes(priority)}
                      onChange={() => handleMultiSelect('project_priority', priority)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={priority} className="text-white text-lg">{priority}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 2: // Room Selection
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Select Rooms for Your Project</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {[
                  'Living Room', 'Dining Room', 'Kitchen', 'Master Bedroom', 'Guest Bedroom',
                  'Home Office', 'Bathroom', 'Master Bathroom', 'Powder Room', 'Foyer/Entry',
                  'Family Room', 'Basement', 'Attic', 'Laundry Room', 'Pantry', 'Closet'
                ].map(room => (
                  <div key={room} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={room}
                      checked={formData.rooms_involved.includes(room)}
                      onChange={() => handleMultiSelect('rooms_involved', room)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={room} className="text-white text-sm">{room}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Add Custom Room</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ background: '#D4A574', color: '#000' }}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            
            {formData.rooms_involved.length > 0 && (
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Selected Rooms:</label>
                <div className="flex flex-wrap gap-2">
                  {formData.rooms_involved.map(room => (
                    <div key={room} className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-700">
                      <span className="text-white">{room}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoom(room)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 3: // Project Type Specific
        return (
          <div className="space-y-6">
            {formData.project_type === 'New Build' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-medium" style={{ color: '#D4A574' }}>New Build Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Working with Architect?</label>
                    <select
                      value={formData.new_build_architect}
                      onChange={(e) => handleInputChange('new_build_architect', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    >
                      <option value="">Select option</option>
                      <option value="Yes, we have an architect">Yes, we have an architect</option>
                      <option value="Need architect recommendations">Need architect recommendations</option>
                      <option value="No architect needed">No architect needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Working with Builder?</label>
                    <select
                      value={formData.new_build_builder}
                      onChange={(e) => handleInputChange('new_build_builder', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    >
                      <option value="">Select option</option>
                      <option value="Yes, we have a builder">Yes, we have a builder</option>
                      <option value="Need builder recommendations">Need builder recommendations</option>
                      <option value="No builder yet">No builder yet</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Approximate Square Footage</label>
                  <input
                    type="text"
                    value={formData.new_build_square_footage}
                    onChange={(e) => handleInputChange('new_build_square_footage', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    placeholder="e.g., 2,500 sq ft"
                  />
                </div>
              </div>
            )}
            
            {formData.project_type === 'Renovation' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-medium" style={{ color: '#D4A574' }}>Renovation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Working with Architect?</label>
                    <select
                      value={formData.renovation_architect}
                      onChange={(e) => handleInputChange('renovation_architect', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    >
                      <option value="">Select option</option>
                      <option value="Yes, we have an architect">Yes, we have an architect</option>
                      <option value="Need architect recommendations">Need architect recommendations</option>
                      <option value="No architect needed">No architect needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Working with Builder?</label>
                    <select
                      value={formData.renovation_builder}
                      onChange={(e) => handleInputChange('renovation_builder', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    >
                      <option value="">Select option</option>
                      <option value="Yes, we have a builder">Yes, we have a builder</option>
                      <option value="Need builder recommendations">Need builder recommendations</option>
                      <option value="No builder needed">No builder needed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Square Footage Being Renovated</label>
                    <input
                      type="text"
                      value={formData.renovation_square_footage}
                      onChange={(e) => handleInputChange('renovation_square_footage', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                      placeholder="e.g., 1,200 sq ft"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Changing Layout/Footprint?</label>
                    <select
                      value={formData.renovation_layout_change}
                      onChange={(e) => handleInputChange('renovation_layout_change', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    >
                      <option value="">Select option</option>
                      <option value="Yes, major layout changes">Yes, major layout changes</option>
                      <option value="Minor layout changes">Minor layout changes</option>
                      <option value="No layout changes">No layout changes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {formData.project_type === 'Furniture Refresh' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-medium" style={{ color: '#D4A574' }}>Furniture Refresh Details</h3>
                <div>
                  <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Square Footage Being Refreshed</label>
                  <input
                    type="text"
                    value={formData.furniture_refresh_square_footage}
                    onChange={(e) => handleInputChange('furniture_refresh_square_footage', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    placeholder="e.g., 800 sq ft"
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Are you keeping any existing pieces?</label>
                  <textarea
                    value={formData.furniture_refresh_keeping_pieces}
                    onChange={(e) => handleInputChange('furniture_refresh_keeping_pieces', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                    rows={4}
                    placeholder="Please describe any furniture or items you'd like to keep and incorporate into the new design..."
                  />
                </div>
              </div>
            )}
          </div>
        );
        
      case 4: // Design Preferences
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Describe your style in 3 words</label>
              <input
                type="text"
                value={formData.design_style_words}
                onChange={(e) => handleInputChange('design_style_words', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                placeholder="e.g., Modern, Cozy, Sophisticated"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Preferred Colors</label>
                <input
                  type="text"
                  value={formData.design_preferred_colors}
                  onChange={(e) => handleInputChange('design_preferred_colors', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  placeholder="e.g., Navy blue, warm whites, gold accents"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Colors to Avoid</label>
                <input
                  type="text"
                  value={formData.design_disliked_colors}
                  onChange={(e) => handleInputChange('design_disliked_colors', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  placeholder="e.g., Bright orange, neon colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Preferred Color Palette (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Neutral/Monochromatic', 'Warm & Earthy', 'Cool & Calming', 
                  'Bold & Dramatic', 'Bright & Energetic', 'Jewel Tones'
                ].map(palette => (
                  <div key={palette} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={palette}
                      checked={formData.design_preferred_palette.includes(palette)}
                      onChange={() => handleMultiSelect('design_preferred_palette', palette)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={palette} className="text-white text-sm">{palette}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Design Styles You Love (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Modern', 'Traditional', 'Transitional', 'Contemporary', 
                  'Rustic/Farmhouse', 'Industrial', 'Scandinavian', 'Bohemian', 
                  'Art Deco', 'Mid-Century Modern'
                ].map(style => (
                  <div key={style} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={style}
                      checked={formData.design_styles_preference.includes(style)}
                      onChange={() => handleMultiSelect('design_styles_preference', style)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={style} className="text-white text-sm">{style}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Design Styles You Dislike</label>
              <textarea
                value={formData.design_styles_dislike}
                onChange={(e) => handleInputChange('design_styles_dislike', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
                placeholder="Please describe any design styles or elements you want to avoid..."
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-4" style={{ color: '#D4A574' }}>Artwork Preferences (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Original Paintings', 'Photography', 'Sculptures', 
                  'Abstract Art', 'Vintage Prints', 'Modern Art'
                ].map(art => (
                  <div key={art} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={art}
                      checked={formData.design_artwork_preference.includes(art)}
                      onChange={() => handleMultiSelect('design_artwork_preference', art)}
                      className="w-5 h-5 rounded border-gray-600 text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <label htmlFor={art} className="text-white text-sm">{art}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 5: // Lifestyle Questions
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Tell us about your family</label>
              <textarea
                value={formData.family_info}
                onChange={(e) => handleInputChange('family_info', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
                placeholder="Family size, ages of children, family dynamics..."
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Do you have pets?</label>
              <textarea
                value={formData.pets_info}
                onChange={(e) => handleInputChange('pets_info', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={2}
                placeholder="Types of pets, any special considerations..."
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>How do you entertain?</label>
              <textarea
                value={formData.entertaining_style}
                onChange={(e) => handleInputChange('entertaining_style', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
                placeholder="Dinner parties, casual gatherings, holidays..."
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>What are your hobbies?</label>
              <textarea
                value={formData.hobbies}
                onChange={(e) => handleInputChange('hobbies', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
                placeholder="Reading, cooking, gardening, sports..."
              />
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Describe your lifestyle</label>
              <textarea
                value={formData.lifestyle}
                onChange={(e) => handleInputChange('lifestyle', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={4}
                placeholder="Work from home, travel frequently, love hosting guests, prefer quiet evenings..."
              />
            </div>
          </div>
        );
        
      case 6: // Additional Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Have you worked with an interior designer before?</label>
              <textarea
                value={formData.worked_with_designer_before}
                onChange={(e) => handleInputChange('worked_with_designer_before', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={3}
                placeholder="Share your experience, what worked well, what didn't..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Who is the primary decision maker?</label>
                <input
                  type="text"
                  value={formData.primary_decision_maker}
                  onChange={(e) => handleInputChange('primary_decision_maker', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                  placeholder="e.g., Both spouses, Wife, Husband"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Level of involvement preferred</label>
                <select
                  value={formData.involvement_level}
                  onChange={(e) => handleInputChange('involvement_level', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                >
                  <option value="">Select involvement level</option>
                  <option value="High - I want to be involved in every decision">High - I want to be involved in every decision</option>
                  <option value="Medium - I want to review major decisions">Medium - I want to review major decisions</option>
                  <option value="Low - I trust you to make most decisions">Low - I trust you to make most decisions</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>What would you pay for your ideal sofa?</label>
              <select
                value={formData.ideal_sofa_price}
                onChange={(e) => handleInputChange('ideal_sofa_price', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
              >
                <option value="">Select price range</option>
                <option value="Under $2,000">Under $2,000</option>
                <option value="$2,000 - $4,000">$2,000 - $4,000</option>
                <option value="$4,000 - $6,000">$4,000 - $6,000</option>
                <option value="$6,000 - $10,000">$6,000 - $10,000</option>
                <option value="Over $10,000">Over $10,000</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Any special requests or needs?</label>
              <textarea
                value={formData.special_requests}
                onChange={(e) => handleInputChange('special_requests', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                rows={4}
                placeholder="Accessibility needs, allergies, specific requirements..."
              />
            </div>
          </div>
        );
        
      case 7: // How Did You Hear About Us
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>How did you hear about us?</label>
              <select
                value={formData.how_heard_about_us}
                onChange={(e) => handleInputChange('how_heard_about_us', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
              >
                <option value="">Select an option</option>
                <option value="Google Search">Google Search</option>
                <option value="Social Media">Social Media</option>
                <option value="Referral from Friend/Family">Referral from Friend/Family</option>
                <option value="Previous Client">Previous Client</option>
                <option value="Interior Design Magazine">Interior Design Magazine</option>
                <option value="Home Show/Event">Home Show/Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Would you like to receive our newsletter?</label>
              <select
                value={formData.newsletter_signup}
                onChange={(e) => handleInputChange('newsletter_signup', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
              >
                <option value="">Select an option</option>
                <option value="Yes">Yes, I'd love design tips and updates</option>
                <option value="No">No, thanks</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-medium mb-2" style={{ color: '#D4A574' }}>Follow us on social media?</label>
              <input
                type="text"
                value={formData.social_media_preferences}
                onChange={(e) => handleInputChange('social_media_preferences', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-[#D4A574] focus:outline-none"
                placeholder="Instagram, Facebook, Pinterest..."
              />
            </div>
            
            <div className="text-center pt-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6" style={{ color: '#D4A574' }} />
                <span className="text-lg" style={{ color: '#D4A574' }}>Ready to submit your questionnaire!</span>
              </div>
              <p className="text-gray-300 mb-6">
                Thank you for taking the time to share your vision with us. 
                We'll review your responses and get back to you within 24 hours.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Header */}
      <div className="relative py-16 px-4" style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <div className="max-w-4xl mx-auto text-center">
          <Link 
            to="/customer"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Landing Page
          </Link>
          
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-light mb-4" style={{ color: '#D4A574' }}>
              ESTABLISHED
            </h1>
            <h2 className="text-2xl md:text-4xl font-light" style={{ color: '#F5F5DC' }}>
              DESIGN CO.
            </h2>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-light mb-4" style={{ color: '#D4A574' }}>
            COMPREHENSIVE CLIENT QUESTIONNAIRE
          </h3>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Help us understand your vision, lifestyle, and preferences to create your perfect space.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Section {currentSection + 1} of {sections.length}</span>
            <span className="text-sm text-gray-400">{Math.round(((currentSection + 1) / sections.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                background: 'linear-gradient(to right, #D4A574, #F5F5DC)',
                width: `${((currentSection + 1) / sections.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            {/* Section Header */}
            <div className="text-center mb-12">
              <h4 className="text-3xl font-light mb-4" style={{ color: '#D4A574' }}>
                {sections[currentSection].title}
              </h4>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {sections[currentSection].description}
              </p>
            </div>

            {/* Section Content */}
            <div className="bg-gray-900 rounded-2xl p-8 mb-8">
              {renderSection()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentSection === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentSection === 0 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              
              <div className="flex space-x-2">
                {sections.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSection
                        ? 'bg-[#D4A574]'
                        : index < currentSection
                        ? 'bg-[#D4A574] opacity-50'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {currentSection === sections.length - 1 ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4A574 0%, #F5F5DC 50%, #D4A574 100%)',
                    color: '#000'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Questionnaire</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextSection}
                  className="px-6 py-3 rounded-lg font-medium transition-all"
                  style={{
                    background: '#D4A574',
                    color: '#000'
                  }}
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerfacingQuestionnaire;