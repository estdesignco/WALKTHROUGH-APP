import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, FileQuestion, Aperture, CheckSquare, ArrowLeft, Trello } from "lucide-react";

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
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">CLIENT INFORMATION</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Full Name</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.client_info?.full_name || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Project Name</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.name || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Email Address</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.client_info?.email || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Phone Number</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.client_info?.phone || 'Not provided'}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-300 mb-2">Project Address</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.client_info?.address || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Details */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">PROJECT DETAILS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Project Type</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.project_type || 'Not specified'}
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
                            <label className="block text-sm font-medium text-stone-300 mb-2">Property Type</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.property_type || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Rooms */}
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

                {/* Design Preferences */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">DESIGN PREFERENCES</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Design Style</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.design_style || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Color Preferences</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200">
                                {project.color_preferences || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="bg-stone-800 rounded-lg border border-stone-700 p-6">
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">ADDITIONAL INFORMATION</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">Special Requests</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-200 min-h-[80px]">
                                {project.special_requests || project.notes || 'No additional information provided'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const tabs = [
        { name: "Questionnaire", icon: FileQuestion, component: <CompleteFilledQuestionnaire /> },
        { name: "Walkthrough", icon: Aperture, component: <div className="text-center text-stone-300 py-8">Walkthrough spreadsheet will be displayed here</div> },
        { name: "Checklist", icon: CheckSquare, component: <div className="text-center text-stone-300 py-8">Checklist spreadsheet will be displayed here</div> },
        { name: "FF&E", icon: Trello, component: <div className="text-center text-stone-300 py-8">FF&E spreadsheet will be displayed here</div> },
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
                <Link to="/customer" className="flex items-center text-stone-400 hover:text-stone-200 transition-colors">
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