import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ComprehensiveQuestionnaire = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  
  const [formData, setFormData] = useState({
    rooms_involved: [],
    ideal_sofa_price: '',
    property_type: '',
    project_type: '',
    renovation_has_current_plans: '',
    renovation_has_new_plans: '',
    client_name: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_preferences: [],
    best_time_to_call: '',
    worked_with_designer_before: '',
    primary_decision_maker: '',
    involvement_level: '',
    timeline: '',
    budget_range: '',
    project_priority: [],
    other_project_description: '',
    new_build_address: '',
    new_build_architect: '',
    new_build_builder: '',
    new_build_has_plans: '',
    new_build_process_stage: '',
    new_build_need_furniture: '',
    new_build_scope_notes: '',
    renovation_address: '',
    renovation_move_in_date: '',
    renovation_builder: '',
    renovation_architect: '',
    renovation_existing_condition: '',
    renovation_need_furniture: '',
    renovation_memories: '',
    renovation_scope_notes: '',
    furniture_refresh_condition: '',
    furniture_has_current_plans: '',
    furniture_move_in_date: '',
    furniture_scope_notes: '',
    design_love_home: '',
    design_space_use: '',
    design_current_use: '',
    design_first_impression: '',
    design_common_color_palette: '',
    design_preferred_palette: [],
    design_disliked_colors: '',
    design_styles_preference: [],
    design_styles_love: '',
    design_artwork_preference: [],
    design_meaningful_item: '',
    design_existing_furniture: '',
    finishes_patterns_preference: [],
    design_materials_to_avoid: '',
    design_special_requirements: '',
    design_pinterest_houzz: '',
    design_additional_comments: '',
    know_you_household: '',
    know_you_pets: '',
    know_you_weekday_routine: '',
    know_you_weekend_routine: '',
    know_you_lighting_preference: '',
    know_you_entertaining_style: '',
    know_you_relax_space: '',
    know_you_future_plans: '',
    know_you_social_media: '',
    know_you_hobbies: '',
    know_you_fun: '',
    know_you_happy: '',
    know_you_family_birthdays: '',
    know_you_anniversary: '',
    know_you_family_together: '',
    know_you_favorite_restaurant: '',
    know_you_favorite_vacation: '',
    know_you_favorite_foods: '',
    know_you_evoke_space: '',
    know_you_support_social_life: '',
    know_you_share_more: '',
    how_heard: '',
    how_heard_other: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const handleFormChange = (field, value) => {
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

  const handleRoomsChange = (newRooms) => {
    handleFormChange('rooms_involved', newRooms);
  };

  const handleAddRoom = () => {
    if (newRoomName && !formData.rooms_involved.includes(newRoomName)) {
      handleRoomsChange([...formData.rooms_involved, newRoomName]);
      setNewRoomName("");
    }
  };

  const handleRemoveRoom = (roomNameToRemove) => {
    handleRoomsChange(formData.rooms_involved.filter(room => room !== roomNameToRemove));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name && !formData.client_name) {
      alert('Please provide at least a project name or client name.');
      return;
    }
    setIsLoading(true);
    try {
      // Create project from questionnaire data
      const projectData = {
        name: formData.name || `${formData.client_name} Project`,
        client_info: {
          full_name: formData.client_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          communication_method: formData.contact_preferences.join(', '),
          call_time: formData.best_time_to_call
        },
        project_type: formData.project_type,
        timeline: formData.timeline,
        budget: formData.budget_range,
        style_preferences: formData.design_styles_preference,
        color_palette: formData.design_preferred_palette.join(', '),
        special_requirements: formData.design_special_requirements,
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
        if (formData.rooms_involved && formData.rooms_involved.length > 0) {
          for (const roomName of formData.rooms_involved) {
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
      setIsLoading(false);
    }
  };

  // Helper components for the form
  const Section = ({ title, description, children }) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[#8B7355]">{title}</h3>
        {description && <p className="text-sm text-stone-400">{description}</p>}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, id, value, onChange, type = "text", placeholder = "", className = "" }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-stone-300">{label}</label>
      <input 
        id={id} 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className={`${inputStyles} ${className}`} 
      />
    </div>
  );

  const FieldWrapper = ({ label, children }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-stone-300">{label}</label>
      {children}
    </div>
  );

  const CheckboxGroup = ({ options, value = [], onChange }) => {
    const handleCheckedChange = (option, checked) => {
      if (checked) {
        onChange([...value, option]);
      } else {
        onChange(value.filter(item => item !== option));
      }
    };

    return (
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {options.map(option => (
          <div key={option} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={option}
              checked={value.includes(option)}
              onChange={(e) => handleCheckedChange(option, e.target.checked)}
              className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
            />
            <label htmlFor={option} className="text-xs text-stone-300">
              {option}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const inputStyles = "bg-gray-700 border-gray-600 text-stone-200 focus:border-[#8B7355] placeholder:text-stone-500 text-sm w-full px-3 py-2 rounded-md";

  // Options arrays from your previous app
  const roomsOptionsUpdated = [
    "Entire Home",
    "Living Room", "Family Room", "Great Room", "Primary Bedroom", "Guest Bedroom", "Children's Bedroom", "Nursery",
    "Home Office", "Study", "Library", "Primary Bathroom", "Guest Bathroom", "Half Bathroom", "Jack and Jill Bathroom",
    "Kitchen", "Pantry", "Butler's Pantry", "Dining Room", "Breakfast Nook", "Bar Area", "Wine Cellar",
    "Laundry Room", "Mudroom", "Utility Room", "Linen Closet", "Walk-in Closet", "Basement", "Home Theater",
    "Media Room", "Game Room", "Home Gym", "Play Room", "Craft Room", "Music Room", "Art Studio",
    "Workshop", "Foyer", "Entryway", "Hallway", "Sunroom", "Screened Porch", "Patio", "Deck",
    "Outdoor Kitchen", "Pool House", "Guest House"
  ];

  const projectPriorityOptions = ["Turn-Key Furnishings", "Art & Decor", "Custom Window Treatments", "Custom Millwork", "Finishes & Fixtures", "Follow a plan we have created in a specific timeframe", "Other"];
  const contactPrefOptions = ["Email", "Phone Call", "Text Message"];
  const stylePrefOptions = ["Modern", "Industrial", "Coastal", "Contemporary", "Mid-Century Modern", "Eclectic", "Traditional", "Transitional", "Rustic", "Farmhouse", "Bohemian", "Minimalist", "Scandinavian", "Classic"];
  const artworkPrefOptions = ["Abstract", "Landscape", "Nature", "Photographs", "Architecture", "Painting", "Water Color", "Minimalist", "Black and White", "Pop-art", "Vintage", "Pattern", "Other"];
  const colorPrefOptions = ["Dark & Moody", "Light & Airy", "Warm Neutral", "Cool Neutral", "Bold & Vibrant", "Earthy & Organic", "Monochromatic", "Pastel"];
  const finishesOptions = ["Warm wood tones", "Neutral wood tones", "Cool wood tones", "Leather", "Silver", "Bronze", "Gold", "Brass", "Chrome", "Brushed Nickel", "Matte Black", "Solid", "Geometric", "Stripes", "Floral", "Animal", "Rattan", "Concrete", "Glass", "Marble", "Other"];

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header with Logo */}
      <div className="w-full bg-[#1E293B] shadow-lg flex items-center justify-center my-8 h-auto max-h-[150px] p-4 rounded-lg border border-[#8B7355]/50 mx-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleCreateProject} className="space-y-6">
          <div className="bg-[#2D3748] border border-stone-700 text-stone-200 rounded-lg p-8">
            
            {/* Client Information */}
            <Section title="Client Information">
              <div className="grid grid-cols-2 gap-3">
                <InputField 
                  label="Client Name" 
                  id="client_name" 
                  value={formData.client_name || ''} 
                  onChange={(e) => handleFormChange('client_name', e.target.value)} 
                />
                <InputField 
                  label="Project Name" 
                  id="name" 
                  value={formData.name || ''} 
                  onChange={(e) => handleFormChange('name', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField 
                  label="Email Address" 
                  id="email" 
                  type="email" 
                  value={formData.email || ''} 
                  onChange={(e) => handleFormChange('email', e.target.value)} 
                />
                <InputField 
                  label="Phone Number" 
                  id="phone" 
                  type="tel" 
                  value={formData.phone || ''} 
                  onChange={(e) => handleFormChange('phone', e.target.value)} 
                />
              </div>
              <FieldWrapper label="Project Address">
                <textarea 
                  className={inputStyles} 
                  value={formData.address || ''} 
                  onChange={(e) => handleFormChange('address', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Contact Preferences">
                <CheckboxGroup 
                  options={contactPrefOptions} 
                  value={formData.contact_preferences} 
                  onChange={(v) => handleFormChange('contact_preferences', v)} 
                />
              </FieldWrapper>
              <InputField 
                label="Best Time to Call" 
                id="best_time_to_call" 
                value={formData.best_time_to_call || ''} 
                onChange={(e) => handleFormChange('best_time_to_call', e.target.value)} 
              />
            </Section>

            {/* Project Type & Budget */}
            <Section title="Project Details">
              <FieldWrapper label="What type of project is this?">
                <div className="space-y-2">
                  {["New Build", "Renovation", "Furniture/Styling Refresh", "Other"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="project_type"
                        value={option}
                        id={`type-${option}`}
                        checked={formData.project_type === option}
                        onChange={(e) => handleFormChange('project_type', e.target.value)}
                        className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                      />
                      <label htmlFor={`type-${option}`} className="text-sm text-stone-200">{option}</label>
                    </div>
                  ))}
                </div>
              </FieldWrapper>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InputField 
                  label="Your Timeline" 
                  id="timeline" 
                  value={formData.timeline} 
                  onChange={(e) => handleFormChange('timeline', e.target.value)} 
                />
                <div>
                  <label htmlFor="budget_range" className="font-semibold text-stone-300">Budget Range</label>
                  <select 
                    value={formData.budget_range} 
                    onChange={(e) => handleFormChange('budget_range', e.target.value)}
                    className={inputStyles}
                  >
                    <option value="">Select...</option>
                    <option value="35k-65k">$35k - $65k</option>
                    <option value="75k-100k">$75k - $100k</option>
                    <option value="125k-500k">$125k - $500k</option>
                    <option value="600k-1M">$600k - $1M</option>
                    <option value="2M-5M">$2M - $5M</option>
                    <option value="7M-10M">$7M - $10M</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <FieldWrapper label="Project Priorities">
                <CheckboxGroup 
                  options={projectPriorityOptions} 
                  value={formData.project_priority} 
                  onChange={(v) => handleFormChange('project_priority', v)} 
                />
              </FieldWrapper>
            </Section>

            {/* Rooms */}
            <Section title="Rooms Involved">
              <FieldWrapper label="Select rooms involved in this project">
                <CheckboxGroup 
                  options={roomsOptionsUpdated} 
                  value={formData.rooms_involved} 
                  onChange={handleRoomsChange} 
                />
              </FieldWrapper>
              <FieldWrapper label="Add Custom Room">
                <div className="flex items-center gap-2">
                  <input
                    className={inputStyles}
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Wine Cellar"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddRoom} 
                    className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white px-4 py-2 rounded-md shrink-0"
                  >
                    + Add
                  </button>
                </div>
                {formData.rooms_involved.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.rooms_involved.map(room => (
                      <span key={room} className="flex items-center bg-gray-600 text-stone-200 px-2 py-1 rounded-full text-xs">
                        {room}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveRoom(room)} 
                          className="ml-1 text-stone-300 hover:text-red-400"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </FieldWrapper>
            </Section>

            {/* Design Preferences */}
            <Section title="Design Preferences">
              <FieldWrapper label="Style Preferences">
                <CheckboxGroup 
                  options={stylePrefOptions} 
                  value={formData.design_styles_preference} 
                  onChange={(v) => handleFormChange('design_styles_preference', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Color Palette Preference">
                <CheckboxGroup 
                  options={colorPrefOptions} 
                  value={formData.design_preferred_palette} 
                  onChange={(v) => handleFormChange('design_preferred_palette', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Artwork Preferences">
                <CheckboxGroup 
                  options={artworkPrefOptions} 
                  value={formData.design_artwork_preference} 
                  onChange={(v) => handleFormChange('design_artwork_preference', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="What do you love about your current home?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_love_home || ''} 
                  onChange={(e) => handleFormChange('design_love_home', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="First impression you want guests to have">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_first_impression || ''} 
                  onChange={(e) => handleFormChange('design_first_impression', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
            </Section>

            {/* Personal Information */}
            <Section title="Getting to Know You">
              <FieldWrapper label="Household members (include ages of children)">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_household || ''} 
                  onChange={(e) => handleFormChange('know_you_household', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Pets">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_pets || ''} 
                  onChange={(e) => handleFormChange('know_you_pets', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Hobbies">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_hobbies || ''} 
                  onChange={(e) => handleFormChange('know_you_hobbies', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="How do you entertain guests?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_entertaining_style || ''} 
                  onChange={(e) => handleFormChange('know_you_entertaining_style', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
            </Section>

            {/* Additional Questions */}
            <Section title="Additional Information">
              <FieldWrapper label="How did you hear about us?">
                <div className="space-y-2">
                  {["Internet Search", "Social Media", "Friend Referral", "Magazine", "Google", "Market Event", "Other"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="how_heard"
                        value={option}
                        id={`heard-${option}`}
                        checked={formData.how_heard === option}
                        onChange={(e) => handleFormChange('how_heard', e.target.value)}
                        className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                      />
                      <label htmlFor={`heard-${option}`} className="text-sm text-stone-200">{option}</label>
                    </div>
                  ))}
                </div>
              </FieldWrapper>
              <FieldWrapper label="Pinterest/Houzz Links">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_pinterest_houzz || ''} 
                  onChange={(e) => handleFormChange('design_pinterest_houzz', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Additional Comments">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_additional_comments || ''} 
                  onChange={(e) => handleFormChange('design_additional_comments', e.target.value)} 
                  rows="4"
                />
              </FieldWrapper>
            </Section>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-700">
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="text-stone-200 border-stone-600 hover:bg-stone-700 hover:text-white px-6 py-3 rounded-lg border"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="bg-[#8B7355] hover:bg-[#A0927B] text-white px-6 py-3 rounded-lg flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default ComprehensiveQuestionnaire;