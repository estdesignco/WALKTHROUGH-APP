import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin || '';
console.log('🔗 CustomerfacingQuestionnaire BACKEND_URL:', BACKEND_URL);

// API functions
const Project = {
    create: async (data) => {
        console.log('🚀 Project.create called with:', data);
        console.log('🔗 Making request to:', `${BACKEND_URL}/api/projects`);
        
        const response = await fetch(`${BACKEND_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        console.log('📡 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.text();
                console.log('❌ Error response body:', errorData);
                if (errorData) {
                    errorMessage = errorData;
                }
            } catch (e) {
                console.log('❌ Could not parse error response:', e);
            }
            throw new Error(`Failed to create project - ${errorMessage}`);
        }
        
        const result = await response.json();
        console.log('✅ Project creation successful:', result);
        return result;
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
    <Card className="bg-gradient-to-br from-black/80 to-gray-900/90 border-[#B49B7E]/20 shadow-2xl backdrop-blur-sm">
        <CardHeader className="border-b border-[#B49B7E]/10 pb-6">
            <CardTitle className="text-3xl font-light text-[#B49B7E] tracking-wide">{title}</CardTitle>
            {description && <CardDescription className="text-lg text-[#F5F5DC]/70 mt-3 leading-relaxed">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
            {children}
        </CardContent>
    </Card>
);

const FieldWrapper = ({ label, children, required }) => (
    <div className="space-y-3">
        <Label className="text-lg font-light text-[#B49B7E] tracking-wide">
            {label} {required && <span className="text-[#B49B7E]/80">*</span>}
        </Label>
        {children}
    </div>
);

const inputStyles = "bg-black/40 border-[#B49B7E]/30 text-[#F5F5DC] focus:border-[#B49B7E] focus:bg-black/60 placeholder:text-[#B49B7E]/50 transition-all duration-300 min-h-[120px] p-4 text-base";

// New InputField component
const InputField = ({ label, id, value, onChange, required = false, type = "text", placeholder = "" }) => (
    <div className="space-y-3">
        <Label htmlFor={id} className="text-lg font-light text-[#B49B7E] tracking-wide">
            {label} {required && <span className="text-[#B49B7E]/80">*</span>}
        </Label>
        <input
            id={id}
            className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7355] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
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
                    <input
                        type="checkbox"
                        id={option}
                        checked={value.includes(option)}
                        onChange={(e) => handleCheckedChange(option, e.target.checked)}
                        className="w-4 h-4 text-[#B49B7E] bg-gray-700 border-gray-600 rounded focus:ring-[#B49B7E] focus:ring-2"
                    />
                    <label htmlFor={option} className="text-sm font-light leading-relaxed text-[#F5F5DC]/90">
                        {option}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default function CustomerfacingQuestionnaire({ isEditMode = false }) {
    const { projectId: urlProjectId } = useParams();
    const editProjectId = isEditMode ? urlProjectId : null;

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
        spouse_partner_name: '',
        spouse_partner_phone: '',
        team_members: [{ name: '', role: '', phone: '' }],
        new_build_address: '',
        new_build_architect: '',
        new_build_builder: '',
        new_build_other_team: '',
        new_build_has_plans: '',
        new_build_process_stage: '',
        new_build_need_furniture: '',
        new_build_scope_notes: '',
        renovation_address: '',
        renovation_move_in_date: '',
        renovation_builder: '',
        renovation_builder_phone: '',
        renovation_architect: '',
        renovation_architect_phone: '',
        renovation_team_members: [{ name: '', role: '', phone: '' }],
        renovation_other_team: '',
        renovation_existing_condition: '',
        renovation_need_furniture: '',
        renovation_memories: '',
        renovation_scope_notes: '',
        furniture_refresh_condition: '',
        furniture_team_members: [{ name: '', role: '', phone: '' }],
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

    // Load existing data when in edit mode
    useEffect(() => {
        if (editProjectId) {
            loadExistingData();
        }
    }, [editProjectId]);

    const loadExistingData = async () => {
        try {
            const [projectRes, questionnaireRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/projects/${editProjectId}`),
                axios.get(`${BACKEND_URL}/api/questionnaire/${editProjectId}`)
            ]);
            
            const existingAnswers = questionnaireRes.data.answers || {};
            console.log('📥 Loaded existing answers:', existingAnswers);
            
            // Merge existing answers into formData
            setFormData(prev => ({ ...prev, ...existingAnswers }));
        } catch (error) {
            console.error('Failed to load existing data:', error);
        }
    };


    const handleFormChange = (field, value) => {
        console.log(`🔄 ${field} changed to:`, value);
        
        // Auto-format phone numbers for ALL phone fields
        if (field.includes('phone') || field.includes('Phone')) {
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
        console.log('🔄 handleRoomsChange called with:', newRooms);
        handleFormChange('rooms_involved', newRooms);
        console.log('✅ Updated rooms_involved to:', newRooms);
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
        
        console.log('📋 SUBMITTING QUESTIONNAIRE - Full FormData:', formData);
        console.log('🔍 Budget Range:', formData.budget_range);
        console.log('🔍 Involvement Level:', formData.involvement_level);
        console.log('🔍 Address:', formData.address);
        
        try {
            // If in edit mode, just update questionnaire and project
            if (editProjectId) {
                console.log('📝 UPDATE MODE: Saving changes for project', editProjectId);
                
                // Update questionnaire
                await axios.post(`${BACKEND_URL}/api/questionnaire/${editProjectId}`, {
                    answers: formData,
                    completion_percentage: 100,
                    completed_at: new Date().toISOString()
                });
                
                // Update project basic info
                await axios.put(`${BACKEND_URL}/api/projects/${editProjectId}`, {
                    name: formData.name,
                    client_info: {
                        full_name: formData.client_name,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address
                    }
                });
                
                alert('✅ Changes saved successfully!');
                window.location.href = `/customer/project/${editProjectId}`;
                return;
            }
            
            // NEW SUBMISSION MODE (existing code)
            // Transform formData to match backend ProjectCreate model
            const projectTypeMap = {
                'Renovation': 'Renovation',
                'New Build': 'New Construction',
                'Design Consultation': 'Design Consultation', 
                'Furniture/Styling Refresh': 'Furniture Only',
                'Other': 'Design Consultation'
            };

            console.log('🔍 Raw project_type from form:', formData.project_type);
            console.log('🔄 Mapped project_type:', projectTypeMap[formData.project_type] || 'Renovation');

            const projectData = {
                name: formData.name || `${formData.client_name || 'Unnamed'} Project`,
                client_info: {
                    full_name: formData.client_name || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    address: formData.address || formData.renovation_address || formData.new_build_address || ''
                },
                project_type: projectTypeMap[formData.project_type] || 'Renovation',
                timeline: formData.timeline || '',
                budget: formData.budget_range || '',
                style_preferences: [], // Can be populated from other form fields if needed
                color_palette: '',
                special_requirements: formData.other_project_description || ''
            };

            console.log('🚀 Submitting project data:', projectData);
            console.log('🔗 Backend URL:', BACKEND_URL);
            
            const newProject = await Project.create(projectData);
            console.log('✅ Project created successfully:', newProject);

            // ALWAYS save questionnaire answers FIRST (regardless of rooms)
            console.log('💾 Saving complete questionnaire answers...');
            try {
                await axios.post(`${BACKEND_URL}/api/questionnaire/${newProject.id}`, {
                    answers: formData,
                    completion_percentage: 100,
                    completed_at: new Date().toISOString()
                });
                console.log('✅ Questionnaire answers saved!');
            } catch (saveError) {
                console.error('❌ Failed to save questionnaire answers:', saveError);
                alert('Warning: Questionnaire data may not have saved completely. Error: ' + saveError.message);
            }

            // Create rooms with FULL walkthrough structure (backend auto-populates)
            console.log('🏠 Checking rooms to create. formData.rooms_involved:', formData.rooms_involved);
            console.log('🏠 Type:', typeof formData.rooms_involved, 'Length:', formData.rooms_involved?.length);
            console.log('🏠 Is Array?:', Array.isArray(formData.rooms_involved));
            
            if (formData.rooms_involved && Array.isArray(formData.rooms_involved) && formData.rooms_involved.length > 0) {
                const uniqueRooms = [...new Set(formData.rooms_involved)];
                console.log(`📋 Will create ${uniqueRooms.length} rooms:`, uniqueRooms);
                
                for (let i = 0; i < uniqueRooms.length; i++) {
                    const roomName = uniqueRooms[i];
                    console.log(`🚀 Creating room ${i+1}/${uniqueRooms.length}: ${roomName}`);
                    
                    try {
                        // Backend automatically creates comprehensive structure for walkthrough rooms
                        const newRoom = await Room.create({ 
                            project_id: newProject.id, 
                            name: roomName,
                            description: '',
                            order_index: i,
                            sheet_type: 'walkthrough',  // This triggers auto-population with full structure
                            auto_populate: true  // Explicitly request full structure
                        });
                        
                        console.log(`✅ Room created successfully: ${roomName}`, newRoom);
                    } catch (roomError) {
                        console.error(`❌ FAILED to create room ${roomName}:`, roomError);
                        alert(`Warning: Failed to create room "${roomName}". Error: ${roomError.message}`);
                    }
                }
                
                console.log('✅ ALL ROOMS CREATED - Questionnaire submission complete!');
            } else {
                console.warn('⚠️ No rooms selected in questionnaire - project created without rooms');
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
                renovation_team_members: [{ name: '', role: '', phone: '' }],
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
            window.location.href = `/project/${newProject.id}?tab=Questionnaire`;
        } catch (error) {
            console.error("❌ QUESTIONNAIRE SUBMISSION FAILED:", error);
            console.error("❌ Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Try to get more specific error message
            let errorMessage = 'Something went wrong. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            }
            
            // If it's a network error, try to parse the response
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            // Enhanced error details for debugging
            console.error("❌ Setting error status:", `error: ${errorMessage}`);
            setSubmissionStatus(`error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Updated roomsOptions to include Entire Home and Classic style
    const roomsOptionsUpdated = [
        // WHOLE HOME
        "Entire Home",
        
        // MAIN LIVING SPACES (Most Common)
        "Living Room", "Family Room", "Kitchen", "Dining Room", "Foyer",
        
        // BEDROOMS & BATHROOMS (Primary First)  
        "Primary Bedroom", "Primary Bathroom", 
        "Guest Bedroom 1", "Guest Bedroom 2", "Guest Bedroom 3", 
        "Guest Bathroom 1", "Guest Bathroom 2", "Guest Bathroom 3",
        "Children's Bedroom", "Nursery",
        
        // WORK & STUDY SPACES
        "Home Office", "Study", "Library",
        
        // ADDITIONAL BATHROOMS
        "Powder", "Half Bathroom", "Jack and Jill Bathroom",
        
        // KITCHEN & DINING RELATED
        "Pantry", "Butler's Pantry", "Scullery", "Breakfast Nook", "Bar Area", "Wine Cellar",
        
        // UTILITY & STORAGE
        "Laundry Room", "Mudroom", "Utility Room", "Linen Closet", "Walk-in Closet",
        
        // ENTERTAINMENT & RECREATION  
        "Home Theater", "Media Room", "Game Room", "Home Gym", "Play Room", "Music Room",
        
        // CREATIVE & HOBBY SPACES
        "Craft Room", "Art Studio", "Workshop",
        
        // TRANSITIONAL SPACES
        "Hallway", "Basement",
        
        // OUTDOOR & SEASONAL SPACES
        "Sunroom", "Screened Porch", "Patio", "Deck", "Outdoor Kitchen",
        
        // ADDITIONAL STRUCTURES
        "Pool House", "Guest House"
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
        'Patio': '#2F5233', 'Powder': '#9B3B7A', 'Powder Bath': '#9B3B7A', 'Study': '#C07B3A',
        'Game Room': '#C2410C', 'Hallway': '#A56A43', 'Screened Porch': '#3B7A6C', 'Deck': '#2F5233',
        'Outdoor Kitchen': '#2F5233', 'Pool House': '#2F5233', 'Guest House': '#4A6741'
    };

    // Logic to find which custom rooms have been added
    // Use the updated list for predefined rooms to filter custom ones
    const predefinedRoomsSet = new Set(roomsOptionsUpdated);
    const customRoomsAdded = formData.rooms_involved.filter(room => !predefinedRoomsSet.has(room));


    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm">
                {/* Back Button */}
                <div className="mb-8">
                    <Link to={editProjectId ? `/customer/project/${editProjectId}` : "/customer"} className="flex items-center text-[#B49B7E]/70 hover:text-[#B49B7E] transition-all duration-300">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {editProjectId ? 'Back to Project' : 'Back to Home'}
                    </Link>
                </div>

                {/* Header with your actual logo */}
                <div className="w-full bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center my-8 rounded-2xl px-4 py-2" style={{ height: '150px' }}>
                    <img
                        src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
                        alt="Established Design Co."
                        className="w-full h-full object-contain"
                        style={{ transform: 'scale(1.8)', maxWidth: '95%', maxHeight: '90%' }}
                    />
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-2xl font-light text-[#B49B7E] tracking-wider">
                        {editProjectId ? 'EDIT QUESTIONNAIRE' : 'COMPREHENSIVE CLIENT QUESTIONNAIRE'}
                    </h2>
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mt-4"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 mt-8">
                    {/* Section 1: Client Information */}
                    <Section title="CLIENT INFORMATION">
                        <InputField label="Full Name" id="client_name" value={formData.client_name || ''} onChange={(e) => handleFormChange('client_name', e.target.value)} required />
                        <InputField label="Project Name" id="name" value={formData.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} required />
                        <InputField label="Email Address" id="email" type="email" value={formData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} />
                        <InputField label="Phone Number" id="phone" type="tel" value={formData.phone || ''} onChange={(e) => handleFormChange('phone', e.target.value)} />
                        <InputField label="Spouse / Partner Name" id="spouse_partner_name" value={formData.spouse_partner_name || ''} onChange={(e) => handleFormChange('spouse_partner_name', e.target.value)} />
                        <InputField label="Spouse / Partner Phone" id="spouse_partner_phone" type="tel" value={formData.spouse_partner_phone || ''} onChange={(e) => handleFormChange('spouse_partner_phone', e.target.value)} />
                        <FieldWrapper label="Project Address">
                            <Autocomplete
                                apiKey="AIzaSyCZ4VtXompFHngyxRATD0FZMruCmfDiiC0"
                                onPlaceSelected={(place) => {
                                    if (place && place.formatted_address) {
                                        handleFormChange('address', place.formatted_address);
                                    }
                                }}
                                options={{
                                    types: ['address'],
                                }}
                                className={inputStyles}
                                placeholder="Start typing your address..."
                            />
                        </FieldWrapper>
                        <FieldWrapper label="Preferred Method of Communication">
                            <CheckboxGroup options={contactPrefOptions} value={formData.contact_preferences} onChange={(v) => handleFormChange('contact_preferences', v)} />
                        </FieldWrapper>
                        <InputField label="Best Time to Call" id="best_time_to_call" value={formData.best_time_to_call || ''} onChange={(e) => handleFormChange('best_time_to_call', e.target.value)} />
                        <FieldWrapper label="Have you worked with a designer before? If not, what are your hesitations?">
                            <textarea id="worked_with_designer_before" className={inputStyles} value={formData.worked_with_designer_before || ''} onChange={(e) => handleFormChange('worked_with_designer_before', e.target.value)}></textarea>
                        </FieldWrapper>
                        <InputField label="Who will be the primary decision maker(s) for this project?" id="primary_decision_maker" value={formData.primary_decision_maker || ''} onChange={(e) => handleFormChange('primary_decision_maker', e.target.value)} />
                        <FieldWrapper label="How involved would you like to be in the design process?">
                            <select 
                                value={formData.involvement_level} 
                                onChange={(e) => handleFormChange('involvement_level', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                            >
                                <option value="">Select...</option>
                                <option value="Very involved - I want to approve every detail">Very involved - I want to approve every detail</option>
                                <option value="Somewhat involved - I want to approve major decisions">Somewhat involved - I want to approve major decisions</option>
                                <option value="Minimally involved - I trust your expertise">Minimally involved - I trust your expertise</option>
                            </select>
                        </FieldWrapper>
                        <FieldWrapper label="What is your ideal sofa price point?">
                            <select
                                value={formData.ideal_sofa_price}
                                onChange={(e) => handleFormChange('ideal_sofa_price', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                            >
                                <option value="">Select...</option>
                                <option value="$2,000-$4,000">$2,000-$4,000</option>
                                <option value="$4,000-$8,000">$4,000-$8,000</option>
                                <option value="$8,000-$12,000">$8,000-$12,000</option>
                                <option value="$12,000+">$12,000+</option>
                            </select>
                        </FieldWrapper>
                    </Section>

                    {/* Section 2: Total Scope of Work */}
                    <Section title="TOTAL SCOPE OF WORK FOR YOUR PROJECT" description="Please take a moment and think which project best fits your needs and answer the appropriate questions below. (New build, Renovation, Furniture Refresh) And don't forget the ROOMS section, even if you are Building!">
                        <FieldWrapper label="What type of property is this?">
                            <select
                                value={formData.property_type}
                                onChange={(e) => handleFormChange('property_type', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                            >
                                <option value="">Select...</option>
                                <option value="Primary Residence">Primary Residence</option>
                                <option value="Vacation Home">Vacation Home</option>
                                <option value="Rental Property">Rental Property</option>
                                <option value="Commercial Space">Commercial Space</option>
                                <option value="Other">Other</option>
                            </select>
                        </FieldWrapper>

                        {/* Updated to use InputField and Select */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <InputField label="Desired timeline for project completion" id="timeline" value={formData.timeline} onChange={(e) => handleFormChange('timeline', e.target.value)} />
                            <div className="space-y-3">
                                <Label htmlFor="budget_range" className="text-lg font-light text-[#B49B7E] tracking-wide">Investment / Budget Range</Label>
                                <select
                                    id="budget_range"
                                    value={formData.budget_range}
                                    onChange={(e) => handleFormChange('budget_range', e.target.value)}
                                    className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
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

                        <FieldWrapper label="What is your priority for this project? (Check all that apply)">
                            <CheckboxGroup options={projectPriorityOptions} value={formData.project_priority} onChange={(v) => handleFormChange('project_priority', v)} />
                        </FieldWrapper>

                        <FieldWrapper label="Which rooms are involved in this project?">
                            <CheckboxGroup options={roomsOptionsUpdated} value={formData.rooms_involved} onChange={handleRoomsChange} />
                        </FieldWrapper>

                        <FieldWrapper label="Add a Custom Room">
                            <div className="flex items-center gap-2">
                                <input
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
                            <select
                                value={formData.project_type}
                                onChange={(e) => handleFormChange('project_type', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                            >
                                <option value="">Select...</option>
                                <option value="New Build">New Build</option>
                                <option value="Renovation">Renovation</option>
                                <option value="Furniture/Styling Refresh">Furniture/Styling Refresh</option>
                                <option value="Other">Other</option>
                            </select>
                        </FieldWrapper>

                        {formData.project_type === 'Other' && (
                            <FieldWrapper label="Tell us about your project">
                                <textarea id="other_project_description" className={inputStyles} value={formData.other_project_description || ''} onChange={(e) => handleFormChange('other_project_description', e.target.value)} placeholder="Please describe your project..."></textarea>
                            </FieldWrapper>
                        )}
                    </Section>

                    {/* Section 4: New Build (Conditional) */}
                    {formData.project_type === 'New Build' && (
                        <Section title="NEW BUILD" description="If you are not currently building a new home, please feel free to skip these questions!">
                            <FieldWrapper label="Please list NEW BUILD address">
                                <Autocomplete
                                    apiKey="AIzaSyCZ4VtXompFHngyxRATD0FZMruCmfDiiC0"
                                    onPlaceSelected={(place) => {
                                        if (place && place.formatted_address) {
                                            handleFormChange('new_build_address', place.formatted_address);
                                        }
                                    }}
                                    options={{
                                        types: ['address'],
                                    }}
                                    className={inputStyles}
                                    placeholder="Start typing address..."
                                    style={{ minHeight: '60px' }}
                                />
                            </FieldWrapper>
                            <FieldWrapper label="Do you have an Architect?">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className={inputStyles} placeholder="Architect Name" value={formData.new_build_architect || ''} onChange={(e) => handleFormChange('new_build_architect', e.target.value)} />
                                    <input className={inputStyles} placeholder="Architect Phone" value={formData.new_build_architect_phone || ''} onChange={(e) => handleFormChange('new_build_architect_phone', e.target.value)} />
                                </div>
                            </FieldWrapper>
                            <FieldWrapper label="Do you have a Builder?">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className={inputStyles} placeholder="Builder Name" value={formData.new_build_builder || ''} onChange={(e) => handleFormChange('new_build_builder', e.target.value)} />
                                    <input className={inputStyles} placeholder="Builder Phone" value={formData.new_build_builder_phone || ''} onChange={(e) => handleFormChange('new_build_builder_phone', e.target.value)} />
                                </div>
                            </FieldWrapper>
                            
                            <FieldWrapper label="Other Team Members">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="text-sm text-[#B49B7E]">Name</label></div>
                                        <div><label className="text-sm text-[#B49B7E]">Role (Electrician, Plumber, etc.)</label></div>
                                        <div><label className="text-sm text-[#B49B7E]">Phone</label></div>
                                    </div>
                                    {(formData.team_members || [{ name: '', role: '', phone: '' }]).map((member, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-3">
                                            <input 
                                                className={inputStyles} 
                                                placeholder="Name"
                                                value={member.name || ''}
                                                onChange={(e) => {
                                                    const newTeam = [...(formData.team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], name: e.target.value };
                                                    handleFormChange('team_members', newTeam);
                                                }}
                                            />
                                            <input 
                                                className={inputStyles} 
                                                placeholder="Role"
                                                value={member.role || ''}
                                                onChange={(e) => {
                                                    const newTeam = [...(formData.team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], role: e.target.value };
                                                    handleFormChange('team_members', newTeam);
                                                }}
                                            />
                                            <input 
                                                className={inputStyles} 
                                                placeholder="XXX-XXX-XXXX"
                                                type="tel"
                                                value={member.phone || ''}
                                                onChange={(e) => {
                                                    const onlyNums = e.target.value.replace(/[^\d]/g, '');
                                                    let formatted = onlyNums;
                                                    if (onlyNums.length > 3 && onlyNums.length <= 6) {
                                                        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
                                                    } else if (onlyNums.length > 6) {
                                                        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
                                                    }
                                                    const newTeam = [...(formData.team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], phone: formatted };
                                                    handleFormChange('team_members', newTeam);
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newTeam = [...(formData.team_members || []), { name: '', role: '', phone: '' }];
                                            handleFormChange('team_members', newTeam);
                                        }}
                                        className="px-4 py-2 bg-[#B49B7E] hover:bg-[#A08B6F] text-white rounded font-semibold"
                                    >
                                        + Add Team Member
                                    </button>
                                </div>
                            </FieldWrapper>
                            
                            <InputField label="Do you have plans drawn?" id="new_build_has_plans" value={formData.new_build_has_plans || ''} onChange={(e) => handleFormChange('new_build_has_plans', e.target.value)} />
                            <InputField label="How far along in the building process are you?" id="new_build_process_stage" value={formData.new_build_process_stage || ''} onChange={(e) => handleFormChange('new_build_process_stage', e.target.value)} />
                            <FieldWrapper label="Once home is complete, will you be needing furniture? If so, give us an idea of what items you would love to procure!">
                                <textarea id="new_build_need_furniture" className={inputStyles} value={formData.new_build_need_furniture || ''} onChange={(e) => handleFormChange('new_build_need_furniture', e.target.value)}></textarea>
                            </FieldWrapper>
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <textarea id="new_build_scope_notes" className={inputStyles} value={formData.new_build_scope_notes || ''} onChange={(e) => handleFormChange('new_build_scope_notes', e.target.value)}></textarea>
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 5: Renovation (Conditional) */}
                    {formData.project_type === 'Renovation' && (
                        <Section title="RENOVATION" description="If you are not looking to renovate, please feel free to skip these questions!">
                            <FieldWrapper label="Please list Renovation Address (If different!)">
                                <Autocomplete
                                    apiKey="AIzaSyCZ4VtXompFHngyxRATD0FZMruCmfDiiC0"
                                    onPlaceSelected={(place) => {
                                        if (place && place.formatted_address) {
                                            handleFormChange('renovation_address', place.formatted_address);
                                        }
                                    }}
                                    options={{
                                        types: ['address'],
                                    }}
                                    className={inputStyles}
                                    placeholder="Start typing address..."
                                    style={{ minHeight: '60px' }}
                                />
                            </FieldWrapper>
                            <InputField label="When did you move into this home?" id="renovation_move_in_date" type="date" value={formData.renovation_move_in_date || ''} onChange={(e) => handleFormChange('renovation_move_in_date', e.target.value)} />
                            
                            <FieldWrapper label="Do you have a Builder?">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className={inputStyles} placeholder="Builder Name" value={formData.renovation_builder || ''} onChange={(e) => handleFormChange('renovation_builder', e.target.value)} />
                                    <input className={inputStyles} placeholder="Builder Phone" value={formData.renovation_builder_phone || ''} onChange={(e) => handleFormChange('renovation_builder_phone', e.target.value)} />
                                </div>
                            </FieldWrapper>
                            
                            <FieldWrapper label="Do you have an Architect?">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className={inputStyles} placeholder="Architect Name" value={formData.renovation_architect || ''} onChange={(e) => handleFormChange('renovation_architect', e.target.value)} />
                                    <input className={inputStyles} placeholder="Architect Phone" value={formData.renovation_architect_phone || ''} onChange={(e) => handleFormChange('renovation_architect_phone', e.target.value)} />
                                </div>
                            </FieldWrapper>
                            
                            <InputField label="Do you have the CURRENT plans/drawings for your home?" id="renovation_has_current_plans" value={formData.renovation_has_current_plans || ''} onChange={(e) => handleFormChange('renovation_has_current_plans', e.target.value)} />
                            
                            <FieldWrapper label="Other Team Members">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="text-sm text-[#B49B7E]">Name</label></div>
                                        <div><label className="text-sm text-[#B49B7E]">Role (Electrician, Plumber, etc.)</label></div>
                                        <div><label className="text-sm text-[#B49B7E]">Phone</label></div>
                                    </div>
                                    {(formData.renovation_team_members || [{ name: '', role: '', phone: '' }]).map((member, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-3">
                                            <input 
                                                className={inputStyles} 
                                                placeholder="Name"
                                                value={member.name || ''}
                                                onChange={(e) => {
                                                    const newTeam = [...(formData.renovation_team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], name: e.target.value };
                                                    handleFormChange('renovation_team_members', newTeam);
                                                }}
                                            />
                                            <input 
                                                className={inputStyles} 
                                                placeholder="Role"
                                                value={member.role || ''}
                                                onChange={(e) => {
                                                    const newTeam = [...(formData.renovation_team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], role: e.target.value };
                                                    handleFormChange('renovation_team_members', newTeam);
                                                }}
                                            />
                                            <input 
                                                className={inputStyles} 
                                                placeholder="XXX-XXX-XXXX"
                                                type="tel"
                                                value={member.phone || ''}
                                                onChange={(e) => {
                                                    const onlyNums = e.target.value.replace(/[^\d]/g, '');
                                                    let formatted = onlyNums;
                                                    if (onlyNums.length > 3 && onlyNums.length <= 6) {
                                                        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
                                                    } else if (onlyNums.length > 6) {
                                                        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
                                                    }
                                                    const newTeam = [...(formData.renovation_team_members || [{ name: '', role: '', phone: '' }])];
                                                    newTeam[idx] = { ...newTeam[idx], phone: formatted };
                                                    handleFormChange('renovation_team_members', newTeam);
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newTeam = [...(formData.renovation_team_members || []), { name: '', role: '', phone: '' }];
                                            handleFormChange('renovation_team_members', newTeam);
                                        }}
                                        className="px-4 py-2 bg-[#B49B7E] hover:bg-[#A08B6F] text-white rounded font-semibold"
                                    >
                                        + Add Team Member
                                    </button>
                                </div>
                            </FieldWrapper>
                            
                            <InputField label="Do you have NEW UPDATED plans drawn?" id="renovation_has_new_plans" value={formData.renovation_has_new_plans || ''} onChange={(e) => handleFormChange('renovation_has_new_plans', e.target.value)} />
                            <FieldWrapper label="Briefly describe the existing condition of the space.">
                                <textarea id="renovation_existing_condition" className={inputStyles} value={formData.renovation_existing_condition || ''} onChange={(e) => handleFormChange('renovation_existing_condition', e.target.value)}></textarea>
                            </FieldWrapper>
                            <FieldWrapper label="Once home is complete, will you be needing furniture? If so, give us an idea of what items you would love to procure!">
                                <textarea id="renovation_need_furniture" className={inputStyles} value={formData.renovation_need_furniture || ''} onChange={(e) => handleFormChange('renovation_need_furniture', e.target.value)}></textarea>
                            </FieldWrapper>
                            <FieldWrapper label="Are there any physical MEMORIES in this home that you would like to preserve?">
                                <textarea id="renovation_memories" className={inputStyles} value={formData.renovation_memories || ''} onChange={(e) => handleFormChange('renovation_memories', e.target.value)}></textarea>
                            </FieldWrapper>
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <textarea id="renovation_scope_notes" className={inputStyles} value={formData.renovation_scope_notes || ''} onChange={(e) => handleFormChange('renovation_scope_notes', e.target.value)}></textarea>
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 6: Furniture Refresh (Conditional) */}
                    {formData.project_type === 'Furniture/Styling Refresh' && (
                        <Section title="FURNITURE REFRESH" description="If you are not looking for a furniture refresh, please feel free to skip these questions!">
                            <FieldWrapper label="Briefly describe the existing condition of the space.">
                                <textarea id="furniture_refresh_condition" className={inputStyles} value={formData.furniture_refresh_condition || ''} onChange={(e) => handleFormChange('furniture_refresh_condition', e.target.value)}></textarea>
                            </FieldWrapper>

                            <FieldWrapper label="Designer/Contractor">
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div><label className="text-sm text-[#B49B7E]">Name</label></div>
                                    <div><label className="text-sm text-[#B49B7E]">Role</label></div>
                                    <div><label className="text-sm text-[#B49B7E]">Phone</label></div>
                                </div>
                                {(formData.furniture_team_members || [{ name: '', role: '', phone: '' }]).map((member, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
                                        <input className={inputStyles} placeholder="Name" value={member.name || ''} onChange={(e) => { const newTeam = [...(formData.furniture_team_members || [{ name: '', role: '', phone: '' }])]; newTeam[idx] = { ...newTeam[idx], name: e.target.value }; handleFormChange('furniture_team_members', newTeam); }} />
                                        <input className={inputStyles} placeholder="Role" value={member.role || ''} onChange={(e) => { const newTeam = [...(formData.furniture_team_members || [{ name: '', role: '', phone: '' }])]; newTeam[idx] = { ...newTeam[idx], role: e.target.value }; handleFormChange('furniture_team_members', newTeam); }} />
                                        <input className={inputStyles} placeholder="XXX-XXX-XXXX" type="tel" value={member.phone || ''} onChange={(e) => { const onlyNums = e.target.value.replace(/[^\d]/g, ''); let formatted = onlyNums; if (onlyNums.length > 3 && onlyNums.length <= 6) { formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`; } else if (onlyNums.length > 6) { formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`; } const newTeam = [...(formData.furniture_team_members || [{ name: '', role: '', phone: '' }])]; newTeam[idx] = { ...newTeam[idx], phone: formatted }; handleFormChange('furniture_team_members', newTeam); }} />
                                    </div>
                                ))}
                                <button type="button" onClick={() => { const newTeam = [...(formData.furniture_team_members || []), { name: '', role: '', phone: '' }]; handleFormChange('furniture_team_members', newTeam); }} className="px-4 py-2 bg-[#B49B7E] hover:bg-[#A08B6F] text-white rounded font-semibold">+ Add Team Member</button>
                            </FieldWrapper>

                            <InputField label="Do you have the CURRENT plans/drawings for your home?" id="furniture_has_current_plans" value={formData.furniture_has_current_plans || ''} onChange={(e) => handleFormChange('furniture_has_current_plans', e.target.value)} />
                            <InputField label="When did you move into this home?" id="furniture_move_in_date" type="date" value={formData.furniture_move_in_date || ''} onChange={(e) => handleFormChange('furniture_move_in_date', e.target.value)} />
                            <FieldWrapper label="Is there anything else we need to know about the scope of this project?">
                                <textarea id="furniture_scope_notes" className={inputStyles} value={formData.furniture_scope_notes || ''} onChange={(e) => handleFormChange('furniture_scope_notes', e.target.value)}></textarea>
                            </FieldWrapper>
                        </Section>
                    )}

                    {/* Section 7: Design Questions */}
                    <Section title="DESIGN QUESTIONS">
                        <FieldWrapper label="What do you love about your current home?">
                            <textarea id="design_love_home" className={inputStyles} value={formData.design_love_home || ''} onChange={(e) => handleFormChange('design_love_home', e.target.value)}></textarea>
                        </FieldWrapper>
                        <InputField label="How will the spaces be used? (e.g., formal dining, casual living, etc.)" id="design_space_use" value={formData.design_space_use || ''} onChange={(e) => handleFormChange('design_space_use', e.target.value)} />
                        <InputField label="What are their current uses?" id="design_current_use" value={formData.design_current_use || ''} onChange={(e) => handleFormChange('design_current_use', e.target.value)} />
                        <FieldWrapper label="What is the first impression you want guests to have when they enter your home?">
                            <textarea id="design_first_impression" className={inputStyles} value={formData.design_first_impression || ''} onChange={(e) => handleFormChange('design_first_impression', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Is there a common color palette in your home that you love?">
                            <textarea id="design_common_color_palette" className={inputStyles} value={formData.design_common_color_palette || ''} onChange={(e) => handleFormChange('design_common_color_palette', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="What color palette do you prefer?">
                            <CheckboxGroup options={colorPrefOptions} value={formData.design_preferred_palette} onChange={(v) => handleFormChange('design_preferred_palette', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Are there any colors do you dislike?">
                            <textarea id="design_disliked_colors" className={inputStyles} value={formData.design_disliked_colors || ''} onChange={(e) => handleFormChange('design_disliked_colors', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Which interior design styles do you prefer? (Select all that apply)">
                            <CheckboxGroup options={stylePrefOptions} value={formData.design_styles_preference} onChange={(v) => handleFormChange('design_styles_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="What do you like about these styles?">
                            <textarea id="design_styles_love" className={inputStyles} value={formData.design_styles_love || ''} onChange={(e) => handleFormChange('design_styles_love', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="What are your preferences for artwork?">
                            <CheckboxGroup options={artworkPrefOptions} value={formData.design_artwork_preference} onChange={(v) => handleFormChange('design_artwork_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Is there a piece of art, furniture, or a souvenir that holds significant personal meaning to you? Tell us the story behind it.">
                            <textarea id="design_meaningful_item" className={inputStyles} value={formData.design_meaningful_item || ''} onChange={(e) => handleFormChange('design_meaningful_item', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Are there any existing furniture pieces or decor items you'd like to keep in the space? If so, please let us know the measurements and attach a photo below for reference.">
                            <textarea id="design_existing_furniture" className={inputStyles} value={formData.design_existing_furniture || ''} onChange={(e) => handleFormChange('design_existing_furniture', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Please upload any photos of the existing spaces you'd like us to see.">
                            <div className="p-4 border-2 border-dashed border-stone-400 rounded-lg text-center">
                                <p className="text-stone-400 text-sm italic mb-2">These can be quick phone shots — no need for anything fancy!</p>
                                <input
                                    type="file"
                                    id="existing-space-photos"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        console.log('Files selected:', files.length);
                                        // Store files in form data
                                        handleFormChange('existing_space_photos', files);
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="border-[#8B7355] text-[#8B7355]"
                                    onClick={() => document.getElementById('existing-space-photos').click()}
                                >
                                    Add file
                                </Button>
                                {formData.existing_space_photos && formData.existing_space_photos.length > 0 && (
                                    <p className="text-green-500 text-sm mt-2">✓ {formData.existing_space_photos.length} file(s) selected</p>
                                )}
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Finishes and Patterns">
                            <CheckboxGroup options={finishesOptions} value={formData.finishes_patterns_preference} onChange={(v) => handleFormChange('finishes_patterns_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any specific materials you prefer or want to avoid?">
                            <textarea id="design_materials_to_avoid" className={inputStyles} value={formData.design_materials_to_avoid || ''} onChange={(e) => handleFormChange('design_materials_to_avoid', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any special requirements or considerations? (e.g., accessibility needs, allergies, etc.)">
                            <textarea id="design_special_requirements" className={inputStyles} value={formData.design_special_requirements || ''} onChange={(e) => handleFormChange('design_special_requirements', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Do you have any images that reflect your vision? OR Any Inspiration Photos? (optional)">
                            <div className="p-4 border-2 border-dashed border-stone-400 rounded-lg text-center">
                                <input
                                    type="file"
                                    id="inspiration-photos"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        console.log('Inspiration files selected:', files.length);
                                        handleFormChange('inspiration_photos', files);
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="border-[#8B7355] text-[#8B7355]"
                                    onClick={() => document.getElementById('inspiration-photos').click()}
                                >
                                    Add file
                                </Button>
                                {formData.inspiration_photos && formData.inspiration_photos.length > 0 && (
                                    <p className="text-green-500 text-sm mt-2">✓ {formData.inspiration_photos.length} file(s) selected</p>
                                )}
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Do you have a Houzz or Pinterest page? Please list your accounts below, and you can also invite us to your boards.">
                            <div className="space-y-2">
                                <p className="text-[#F5F5DC] text-sm">at https://www.pinterest.com/estdesignco/ and https://www.houzz.com/professionals/interior-designers-and-decorators/established-design-co-pfvwus-pf~1101592055</p>
                                <textarea id="design_pinterest_houzz" className={inputStyles} value={formData.design_pinterest_houzz || ''} onChange={(e) => handleFormChange('design_pinterest_houzz', e.target.value)}></textarea>
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="Any additional comments or questions?">
                            <textarea id="design_additional_comments" className={inputStyles} value={formData.design_additional_comments || ''} onChange={(e) => handleFormChange('design_additional_comments', e.target.value)}></textarea>
                        </FieldWrapper>
                    </Section>

                    {/* Section 8: Getting to Know You Better */}
                    <Section title="GETTING TO KNOW YOU BETTER..." description="We want to get to know you better so we can serve you in the best way possible! We not only want to help design your home, but want your experience with us to be tailor-made JUST FOR YOU!">
                        <FieldWrapper label="Who lives in your household? (Include ages of children if applicable)">
                            <textarea id="know_you_household" className={inputStyles} value={formData.know_you_household || ''} onChange={(e) => handleFormChange('know_you_household', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Do you have pets? If yes, please specify">
                            <textarea id="know_you_pets" className={inputStyles} value={formData.know_you_pets || ''} onChange={(e) => handleFormChange('know_you_pets', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Describe a typical weekday for your household. What activities take place in the home?">
                            <textarea id="know_you_weekday_routine" className={inputStyles} value={formData.know_you_weekday_routine || ''} onChange={(e) => handleFormChange('know_you_weekday_routine', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Describe a typical weekend for your household.">
                            <textarea id="know_you_weekend_routine" className={inputStyles} value={formData.know_you_weekend_routine || ''} onChange={(e) => handleFormChange('know_you_weekend_routine', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Are you early birds or night owls? How does natural and artificial lighting play a role in your daily routines?">
                            <textarea id="know_you_lighting_preference" className={inputStyles} value={formData.know_you_lighting_preference || ''} onChange={(e) => handleFormChange('know_you_lighting_preference', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="How do you typically entertain guests? (e.g., large formal dinners, casual get-togethers, intimate cocktails, kids' parties)">
                            <textarea id="know_you_entertaining_style" className={inputStyles} value={formData.know_you_entertaining_style || ''} onChange={(e) => handleFormChange('know_you_entertaining_style', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Where does each family member go to relax and have personal time? What activities do they do there?">
                            <textarea id="know_you_relax_space" className={inputStyles} value={formData.know_you_relax_space || ''} onChange={(e) => handleFormChange('know_you_relax_space', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="How do you see your family's needs changing in the next 5-10 years? (e.g., growing children, aging in place, working from home more)">
                            <textarea id="know_you_future_plans" className={inputStyles} value={formData.know_you_future_plans || ''} onChange={(e) => handleFormChange('know_you_future_plans', e.target.value)}></textarea>
                        </FieldWrapper>
                        <InputField label="Do you have social media pages that you would mind sharing with us?" id="know_you_social_media" value={formData.know_you_social_media || ''} onChange={(e) => handleFormChange('know_you_social_media', e.target.value)} />
                        <FieldWrapper label="Tell us about your hobbies">
                            <div className="space-y-2">
                                <p className="text-[#F5F5DC] text-sm italic">Don't be shy, tell us about you and your spouse, and your kids' favorite hobbies!</p>
                                <textarea id="know_you_hobbies" className={inputStyles} value={formData.know_you_hobbies || ''} onChange={(e) => handleFormChange('know_you_hobbies', e.target.value)}></textarea>
                            </div>
                        </FieldWrapper>
                        <FieldWrapper label="What do you you like to do for fun?">
                            <textarea id="know_you_fun" className={inputStyles} value={formData.know_you_fun || ''} onChange={(e) => handleFormChange('know_you_fun', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="What makes you HAPPY?!">
                            <textarea id="know_you_happy" className={inputStyles} value={formData.know_you_happy || ''} onChange={(e) => handleFormChange('know_you_happy', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="When are your families Birthdays?">
                            <textarea id="know_you_family_birthdays" className={inputStyles} value={formData.know_you_family_birthdays || ''} onChange={(e) => handleFormChange('know_you_family_birthdays', e.target.value)}></textarea>
                        </FieldWrapper>
                        <InputField label="When is your Anniversary?" id="know_you_anniversary" type="date" value={formData.know_you_anniversary || ''} onChange={(e) => handleFormChange('know_you_anniversary', e.target.value)} />
                        <FieldWrapper label="What does your Family like to do together for fun?">
                            <textarea id="know_you_family_together" className={inputStyles} value={formData.know_you_family_together || ''} onChange={(e) => handleFormChange('know_you_family_together', e.target.value)}></textarea>
                        </FieldWrapper>
                        <InputField label="What is your FAVORITE restaurant" id="know_you_favorite_restaurant" value={formData.know_you_favorite_restaurant || ''} onChange={(e) => handleFormChange('know_you_favorite_restaurant', e.target.value)} />
                        <FieldWrapper label="What is your favorite place to vacation?">
                            <textarea id="know_you_favorite_vacation" className={inputStyles} value={formData.know_you_favorite_vacation || ''} onChange={(e) => handleFormChange('know_you_favorite_vacation', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Tell us about your favorite foods, snacks, drinks, wine, beer, etc... OR ANYTHING ELSE that you just LOVE that we should know about!">
                            <textarea id="know_you_favorite_foods" className={inputStyles} value={formData.know_you_favorite_foods || ''} onChange={(e) => handleFormChange('know_you_favorite_foods', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="When you come home after a long day, what space do you naturally gravitate toward, and what feeling do you want that space to evoke?">
                            <textarea id="know_you_evoke_space" className={inputStyles} value={formData.know_you_evoke_space || ''} onChange={(e) => handleFormChange('know_you_evoke_space', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="How do you want your home to support your social life?">
                            <textarea id="know_you_support_social_life" className={inputStyles} value={formData.know_you_support_social_life || ''} onChange={(e) => handleFormChange('know_you_support_social_life', e.target.value)}></textarea>
                        </FieldWrapper>
                        <FieldWrapper label="Is there ANYTHING ELSE that you would like to share with us to let us know how we can best serve you such as favorite memories of your last or current home, or favorite places, or just ANYTHING you want to share with us we would LOVE to to know about it as we get to know each other better!">
                            <textarea id="know_you_share_more" className={inputStyles} value={formData.know_you_share_more || ''} onChange={(e) => handleFormChange('know_you_share_more', e.target.value)}></textarea>
                        </FieldWrapper>
                    </Section>

                    {/* Section 9: How did you hear about us */}
                    <Section title="HOW DID YOU HEAR ABOUT US">
                        <FieldWrapper label="How did you hear about us?">
                            <select
                                value={formData.how_heard}
                                onChange={(e) => handleFormChange('how_heard', e.target.value)}
                                className="flex h-12 w-full rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-[#F5F5DC] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                            >
                                <option value="">Select one...</option>
                                <option value="Internet Search">Internet Search</option>
                                <option value="Social Media">Social Media</option>
                                <option value="Friend Referral">Friend Referral</option>
                                <option value="Magazine">Magazine</option>
                                <option value="Google">Google</option>
                                <option value="Market Event">Market Event</option>
                                <option value="Other">Other</option>
                            </select>
                        </FieldWrapper>
                        
                        {formData.how_heard === 'Other' && (
                            <FieldWrapper label="Please specify">
                                <input className={inputStyles} value={formData.how_heard_other || ''} onChange={(e) => handleFormChange('how_heard_other', e.target.value)} placeholder="Please tell us how you heard about us..." />
                            </FieldWrapper>
                        )}
                    </Section>

                    {/* Submit Button */}
                    <div className="text-center pt-8">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.name || !formData.client_name || !formData.email}
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
                        
                        {submissionStatus && (
                            <p className={`mt-4 text-lg ${submissionStatus === 'success' ? 'text-green-400' : submissionStatus && submissionStatus.startsWith('error') ? 'text-red-400' : 'text-[#B49B7E]'}`}>
                                {submissionStatus === 'success' ? 'Project created successfully!' : submissionStatus && submissionStatus.startsWith('error') ? submissionStatus.replace('error: ', '') : submissionStatus || ''}
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}