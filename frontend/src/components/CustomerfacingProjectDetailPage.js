import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, FileQuestion, Aperture, CheckSquare, ArrowLeft, Trello } from "lucide-react";
import WalkthroughDashboard from './WalkthroughDashboard';
import ChecklistDashboard from './ChecklistDashboard';
import FFEDashboard from './FFEDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// API functions
const Project = {
    get: async (id) => {
        const response = await fetch(`${BACKEND_URL}/api/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        return await response.json();
    }
};

export default function ProjectPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Questionnaire");

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setIsLoading(true);
                console.log('Fetching project:', projectId);
                const projectData = await Project.get(projectId);
                console.log('Project data received:', projectData);
                setProject(projectData);
            } catch (error) {
                console.error("Failed to fetch project:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    // Complete Filled Questionnaire Component
    const CompleteFilledQuestionnaire = () => {
        if (!project) return <div className="text-center text-stone-300 py-8">Loading questionnaire...</div>;
        
        return (
            <div className="space-y-8 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#8B7355]">COMPREHENSIVE CLIENT QUESTIONNAIRE</h2>
                    <button className="px-4 py-2 bg-[#8B7355] text-white rounded hover:bg-[#9c8563] transition-colors">
                        Edit Answers
                    </button>
                </div>

                {/* Client Information */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#D4A574] mb-4">CLIENT INFORMATION</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Full Name</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.client_info?.full_name || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Project Name</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 35, 0.9) 30%, rgba(10, 15, 20, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.name || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Email Address</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.client_info?.email || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Phone Number</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 35, 0.9) 30%, rgba(10, 15, 20, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.client_info?.phone || 'Not provided'}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Project Address</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.client_info?.address || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Best Time to Call</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 35, 0.9) 30%, rgba(10, 15, 20, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.best_time_to_call || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Preferred Communication</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {Array.isArray(project.contact_preferences) ? project.contact_preferences.join(', ') : project.contact_preferences || 'Not specified'}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Previous Designer Experience</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 35, 0.9) 30%, rgba(10, 15, 20, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.worked_with_designer_before || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Primary Decision Maker(s)</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.primary_decision_maker || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Involvement Level</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 25, 35, 0.9) 30%, rgba(10, 15, 20, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.involvement_level || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Ideal Sofa Price Point</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {project.ideal_sofa_price || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Rooms - MOVED TO TOP */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">PROJECT ROOMS</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.rooms?.map((room, index) => (
                            <div key={room.id || index} className="p-3 bg-stone-700 rounded border border-stone-600">
                                <h4 className="font-semibold text-[#8B7355]">{room.name}</h4>
                                {room.description && <p className="text-sm text-stone-400 mt-1">{room.description}</p>}
                            </div>
                        )) || (
                            <p className="text-stone-400 col-span-full">No rooms specified</p>
                        )}
                    </div>
                </div>

                {/* Total Scope of Work */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">TOTAL SCOPE OF WORK</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Property Type</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.property_type || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Timeline</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.timeline || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Budget Range</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.budget_range || project.budget || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Project Priority</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {Array.isArray(project.project_priority) ? project.project_priority.join(', ') : project.project_priority || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Type Specific */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">PROJECT TYPE - {project.project_type?.toUpperCase() || 'NOT SPECIFIED'}</h3>
                    
                    {project.project_type === "New Build" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Working with Architect?</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.new_build_architect || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Working with Builder?</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.new_build_builder || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Square Footage</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.new_build_square_footage || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {project.project_type === "Renovation" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Working with Architect?</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.renovation_architect || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Working with Builder?</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.renovation_builder || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Square Footage Being Renovated</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.renovation_square_footage || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Changing Layout/Footprint?</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.renovation_layout_change || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {project.project_type === "Furniture Refresh" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Square Footage Being Refreshed</label>
                                    <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                        {project.furniture_refresh_square_footage || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Keeping Any Existing Pieces?</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                    {project.furniture_refresh_keeping_pieces || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Design Questions */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">DESIGN QUESTIONS</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Style in 3 Words</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {project.design_style_words || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Preferred Colors</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {project.design_preferred_colors || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Disliked Colors</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {project.design_disliked_colors || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Preferred Palette</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {Array.isArray(project.design_preferred_palette) ? project.design_preferred_palette.join(', ') : project.design_preferred_palette || 'Not specified'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Artwork Preference</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {Array.isArray(project.design_artwork_preference) ? project.design_artwork_preference.join(', ') : project.design_artwork_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Liked Design Styles</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {Array.isArray(project.design_styles_preference) ? project.design_styles_preference.join(', ') : project.design_styles_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Disliked Design Styles</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {project.design_styles_dislike || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Patterns & Textures Preference</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {Array.isArray(project.finishes_patterns_preference) ? project.finishes_patterns_preference.join(', ') : project.finishes_patterns_preference || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Getting to Know You Better */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">GETTING TO KNOW YOU BETTER</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Tell us about your family</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {project.family_info || 'Not provided'}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">Do you have pets?</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {project.pets_info || 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">How do you entertain?</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                    {project.entertaining_style || 'Not provided'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">What are your hobbies?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[60px]">
                                {project.hobbies || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">What is your lifestyle like?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {project.lifestyle || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Any special requests or needs?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {project.special_requests || project.notes || 'No special requests'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* How Did You Hear About Us */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">HOW DID YOU HEAR ABOUT US</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">How did you hear about us?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.how_heard_about_us || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Newsletter signup?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.newsletter_signup || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Social media preferences</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.social_media_preferences || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        );
    };

    const tabs = [
        { name: "Questionnaire", icon: FileQuestion, component: <CompleteFilledQuestionnaire /> },
        { name: "Walkthrough", icon: Aperture, component: project ? (
            <div className="walkthrough-content">
                <WalkthroughDashboard isOffline={false} hideNavigation={true} projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading walkthrough...</div> },
        { name: "Checklist", icon: CheckSquare, component: project ? (
            <div className="checklist-content">
                <ChecklistDashboard isOffline={false} hideNavigation={true} projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading checklist...</div> },
        { name: "FF&E", icon: Trello, component: project ? (
            <div className="ffe-content">
                <FFEDashboard isOffline={false} hideNavigation={true} projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading FF&E...</div> },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 mr-2 animate-spin text-stone-400" /> 
                <span className="text-stone-300">Loading project...</span>
            </div>
        );
    }
    
    if (!project) {
        return <div className="text-center text-stone-300">Project not found.</div>;
    }

    return (
        <div className="space-y-8 text-stone-200 min-h-screen bg-gray-900 p-6">
            <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center text-stone-400 hover:text-stone-200 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to All Projects
                </Link>
            </div>

            <div className="space-y-4">
                <h1 className="text-6xl font-bold" style={{color: '#8B7355'}}>{project.name}</h1>
                <p className="text-stone-300 mt-1 text-lg">{project.client_info?.full_name || project.client_name} - {project.client_info?.address || project.address}</p>
            </div>

            <div className="border-b border-stone-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`${
                                    activeTab === tab.name
                                        ? 'border-stone-400 text-stone-200'
                                        : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-300'
                                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="py-4">
                {tabs.find(tab => tab.name === activeTab)?.component}
            </div>
        </div>
    );
}