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
              <FieldWrapper label="Have you worked with a designer before? If not, what are your hesitations?">
                <textarea 
                  className={inputStyles} 
                  value={formData.worked_with_designer_before || ''} 
                  onChange={(e) => handleFormChange('worked_with_designer_before', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <InputField 
                label="Who will be the primary decision maker(s) for this project?" 
                id="primary_decision_maker" 
                value={formData.primary_decision_maker || ''} 
                onChange={(e) => handleFormChange('primary_decision_maker', e.target.value)} 
              />
              <FieldWrapper label="How involved would you like to be in the design process?">
                <div className="space-y-2">
                  {["Very involved - I want to approve every detail", "Somewhat involved - I want to approve major decisions", "Minimally involved - I trust your expertise"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="involvement_level"
                        value={option}
                        id={`involvement-${option}`}
                        checked={formData.involvement_level === option}
                        onChange={(e) => handleFormChange('involvement_level', e.target.value)}
                        className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                      />
                      <label htmlFor={`involvement-${option}`} className="text-sm text-stone-200">{option}</label>
                    </div>
                  ))}
                </div>
              </FieldWrapper>
              <FieldWrapper label="What is your ideal sofa price point?">
                <select 
                  value={formData.ideal_sofa_price || ''} 
                  onChange={(e) => handleFormChange('ideal_sofa_price', e.target.value)}
                  className={inputStyles}
                >
                  <option value="">Select...</option>
                  <option value="$2,000-$4,000">$2,000-$4,000</option>
                  <option value="$4,000-$8,000">$4,000-$8,000</option>
                  <option value="$8,000-$12,000">$8,000-$12,000</option>
                  <option value="$12,000+">$12,000+</option>
                </select>
              </FieldWrapper>
            </Section>

            {/* Total Scope of Work */}
            <Section title="Total Scope of Work for Your Project">
              <FieldWrapper label="What type of property is this?">
                <div className="space-y-2">
                  {["Primary Residence", "Vacation Home", "Rental Property", "Commercial Space", "Other"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="property_type"
                        value={option}
                        id={`property-${option}`}
                        checked={formData.property_type === option}
                        onChange={(e) => handleFormChange('property_type', e.target.value)}
                        className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                      />
                      <label htmlFor={`property-${option}`} className="text-sm text-stone-200">{option}</label>
                    </div>
                  ))}
                </div>
              </FieldWrapper>
              <InputField 
                label="What is your desired timeline for project completion?" 
                id="timeline" 
                value={formData.timeline || ''} 
                onChange={(e) => handleFormChange('timeline', e.target.value)} 
              />
              <FieldWrapper label="Investment / Budget Range">
                <select 
                  value={formData.budget_range || ''} 
                  onChange={(e) => handleFormChange('budget_range', e.target.value)}
                  className={inputStyles}
                >
                  <option value="">Select...</option>
                  <option value="$15k-$30k">$15k-$30k</option>
                  <option value="$30k-$50k">$30k-$50k</option>
                  <option value="$50k-$75k">$50k-$75k</option>
                  <option value="$75k-$100k">$75k-$100k</option>
                  <option value="$100k-$150k">$100k-$150k</option>
                  <option value="$150k+">$150k+</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="What is your priority for this project? (Check all that apply)">
                <CheckboxGroup 
                  options={projectPriorityOptions} 
                  value={formData.project_priority} 
                  onChange={(v) => handleFormChange('project_priority', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Which rooms are involved in this project?">
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

            {/* Project Type */}
            <Section title="Type of Project">
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

              {/* CONDITIONAL SECTIONS BASED ON PROJECT TYPE */}
              {formData.project_type === "New Build" && (
                <div className="space-y-4 mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-md font-semibold text-[#8B7355]">New Build Details</h4>
                  <InputField 
                    label="New Build Address" 
                    id="new_build_address" 
                    value={formData.new_build_address || ''} 
                    onChange={(e) => handleFormChange('new_build_address', e.target.value)} 
                  />
                  <InputField 
                    label="Architect" 
                    id="new_build_architect" 
                    value={formData.new_build_architect || ''} 
                    onChange={(e) => handleFormChange('new_build_architect', e.target.value)} 
                  />
                  <InputField 
                    label="Builder" 
                    id="new_build_builder" 
                    value={formData.new_build_builder || ''} 
                    onChange={(e) => handleFormChange('new_build_builder', e.target.value)} 
                  />
                  <FieldWrapper label="Do you have plans?">
                    <div className="space-y-2">
                      {["Yes", "No", "In Progress"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="new_build_has_plans"
                            value={option}
                            id={`plans-${option}`}
                            checked={formData.new_build_has_plans === option}
                            onChange={(e) => handleFormChange('new_build_has_plans', e.target.value)}
                            className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                          />
                          <label htmlFor={`plans-${option}`} className="text-sm text-stone-200">{option}</label>
                        </div>
                      ))}
                    </div>
                  </FieldWrapper>
                  <FieldWrapper label="What stage of the process are you in?">
                    <textarea 
                      className={inputStyles} 
                      value={formData.new_build_process_stage || ''} 
                      onChange={(e) => handleFormChange('new_build_process_stage', e.target.value)} 
                      rows="3"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Do you need help selecting furniture and decor?">
                    <div className="space-y-2">
                      {["Yes", "No", "Maybe"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="new_build_need_furniture"
                            value={option}
                            id={`furniture-${option}`}
                            checked={formData.new_build_need_furniture === option}
                            onChange={(e) => handleFormChange('new_build_need_furniture', e.target.value)}
                            className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                          />
                          <label htmlFor={`furniture-${option}`} className="text-sm text-stone-200">{option}</label>
                        </div>
                      ))}
                    </div>
                  </FieldWrapper>
                  <FieldWrapper label="Please share any additional notes about your new build project">
                    <textarea 
                      className={inputStyles} 
                      value={formData.new_build_scope_notes || ''} 
                      onChange={(e) => handleFormChange('new_build_scope_notes', e.target.value)} 
                      rows="4"
                    />
                  </FieldWrapper>
                </div>
              )}

              {formData.project_type === "Renovation" && (
                <div className="space-y-4 mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-md font-semibold text-[#8B7355]">Renovation Details</h4>
                  <InputField 
                    label="Renovation Address" 
                    id="renovation_address" 
                    value={formData.renovation_address || ''} 
                    onChange={(e) => handleFormChange('renovation_address', e.target.value)} 
                  />
                  <InputField 
                    label="Move-in Date (if applicable)" 
                    id="renovation_move_in_date" 
                    value={formData.renovation_move_in_date || ''} 
                    onChange={(e) => handleFormChange('renovation_move_in_date', e.target.value)} 
                  />
                  <InputField 
                    label="Builder/Contractor" 
                    id="renovation_builder" 
                    value={formData.renovation_builder || ''} 
                    onChange={(e) => handleFormChange('renovation_builder', e.target.value)} 
                  />
                  <InputField 
                    label="Architect" 
                    id="renovation_architect" 
                    value={formData.renovation_architect || ''} 
                    onChange={(e) => handleFormChange('renovation_architect', e.target.value)} 
                  />
                  <FieldWrapper label="What is the existing condition of the home?">
                    <textarea 
                      className={inputStyles} 
                      value={formData.renovation_existing_condition || ''} 
                      onChange={(e) => handleFormChange('renovation_existing_condition', e.target.value)} 
                      rows="3"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Do you have current plans for the renovation?">
                    <div className="space-y-2">
                      {["Yes", "No", "In Progress"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="renovation_has_current_plans"
                            value={option}
                            id={`renovation-plans-${option}`}
                            checked={formData.renovation_has_current_plans === option}
                            onChange={(e) => handleFormChange('renovation_has_current_plans', e.target.value)}
                            className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                          />
                          <label htmlFor={`renovation-plans-${option}`} className="text-sm text-stone-200">{option}</label>
                        </div>
                      ))}
                    </div>
                  </FieldWrapper>
                  <FieldWrapper label="Do you need help selecting furniture and decor?">
                    <div className="space-y-2">
                      {["Yes", "No", "Maybe"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="renovation_need_furniture"
                            value={option}
                            id={`renovation-furniture-${option}`}
                            checked={formData.renovation_need_furniture === option}
                            onChange={(e) => handleFormChange('renovation_need_furniture', e.target.value)}
                            className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                          />
                          <label htmlFor={`renovation-furniture-${option}`} className="text-sm text-stone-200">{option}</label>
                        </div>
                      ))}
                    </div>
                  </FieldWrapper>
                  <FieldWrapper label="Are there any memories or sentimental value attached to your current home that we should preserve?">
                    <textarea 
                      className={inputStyles} 
                      value={formData.renovation_memories || ''} 
                      onChange={(e) => handleFormChange('renovation_memories', e.target.value)} 
                      rows="4"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Please share any additional notes about your renovation project">
                    <textarea 
                      className={inputStyles} 
                      value={formData.renovation_scope_notes || ''} 
                      onChange={(e) => handleFormChange('renovation_scope_notes', e.target.value)} 
                      rows="4"
                    />
                  </FieldWrapper>
                </div>
              )}

              {formData.project_type === "Furniture/Styling Refresh" && (
                <div className="space-y-4 mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-md font-semibold text-[#8B7355]">Furniture/Styling Refresh Details</h4>
                  <FieldWrapper label="What is the current condition of your home?">
                    <textarea 
                      className={inputStyles} 
                      value={formData.furniture_refresh_condition || ''} 
                      onChange={(e) => handleFormChange('furniture_refresh_condition', e.target.value)} 
                      rows="3"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Do you have current plans for the refresh?">
                    <div className="space-y-2">
                      {["Yes", "No", "Some ideas"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="furniture_has_current_plans"
                            value={option}
                            id={`furniture-plans-${option}`}
                            checked={formData.furniture_has_current_plans === option}
                            onChange={(e) => handleFormChange('furniture_has_current_plans', e.target.value)}
                            className="border-stone-400 text-[#8B7355] focus:ring-[#8B7355]"
                          />
                          <label htmlFor={`furniture-plans-${option}`} className="text-sm text-stone-200">{option}</label>
                        </div>
                      ))}
                    </div>
                  </FieldWrapper>
                  <InputField 
                    label="When would you like to complete this refresh?" 
                    id="furniture_move_in_date" 
                    value={formData.furniture_move_in_date || ''} 
                    onChange={(e) => handleFormChange('furniture_move_in_date', e.target.value)} 
                  />
                  <FieldWrapper label="Please share any additional notes about your furniture/styling refresh">
                    <textarea 
                      className={inputStyles} 
                      value={formData.furniture_scope_notes || ''} 
                      onChange={(e) => handleFormChange('furniture_scope_notes', e.target.value)} 
                      rows="4"
                    />
                  </FieldWrapper>
                </div>
              )}

              <FieldWrapper label="Tell us more about your project and what you would love to accomplish">
                <textarea 
                  className={inputStyles} 
                  value={formData.other_project_description || ''} 
                  onChange={(e) => handleFormChange('other_project_description', e.target.value)} 
                  rows="4"
                />
              </FieldWrapper>
            </Section>

            {/* Design Questions */}
            <Section title="Design Questions">
              <FieldWrapper label="What do you love about your current home?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_love_home || ''} 
                  onChange={(e) => handleFormChange('design_love_home', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="How will the spaces be used? (e.g., formal dining, casual living, etc.)">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_space_use || ''} 
                  onChange={(e) => handleFormChange('design_space_use', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="How are you currently using these spaces?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_current_use || ''} 
                  onChange={(e) => handleFormChange('design_current_use', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What is the first impression you want guests to have when they enter your home?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_first_impression || ''} 
                  onChange={(e) => handleFormChange('design_first_impression', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What is your current home's color palette?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_common_color_palette || ''} 
                  onChange={(e) => handleFormChange('design_common_color_palette', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="What color palette do you prefer?">
                <CheckboxGroup 
                  options={colorPrefOptions} 
                  value={formData.design_preferred_palette} 
                  onChange={(v) => handleFormChange('design_preferred_palette', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Are there any colors you strongly dislike?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_disliked_colors || ''} 
                  onChange={(e) => handleFormChange('design_disliked_colors', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="Which interior design styles do you prefer? (Select all that apply)">
                <CheckboxGroup 
                  options={stylePrefOptions} 
                  value={formData.design_styles_preference} 
                  onChange={(v) => handleFormChange('design_styles_preference', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Tell us more about the styles you love">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_styles_love || ''} 
                  onChange={(e) => handleFormChange('design_styles_love', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What are your preferences for artwork?">
                <CheckboxGroup 
                  options={artworkPrefOptions} 
                  value={formData.design_artwork_preference} 
                  onChange={(v) => handleFormChange('design_artwork_preference', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Is there a piece of art, furniture, or a souvenir that holds significant personal meaning to you?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_meaningful_item || ''} 
                  onChange={(e) => handleFormChange('design_meaningful_item', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Do you have existing furniture that you would like to keep?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_existing_furniture || ''} 
                  onChange={(e) => handleFormChange('design_existing_furniture', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Finishes and Patterns (Select all that apply)">
                <CheckboxGroup 
                  options={finishesOptions} 
                  value={formData.finishes_patterns_preference} 
                  onChange={(v) => handleFormChange('finishes_patterns_preference', v)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Do you have any specific materials you prefer or want to avoid?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_materials_to_avoid || ''} 
                  onChange={(e) => handleFormChange('design_materials_to_avoid', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Are there any special requirements or accessibility needs we should consider?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_special_requirements || ''} 
                  onChange={(e) => handleFormChange('design_special_requirements', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Pinterest/Houzz Links or Inspiration Sources">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_pinterest_houzz || ''} 
                  onChange={(e) => handleFormChange('design_pinterest_houzz', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Any additional design comments or thoughts?">
                <textarea 
                  className={inputStyles} 
                  value={formData.design_additional_comments || ''} 
                  onChange={(e) => handleFormChange('design_additional_comments', e.target.value)} 
                  rows="4"
                />
              </FieldWrapper>
            </Section>

            {/* Getting to Know You Better */}
            <Section title="Getting to Know You Better">
              <FieldWrapper label="Who lives in your household? (Include ages of children if applicable)">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_household || ''} 
                  onChange={(e) => handleFormChange('know_you_household', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Do you have pets? If yes, please specify">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_pets || ''} 
                  onChange={(e) => handleFormChange('know_you_pets', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="Describe a typical weekday at your home">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_weekday_routine || ''} 
                  onChange={(e) => handleFormChange('know_you_weekday_routine', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Describe a typical weekend at your home">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_weekend_routine || ''} 
                  onChange={(e) => handleFormChange('know_you_weekend_routine', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What are your lighting preferences?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_lighting_preference || ''} 
                  onChange={(e) => handleFormChange('know_you_lighting_preference', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="How do you typically entertain guests?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_entertaining_style || ''} 
                  onChange={(e) => handleFormChange('know_you_entertaining_style', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Where do you go to relax in your home?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_relax_space || ''} 
                  onChange={(e) => handleFormChange('know_you_relax_space', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="Do you have any future plans for your family (children, aging parents, etc.)?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_future_plans || ''} 
                  onChange={(e) => handleFormChange('know_you_future_plans', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Are you active on social media? If so, which platforms?">
                <input 
                  className={inputStyles} 
                  value={formData.know_you_social_media || ''} 
                  onChange={(e) => handleFormChange('know_you_social_media', e.target.value)} 
                />
              </FieldWrapper>
              <FieldWrapper label="Tell us about your hobbies">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_hobbies || ''} 
                  onChange={(e) => handleFormChange('know_you_hobbies', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What do you do for fun?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_fun || ''} 
                  onChange={(e) => handleFormChange('know_you_fun', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What makes you HAPPY?!">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_happy || ''} 
                  onChange={(e) => handleFormChange('know_you_happy', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="When are your family birthdays?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_family_birthdays || ''} 
                  onChange={(e) => handleFormChange('know_you_family_birthdays', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="When is your anniversary?">
                <input 
                  className={inputStyles} 
                  value={formData.know_you_anniversary || ''} 
                  onChange={(e) => handleFormChange('know_you_anniversary', e.target.value)} 
                />
              </FieldWrapper>
              <FieldWrapper label="What does your family like to do together?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_family_together || ''} 
                  onChange={(e) => handleFormChange('know_you_family_together', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="What is your FAVORITE restaurant?">
                <input 
                  className={inputStyles} 
                  value={formData.know_you_favorite_restaurant || ''} 
                  onChange={(e) => handleFormChange('know_you_favorite_restaurant', e.target.value)} 
                />
              </FieldWrapper>
              <FieldWrapper label="What is your favorite place to vacation?">
                <input 
                  className={inputStyles} 
                  value={formData.know_you_favorite_vacation || ''} 
                  onChange={(e) => handleFormChange('know_you_favorite_vacation', e.target.value)} 
                />
              </FieldWrapper>
              <FieldWrapper label="What are your favorite foods?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_favorite_foods || ''} 
                  onChange={(e) => handleFormChange('know_you_favorite_foods', e.target.value)} 
                  rows="2"
                />
              </FieldWrapper>
              <FieldWrapper label="When you come home after a long day, what space do you naturally gravitate toward, and what feeling do you want that space to evoke?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_evoke_space || ''} 
                  onChange={(e) => handleFormChange('know_you_evoke_space', e.target.value)} 
                  rows="4"
                />
              </FieldWrapper>
              <FieldWrapper label="How do you like your home to support your social life?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_support_social_life || ''} 
                  onChange={(e) => handleFormChange('know_you_support_social_life', e.target.value)} 
                  rows="3"
                />
              </FieldWrapper>
              <FieldWrapper label="Is there ANYTHING ELSE that you would like to share with us?">
                <textarea 
                  className={inputStyles} 
                  value={formData.know_you_share_more || ''} 
                  onChange={(e) => handleFormChange('know_you_share_more', e.target.value)} 
                  rows="4"
                />
              </FieldWrapper>
            </Section>

            {/* How Did You Hear About Us */}
            <Section title="How Did You Hear About Us">
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
              {formData.how_heard === "Other" && (
                <FieldWrapper label="Please specify">
                  <input 
                    className={inputStyles} 
                    value={formData.how_heard_other || ''} 
                    onChange={(e) => handleFormChange('how_heard_other', e.target.value)} 
                  />
                </FieldWrapper>
              )}
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