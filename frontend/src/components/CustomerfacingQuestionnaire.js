import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// API functions
const projectAPI = {
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

const roomAPI = {
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

const itemAPI = {
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

// Section wrapper component
const Section = ({ title, description, children }) => (
    <div className="bg-gray-800 border-stone-700 shadow-lg rounded-lg p-6 space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-stone-300">{title}</h2>
            {description && <p className="text-md text-stone-400 mt-2">{description}</p>}
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const FieldWrapper = ({ label, children, required }) => (
    <div className="space-y-2">
        <Label className="text-lg font-semibold text-[#8B7355]">
            {label} {required && <span className="text-red-400">*</span>}
        </Label>
        {children}
    </div>
);

const inputStyles = "bg-gray-700 border-gray-600 text-[#F5F5DC] focus:border-[#8B7355] placeholder:text-stone-400";

// New InputField component
const InputField = ({ label, id, value, onChange, required = false, type = "text", placeholder = "" }) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-lg font-semibold text-[#8B7355]">
            {label} {required && <span className="text-red-400">*</span>}
        </Label>
        <Input
            id={id}
            className={inputStyles}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {options.map(option => (
                <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                        id={option}
                        checked={value.includes(option)}
                        onCheckedChange={(checked) => handleCheckedChange(option, checked)}
                        className="border-stone-400 data-[state=checked]:bg-[#F5F5DC] data-[state=checked]:border-[#F5F5DC] data-[state=checked]:text-[#8B7355]"
                    />
                    <label htmlFor={option} className="text-sm font-medium leading-none text-[#F5F5DC]">
                        {option}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default function CustomerfacingQuestionnaire() {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus(null);
        try {
            const newProject = await projectAPI.create(formData);

            // Create rooms WITH THE CORRECT STARTER ITEMS
            if (formData.rooms_involved && formData.rooms_involved.length > 0) {
                const uniqueRooms = [...new Set(formData.rooms_involved)];
                
                for (const roomName of uniqueRooms) {
                    const newRoom = await roomAPI.create({ 
                        project_id: newProject.id, 
                        name: roomName, 
                        notes: '' 
                    });

                    // THIS IS THE CORRECTED, SIMPLIFIED ITEM POPULATION LOGIC
                    const basicItems = [
                        { category: 'LIGHTING', sub_category: 'CEILING', name: 'Ceiling Light - Click to edit' },
                        { category: 'FURNITURE', sub_category: 'SEATING', name: 'Seating - Click to edit' },
                        { category: 'ACCESSORIES', sub_category: 'ART & DECOR', name: 'Art & Decor - Click to edit' },
                        { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'WALL', name: 'Wall Finish - Click to edit' },
                        { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'FLOORING', name: 'Flooring - Click to edit' }
                    ];

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
                    } else if (roomName === "Entire Home") {
                        // Additional items for 'Entire Home'
                        basicItems.push(
                            { category: 'WINDOWS AND DOORS', sub_category: 'WINDOWS', name: 'Window Treatment - Click to edit' },
                            { category: 'HARDWARE', sub_category: 'DOOR HARDWARE', name: 'Door Hardware - Click to edit' },
                            { category: 'PAINT AND MATERIALS', sub_category: 'INTERIOR PAINT', name: 'Interior Paint - Click to edit' },
                            { category: 'ELECTRONICS AND SMART HOME', sub_category: 'SECURITY SYSTEMS', name: 'Security System - Click to edit' },
                            { category: 'ARCHITECTURAL ELEMENTS', sub_category: 'MOLDING', name: 'Molding - Click to edit' }
                        );
                    }

                    const itemsToCreate = basicItems.map(item => ({
                        project_id: newProject.id,
                        room_id: newRoom.id,
                        category: item.category,
                        sub_category: item.sub_category,
                        name: item.name,
                        status: 'Walkthrough',
                        quantity: 1,
                    }));

                    await itemAPI.bulkCreate(itemsToCreate);
                }
            }

            setSubmissionStatus('success');
            // Reset form data after successful submission
            setFormData({
                rooms_involved: [],
                ideal_sofa_price: '',
                property_type: '',
                project_type: '',
                renovation_has_current_plans: '',
                renovation_has_new_plans: '',
                client_name: '', name: '', email: '', phone: '', address: '', contact_preferences: [],
                best_time_to_call: '', worked_with_designer_before: '', primary_decision_maker: '', involvement_level: '',
                timeline: '', budget_range: '', project_priority: [], other_project_description: '',
                new_build_address: '', new_build_architect: '', new_build_builder: '', new_build_has_plans: '',
                new_build_process_stage: '', new_build_need_furniture: '', new_build_scope_notes: '',
                renovation_address: '', renovation_move_in_date: '', renovation_builder: '', renovation_architect: '',
                renovation_existing_condition: '', renovation_need_furniture: '', renovation_memories: '',
                renovation_scope_notes: '', furniture_refresh_condition: '', furniture_has_current_plans: '',
                furniture_move_in_date: '', furniture_scope_notes: '', design_love_home: '', design_space_use: '',
                design_current_use: '', design_first_impression: '', design_common_color_palette: '',
                design_preferred_palette: [], design_disliked_colors: '', design_styles_preference: [],
                design_styles_love: '', design_artwork_preference: [], design_meaningful_item: '',
                design_existing_furniture: '', finishes_patterns_preference: [], design_materials_to_avoid: '',
                design_special_requirements: '', design_pinterest_houzz: '', design_additional_comments: '',
                know_you_household: '', know_you_pets: '', know_you_weekday_routine: '', know_you_weekend_routine: '',
                know_you_lighting_preference: '', know_you_entertaining_style: '', know_you_relax_space: '',
                know_you_future_plans: '', know_you_social_media: '', know_you_hobbies: '', know_you_fun: '',
                know_you_happy: '', know_you_family_birthdays: '', know_you_anniversary: '',
                know_you_family_together: '', know_you_favorite_restaurant: '', know_you_favorite_vacation: '',
                know_you_favorite_foods: '', know_you_evoke_space: '', know_you_support_social_life: '',
                know_you_share_more: '', how_heard: '', how_heard_other: '',
            });
            // Redirect after successful project creation
            window.location.href = `/customer/project/${newProject.id}`;
        } catch (error) {
            console.error("Failed to create project:", error);
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Updated roomsOptions
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

    const PREVIEW_ROOM_COLORS = {
        'Entire Home': '#4B5563',
        'Living Room': '#7C6B7F', 'Family Room': '#7C6B7F', 'Sunroom': '#3B7A6C', 'Primary Bedroom': '#4A6741',
        'Guest Bedroom': '#6B4C75', 'Children\'s Bedroom': '#C07B3A', 'Nursery': '#8B5A3D', 'Home Office': '#C07B3A',
        'Primary Bathroom': '#3B6B8C', 'Guest Bathroom': '#6B4037', 'Half Bathroom': '#9B3B7A', 'Jack and Jill Bathroom': '#9B3B7A',
        'Kitchen': '#5B9AA0', 'Pantry': '#5B9AA0', 'Butler\'s Pantry': '#5B9AA0',
        'Dining Room': '#B8484A', 'Breakfast Nook': '#B8484A',
        'Bar Area': '#6B7280', 'Laundry Room': '#5B7A2F', 'Mudroom': '#A56A43', 'Utility Room': '#6B7280',
        'Linen Closet': '#6B7280', 'Walk-in Closet': '#6B7280', 'Basement': '#374151', 'Home Theater': '#374151',
        'Media Room': '#374151', 'Home Gym': '#EA580C', 'Play Room': '#C2410C', 'Craft Room': '#BE185D',
        'Music Room': '#BE185D', 'Art Studio': '#BE185D', 'Library': '#4A5568', 'Wine Cellar': '#4A5568',
        'Hobby Room': '#BE185D', 'Workshop': '#4A5568', 'Foyer': '#A56A43', 'Backyard': '#2F5233',
        'Patio': '#2F5233', 'Powder Bath': '#9B3B7A', 'Great Room': '#7C6B7F', 'Study': '#C07B3A',
        'Game Room': '#C2410C', 'Entryway': '#A56A43', 'Hallway': '#A56A43', 'Screened Porch': '#3B7A6C', 'Deck': '#2F5233',
        'Outdoor Kitchen': '#2F5233', 'Pool House': '#2F5233', 'Guest House': '#4A6741'
    };

    // Logic to find which custom rooms have been added
    const predefinedRoomsSet = new Set(roomsOptionsUpdated);
    const customRoomsAdded = formData.rooms_involved.filter(room => !predefinedRoomsSet.has(room));

    return (
        <div className="bg-[#1E293B] min-h-screen p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
            <div className="max-w-4xl mx-auto bg-[#2D3748] p-8 rounded-lg shadow-2xl">
                {/* Header that matches your drawing - bigger and more proportionate container */}
                <div className="w-full bg-[#8B7355] shadow-lg flex items-center justify-center my-8" style={{ height: '130px' }}>
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf2_Establishedlogo.png"
                        alt="Established Design Co."
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-xl font-bold text-[#8B7355]">COMPREHENSIVE CLIENT QUESTIONNAIRE</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 mt-8">
                    {/* Section 1: Client Information */}
                    <Section title="CLIENT INFORMATION">
                        <InputField label="Full Name" id="client_name" value={formData.client_name || ''} onChange={(e) => handleFormChange('client_name', e.target.value)} required />
                        <InputField label="Project Name" id="name" value={formData.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} required />
                        <InputField label="Email Address" id="email" type="email" value={formData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} />
                        <InputField label="Phone Number" id="phone" type="tel" value={formData.phone || ''} onChange={(e) => handleFormChange('phone', e.target.value)} />
                        <FieldWrapper label="Project Address">
                            <Textarea className={inputStyles} value={formData.address || ''} onChange={(e) => handleFormChange('address', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Preferred Method of Communication">
                            <CheckboxGroup options={contactPrefOptions} value={formData.contact_preferences} onChange={(v) => handleFormChange('contact_preferences', v)} />
                        </FieldWrapper>
                        <InputField label="Best Time to Call" id="best_time_to_call" value={formData.best_time_to_call || ''} onChange={(e) => handleFormChange('best_time_to_call', e.target.value)} />
                        <FieldWrapper label="Have you worked with a designer before? If not, what are your hesitations?">
                            <Textarea className={inputStyles} value={formData.worked_with_designer_before || ''} onChange={(e) => handleFormChange('worked_with_designer_before', e.target.value)} />
                        </FieldWrapper>
                        <InputField label="Who will be the primary decision maker(s) for this project?" id="primary_decision_maker" value={formData.primary_decision_maker || ''} onChange={(e) => handleFormChange('primary_decision_maker', e.target.value)} />
                        <FieldWrapper label="How involved would you like to be in the design process?">
                            <RadioGroup value={formData.involvement_level} onValueChange={(value) => handleFormChange('involvement_level', value)} className="text-[#F5F5DC]">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Very involved - I want to approve every detail" id="very-involved" className="border-stone-400 text-[#8B7355]" />
                                        <Label htmlFor="very-involved" className="text-[#F5F5DC]">Very involved - I want to approve every detail</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Somewhat involved - I want to approve major decisions" id="somewhat-involved" className="border-stone-400 text-[#8B7355]" />
                                        <Label htmlFor="somewhat-involved" className="text-[#F5F5DC]">Somewhat involved - I want to approve major decisions</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Minimally involved - I trust your expertise" id="minimally-involved" className="border-stone-400 text-[#8B7355]" />
                                        <Label htmlFor="minimally-involved" className="text-[#F5F5DC]">Minimally involved - I trust your expertise</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </FieldWrapper>
                        <FieldWrapper label="What is your ideal sofa price point?">
                            <RadioGroup value={formData.ideal_sofa_price} onValueChange={(value) => handleFormChange('ideal_sofa_price', value)} className="text-[#F5F5DC]">
                                <div className="flex flex-col space-y-2">
                                    {["$2,000-$4,000", "$4,000-$8,000", "$8,000-$12,000", "$12,000+"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`sofa-price-${option.replace(/[^a-zA-Z0-9]/g, '')}`} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={`sofa-price-${option.replace(/[^a-zA-Z0-9]/g, '')}`} className="text-[#F5F5DC]">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>
                    </Section>

                    {/* Section 2: Total Scope of Work */}
                    <Section title="TOTAL SCOPE OF WORK FOR YOUR PROJECT" description="Please take a moment and think which project best fits your needs and answer the appropriate questions below. (New build, Renovation, Furniture Refresh) And don't forget the ROOMS section, even if you are Building!">
                        <FieldWrapper label="What type of property is this?">
                            <RadioGroup value={formData.property_type} onValueChange={(value) => handleFormChange('property_type', value)} className="text-[#F5F5DC]">
                                <div className="flex flex-col space-y-2">
                                    {["Primary Residence", "Vacation Home", "Rental Property", "Commercial Space", "Other"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={option} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={option} className="text-[#F5F5DC]">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <InputField label="Desired timeline for project completion" id="timeline" value={formData.timeline} onChange={(e) => handleFormChange('timeline', e.target.value)} />
                            <div>
                                <Label htmlFor="budget_range" className="text-lg font-semibold text-[#8B7355]">Investment / Budget Range</Label>
                                <Select value={formData.budget_range} onValueChange={(value) => handleFormChange('budget_range', value)}>
                                    <SelectTrigger id="budget_range" className="bg-gray-700 border-gray-600 text-[#F5F5DC] focus:border-[#8B7355] placeholder:text-stone-400">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 text-[#F5F5DC] border-stone-700">
                                        <SelectItem value="35k-65k" className="focus:bg-[#8B7355] focus:text-white">$35k - $65k</SelectItem>
                                        <SelectItem value="75k-100k" className="focus:bg-[#8B7355] focus:text-white">$75k - $100k</SelectItem>
                                        <SelectItem value="125k-500k" className="focus:bg-[#8B7355] focus:text-white">$125k - $500k</SelectItem>
                                        <SelectItem value="600k-1M" className="focus:bg-[#8B7355] focus:text-white">$600k - $1M</SelectItem>
                                        <SelectItem value="2M-5M" className="focus:bg-[#8B7355] focus:text-white">$2M - $5M</SelectItem>
                                        <SelectItem value="7M-10M" className="focus:bg-[#8B7355] focus:text-white">$7M - $10M</SelectItem>
                                        <SelectItem value="other" className="focus:bg-[#8B7355] focus:text-white">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <FieldWrapper label="What is your priority for this project? (Check all that apply)">
                            <CheckboxGroup options={projectPriorityOptions} value={formData.project_priority} onChange={(v) => handleFormChange('project_priority', v)} />
                        </FieldWrapper>

                        <FieldWrapper label="Which rooms are involved in this project?">
                            <CheckboxGroup options={roomsOptionsUpdated} value={formData.rooms_involved} onChange={handleRoomsChange} />
                        </FieldWrapper>

                        <FieldWrapper label="Add a Custom Room">
                            <div className="flex items-center gap-2">
                                <Input
                                    className={inputStyles}
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="e.g., Wine Cellar"
                                />
                                <Button type="button" onClick={handleAddRoom} className="bg-[#B49B7E] hover:bg-[#A08B6F] shrink-0">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Room
                                </Button>
                            </div>
                            {customRoomsAdded.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    <h4 className="text-sm font-semibold text-stone-400">Custom rooms added:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {customRoomsAdded.map(room => (
                                            <div key={room} className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1 text-sm">
                                                <span>{room}</span>
                                                <button type="button" onClick={() => handleRemoveRoom(room)}>
                                                    <XCircle className="w-4 h-4 text-red-400 hover:text-red-300"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </FieldWrapper>
                    </Section>

                    {/* Section 3: Type of Project */}
                    <Section title="TYPE OF PROJECT" description="Tell us more about your project and what you would love to accomplish, and how we can best partner with you!">
                        <FieldWrapper label="What type of project is this?">
                            <RadioGroup value={formData.project_type} onValueChange={(value) => handleFormChange('project_type', value)} className="text-[#F5F5DC]">
                                <div className="flex flex-col space-y-2">
                                    {["New Build", "Renovation", "Furniture/Styling Refresh", "Other"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`type-${option}`} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={`type-${option}`} className="text-[#F5F5DC]">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>

                        {formData.project_type === 'Other' && (
                            <FieldWrapper label="Tell us about your project">
                                <Textarea className={inputStyles} value={formData.other_project_description || ''} onChange={(e) => handleFormChange('other_project_description', e.target.value)} placeholder="Please describe your project..." />
                            </FieldWrapper>
                        )}
                    </Section>

                    {/* Conditional Sections for New Build, Renovation, and Furniture Refresh would continue here following the same structure from the original code... */}

                    {/* Rooms Preview Section */}
                    {formData.rooms_involved && formData.rooms_involved.length > 0 && (
                        <Section title="Project Rooms Preview" description="A preview of the rooms that will be created in your project spreadsheets.">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {formData.rooms_involved.map(room => (
                                    <div key={room} className="rounded-lg overflow-hidden shadow-lg border border-stone-700">
                                        <div style={{ backgroundColor: PREVIEW_ROOM_COLORS[room] || '#6B7280' }} className="p-3 text-white font-bold text-center">
                                            {room}
                                        </div>
                                        <div className="p-4 bg-gray-700 text-sm text-center text-stone-300 h-full">
                                            Items for this room will be managed in the spreadsheet tabs after submission.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    <div className="flex justify-end pt-8">
                        <Button type="submit" disabled={isSubmitting} className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white font-bold py-3 px-8 text-lg rounded-lg w-full sm:w-auto">
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Submit Questionnaire
                        </Button>
                    </div>

                    {submissionStatus === 'success' && (
                        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
                            Questionnaire submitted successfully! Redirecting...
                        </div>
                    )}
                    {submissionStatus === 'error' && (
                        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
                            Failed to submit questionnaire. Please try again.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}