import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, FileQuestion, Aperture, CheckSquare, ArrowLeft, Trello, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// API functions
const projectAPI = {
  get: async (id) => {
    const response = await fetch(`${BACKEND_URL}/api/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return await response.json();
  },
  update: async (id, data) => {
    const response = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return await response.json();
  }
};

const roomAPI = {
  filter: async (filter) => {
    const params = new URLSearchParams(filter);
    const response = await fetch(`${BACKEND_URL}/api/rooms?${params}`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return await response.json();
  },
  create: async (data) => {
    const response = await fetch(`${BACKEND_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create room');
    return await response.json();
  },
  delete: async (id) => {
    const response = await fetch(`${BACKEND_URL}/api/rooms/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete room');
    return true;
  }
};

const itemAPI = {
  filter: async (filter) => {
    const params = new URLSearchParams(filter);
    const response = await fetch(`${BACKEND_URL}/api/items?${params}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  },
  bulkCreate: async (items) => {
    const response = await fetch(`${BACKEND_URL}/api/items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    if (!response.ok) throw new Error('Failed to create items');
    return await response.json();
  },
  delete: async (id) => {
    const response = await fetch(`${BACKEND_URL}/api/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete item');
    return true;
  }
};

const EditableQuestionnaireTab = ({ project, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (project) {
            const initialData = { ...project };
            
            const contactFields = [
                'new_build_architect_additional_contacts', 'new_build_builder_additional_contacts',
                'renovation_architect_additional_contacts', 'renovation_builder_additional_contacts'
            ];
            contactFields.forEach(field => {
                if (typeof initialData[field] === 'string') {
                    initialData[field] = initialData[field].split(',').map(s => s.trim()).filter(Boolean);
                } else if (!Array.isArray(initialData[field])) {
                    initialData[field] = [];
                }
            });

            const arrayStringFields = [
                'contact_preferences', 'project_priority', 'rooms_involved', 'additional_rooms_involved',
                'design_preferred_palette', 'design_artwork_preference', 'design_styles_preference', 
                'finishes_patterns_preference'
            ];
            arrayStringFields.forEach(field => {
                if (Array.isArray(initialData[field])) {
                    initialData[field] = initialData[field].join(', ');
                } else if (typeof initialData[field] !== 'string') {
                    initialData[field] = '';
                }
            });
            
            setFormData(initialData);
        }
    }, [project]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAdditionalContactChange = (field, index, value) => {
        setFormData(prev => {
            const updatedContacts = [...(prev[field] || [])];
            updatedContacts[index] = value;
            return { ...prev, [field]: updatedContacts };
        });
    };

    const addAdditionalContact = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), '']
        }));
    };

    const removeAdditionalContact = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] || []).filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const dataToSave = { ...formData };
            
            const contactFields = [
                'new_build_architect_additional_contacts', 'new_build_builder_additional_contacts',
                'renovation_architect_additional_contacts', 'renovation_builder_additional_contacts'
            ];
            contactFields.forEach(field => {
                if (Array.isArray(dataToSave[field])) {
                    dataToSave[field] = dataToSave[field].filter(Boolean);
                } else { 
                    dataToSave[field] = [];
                }
            });

            const arrayStringFields = [
                'contact_preferences', 'project_priority', 'rooms_involved', 'additional_rooms_involved',
                'design_preferred_palette', 'design_artwork_preference', 'design_styles_preference',
                'finishes_patterns_preference'
            ];

            arrayStringFields.forEach(field => {
                if (typeof dataToSave[field] === 'string') {
                    dataToSave[field] = dataToSave[field].split(',').map(s => s.trim()).filter(Boolean);
                } else if (!dataToSave[field]) { 
                    dataToSave[field] = [];
                }
            });

            // Room sync logic
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const newRoomsInvolved = new Set([...(dataToSave.rooms_involved || []), ...(dataToSave.additional_rooms_involved || [])]);
            const currentRooms = await roomAPI.filter({ project_id: project.id });
            const currentRoomNames = new Set(currentRooms.map(r => r.name));

            const roomsToAdd = Array.from(newRoomsInvolved).filter(name => !currentRoomNames.has(name));
            const roomsToDelete = currentRooms.filter(room => !newRoomsInvolved.has(room.name));

            for (const roomToDelete of roomsToDelete) {
                const roomItems = await itemAPI.filter({ room_id: roomToDelete.id });
                for (const item of roomItems) {
                    await itemAPI.delete(item.id);
                    await sleep(100);
                }
                await roomAPI.delete(roomToDelete.id);
            }

            // Create new rooms with basic items
            for (const roomNameToAdd of roomsToAdd) {
                const newRoom = await roomAPI.create({ project_id: project.id, name: roomNameToAdd });
                
                const basicItems = [
                    { category: 'LIGHTING', sub_category: 'CEILING', name: 'Ceiling Light - Click to edit' },
                    { category: 'FURNITURE', sub_category: 'SEATING', name: 'Seating - Click to edit' },
                    { category: 'ACCESSORIES', sub_category: 'ART & DECOR', name: 'Art & Decor - Click to edit' },
                    { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'WALL', name: 'Wall Finish - Click to edit' },
                    { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'FLOORING', name: 'Flooring - Click to edit' }
                ];

                if (roomNameToAdd.toLowerCase().includes('kitchen')) {
                    basicItems.push(
                        { category: 'APPLIANCES', sub_category: 'KITCHEN APPLIANCES', name: 'Refrigerator - Click to edit' },
                        { category: 'PLUMBING', sub_category: 'KITCHEN SINKS & FAUCETS', name: 'Kitchen Sink - Click to edit' },
                        { category: 'CABINETS', sub_category: 'LOWER', name: 'Lower Cabinets - Click to edit' },
                        { category: 'COUNTERTOPS & TILE', sub_category: 'COUNTERTOPS', name: 'Countertops - Click to edit' }
                    );
                } else if (roomNameToAdd.toLowerCase().includes('bath')) {
                    basicItems.push(
                        { category: 'PLUMBING', sub_category: 'SHOWER & TUB', name: 'Shower/Tub - Click to edit' },
                        { category: 'CABINETS', sub_category: 'VANITY', name: 'Vanity - Click to edit' },
                        { category: 'COUNTERTOPS & TILE', sub_category: 'TILE', name: 'Floor Tile - Click to edit' }
                    );
                } else if (roomNameToAdd.toLowerCase().includes('bedroom')) {
                     basicItems.push(
                        { category: 'FURNITURE', sub_category: 'BEDS', name: 'Bed - Click to edit' },
                        { category: 'TEXTILES', sub_category: 'BEDDING', name: 'Bedding - Click to edit' }
                    );
                }

                const itemsToCreate = basicItems.map(item => ({
                    project_id: project.id,
                    room_id: newRoom.id,
                    category: item.category,
                    sub_category: item.sub_category,
                    name: item.name,
                    status: 'Walkthrough',
                    quantity: 1,
                }));

                await itemAPI.bulkCreate(itemsToCreate);
            }
            
            await projectAPI.update(project.id, dataToSave);
            onUpdate();
            alert('Project updated successfully!');

        } catch (error) {
            console.error("Failed to update project and sync rooms:", error);
            alert('An error occurred while updating the project. Please check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhone = (value) => {
        const onlyNums = value.replace(/[^\d]/g, '');
        let formatted = onlyNums;
        if (onlyNums.length > 3 && onlyNums.length <= 6) {
            formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
        } else if (onlyNums.length > 6) {
            formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
        }
        return formatted;
    };

    const handlePhoneChange = (value) => {
        if (/^[\d-]*$/.test(value) || value === '') {
            handleFieldChange('phone', formatPhone(value));
        }
    };

    // Helper for rendering input fields
    const renderInput = (label, field, type = "text", placeholder = "") => (
        <div>
            <Label htmlFor={field} className="text-stone-300">{label}</Label>
            <Input
                id={field}
                type={type}
                value={formData[field] || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="bg-stone-700 border-stone-600 text-stone-200 mt-1"
                placeholder={placeholder}
            />
        </div>
    );

    // Helper for rendering textarea fields
    const renderTextarea = (label, field, placeholder = "") => (
        <div>
            <Label htmlFor={field} className="text-stone-300">{label}</Label>
            <Textarea
                id={field}
                value={formData[field] || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="bg-stone-700 border-stone-600 text-stone-200 min-h-[80px] mt-1"
                placeholder={placeholder}
            />
        </div>
    );

    // Helper for rendering select fields
    const renderSelect = (label, field, options, placeholder = "Select...") => (
        <div>
            <Label htmlFor={field} className="text-stone-300">{label}</Label>
            <Select value={formData[field] || ''} onValueChange={(value) => handleFieldChange(field, value)}>
                <SelectTrigger id={field} className="bg-stone-700 border-stone-600 text-stone-200 mt-1">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 text-stone-200 border-stone-700">
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="hover:bg-stone-700">
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    // Helper for rendering dynamic contact list
    const renderContactList = (label, field) => (
        <div className="col-span-1 md:col-span-2 space-y-2">
            <Label className="text-stone-300">{label}</Label>
            {(formData[field] || []).map((contact, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input
                        type="text"
                        value={contact}
                        onChange={(e) => handleAdditionalContactChange(field, index, e.target.value)}
                        className="bg-stone-700 border-stone-600 text-stone-200"
                        placeholder="Name - email@example.com - 555-1234"
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeAdditionalContact(field, index)} className="bg-red-500 hover:bg-red-600 text-white">
                        Remove
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addAdditionalContact(field)} className="border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355] hover:text-stone-100">
                <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
        </div>
    );

    return (
        <div className="space-y-8 p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-[#1E293B] p-4 rounded-md shadow-lg border border-stone-700">
                <h2 className="text-2xl font-bold text-[#8B7355]">Edit Project Details</h2>
                <Button onClick={handleSave} disabled={isLoading} className="bg-[#8B7355] hover:bg-[#7A6249] text-stone-100">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                </Button>
            </div>

            {/* Client & Project Information */}
            <div className="bg-[#1E293B] border-stone-700 shadow-lg rounded-lg p-6">
                <h3 className="text-[#8B7355] text-xl font-semibold mb-4">Client & Project Information</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInput("Project Name", "name")}
                        {renderInput("Client Name", "client_name")}
                        {renderInput("Address", "address")}
                        {renderInput("Email", "email", "email")}
                        <div>
                            <Label htmlFor="phone" className="text-stone-300">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="bg-stone-700 border-stone-600 text-stone-200 mt-1"
                                placeholder="e.g. 123-456-7890"
                            />
                        </div>
                        {renderTextarea("Contact Preferences (comma-separated)", "contact_preferences", "email, phone, text")}
                        {renderInput("Best Time to Call", "best_time_to_call")}
                        {renderSelect("Worked with Designer Before", "worked_with_designer_before", [
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                        ])}
                        {renderInput("Primary Decision Maker", "primary_decision_maker")}
                        {renderSelect("Desired Involvement Level", "involvement_level", [
                            { value: "high", label: "High - I want to be involved in every decision" },
                            { value: "medium", label: "Medium - I want to approve major decisions" },
                            { value: "low", label: "Low - I trust you to make most decisions" },
                        ])}
                    </div>
                </div>
            </div>

            {/* Scope & Budget */}
            <div className="bg-[#1E293B] border-stone-700 shadow-lg rounded-lg p-6">
                <h3 className="text-[#8B7355] text-xl font-semibold mb-4">Scope & Budget</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelect("Project Type", "project_type", [
                            { value: "New Build", label: "New Build" },
                            { value: "Renovation", label: "Renovation" },
                            { value: "Furniture/Styling Refresh", label: "Furniture/Styling Refresh" },
                            { value: "Other", label: "Other" },
                        ])}
                        {renderInput("Timeline", "timeline")}
                        {renderSelect("Budget Range", "budget_range", [
                            { value: "35k-65k", label: "$35k - $65k" },
                            { value: "75k-100k", label: "$75k - $100k" },
                            { value: "125k-500k", label: "$125k - $500k" },
                            { value: "600k-1M", label: "$600k - $1M" },
                            { value: "2M-5M", label: "$2M - $5M" },
                            { value: "7M-10M", label: "$7M - $10M" },
                            { value: "other", label: "Other" },
                        ])}
                        {renderInput("Ideal Sofa Price", "ideal_sofa_price")}
                        {renderTextarea("Project Priorities (comma-separated)", "project_priority", "quality, timeline, budget")}
                        {renderTextarea("Rooms Involved (comma-separated)", "rooms_involved", "Living Room, Kitchen, Primary Bedroom")}
                        {renderTextarea("Additional Rooms Involved (comma-separated)", "additional_rooms_involved", "Guest Bedroom, Office")}
                    </div>
                    {formData.project_type === 'Other' && (
                        <div className="col-span-2">
                            {renderTextarea("Other Project Description", "other_project_description")}
                        </div>
                    )}
                </div>
            </div>

            {/* Design & Style Preferences */}
            <div className="bg-[#1E293B] border-stone-700 shadow-lg rounded-lg p-6">
                <h3 className="text-[#8B7355] text-xl font-semibold mb-4">Design & Style Preferences</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderTextarea("What They Love About Home", "design_love_home")}
                        {renderTextarea("How Space Will Be Used", "design_space_use")}
                        {renderTextarea("How Space Is Currently Used", "design_current_use")}
                        {renderTextarea("First Impression for Guests", "design_first_impression")}
                        {renderInput("Common Color Palette", "design_common_color_palette")}
                        {renderTextarea("Preferred Color Palette (comma-separated)", "design_preferred_palette", "whites, blues, grays")}
                        {renderInput("Disliked Colors", "design_disliked_colors")}
                        {renderTextarea("Artwork Preference (comma-separated)", "design_artwork_preference", "modern, abstract, photography")}
                        {renderTextarea("Style Preferences (comma-separated)", "design_styles_preference", "modern, transitional, farmhouse")}
                        {renderTextarea("Styles They Love", "design_styles_love")}
                        {renderTextarea("Existing Furniture to Keep", "design_existing_furniture")}
                        {renderTextarea("Finishes/Patterns Preference (comma-separated)", "finishes_patterns_preference", "natural wood, marble, linen")}
                        {renderTextarea("Materials to Avoid", "design_materials_to_avoid")}
                        {renderTextarea("Meaningful Item", "design_meaningful_item")}
                        {renderTextarea("Special Requirements", "design_special_requirements")}
                        {renderInput("Pinterest/Houzz Links", "design_pinterest_houzz")}
                        {renderTextarea("Additional Design Comments", "design_additional_comments")}
                    </div>
                </div>
            </div>

            {/* Get To Know You */}
            <div className="bg-[#1E293B] border-stone-700 shadow-lg rounded-lg p-6">
                <h3 className="text-[#8B7355] text-xl font-semibold mb-4">Get To Know You</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderTextarea("Household Members", "know_you_household")}
                        {renderTextarea("Pets", "know_you_pets")}
                        {renderInput("Social Media", "know_you_social_media")}
                        {renderInput("Hobbies", "know_you_hobbies")}
                        {renderInput("What They Do For Fun", "know_you_fun")}
                        {renderInput("What Makes Them Happy", "know_you_happy")}
                        {renderInput("Family Birthdays", "know_you_family_birthdays")}
                        {renderInput("Anniversary", "know_you_anniversary", "date")}
                        {renderTextarea("What They Do As a Family", "know_you_family_together")}
                        {renderTextarea("Weekday Routine", "know_you_weekday_routine")}
                        {renderTextarea("Weekend Routine", "know_you_weekend_routine")}
                        {renderInput("Lighting Preference (Early Birds/Night Owls)", "know_you_lighting_preference")}
                        {renderTextarea("Entertaining Style", "know_you_entertaining_style")}
                        {renderInput("Favorite Restaurant", "know_you_favorite_restaurant")}
                        {renderInput("Favorite Vacation", "know_you_favorite_vacation")}
                        {renderInput("Favorite Foods", "know_you_favorite_foods")}
                        {renderTextarea("Where Family Relaxes", "know_you_relax_space")}
                        {renderTextarea("How They Want Space to Feel", "know_you_evoke_space")}
                        {renderTextarea("How Home Supports Social Life", "know_you_support_social_life")}
                        {renderTextarea("Future Family Plans (5-10 years)", "know_you_future_plans")}
                        {renderTextarea("Anything Else to Share", "know_you_share_more")}
                    </div>
                </div>
            </div>

            {/* Referral */}
            <div className="bg-[#1E293B] border-stone-700 shadow-lg rounded-lg p-6">
                <h3 className="text-[#8B7355] text-xl font-semibold mb-4">Referral</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInput("How They Heard About Us", "how_heard")}
                        {renderTextarea("Other Referral Details", "how_heard_other")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CustomerfacingProjectDetailPage() {
    const { projectId } = useParams();
    
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Questionnaire");

    const fetchProject = useCallback(async () => {
        if (projectId) {
            setIsLoading(true);
            try {
                const projectData = await projectAPI.get(projectId);
                setProject(projectData);
            } catch (error) {
                console.error("Failed to fetch project:", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);
    
    const tabs = [
        { name: "Questionnaire", icon: FileQuestion, component: <EditableQuestionnaireTab project={project} onUpdate={fetchProject} /> },
        { name: "Walkthrough", icon: Aperture, component: <div className="text-center text-stone-300 py-8">Walkthrough spreadsheet will be displayed here</div> },
        { name: "Checklist", icon: CheckSquare, component: <div className="text-center text-stone-300 py-8">Checklist spreadsheet will be displayed here</div> },
        { name: "FF&E", icon: Trello, component: <div className="text-center text-stone-300 py-8">FF&E spreadsheet will be displayed here</div> },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 mr-2 animate-spin text-stone-400" /> <span className="text-stone-300">Loading project...</span>
            </div>
        );
    }
    
    if (!project) {
        return <div className="text-center text-stone-300">Project not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <Link to="/customer" className="inline-flex items-center text-sm font-medium text-stone-400 hover:text-stone-100 mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Projects
                </Link>
                <h1 className="text-6xl font-bold" style={{color: '#8B7355'}}>{project.name}</h1>
                <p className="text-stone-300 mt-1 text-lg">{project.client_name} - {project.address}</p>
            </div>

            <div className="border-b border-stone-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`whitespace-nowrap py-4 px-4 border-b-2 font-semibold text-lg transition-colors ${
                                activeTab === tab.name
                                    ? 'border-[#8B7355] text-[#8B7355]'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                            }`}
                        >
                            <tab.icon className="inline-block w-6 h-6 mr-3" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {tabs.find(tab => tab.name === activeTab)?.component}
            </div>
        </div>
    );
}