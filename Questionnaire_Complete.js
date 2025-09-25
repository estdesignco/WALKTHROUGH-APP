import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CustomerFacingQuestionnaire = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    email: '',
    phone: '',
    address: '',
    rooms_involved: [],
    project_type: '',
    timeline: '',
    budget: '',
    style_preferences: '',
    description: '',
    family_details: '',
    lifestyle_preferences: '',
    technology_needs: '',
    sustainability_priorities: '',
    storage_requirements: '',
    entertaining_needs: '',
    maintenance_preferences: ''
  });

  const [customRoom, setCustomRoom] = useState('');

  const projectTypes = [
    'Full Home Renovation',
    'Kitchen Remodel',
    'Bathroom Remodel',
    'Living Room Design',
    'Bedroom Design',
    'Home Office Design',
    'Basement Finishing',
    'New Construction',
    'Consultation Only',
    'Other'
  ];

  const timelineOptions = [
    '1-3 months',
    '3-6 months',
    '6-12 months',
    '1+ years',
    'Flexible'
  ];

  const budgetRanges = [
    'Under $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    '$100,000 - $250,000',
    '$250,000+',
    'To be discussed'
  ];

  const roomOptions = [
    'Living Room', 'Dining Room', 'Kitchen', 'Primary Bedroom', 
    'Guest Bedroom', 'Children\'s Bedroom', 'Primary Bathroom', 
    'Guest Bathroom', 'Home Office', 'Family Room', 'Basement',
    'Laundry Room', 'Entryway', 'Outdoor Spaces', 'Whole House'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoomSelection = (room) => {
    setFormData(prev => ({
      ...prev,
      rooms_involved: prev.rooms_involved.includes(room)
        ? prev.rooms_involved.filter(r => r !== room)
        : [...prev.rooms_involved, room]
    }));
  };

  const addCustomRoom = () => {
    if (customRoom.trim() && !formData.rooms_involved.includes(customRoom.trim())) {
      setFormData(prev => ({
        ...prev,
        rooms_involved: [...prev.rooms_involved, customRoom.trim()]
      }));
      setCustomRoom('');
    }
  };

  const removeRoom = (room) => {
    setFormData(prev => ({
      ...prev,
      rooms_involved: prev.rooms_involved.filter(r => r !== room)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.client_name || !formData.email || formData.rooms_involved.length === 0) {
      setSubmitStatus('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Creating your project...');

    try {
      const projectData = {
        name: formData.name,
        client_info: {
          full_name: formData.client_name,
          email: formData.email,
          phone: formData.phone || '',
          address: formData.address || ''
        },
        rooms_involved: formData.rooms_involved,
        project_type: formData.project_type,
        timeline: formData.timeline,
        budget: formData.budget,
        style_preferences: formData.style_preferences,
        description: formData.description,
        family_details: formData.family_details,
        lifestyle_preferences: formData.lifestyle_preferences,
        technology_needs: formData.technology_needs,
        sustainability_priorities: formData.sustainability_priorities,
        storage_requirements: formData.storage_requirements,
        entertaining_needs: formData.entertaining_needs,
        maintenance_preferences: formData.maintenance_preferences
      };

      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      setSubmitStatus('Project created successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          client_name: '',
          email: '',
          phone: '',
          address: '',
          rooms_involved: [],
          project_type: '',
          timeline: '',
          budget: '',
          style_preferences: '',
          description: '',
          family_details: '',
          lifestyle_preferences: '',
          technology_needs: '',
          sustainability_priorities: '',
          storage_requirements: '',
          entertaining_needs: '',
          maintenance_preferences: ''
        });
        setSubmitStatus('');
      }, 2000);

    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitStatus('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-4 py-2" style={{ height: '150px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(1.8)', maxWidth: '95%', maxHeight: '90%' }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-[#B49B7E] tracking-wide mb-4">Design Questionnaire</h1>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-6"></div>
          <p className="text-lg" style={{ color: '#F5F5DC', opacity: '0.8' }}>
            Help us create your perfect space by sharing your vision and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Information */}
          <Card className="bg-gradient-to-br from-black/40 to-gray-900/60 border-[#B49B7E]/20">
            <CardHeader>
              <CardTitle className="text-2xl font-light text-[#B49B7E] tracking-wide">Basic Information</CardTitle>
              <CardDescription style={{ color: '#F5F5DC', opacity: '0.7' }}>
                Let's start with the essentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-[#F5F5DC]/90 font-medium">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="e.g., Smith Family Home Renovation"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="client_name" className="text-[#F5F5DC]/90 font-medium">Your Full Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="John and Jane Smith"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email" className="text-[#F5F5DC]/90 font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="john@email.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-[#F5F5DC]/90 font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-[#F5F5DC]/90 font-medium">Property Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                  placeholder="123 Main Street, City, State 12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Room Selection */}
          <Card className="bg-gradient-to-br from-black/40 to-gray-900/60 border-[#B49B7E]/20">
            <CardHeader>
              <CardTitle className="text-2xl font-light text-[#B49B7E] tracking-wide">Rooms Involved *</CardTitle>
              <CardDescription style={{ color: '#F5F5DC', opacity: '0.7' }}>
                Select all rooms that will be part of this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Room Selection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roomOptions.map((room) => (
                  <div key={room} className="flex items-center space-x-2">
                    <Checkbox
                      id={room}
                      checked={formData.rooms_involved.includes(room)}
                      onCheckedChange={() => handleRoomSelection(room)}
                      className="border-[#B49B7E]/50 data-[state=checked]:bg-[#B49B7E] data-[state=checked]:border-[#B49B7E]"
                    />
                    <Label
                      htmlFor={room}
                      className="text-sm text-[#F5F5DC]/90 cursor-pointer"
                    >
                      {room}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Custom Room Input */}
              <div className="flex gap-2">
                <Input
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="Add custom room..."
                  className="bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRoom())}
                />
                <Button
                  type="button"
                  onClick={addCustomRoom}
                  className="bg-[#B49B7E] hover:bg-[#A08B6F] text-[#F5F5DC]"
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected Rooms Display */}
              {formData.rooms_involved.length > 0 && (
                <div className="mt-4">
                  <Label className="text-[#F5F5DC]/90 font-medium mb-3 block">Selected Rooms:</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.rooms_involved.map((room) => (
                      <div
                        key={room}
                        className="flex items-center gap-2 bg-[#B49B7E]/20 border border-[#B49B7E]/30 px-3 py-1 rounded-full"
                      >
                        <span className="text-sm text-[#F5F5DC]">{room}</span>
                        <button
                          type="button"
                          onClick={() => removeRoom(room)}
                          className="text-[#B49B7E] hover:text-red-400 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card className="bg-gradient-to-br from-black/40 to-gray-900/60 border-[#B49B7E]/20">
            <CardHeader>
              <CardTitle className="text-2xl font-light text-[#B49B7E] tracking-wide">Project Details</CardTitle>
              <CardDescription style={{ color: '#F5F5DC', opacity: '0.7' }}>
                Tell us about your project scope and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-[#F5F5DC]/90 font-medium">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                    <SelectTrigger className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E]">
                      <SelectValue placeholder="Select project type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-[#B49B7E]/30">
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-[#F5F5DC] focus:bg-[#B49B7E]/20">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#F5F5DC]/90 font-medium">Timeline</Label>
                  <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                    <SelectTrigger className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E]">
                      <SelectValue placeholder="Select timeline..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-[#B49B7E]/30">
                      {timelineOptions.map((timeline) => (
                        <SelectItem key={timeline} value={timeline} className="text-[#F5F5DC] focus:bg-[#B49B7E]/20">
                          {timeline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#F5F5DC]/90 font-medium">Budget Range</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E]">
                      <SelectValue placeholder="Select budget range..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-[#B49B7E]/30">
                      {budgetRanges.map((budget) => (
                        <SelectItem key={budget} value={budget} className="text-[#F5F5DC] focus:bg-[#B49B7E]/20">
                          {budget}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="style_preferences" className="text-[#F5F5DC]/90 font-medium">Style Preferences</Label>
                <Textarea
                  id="style_preferences"
                  value={formData.style_preferences}
                  onChange={(e) => handleInputChange('style_preferences', e.target.value)}
                  className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                  placeholder="Describe your preferred design style (e.g., modern, traditional, transitional, farmhouse, etc.)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-[#F5F5DC]/90 font-medium">Project Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                  placeholder="Tell us about your vision, goals, and any specific requirements for this project..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle Questions */}
          <Card className="bg-gradient-to-br from-black/40 to-gray-900/60 border-[#B49B7E]/20">
            <CardHeader>
              <CardTitle className="text-2xl font-light text-[#B49B7E] tracking-wide">Lifestyle & Preferences</CardTitle>
              <CardDescription style={{ color: '#F5F5DC', opacity: '0.7' }}>
                Help us understand your lifestyle to create the perfect space
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="family_details" className="text-[#F5F5DC]/90 font-medium">Family & Household</Label>
                  <Textarea
                    id="family_details"
                    value={formData.family_details}
                    onChange={(e) => handleInputChange('family_details', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="Tell us about your family (kids, pets, elderly family members, etc.)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="lifestyle_preferences" className="text-[#F5F5DC]/90 font-medium">Lifestyle Preferences</Label>
                  <Textarea
                    id="lifestyle_preferences"
                    value={formData.lifestyle_preferences}
                    onChange={(e) => handleInputChange('lifestyle_preferences', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="How do you live in your space? (formal vs casual, active vs relaxed, etc.)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="technology_needs" className="text-[#F5F5DC]/90 font-medium">Technology Needs</Label>
                  <Textarea
                    id="technology_needs"
                    value={formData.technology_needs}
                    onChange={(e) => handleInputChange('technology_needs', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="Smart home features, entertainment systems, home office needs, etc."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="sustainability_priorities" className="text-[#F5F5DC]/90 font-medium">Sustainability Priorities</Label>
                  <Textarea
                    id="sustainability_priorities"
                    value={formData.sustainability_priorities}
                    onChange={(e) => handleInputChange('sustainability_priorities', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="Eco-friendly materials, energy efficiency, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="storage_requirements" className="text-[#F5F5DC]/90 font-medium">Storage Requirements</Label>
                  <Textarea
                    id="storage_requirements"
                    value={formData.storage_requirements}
                    onChange={(e) => handleInputChange('storage_requirements', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="What do you need to store? How much space do you need?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="entertaining_needs" className="text-[#F5F5DC]/90 font-medium">Entertaining Needs</Label>
                  <Textarea
                    id="entertaining_needs"
                    value={formData.entertaining_needs}
                    onChange={(e) => handleInputChange('entertaining_needs', e.target.value)}
                    className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                    placeholder="How often do you entertain? What type of gatherings?"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maintenance_preferences" className="text-[#F5F5DC]/90 font-medium">Maintenance Preferences</Label>
                <Textarea
                  id="maintenance_preferences"
                  value={formData.maintenance_preferences}
                  onChange={(e) => handleInputChange('maintenance_preferences', e.target.value)}
                  className="mt-2 bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:ring-[#B49B7E] placeholder:text-[#B49B7E]/50"
                  placeholder="Low maintenance vs. high-end finishes, cleaning preferences, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center pt-8">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.client_name || !formData.email || formData.rooms_involved.length === 0}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] px-12 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Project...
                </>
              ) : (
                'Submit Questionnaire'
              )}
            </Button>
            
            {submitStatus && (
              <p className={`mt-4 text-lg ${submitStatus.includes('success') ? 'text-green-400' : submitStatus.includes('wrong') ? 'text-red-400' : 'text-[#B49B7E]'}`}>
                {submitStatus}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFacingQuestionnaire;