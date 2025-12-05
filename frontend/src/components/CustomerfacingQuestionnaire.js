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

const createPageUrl = (page) => {
    return `/customer/${page.toLowerCase()}`;
};

// Section wrapper component
const Section = ({ title, description, children }) => (
    <Card className="bg-gray-800 border-stone-700 shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-stone-300">{title}</CardTitle>
            {description && <CardDescription className="text-md text-stone-400">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
            {children}
        </CardContent>
    </Card>
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

export default function Questionnaire() {
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
            const newProject = await Project.create(formData);

            // Create rooms WITH THE CORRECT STARTER ITEMS
            if (formData.rooms_involved && formData.rooms_involved.length > 0) {
                const uniqueRooms = [...new Set(formData.rooms_involved)];
                
                for (const roomName of uniqueRooms) {
                    const newRoom = await Room.create({ 
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

                    await Item.bulkCreate(itemsToCreate);
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

    // Updated roomsOptions to include Entire Home and Classic style
    const roomsOptionsUpdated = [
        "Entire Home", // Added 'Entire Home'
        "Living Room", "Family Room", "Great Room", "Primary Bedroom", "Guest Bedroom", "Children's Bedroom", "Nursery",
        "Home Office", "Study", "Library", "Primary Bathroom", "Guest Bathroom", "Half Bathroom", "Jack and Jill Bathroom",
        "Kitchen", "Pantry", "Butler's Pantry", "Dining Room", "Breakfast Nook", "Bar Area", "Wine Cellar",
        "Laundry Room", "Mudroom", "Utility Room", "Linen Closet", "Walk-in Closet", "Basement", "Home Theater",
        "Media Room", "Game Room", "Home Gym", "Play Room", "Craft Room", "Music Room", "Art Studio",
        "Workshop", "Foyer", "Entryway", "Hallway", "Sunroom", "Screened Porch", "Patio", "Deck",
        "Outdoor Kitchen", "Pool House", "Guest House"
    ];

    // Updated projectPriorityOptions from outline's formConfig
    const projectPriorityOptions = ["Turn-Key Furnishings", "Art & Decor", "Custom Window Treatments", "Custom Millwork", "Finishes & Fixtures", "Follow a plan we have created in a specific timeframe", "Other"];

    // Retaining original options not specified in the outline's partial formConfig
    const contactPrefOptions = ["Email", "Phone Call", "Text Message"];
    const stylePrefOptions = ["Modern", "Industrial", "Coastal", "Contemporary", "Mid-Century Modern", "Eclectic", "Traditional", "Transitional", "Rustic", "Farmhouse", "Bohemian", "Minimalist", "Scandinavian", "Classic"]; // Added 'Classic'
    const artworkPrefOptions = ["Abstract", "Landscape", "Nature", "Photographs", "Architecture", "Painting", "Water Color", "Minimalist", "Black and White", "Pop-art", "Vintage", "Pattern", "Other"];
    const colorPrefOptions = ["Dark & Moody", "Light & Airy", "Warm Neutral", "Cool Neutral", "Bold & Vibrant", "Earthy & Organic", "Monochromatic", "Pastel"];
    const finishesOptions = ["Warm wood tones", "Neutral wood tones", "Cool wood tones", "Leather", "Silver", "Bronze", "Gold", "Brass", "Chrome", "Brushed Nickel", "Matte Black", "Solid", "Geometric", "Stripes", "Floral", "Animal", "Rattan", "Concrete", "Glass", "Marble", "Other"];

    const PREVIEW_ROOM_COLORS = {
        'Entire Home': '#4B5563', // New color for Entire Home
        'Living Room': '#7C6B7F', 'Family Room': '#7C6B7F', 'Sunroom': '#3B7A6C', 'Primary Bedroom': '#4A6741',
        'Guest Bedroom': '#6B4C75', 'Children\'s Bedroom': '#C07B3A', 'Nursery': '#8B5A3D', 'Home Office': '#C07B3A',
        'Primary Bathroom': '#3B6B8C', 'Guest Bathroom': '#6B4037', 'Half Bathroom': '#9B3B7A', 'Jack and Jill Bathroom': '#9B3B7A',
        'Kitchen': '#5B9AA0', 'Pantry': '#5B9AA0', 'Butler\'s Pantry': '#5B9AA0', // Added Butler's Pantry color
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
    // Use the updated list for predefined rooms to filter custom ones
    const predefinedRoomsSet = new Set(roomsOptionsUpdated);
    const customRoomsAdded = formData.rooms_involved.filter(room => !predefinedRoomsSet.has(room));


    return (
        <div className="bg-[#1E293B] min-h-screen p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
            <div className="max-w-4xl mx-auto bg-[#2D3748] p-8 rounded-lg shadow-2xl">
                {/* Back Button */}
                <div className="mb-6">
                    <Link to="/" className="flex items-center text-stone-400 hover:text-stone-200 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Projects
                    </Link>
                </div>

                {/* Header that matches your drawing - bigger and more proportionate container */}
                <div className="w-full bg-[#8B7355] shadow-lg flex items-center justify-center my-8" style={{ height: '130px' }}>
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png"
                        alt="Established Design Co."
                        className="w-full h-full object-contain"
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

                        {/* Updated to use InputField and Select */}
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

                    {/* Section 4: New Build (Conditional) */}
                    {formData.project_type === 'New Build' && (
                        <Section title="NEW BUILD" description="If you are not currently building a new home, please feel free to skip these questions!">
                            <FieldWrapper label="Please list NEW BUILD address">
                                <Textarea className={inputStyles} value={formData.new_build_address || ''} onChange={(e) => handleFormChange('new_build_address', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Do you have an Architect? If so, please list Name and phone number below?">
                                <Textarea className={inputStyles} value={formData.new_build_architect || ''} onChange={(e) => handleFormChange('new_build_architect', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Do you have a builder? If so, please list Name and phone number below?">
                                <Textarea className={inputStyles} value={formData.new_build_builder || ''} onChange={(e) => handleFormChange('new_build_builder', e.target.value)} />
                            </FieldWrapper>
                            <InputField label="Do you have plans drawn?" id="new_build_has_plans" value={formData.new_build_has_plans || ''} onChange={(e) => handleFormChange('new_build_has_plans', e.target.value)} />
                            <InputField label="How far along in the building process are you?" id="new_build_process_stage" value={formData.new_build_process_stage || ''} onChange={(e) => handleFormChange('new_build_process_stage', e.target.value)} />
                            <FieldWrapper label="Once home is complete, will you be needing furniture? If so, give us an idea of what items you would love to procure!">
                                <Textarea className={inputStyles} value={formData.new_build_need_furniture || ''} onChange={(e) => handleFormChange('new_build_need_furniture', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <Textarea className={inputStyles} value={formData.new_build_scope_notes || ''} onChange={(e) => handleFormChange('new_build_scope_notes', e.target.value)} />
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 5: Renovation (Conditional) */}
                    {formData.project_type === 'Renovation' && (
                        <Section title="RENOVATION" description="If you are not looking to renovate, please feel free to skip these questions!">
                            <FieldWrapper label="Please list Renovation Address (If different!)">
                                <Textarea className={inputStyles} value={formData.renovation_address || ''} onChange={(e) => handleFormChange('renovation_address', e.target.value)} />
                            </FieldWrapper>
                            <InputField label="When did you move into this home?" id="renovation_move_in_date" type="date" value={formData.renovation_move_in_date || ''} onChange={(e) => handleFormChange('renovation_move_in_date', e.target.value)} />
                            <FieldWrapper label="Do you have a builder? If so, please list Name and phone number below?">
                                <Textarea className={inputStyles} value={formData.renovation_builder || ''} onChange={(e) => handleFormChange('renovation_builder', e.target.value)} />
                            </FieldWrapper>
                            <InputField label="Do you have the CURRENT plans/drawings for your home?" id="renovation_has_current_plans" value={formData.renovation_has_current_plans || ''} onChange={(e) => handleFormChange('renovation_has_current_plans', e.target.value)} />
                            <FieldWrapper label="Do you have an Architect? If so, please list Name and phone number below?">
                                <Textarea className={inputStyles} value={formData.renovation_architect || ''} onChange={(e) => handleFormChange('renovation_architect', e.target.value)} />
                            </FieldWrapper>
                            <InputField label="Do you have NEW UPDATED plans drawn?" id="renovation_has_new_plans" value={formData.renovation_has_new_plans || ''} onChange={(e) => handleFormChange('renovation_has_new_plans', e.target.value)} />
                            <FieldWrapper label="Briefly describe the existing condition of the space.">
                                <Textarea className={inputStyles} value={formData.renovation_existing_condition || ''} onChange={(e) => handleFormChange('renovation_existing_condition', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Once home is complete, will you be needing furniture? If so, give us an idea of what items you would love to procure!">
                                <Textarea className={inputStyles} value={formData.renovation_need_furniture || ''} onChange={(e) => handleFormChange('renovation_need_furniture', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Are there any physical MEMORIES in this home that you would like to preserve?">
                                <Textarea className={inputStyles} value={formData.renovation_memories || ''} onChange={(e) => handleFormChange('renovation_memories', e.target.value)} />
                            </FieldWrapper>
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <Textarea className={inputStyles} value={formData.renovation_scope_notes || ''} onChange={(e) => handleFormChange('renovation_scope_notes', e.target.value)} />
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 6: Furniture Refresh (Conditional) */}
                    {formData.project_type === 'Furniture/Styling Refresh' && (
                        <Section title="FURNITURE REFRESH" description="If you are not looking for a furniture refresh, please feel free to skip these questions!">
                            <FieldWrapper label="Briefly describe the existing condition of the space.">
                                <Textarea className={inputStyles} value={formData.furniture_refresh_condition || ''} onChange={(e) => handleFormChange('furniture_refresh_condition', e.target.value)} />
                            </FieldWrapper>
                            <InputField label="Do you have the CURRENT plans/drawings for your home?" id="furniture_has_current_plans" value={formData.furniture_has_current_plans || ''} onChange={(e) => handleFormChange('furniture_has_current_plans', e.target.value)} />
                            <InputField label="When did you move into this home?" id="furniture_move_in_date" type="date" value={formData.furniture_move_in_date || ''} onChange={(e) => handleFormChange('furniture_move_in_date', e.target.value)} />
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <Textarea className={inputStyles} value={formData.furniture_scope_notes || ''} onChange={(e) => handleFormChange('furniture_scope_notes', e.target.value)} />
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 7: Design Questions */}
                    <Section title="DESIGN QUESTIONS">
                        <FieldWrapper label="What do you love about your current home?">
                            <Textarea className={inputStyles} value={formData.design_love_home || ''} onChange={(e) => handleFormChange('design_love_home', e.target.value)} />
                        </FieldWrapper>
                        <InputField label="How will the spaces be used? (e.g., formal dining, casual living, etc.)" id="design_space_use" value={formData.design_space_use || ''} onChange={(e) => handleFormChange('design_space_use', e.target.value)} />
                        <InputField label="What are their current uses?" id="design_current_use" value={formData.design_current_use || ''} onChange={(e) => handleFormChange('design_current_use', e.target.value)} />
                        <FieldWrapper label="What is the first impression you want guests to have when they enter your home?">
                            <Textarea className={inputStyles} value={formData.design_first_impression || ''} onChange={(e) => handleFormChange('design_first_impression', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Is there a common color palette in your home that you love?">
                            <Textarea className={inputStyles} value={formData.design_common_color_palette || ''} onChange={(e) => handleFormChange('design_common_color_palette', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="What color palette do you prefer?">
                            <CheckboxGroup options={colorPrefOptions} value={formData.design_preferred_palette} onChange={(v) => handleFormChange('design_preferred_palette', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Are there any colors do you dislike?">
                            <Textarea className={inputStyles} value={formData.design_disliked_colors || ''} onChange={(e) => handleFormChange('design_disliked_colors', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Which interior design styles do you prefer? (Select all that apply)">
                            <CheckboxGroup options={stylePrefOptions} value={formData.design_styles_preference} onChange={(v) => handleFormChange('design_styles_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="What do you like about these styles?">
                            <Textarea className={inputStyles} value={formData.design_styles_love || ''} onChange={(e) => handleFormChange('design_styles_love', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="What are your preferences for artwork?">
                            <CheckboxGroup options={artworkPrefOptions} value={formData.design_artwork_preference} onChange={(v) => handleFormChange('design_artwork_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Is there a piece of art, furniture, or a souvenir that holds significant personal meaning to you? Tell us the story behind it.">
                            <Textarea className={inputStyles} value={formData.design_meaningful_item || ''} onChange={(e) => handleFormChange('design_meaningful_item', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Are there any existing furniture pieces or decor items you'd like to keep in the space? If so, please let us know the measurements and attach a photo below for reference.">
                            <Textarea className={inputStyles} value={formData.design_existing_furniture || ''} onChange={(e) => handleFormChange('design_existing_furniture', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Please upload any photos of the existing spaces you'd like us to see.">
                            <div className="p-4 border-2 border-dashed border-stone-400 rounded-lg text-center">
                                <p className="text-stone-400 text-sm italic mb-2">These can be quick phone shots — no need for anything fancy!</p>
                                <Button type="button" variant="outline" className="border-[#8B7355] text-[#8B7355]">
                                    Add file
                                </Button>
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Finishes and Patterns">
                            <CheckboxGroup options={finishesOptions} value={formData.finishes_patterns_preference} onChange={(v) => handleFormChange('finishes_patterns_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any specific materials you prefer or want to avoid?">
                            <Textarea className={inputStyles} value={formData.design_materials_to_avoid || ''} onChange={(e) => handleFormChange('design_materials_to_avoid', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any special requirements or considerations? (e.g., accessibility needs, allergies, etc.)">
                            <Textarea className={inputStyles} value={formData.design_special_requirements || ''} onChange={(e) => handleFormChange('design_special_requirements', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any images that reflect your vision? OR Any Inspiration Photos? (optional)">
                            <div className="p-4 border-2 border-dashed border-stone-400 rounded-lg text-center">
                                <Button type="button" variant="outline" className="border-[#8B7355] text-[#8B7355]">
                                    Add file
                                </Button>
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Do you have a Houzz or Pinterest page? Please list your accounts below, and you can also invite us to your boards.">
                            <div className="space-y-2">
                                <p className="text-[#F5F5DC] text-sm">at https://www.pinterest.com/estdesignco/ and https://www.houzz.com/professionals/interior-designers-and-decorators/established-design-co-pfvwus-pf~1101592055</p>
                                <Textarea className={inputStyles} value={formData.design_pinterest_houzz || ''} onChange={(e) => handleFormChange('design_pinterest_houzz', e.target.value)} />
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Any additional comments or questions?">
                            <Textarea className={inputStyles} value={formData.design_additional_comments || ''} onChange={(e) => handleFormChange('design_additional_comments', e.target.value)} />
                        </FieldWrapper>
                    </Section>

                    {/* Section 8: Getting to Know You Better */}
                    <Section title="GETTING TO KNOW YOU BETTER..." description="We want to get to know you better so we can serve you in the best way possible! We not only want to help design your home, but want your experience with us to be tailor-made JUST FOR YOU!">
                        <FieldWrapper label="Who lives in your household? (Include ages of children if applicable)">
                            <Textarea className={inputStyles} value={formData.know_you_household || ''} onChange={(e) => handleFormChange('know_you_household', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Do you have pets? If yes, please specify">
                            <Textarea className={inputStyles} value={formData.know_you_pets || ''} onChange={(e) => handleFormChange('know_you_pets', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Describe a typical weekday for your household. What activities take place in the home?">
                            <Textarea className={inputStyles} value={formData.know_you_weekday_routine || ''} onChange={(e) => handleFormChange('know_you_weekday_routine', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Describe a typical weekend for your household.">
                            <Textarea className={inputStyles} value={formData.know_you_weekend_routine || ''} onChange={(e) => handleFormChange('know_you_weekend_routine', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Are you early birds or night owls? How does natural and artificial lighting play a role in your daily routines?">
                            <Textarea className={inputStyles} value={formData.know_you_lighting_preference || ''} onChange={(e) => handleFormChange('know_you_lighting_preference', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="How do you typically entertain guests? (e.g., large formal dinners, casual get-togethers, intimate cocktails, kids' parties)">
                            <Textarea className={inputStyles} value={formData.know_you_entertaining_style || ''} onChange={(e) => handleFormChange('know_you_entertaining_style', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Where does each family member go to relax and have personal time? What activities do they do there?">
                            <Textarea className={inputStyles} value={formData.know_you_relax_space || ''} onChange={(e) => handleFormChange('know_you_relax_space', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="How do you see your family's needs changing in the next 5-10 years? (e.g., growing children, aging in place, working from home more)">
                            <Textarea className={inputStyles} value={formData.know_you_future_plans || ''} onChange={(e) => handleFormChange('know_you_future_plans', e.target.value)} />
                        </FieldWrapper>
                        <InputField label="Do you have social media pages that you would mind sharing with us?" id="know_you_social_media" value={formData.know_you_social_media || ''} onChange={(e) => handleFormChange('know_you_social_media', e.target.value)} />
                        <FieldWrapper label="Tell us about your hobbies">
                            <div className="space-y-2">
                                <p className="text-[#F5F5DC] text-sm italic">Don't be shy, tell us about you and your spouse, and your kids' favorite hobbies!</p>
                                <Textarea className={inputStyles} value={formData.know_you_hobbies || ''} onChange={(e) => handleFormChange('know_you_hobbies', e.target.value)} />
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="What do you you like to do for fun?">
                            <Textarea className={inputStyles} value={formData.know_you_fun || ''} onChange={(e) => handleFormChange('know_you_fun', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="What makes you HAPPY?!">
                            <Textarea className={inputStyles} value={formData.know_you_happy || ''} onChange={(e) => handleFormChange('know_you_happy', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="When are your families Birthdays?">
                            <Textarea className={inputStyles} value={formData.know_you_family_birthdays || ''} onChange={(e) => handleFormChange('know_you_family_birthdays', e.target.value)} />
                        </FieldWrapper>
                        <InputField label="When is your Anniversary?" id="know_you_anniversary" type="date" value={formData.know_you_anniversary || ''} onChange={(e) => handleFormChange('know_you_anniversary', e.target.value)} />
                        <FieldWrapper label="What does your Family like to do together for fun?">
                            <Textarea className={inputStyles} value={formData.know_you_family_together || ''} onChange={(e) => handleFormChange('know_you_family_together', e.target.value)} />
                        </FieldWrapper>
                        <InputField label="What is your FAVORITE restaurant" id="know_you_favorite_restaurant" value={formData.know_you_favorite_restaurant || ''} onChange={(e) => handleFormChange('know_you_favorite_restaurant', e.target.value)} />
                        <FieldWrapper label="What is your favorite place to vacation?">
                            <Textarea className={inputStyles} value={formData.know_you_favorite_vacation || ''} onChange={(e) => handleFormChange('know_you_favorite_vacation', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Tell us about your favorite foods, snacks, drinks, wine, beer, etc... OR ANYTHING ELSE that you just LOVE that we should know about!">
                            <Textarea className={inputStyles} value={formData.know_you_favorite_foods || ''} onChange={(e) => handleFormChange('know_you_favorite_foods', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="When you come home after a long day, what space do you naturally gravitate toward, and what feeling do you want that space to evoke?">
                            <Textarea className={inputStyles} value={formData.know_you_evoke_space || ''} onChange={(e) => handleFormChange('know_you_evoke_space', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="How do you want your home to support your social life?">
                            <Textarea className={inputStyles} value={formData.know_you_support_social_life || ''} onChange={(e) => handleFormChange('know_you_support_social_life', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Is there ANYTHING ELSE that you would like to share with us to let us know how we can best serve you such as favorite memories of your last or current home, or favorite places, or just ANYTHING you want to share with us we would LOVE to to know about it as we get to know each other better!">
                            <Textarea className={inputStyles} value={formData.know_you_share_more || ''} onChange={(e) => handleFormChange('know_you_share_more', e.target.value)} />
                        </FieldWrapper>
                    </Section>

                    {/* Section 9: How Did You Hear About Us */}
                    <Section title="HOW DID YOU HEAR ABOUT US AND HOW TO STAY IN TOUCH">
                        <FieldWrapper label="How did you hear about us?">
                            <RadioGroup value={formData.how_heard} onValueChange={(value) => handleFormChange('how_heard', value)} className="text-[#F5F5DC]">
                                <div className="flex flex-col space-y-2">
                                    {["Internet Search", "Social Media", "Friend Referral", "Magazine", "Google", "Market Event", "Other"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`heard-${option}`} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={`heard-${option}`} className="text-[#F5F5DC]">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>
                        {formData.how_heard === 'Other' && (
                            <InputField label="Please specify how you heard about us" id="how_heard_other" value={formData.how_heard_other || ''} onChange={(e) => handleFormChange('how_heard_other', e.target.value)} />
                        )}
                    </Section>

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