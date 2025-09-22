import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Home, Trash2, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// API functions
const Project = {
    list: async (sort) => {
        const response = await fetch(`${BACKEND_URL}/api/projects?sort=${sort || '-updated_date'}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return await response.json();
    },
    create: async (data) => {
        const response = await fetch(`${BACKEND_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create project');
        return await response.json();
    },
    delete: async (id) => {
        const response = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete project');
        return true;
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

const SendEmail = async ({ to, subject, body, from_name }) => {
    const response = await fetch(`${BACKEND_URL}/api/send-questionnaire-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to,
            subject,
            body,
            from_name
        })
    });
    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
};

const createPageUrl = (page) => {
    return `/customer/${page.toLowerCase()}`;
};

const NewProjectDialog = ({ isOpen, onOpenChange }) => {
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

    const handleFormChange = React.useCallback((field, value) => {
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
    }, []);

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
        setIsLoading(true);

        try {
            const formData = new FormData(e.target);
            const formValues = Object.fromEntries(formData.entries());
            
            const projectData = {
                name: formValues.name || `${formValues.client_name}'s Project`,
                client_info: {
                    full_name: formValues.client_name,
                    email: formValues.email,
                    phone: formValues.phone,
                    address: formValues.address || '',
                    contact_preferences: [],
                    best_time_to_call: formValues.best_time_to_call || ''
                },
                project_type: formValues.project_type || 'Renovation',
                timeline: formValues.timeline || '',
                budget: formValues.budget_range || '$35k-65k',
                rooms_involved: [],
                design_styles_preference: [],
                design_preferred_palette: [],
                design_artwork_preference: []
            };

            console.log('Creating project with data:', projectData);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newProject = await response.json();
            console.log('Project created successfully:', newProject);
            
            alert('Project created successfully!');
            onOpenChange(false);
            
            // Reset form
            e.target.reset();
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please try again.');
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open) => {
        if (!open) {
            // Reset form on close
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
            setNewRoomName("");
        }
        onOpenChange(open);
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

    const InputField = ({ label, id, name, type = "text", placeholder = "", className = "" }) => (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-sm font-medium text-stone-300">{label}</Label>
            <input 
                id={id} 
                name={name}
                type={type} 
                placeholder={placeholder} 
                className={`${inputStyles} ${className} w-full px-3 py-2 rounded-md border-0 bg-gray-700 text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]`}
                autoComplete="off"
            />
        </div>
    );

    const FieldWrapper = ({ label, children }) => (
        <div className="space-y-1">
            <Label className="text-sm font-medium text-stone-300">{label}</Label>
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
                        <Checkbox
                            id={option}
                            checked={value.includes(option)}
                            onCheckedChange={(checked) => handleCheckedChange(option, checked)}
                            className="border-stone-400 data-[state=checked]:bg-[#8B7355] data-[state=checked]:border-[#8B7355]"
                        />
                        <label htmlFor={option} className="text-xs text-stone-300">
                            {option}
                        </label>
                    </div>
                ))}
            </div>
        );
    };

    const inputStyles = "bg-gray-700 border-gray-600 text-stone-200 focus:border-[#8B7355] placeholder:text-stone-500 text-sm";

    // Options arrays
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-[#2D3748] border-stone-700 text-stone-200 max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#8B7355] text-2xl">New Client Project</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Fill out as much or as little information as you have. Nothing is required.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-6 pt-2">
                    {/* Client Information */}
                    <Section title="Client Information">
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Client Name" id="client_name" name="client_name" />
                            <InputField label="Project Name" id="name" name="name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Email Address" id="email" name="email" type="email" />
                            <InputField label="Phone Number" id="phone" name="phone" type="tel" />
                        </div>
                        <FieldWrapper label="Project Address">
                            <Textarea className={inputStyles} value={formData.address || ''} onChange={(e) => handleFormChange('address', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Contact Preferences">
                            <CheckboxGroup options={contactPrefOptions} value={formData.contact_preferences} onChange={(v) => handleFormChange('contact_preferences', v)} />
                        </FieldWrapper>
                        <InputField label="Best Time to Call" id="best_time_to_call" name="best_time_to_call" />
                    </Section>

                    {/* Project Type & Budget */}
                    <Section title="Project Details">
                        <FieldWrapper label="What type of project is this?">
                            <RadioGroup value={formData.project_type} onValueChange={(value) => handleFormChange('project_type', value)} className="text-stone-200">
                                <div className="grid grid-cols-2 gap-2">
                                    {["New Build", "Renovation", "Furniture/Styling Refresh", "Other"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`type-${option}`} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={`type-${option}`} className="text-sm text-stone-200">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <InputField label="Your Timeline" id="timeline" name="timeline" />
                            <div>
                                <Label htmlFor="budget_range" className="font-semibold text-stone-300">Budget Range</Label>
                                <Select value={formData.budget_range} onValueChange={(value) => handleFormChange('budget_range', value)}>
                                    <SelectTrigger id="budget_range" className="bg-gray-700 border-gray-600 text-stone-200 focus:border-[#8B7355] placeholder:text-stone-500 text-sm">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600 text-stone-200">
                                        <SelectItem value="35k-65k">$35k - $65k</SelectItem>
                                        <SelectItem value="75k-100k">$75k - $100k</SelectItem>
                                        <SelectItem value="125k-500k">$125k - $500k</SelectItem>
                                        <SelectItem value="600k-1M">$600k - $1M</SelectItem>
                                        <SelectItem value="2M-5M">$2M - $5M</SelectItem>
                                        <SelectItem value="7M-10M">$7M - $10M</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <FieldWrapper label="Project Priorities">
                            <CheckboxGroup options={projectPriorityOptions} value={formData.project_priority} onChange={(v) => handleFormChange('project_priority', v)} />
                        </FieldWrapper>
                    </Section>

                    {/* Rooms */}
                    <Section title="Rooms Involved">
                        <FieldWrapper label="Select rooms involved in this project">
                            <CheckboxGroup options={roomsOptionsUpdated} value={formData.rooms_involved} onChange={handleRoomsChange} />
                        </FieldWrapper>
                        <FieldWrapper label="Add Custom Room">
                            <div className="flex items-center gap-2">
                                <Input
                                    className={inputStyles}
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="e.g., Wine Cellar"
                                />
                                <Button type="button" onClick={handleAddRoom} className="bg-[#B49B7E] hover:bg-[#A08B6F] shrink-0">
                                    <Plus className="mr-1 h-3 w-3" /> Add
                                </Button>
                            </div>
                            {formData.rooms_involved.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.rooms_involved.map(room => (
                                        <span key={room} className="flex items-center bg-gray-600 text-stone-200 px-2 py-1 rounded-full text-xs">
                                            {room}
                                            <button type="button" onClick={() => handleRemoveRoom(room)} className="ml-1 text-stone-300 hover:text-red-400">
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
                            <CheckboxGroup options={stylePrefOptions} value={formData.design_styles_preference} onChange={(v) => handleFormChange('design_styles_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Color Palette Preference">
                            <CheckboxGroup options={colorPrefOptions} value={formData.design_preferred_palette} onChange={(v) => handleFormChange('design_preferred_palette', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="Artwork Preferences">
                            <CheckboxGroup options={artworkPrefOptions} value={formData.design_artwork_preference} onChange={(v) => handleFormChange('design_artwork_preference', v)} />
                        </FieldWrapper>
                        <FieldWrapper label="What do you love about your current home?">
                            <Textarea className={inputStyles} value={formData.design_love_home || ''} onChange={(e) => handleFormChange('design_love_home', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="First impression you want guests to have">
                            <Textarea className={inputStyles} value={formData.design_first_impression || ''} onChange={(e) => handleFormChange('design_first_impression', e.target.value)} />
                        </FieldWrapper>
                    </Section>

                    {/* Personal Information */}
                    <Section title="Getting to Know You">
                        <FieldWrapper label="Household members (include ages of children)">
                            <Textarea className={inputStyles} value={formData.know_you_household || ''} onChange={(e) => handleFormChange('know_you_household', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Pets">
                            <Textarea className={inputStyles} value={formData.know_you_pets || ''} onChange={(e) => handleFormChange('know_you_pets', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Hobbies">
                            <Textarea className={inputStyles} value={formData.know_you_hobbies || ''} onChange={(e) => handleFormChange('know_you_hobbies', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="How do you entertain guests?">
                            <Textarea className={inputStyles} value={formData.know_you_entertaining_style || ''} onChange={(e) => handleFormChange('know_you_entertaining_style', e.target.value)} />
                        </FieldWrapper>
                    </Section>

                    {/* Additional Questions */}
                    <Section title="Additional Information">
                        <FieldWrapper label="How did you hear about us?">
                            <RadioGroup value={formData.how_heard} onValueChange={(value) => handleFormChange('how_heard', value)} className="text-stone-200">
                                <div className="grid grid-cols-2 gap-2">
                                    {["Internet Search", "Social Media", "Friend Referral", "Magazine", "Google", "Market Event", "Other"].map(option => (
                                        <div key={option} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`heard-${option}`} className="border-stone-400 text-[#8B7355]" />
                                            <Label htmlFor={`heard-${option}`} className="text-sm text-stone-200">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </FieldWrapper>
                        <FieldWrapper label="Pinterest/Houzz Links">
                            <Textarea className={inputStyles} value={formData.design_pinterest_houzz || ''} onChange={(e) => handleFormChange('design_pinterest_houzz', e.target.value)} />
                        </FieldWrapper>
                        <FieldWrapper label="Additional Comments">
                            <Textarea className={inputStyles} value={formData.design_additional_comments || ''} onChange={(e) => handleFormChange('design_additional_comments', e.target.value)} />
                        </FieldWrapper>
                    </Section>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-700">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-stone-200 border-stone-600 hover:bg-stone-700 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-[#8B7355] hover:bg-[#A0927B] text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Create Project
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const EmailNewClientDialog = ({ isOpen, onOpenChange }) => {
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('Design Services - Client Questionnaire');
    const [emailBody, setEmailBody] = useState(
`Hello,

Thank you for your interest in working with Established Design Co.

To help us better understand your vision and needs for your upcoming project, please take a few moments to fill out our comprehensive client questionnaire. Your detailed responses will allow us to tailor our design approach specifically to you.

Please click the link below to access the form:
[Link to Questionnaire]

We look forward to reviewing your submission and beginning this creative journey together.

Best regards,
The Established Design Co. Team`
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await SendEmail({
                to: emailTo,
                subject: emailSubject,
                body: emailBody.replace(/\n/g, '<br>'),
                from_name: 'Established Design Co.'
            });
            alert('Questionnaire sent successfully!');
            setEmailTo('');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Failed to send email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#2D3748] border-stone-700 text-stone-200 max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[#8B7355] text-2xl">Email Questionnaire to New Client</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Send the client questionnaire to a potential new client
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="newClientEmail" className="text-[#8B7355]">Client Email</Label>
                        <Input id="newClientEmail" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} required className="bg-gray-700 border-gray-600 text-stone-200" placeholder="client@example.com" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="newClientSubject" className="text-[#8B7355]">Subject</Label>
                        <Input id="newClientSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required className="bg-gray-700 border-gray-600 text-stone-200" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="newClientBody" className="text-[#8B7355]">Email Body</Label>
                        <Textarea id="newClientBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} required rows={12} className="bg-gray-700 border-gray-600 text-stone-200" />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-stone-200 border-stone-600 hover:bg-stone-700 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-[#8B7355] hover:bg-[#A0927B] text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Questionnaire
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const EmailClientDialog = ({ project, isOpen, onOpenChange, onEmailSent }) => {
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setEmailTo(project.email || '');
            setEmailSubject(`${project.name} - Project Questionnaire`);
            setEmailBody(
`Hello ${project.client_name},

Thank you for your interest in working with Established Design Co.

To help us better understand your vision and needs for your project, "${project.name}", please take a few moments to fill out our comprehensive client questionnaire. Your detailed responses will allow us to tailor our design approach specifically to you.

Please click the link below to access the form:
[Link to Questionnaire]

We look forward to reviewing your submission and beginning this creative journey together.

Best regards,
The Established Design Co. Team`
            );
        }
    }, [project]);

    if (!project) {
        return null;
    }

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await SendEmail({
                to: emailTo,
                subject: emailSubject,
                body: emailBody.replace(/\n/g, '<br>'),
                from_name: 'Established Design Co.'
            });
            alert('Email sent successfully!');
            onEmailSent();
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Failed to send email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#2D3748] border-stone-700 text-stone-200">
                <DialogHeader>
                    <DialogTitle className="text-[#8B7355] text-2xl">Email Questionnaire to Client</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Sending for project: {project.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="emailTo" className="text-[#8B7355]">Client Email</Label>
                        <Input id="emailTo" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} required className="bg-gray-700 border-gray-600 text-stone-200" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="emailSubject" className="text-[#8B7355]">Subject</Label>
                        <Input id="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required className="bg-gray-700 border-gray-600 text-stone-200" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="emailBody" className="text-[#8B7355]">Body</Label>
                        <Textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} required rows={10} className="bg-gray-700 border-gray-600 text-stone-200" />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-stone-200 border-stone-600 hover:bg-stone-700 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-[#8B7355] hover:bg-[#A0927B] text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send Email
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function Index() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProject, setDeletingProject] = useState(null);
  const [emailingProject, setEmailingProject] = useState(null);
  const [isNewClientEmailOpen, setIsNewClientEmailOpen] = useState(false);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const projectList = await Project.list('-updated_date');
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId, projectName) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated rooms and items. This cannot be undone.`)) {
      setDeletingProject(projectId);
      try {
        await Project.delete(projectId);
        await fetchProjects(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete project:", error);
        alert("There was an error deleting the project.");
      } finally {
        setDeletingProject(null);
      }
    }
  };

  return (
    <div className="space-y-8 text-stone-200">
       <div className="w-full bg-[#1E293B] shadow-lg flex items-center justify-center my-8 h-auto max-h-[150px] p-4 rounded-lg border border-[#8B7355]/50">
          <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png"
              alt="Established Design Co."
              className="w-full h-full object-contain"
          />
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-stone-700">
          <h1 className="text-4xl font-bold" style={{color: '#8B7355'}}>Studio Projects</h1>
          <div className="flex gap-3">
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base">
                          <Plus className="mr-2 h-5 w-5" /> New Client
                      </Button>
                  </DialogTrigger>
              </Dialog>
              <Dialog open={isNewClientEmailOpen} onOpenChange={setIsNewClientEmailOpen}>
                  <DialogTrigger asChild>
                      <Button className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base">
                          <Mail className="mr-2 h-5 w-5" /> Email New Client
                      </Button>
                  </DialogTrigger>
              </Dialog>
              <Link to={createPageUrl("Questionnaire")}>
                  <Button className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base">
                      <Plus className="mr-2 h-5 w-5" /> Full Questionnaire
                  </Button>
              </Link>
          </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#8B7355]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B]/50 rounded-lg border-2 border-dashed border-stone-700">
            <Home className="mx-auto h-16 w-16 text-stone-500" />
            <h3 className="mt-4 text-xl font-medium text-stone-300">Your Project Library is Empty</h3>
            <p className="mt-2 text-md text-stone-400">Get started by creating your first project file.</p>
        </div>
      ) : (
        <div className="space-y-4">
            {projects.map((project) => (
                <div key={project.id} className="group relative bg-[#1E293B] hover:bg-[#2D3748] border border-stone-700 hover:border-[#8B7355] rounded-lg shadow-lg transition-all duration-300">
                      <div className="absolute top-3 right-3 z-10 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEmailingProject(project);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 bg-blue-900/30"
                          title="Email Client"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                            disabled={deletingProject === project.id}
                            className="text-stone-400 hover:text-red-500 hover:bg-red-900/50"
                            title="Delete Project"
                        >
                            {deletingProject === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                      </div>
                    <Link to={`/project/${project.id}/detail`} className="block p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-[#A0927B] group-hover:text-[#8B7355] transition-colors">{project.name}</h2>
                                <p className="text-sm text-stone-400 mt-1">{project.client_name}</p>
                            </div>
                            <div className="text-right mr-20">
                                <p className="text-xs text-stone-500">Last Updated</p>
                                <p className="text-sm text-stone-400">{new Date(project.updated_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-md text-stone-300 mt-4 border-t border-stone-700 pt-4 flex justify-between items-center">
                          <span>{project.address}</span>
                          <span className="text-sm font-semibold text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-20">
                            View Project →
                          </span>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
      )}
      <NewProjectDialog isOpen={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen} />
      <EmailNewClientDialog isOpen={isNewClientEmailOpen} onOpenChange={setIsNewClientEmailOpen} />
      <EmailClientDialog
        project={emailingProject}
        isOpen={!!emailingProject}
        onOpenChange={(isOpen) => !isOpen && setEmailingProject(null)}
        onEmailSent={() => setEmailingProject(null)}
      />
    </div>
  );
}