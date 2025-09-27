import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompletePageLayout from './CompletePageLayout';

const ComprehensiveQuestionnaire = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  
  const [formData, setFormData] = useState({
    // CLIENT INFORMATION
    full_name: '',
    project_name: '',
    email: '',
    phone: '',
    address: '',
    communication_method: 'Email',
    call_time: '',
    designer_experience: '',
    decision_makers: '',
    involvement_level: 'Somewhat involved - I want to approve major decisions',
    sofa_price_point: '$4,000-$8,000',
    
    // SCOPE OF WORK
    property_type: 'Primary Residence',
    timeline: '',
    budget_range: '$50k-$75k',
    project_priorities: [],
    selected_rooms: [],
    custom_rooms: '',
    
    // PROJECT TYPE
    project_type: 'New Build',
    project_description: '',
    
    // DESIGN QUESTIONS
    home_loves: '',
    space_usage: '',
    current_uses: '',
    first_impression: '',
    current_color_palette: '',
    preferred_color_palette: 'Warm Neutral',
    disliked_colors: '',
    design_styles: [],
    style_preferences: '',
    artwork_preferences: [],
    meaningful_pieces: '',
    existing_furniture: '',
    materials_preferences: [],
    material_preferences_notes: '',
    special_requirements: '',
    inspiration_images: null,
    pinterest_houzz: '',
    additional_comments: '',
    
    // LIFESTYLE
    household_members: '',
    pets: '',
    typical_weekday: '',
    typical_weekend: '',
    lighting_preferences: '',
    entertaining_style: '',
    relaxation_spaces: '',
    future_needs: '',
    social_media: '',
    hobbies: '',
    fun_activities: '',
    happiness: '',
    birthdays: '',
    anniversary: '',
    family_activities: '',
    favorite_restaurant: '',
    favorite_vacation: '',
    favorite_foods: '',
    favorite_space: '',
    social_support: '',
    additional_sharing: '',
    
    // HOW DID YOU HEAR
    referral_source: 'Internet Search'
  });

  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomOptions = [
    'Living Room', 'Family Room', 'Great Room', 'Primary Bedroom', 'Guest Bedroom',
    'Children\'s Bedroom', 'Nursery', 'Home Office', 'Study', 'Library',
    'Primary Bathroom', 'Guest Bathroom', 'Half Bathroom', 'Jack and Jill Bathroom',
    'Kitchen', 'Pantry', 'Butler\'s Pantry', 'Dining Room', 'Breakfast Nook',
    'Bar Area', 'Wine Cellar', 'Laundry Room', 'Mudroom', 'Utility Room',
    'Linen Closet', 'Walk-in Closet', 'Basement', 'Home Theater', 'Media Room',
    'Game Room', 'Home Gym', 'Play Room', 'Craft Room', 'Music Room',
    'Art Studio', 'Workshop', 'Foyer', 'Entryway', 'Hallway',
    'Sunroom', 'Screened Porch', 'Patio', 'Deck', 'Outdoor Kitchen',
    'Pool House', 'Guest House'
  ];

  const sections = [
    'Client Information',
    'Scope of Work',
    'Project Type',
    'Design Questions',
    'Lifestyle',
    'Referral Source'
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleFileChange = (name, files) => {
    setFormData(prev => ({
      ...prev,
      [name]: files
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create project from questionnaire data
      const projectData = {
        name: formData.project_name || `${formData.full_name} Project`,
        client_info: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          communication_method: formData.communication_method,
          call_time: formData.call_time
        },
        project_type: formData.project_type,
        timeline: formData.timeline,
        budget: formData.budget_range,
        style_preferences: formData.design_styles,
        color_palette: formData.preferred_color_palette,
        special_requirements: formData.special_requirements,
        questionnaire_data: formData
      };

      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const project = await response.json();
        
        // Add selected rooms to the project
        if (formData.selected_rooms.length > 0) {
          for (const roomName of formData.selected_rooms) {
            await fetch(`${BACKEND_URL}/api/rooms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                project_id: project.id,
                room_type: roomName.toLowerCase().replace(/\s+/g, '_'),
                room_name: roomName
              }),
            });
          }
        }

        // Navigate to walkthrough with the new project
        navigate(`/project/${project.id}/walkthrough`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderClientInformation = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">CLIENT INFORMATION</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
          <input
            type="text"
            value={formData.project_name}
            onChange={(e) => handleInputChange('project_name', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Project Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Method of Communication</label>
        <div className="space-y-2">
          {['Email', 'Phone Call', 'Text Message'].map(method => (
            <label key={method} className="flex items-center">
              <input
                type="radio"
                name="communication_method"
                value={method}
                checked={formData.communication_method === method}
                onChange={(e) => handleInputChange('communication_method', e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-300">{method}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Best Time to Call</label>
        <input
          type="text"
          value={formData.call_time}
          onChange={(e) => handleInputChange('call_time', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Have you worked with a designer before? If not, what are your hesitations?</label>
        <textarea
          value={formData.designer_experience}
          onChange={(e) => handleInputChange('designer_experience', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Who will be the primary decision maker(s) for this project?</label>
        <input
          type="text"
          value={formData.decision_makers}
          onChange={(e) => handleInputChange('decision_makers', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">How involved would you like to be in the design process?</label>
        <select
          value={formData.involvement_level}
          onChange={(e) => handleInputChange('involvement_level', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="Very involved - I want to approve every detail">Very involved - I want to approve every detail</option>
          <option value="Somewhat involved - I want to approve major decisions">Somewhat involved - I want to approve major decisions</option>
          <option value="Minimally involved - I trust your expertise">Minimally involved - I trust your expertise</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is your ideal sofa price point?</label>
        <select
          value={formData.sofa_price_point}
          onChange={(e) => handleInputChange('sofa_price_point', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="$2,000-$4,000">$2,000-$4,000</option>
          <option value="$4,000-$8,000">$4,000-$8,000</option>
          <option value="$8,000-$12,000">$8,000-$12,000</option>
          <option value="$12,000+">$12,000+</option>
        </select>
      </div>
    </div>
  );

  const renderScopeOfWork = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">TOTAL SCOPE OF WORK FOR YOUR PROJECT</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What type of property is this?</label>
        <select
          value={formData.property_type}
          onChange={(e) => handleInputChange('property_type', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="Primary Residence">Primary Residence</option>
          <option value="Vacation Home">Vacation Home</option>
          <option value="Rental Property">Rental Property</option>
          <option value="Commercial Space">Commercial Space</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is your desired timeline for project completion?</label>
        <input
          type="text"
          value={formData.timeline}
          onChange={(e) => handleInputChange('timeline', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Investment / Budget Range</label>
        <select
          value={formData.budget_range}
          onChange={(e) => handleInputChange('budget_range', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="$15k-$30k">$15k-$30k</option>
          <option value="$30k-$50k">$30k-$50k</option>
          <option value="$50k-$75k">$50k-$75k</option>
          <option value="$75k-$100k">$75k-$100k</option>
          <option value="$100k-$150k">$100k-$150k</option>
          <option value="$150k+">$150k+</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is your priority for this project? (Check all that apply)</label>
        <div className="space-y-2">
          {[
            'Turn-Key Furnishings',
            'Art & Decor',
            'Custom Window Treatments',
            'Custom Millwork',
            'Finishes & Fixtures',
            'Follow a plan we have created in a specific timeframe',
            'Other'
          ].map(priority => (
            <label key={priority} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.project_priorities.includes(priority)}
                onChange={() => handleMultiSelectChange('project_priorities', priority)}
                className="mr-2"
              />
              <span className="text-gray-300">{priority}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Which rooms are involved in this project?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {roomOptions.map(room => (
            <label key={room} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.selected_rooms.includes(room)}
                onChange={() => handleMultiSelectChange('selected_rooms', room)}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">{room}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Add Custom Room (optional)</label>
        <input
          type="text"
          value={formData.custom_rooms}
          onChange={(e) => handleInputChange('custom_rooms', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          placeholder="Enter custom room name"
        />
      </div>
    </div>
  );

  const renderProjectType = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">TYPE OF PROJECT</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What type of project is this?</label>
        <div className="space-y-2">
          {['New Build', 'Renovation', 'Furniture/Styling Refresh', 'Other'].map(type => (
            <label key={type} className="flex items-center">
              <input
                type="radio"
                name="project_type"
                value={type}
                checked={formData.project_type === type}
                onChange={(e) => handleInputChange('project_type', e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-300">{type}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tell us more about your project and what you would love to accomplish</label>
        <textarea
          value={formData.project_description}
          onChange={(e) => handleInputChange('project_description', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="4"
        />
      </div>
    </div>
  );

  const renderDesignQuestions = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">DESIGN QUESTIONS</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What do you love about your current home?</label>
        <textarea
          value={formData.home_loves}
          onChange={(e) => handleInputChange('home_loves', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">How will the spaces be used? (e.g., formal dining, casual living, etc.)</label>
        <textarea
          value={formData.space_usage}
          onChange={(e) => handleInputChange('space_usage', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is the first impression you want guests to have when they enter your home?</label>
        <textarea
          value={formData.first_impression}
          onChange={(e) => handleInputChange('first_impression', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What color palette do you prefer?</label>
        <select
          value={formData.preferred_color_palette}
          onChange={(e) => handleInputChange('preferred_color_palette', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="Dark & Moody">Dark & Moody</option>
          <option value="Light & Airy">Light & Airy</option>
          <option value="Warm Neutral">Warm Neutral</option>
          <option value="Cool Neutral">Cool Neutral</option>
          <option value="Bold & Vibrant">Bold & Vibrant</option>
          <option value="Earthy & Organic">Earthy & Organic</option>
          <option value="Monochromatic">Monochromatic</option>
          <option value="Pastel">Pastel</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Which interior design styles do you prefer? (Select all that apply)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Modern', 'Industrial', 'Coastal', 'Contemporary', 'Mid-Century Modern',
            'Eclectic', 'Traditional', 'Transitional', 'Rustic', 'Farmhouse',
            'Bohemian', 'Minimalist', 'Scandinavian'
          ].map(style => (
            <label key={style} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.design_styles.includes(style)}
                onChange={() => handleMultiSelectChange('design_styles', style)}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">{style}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What are your preferences for artwork?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Abstract', 'Landscape', 'Nature', 'Photographs', 'Architecture',
            'Painting', 'Water Color', 'Minimalist', 'Black and White',
            'Pop-art', 'Vintage', 'Pattern', 'Other'
          ].map(art => (
            <label key={art} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.artwork_preferences.includes(art)}
                onChange={() => handleMultiSelectChange('artwork_preferences', art)}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">{art}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Is there a piece of art, furniture, or a souvenir that holds significant personal meaning to you?</label>
        <textarea
          value={formData.meaningful_pieces}
          onChange={(e) => handleInputChange('meaningful_pieces', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Finishes and Patterns (Select all that apply)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Warm wood tones', 'Neutral wood tones', 'Cool wood tones', 'Leather',
            'Silver', 'Bronze', 'Gold', 'Brass', 'Chrome', 'Brushed Nickel',
            'Matte Black', 'Solid', 'Geometric', 'Stripes', 'Floral', 'Animal',
            'Rattan', 'Concrete', 'Glass', 'Marble', 'Other'
          ].map(material => (
            <label key={material} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.materials_preferences.includes(material)}
                onChange={() => handleMultiSelectChange('materials_preferences', material)}
                className="mr-2"
              />
              <span className="text-gray-300 text-sm">{material}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Do you have any specific materials you prefer or want to avoid?</label>
        <textarea
          value={formData.material_preferences_notes}
          onChange={(e) => handleInputChange('material_preferences_notes', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
    </div>
  );

  const renderLifestyle = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">GETTING TO KNOW YOU BETTER...</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Who lives in your household? (Include ages of children if applicable)</label>
        <textarea
          value={formData.household_members}
          onChange={(e) => handleInputChange('household_members', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Do you have pets? If yes, please specify</label>
        <input
          type="text"
          value={formData.pets}
          onChange={(e) => handleInputChange('pets', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">How do you typically entertain guests?</label>
        <textarea
          value={formData.entertaining_style}
          onChange={(e) => handleInputChange('entertaining_style', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tell us about your hobbies</label>
        <textarea
          value={formData.hobbies}
          onChange={(e) => handleInputChange('hobbies', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What makes you HAPPY?!</label>
        <textarea
          value={formData.happiness}
          onChange={(e) => handleInputChange('happiness', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is your FAVORITE restaurant?</label>
        <input
          type="text"
          value={formData.favorite_restaurant}
          onChange={(e) => handleInputChange('favorite_restaurant', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What is your favorite place to vacation?</label>
        <input
          type="text"
          value={formData.favorite_vacation}
          onChange={(e) => handleInputChange('favorite_vacation', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">When you come home after a long day, what space do you naturally gravitate toward, and what feeling do you want that space to evoke?</label>
        <textarea
          value={formData.favorite_space}
          onChange={(e) => handleInputChange('favorite_space', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Is there ANYTHING ELSE that you would like to share with us?</label>
        <textarea
          value={formData.additional_sharing}
          onChange={(e) => handleInputChange('additional_sharing', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
          rows="4"
        />
      </div>
    </div>
  );

  const renderReferralSource = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#F5F5DC] mb-4">HOW DID YOU HEAR ABOUT US</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">How did you hear about us?</label>
        <select
          value={formData.referral_source}
          onChange={(e) => handleInputChange('referral_source', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-[#B49B7E]/30 rounded-md text-[#F5F5DC]"
        >
          <option value="Internet Search">Internet Search</option>
          <option value="Social Media">Social Media</option>
          <option value="Friend Referral">Friend Referral</option>
          <option value="Magazine">Magazine</option>
          <option value="Google">Google</option>
          <option value="Market Event">Market Event</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderClientInformation();
      case 1: return renderScopeOfWork();
      case 2: return renderProjectType();
      case 3: return renderDesignQuestions();
      case 4: return renderLifestyle();
      case 5: return renderReferralSource();
      default: return renderClientInformation();
    }
  };

  return (
    <CompletePageLayout 
      projectId={clientId}
      activeTab="questionnaire"
      title="COMPREHENSIVE CLIENT QUESTIONNAIRE"
      hideNavigation={true}
    >
      {/* Progress Bar Container */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <div className="flex items-center justify-between mb-4">
          {sections.map((section, index) => (
            <div
              key={section}
              className={`flex-1 text-center text-sm ${
                index === currentSection
                  ? 'text-[#B49B7E] font-semibold'
                  : index < currentSection
                  ? 'text-green-400'
                  : 'text-[#F5F5DC]/60'
              }`}
            >
              {section}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 border border-[#B49B7E]/20">
          <div
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content Container */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-8 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <form onSubmit={handleSubmit}>
          {renderCurrentSection()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSection === 0}
              className="px-6 py-3 bg-[#8B4444]/80 hover:bg-[#8B4444] disabled:bg-gray-800/50 text-[#F5F5DC] rounded-lg transition-colors border border-[#B49B7E]/20"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="px-6 py-3 bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-black rounded-lg transition-colors border border-[#B49B7E]/20"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.full_name || !formData.project_name}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:bg-gray-600/50 text-[#F5F5DC] rounded-lg transition-colors border border-[#B49B7E]/20"
                >
                  {isSubmitting ? 'Creating Project...' : 'Submit Questionnaire'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </CompletePageLayout>
  );
};

export default ComprehensiveQuestionnaire;