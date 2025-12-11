import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, FileQuestion, Aperture, CheckSquare, ArrowLeft, Trello, ListTodo, DollarSign, Calendar, BarChart3, Palette, Zap, FileText, Calculator, Users, Sparkles, Home, Package, Phone, Ruler, Bot, PaintBucket, MessageSquare, Clipboard, Truck, Layout } from "lucide-react";
import EditInput from './EditInput';
import WalkthroughDashboard from './WalkthroughDashboard';
import ContactSheet from './ContactSheet';
import FullscreenMoodboard from './FullscreenMoodboard';
import CriticalPathDashboard from './CriticalPathDashboard';

import ChecklistDashboard from './ChecklistDashboard';
import FFEDashboard from './FFEDashboard';
import MeasurementsAndFilesPage from './MeasurementsAndFilesPage';
import ToDoList from './ToDoList';
import FinanceDashboard from './FinanceDashboard';
import InstallationCalendar from './InstallationCalendar';
import ReportsDashboard from './ReportsDashboard';
import DesignToolsDashboard from './DesignToolsDashboard';
import DesignToolsHub from './DesignToolsHub';
import AutomationDashboard from './AutomationDashboard';
import ExportsDashboard from './ExportsDashboard';
import CalculatorDashboard from './CalculatorDashboard';
import BudgetTracker from './BudgetTracker';
import VendorContactManager from './VendorContactManager';
import MaterialLibrary from './MaterialLibrary';
import AIDesignDashboard from './AIDesignDashboard';
import RoomRenderingStudio from './RoomRenderingStudio';
import TeamChat from './TeamChat';
import PunchList from './PunchList';
import ShippingTracker from './ShippingTracker';

import EditableQuestionnaireView from './EditableQuestionnaireView';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);

// API functions
const Project = {
    get: async (id) => {
        const response = await fetch(`${BACKEND_URL}/api/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        return await response.json();
    }
};

export default function ProjectDetailPage() {
    const { projectId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [questionnaire, setQuestionnaire] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "Questionnaire");
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Update URL when tab changes
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setSearchParams({ tab: tabName });
    };
    
    // Sync activeTab with URL params on load/refresh
    useEffect(() => {
        const urlTab = searchParams.get('tab');
        if (urlTab && urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setIsLoading(true);
                console.log('Fetching project:', projectId);
                const projectData = await Project.get(projectId);
                console.log('Project data received:', projectData);
                setProject(projectData);
                
                // Also fetch questionnaire answers
                try {
                    console.log('Fetching questionnaire for:', projectId);
                    const questionnaireResponse = await fetch(`${BACKEND_URL}/api/questionnaire/${projectId}`);
                    if (questionnaireResponse.ok) {
                        const questionnaireData = await questionnaireResponse.json();
                        console.log('✅ Questionnaire data loaded:', Object.keys(questionnaireData.answers || {}).length, 'fields');
                        setQuestionnaire(questionnaireData);
                    }
                } catch (qError) {
                    console.log('No questionnaire data');
                }
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

    const handleEditClick = () => {
        setEditedProject({ ...project });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedProject(null);
    };

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true);
            const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedProject)
            });

            if (response.ok) {
                const updatedProject = await response.json();
                setProject(updatedProject);
                setIsEditing(false);
                setEditedProject(null);
                alert('Project updated successfully!');
            } else {
                throw new Error('Failed to update project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = React.useCallback((field, value, nested = null) => {
        setEditedProject(prev => {
            if (!prev) return prev;
            const newProject = { ...prev };
            
            if (nested) {
                newProject[nested] = { ...prev[nested], [field]: value };
            } else {
                newProject[field] = value;
            }
            
            return newProject;
        });
    }, []);

    // Complete Filled Questionnaire Component
    const CompleteFilledQuestionnaire = () => {
        if (!project) return <div className="text-center text-stone-300 py-8">Loading questionnaire...</div>;
        
        const answers = questionnaire?.answers || {};
        console.log('📋 Rendering questionnaire with', Object.keys(answers).length, 'answer fields');
        
        return (
            <div className="space-y-8 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#8B7355]">COMPREHENSIVE CLIENT QUESTIONNAIRE</h2>
                    {!isEditing ? (
                        <button 
                            onClick={() => navigate(`/project/${projectId}/edit-questionnaire`)}
                            className="px-4 py-2 bg-[#8B7355] text-white rounded hover:bg-[#9c8563] transition-colors"
                        >
                            Edit Answers
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button 
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
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
                            {isEditing ? (
                                <EditInput
                                    type="text"
                                    value={editedProject?.client_info?.full_name || ''}
                                    onChange={(val) => handleInputChange('full_name', val, 'client_info')}
                                    className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                                />
                            ) : (
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                }}>
                                    {project.client_info?.full_name || 'Not provided'}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Project Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProject?.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                                />
                            ) : (
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                                }}>
                                    {project.name || 'Not provided'}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Email Address</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedProject?.client_info?.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value, 'client_info')}
                                    className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                                />
                            ) : (
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                }}>
                                    {project.client_info?.email || 'Not provided'}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={editedProject?.client_info?.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value, 'client_info')}
                                    className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                                />
                            ) : (
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                                }}>
                                    {project.client_info?.phone || 'Not provided'}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Project Address</label>
                            {isEditing ? (
                                <textarea
                                    value={editedProject?.client_info?.address || ''}
                                    onChange={(e) => handleInputChange('address', e.target.value, 'client_info')}
                                    className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                                    rows="3"
                                />
                            ) : (
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                                }}>
                                    {project.client_info?.address || 'Not provided'}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Spouse/Partner Name</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                            }}>
                                {answers.spouse_partner_name || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Spouse/Partner Phone</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {answers.spouse_partner_phone || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Best Time to Call</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                            }}>
                                {answers.best_time_to_call || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Preferred Communication</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {Array.isArray(answers.contact_preferences) ? answers.contact_preferences.join(', ') : answers.contact_preferences || 'Not specified'}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Previous Designer Experience</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{
                                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                            }}>
                                {answers.worked_with_designer_before || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Primary Decision Maker(s)</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {answers.primary_decision_maker || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Involvement Level</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 15, 0.95) 70%, rgba(10, 10, 10, 0.95) 100%)'
                            }}>
                                {answers.involvement_level || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Ideal Sofa Price Point</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                            }}>
                                {answers.ideal_sofa_price || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Rooms - MOVED TO TOP */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">PROJECT ROOMS</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.rooms?.map((room, index) => (
                            <div key={room.id || index} className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                <h4 className="font-semibold text-[#8B7355]">{room.name}</h4>
                                {room.description && <p className="text-sm text-[#D4C5A9] mt-1">{room.description}</p>}
                            </div>
                        )) || (
                            <p className="text-[#D4C5A9] col-span-full">No rooms specified</p>
                        )}
                    </div>
                </div>

                {/* Total Scope of Work */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">TOTAL SCOPE OF WORK</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Property Type</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                {answers.property_type || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Timeline</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                {answers.timeline || project.timeline || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Budget Range</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                {answers.budget_range || project.budget || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Project Priority</label>
                            <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                {Array.isArray(answers.project_priority) ? answers.project_priority.join(', ') : answers.project_priority || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Type Specific */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">PROJECT TYPE - {project.project_type?.toUpperCase() || 'NOT SPECIFIED'}</h3>
                    
                    {project.project_type === "New Build" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">New Build Address</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.new_build_address || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Working with Architect?</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.new_build_architect || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Working with Builder?</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.new_build_builder || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Process Stage</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.new_build_process_stage || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Need New Furniture?</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.new_build_need_furniture || 'Not specified'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Scope Notes</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.new_build_scope_notes || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    )}

                    {project.project_type === "Renovation" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Renovation Address</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.renovation_address || project.client_info?.address || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Working with Architect?</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.renovation_architect || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Architect Phone</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.renovation_architect_phone || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Working with Builder?</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.renovation_builder || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Builder Phone</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.renovation_builder_phone || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Existing Condition</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.renovation_existing_condition || 'Not specified'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Need New Furniture?</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.renovation_need_furniture || 'Not specified'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Favorite Memories of Current Home</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.renovation_memories || 'Not specified'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Scope Notes</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.renovation_scope_notes || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    )}

                    {project.project_type === "Furniture Refresh" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Condition of Current Furniture</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.furniture_refresh_condition || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Move-in Date</label>
                                    <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                        {answers.furniture_move_in_date || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Scope Notes</label>
                                <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] min-h-[80px]" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 30%, rgba(5, 5, 5, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)' }}>
                                    {answers.furniture_scope_notes || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Design Questions */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">DESIGN QUESTIONS</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What do you love about your current home?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_love_home || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">How will the spaces be used? (e.g., formal dining, casual living, etc.)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {answers.design_space_use || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What are their current uses?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {answers.design_current_use || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What is the first impression you want guests to have when they enter your home?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_first_impression || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Is there a common color palette in your home that you love?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_common_color_palette || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What color palette do you prefer?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {Array.isArray(answers.design_preferred_palette) ? answers.design_preferred_palette.join(', ') : answers.design_preferred_palette || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Are there any colors do you dislike?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {answers.design_disliked_colors || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Which interior design styles do you prefer? (Select all that apply)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {Array.isArray(answers.design_styles_preference) ? answers.design_styles_preference.join(', ') : answers.design_styles_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What do you like about these styles?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_styles_love || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What are your preferences for artwork?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {Array.isArray(answers.design_artwork_preference) ? answers.design_artwork_preference.join(', ') : answers.design_artwork_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Is there a piece of art, furniture, or a souvenir that holds significant personal meaning to you? Tell us the story behind it.</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_meaningful_item || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Are there any existing furniture pieces or decor items you&apos;d like to keep in the space? If so, please let us know the measurements and attach a photo below for reference.</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_existing_furniture || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Finishes and Patterns</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {Array.isArray(answers.finishes_patterns_preference) ? answers.finishes_patterns_preference.join(', ') : answers.finishes_patterns_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Do you have any specific materials you prefer or want to avoid?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_materials_to_avoid || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Do you have any special requirements or considerations? (e.g., accessibility needs, allergies, etc.)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.design_special_requirements || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Getting to Know You Better */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">GETTING TO KNOW YOU BETTER</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Who lives in your household? (Include ages of children if applicable)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_household || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Do you have pets? If yes, please specify</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_pets || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">How do you typically entertain guests? (e.g., large formal dinners, casual get-togethers, intimate cocktails, kids&apos; parties)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_entertaining_style || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Tell us about your hobbies</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_hobbies || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Describe a typical weekday for your household. What activities take place in the home?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_weekday_routine || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Describe a typical weekend for your household.</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_weekend_routine || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Are you early birds or night owls? How does natural and artificial lighting play a role in your daily routines?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_lighting_preference || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Where does each family member go to relax and have personal time? What activities do they do there?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_relax_space || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">How do you see your family&apos;s needs changing in the next 5-10 years? (e.g., growing children, aging in place, working from home more)</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_future_plans || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What do you you like to do for fun?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_fun || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What makes you HAPPY?!</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_happy || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Family Birthdays</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {/* Handle both old string format and new array format */}
                                {answers.family_birthdays && Array.isArray(answers.family_birthdays) && answers.family_birthdays.length > 0 ? (
                                    <ul className="list-none space-y-1">
                                        {answers.family_birthdays.filter(b => b.name || b.date).map((birthday, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <span className="font-medium">{birthday.name || 'Unknown'}</span>
                                                {birthday.date && <span className="text-[#B49B7E]">- {new Date(birthday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : answers.know_you_family_birthdays ? (
                                    answers.know_you_family_birthdays
                                ) : 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What does your Family like to do together for fun?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_family_together || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">What is your favorite place to vacation?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_favorite_vacation || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Tell us about your favorite foods, snacks, drinks, wine, beer, etc... OR ANYTHING ELSE that you just LOVE that we should know about!</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_favorite_foods || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">When you come home after a long day, what space do you naturally gravitate toward, and what feeling do you want that space to evoke?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_evoke_space || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">How do you want your home to support your social life?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[100px]">
                                {answers.know_you_support_social_life || 'Not provided'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">Is there ANYTHING ELSE that you would like to share with us to let us know how we can best serve you such as favorite memories of your last or current home, or favorite places, or just ANYTHING you want to share with us we would LOVE to to know about it as we get to know each other better!</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9] min-h-[120px]">
                                {answers.know_you_share_more || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* How Did You Hear About Us */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <h3 className="text-xl font-bold text-[#8B7355] mb-4">HOW DID YOU HEAR ABOUT US</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#D4A574] mb-2">How did you hear about us?</label>
                            <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                {answers.how_heard || 'Not provided'}
                            </div>
                        </div>
                        {answers.how_heard === 'Other' && (
                            <div>
                                <label className="block text-sm font-medium text-[#D4A574] mb-2">Please specify</label>
                                <div className="p-3 bg-stone-700 border border-stone-600 rounded text-[#D4C5A9]">
                                    {answers.how_heard_other || 'Not provided'}
                                </div>
                            </div>
                        )}
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
        { name: "Measurements", icon: Aperture, component: project ? (
            <div className="measurements-content">
                <MeasurementsAndFilesPage projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading measurements...</div> },
        { name: "To Do", icon: ListTodo, component: project ? (
            <div className="todo-content">
                <ToDoList projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading to-do list...</div> },
        { name: "Calendar", icon: Calendar, component: project ? (
            <div className="calendar-content">
                <InstallationCalendar projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading calendar...</div> },
        { name: "Contacts", icon: Users, component: project ? (
            <div className="contacts-content">
                <ContactSheet projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading contacts...</div> },
        { name: "Design", icon: Palette, component: project ? (
            <div className="design-content">
                <DesignToolsDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading design tools...</div> },
        { name: "Moodboard", icon: Sparkles, component: project ? (
            <div className="moodboard-content">
                <FullscreenMoodboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading moodboard...</div> },
        { name: "Finance", icon: DollarSign, component: project ? (
            <div className="finance-content">
                <FinanceDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading finance...</div> },
        { name: "Critical Path", icon: BarChart3, component: project ? (
            <div className="critical-path-content">
                <CriticalPathDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading critical path...</div> },

        { name: "Calculators", icon: Calculator, component: project ? (
            <div className="calculators-content">
                <CalculatorDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading calculators...</div> },
        { name: "Budget", icon: DollarSign, component: project ? (
            <div className="budget-content">
                <BudgetTracker projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading budget...</div> },
        { name: "Vendors", icon: Phone, component: project ? (
            <div className="vendors-content">
                <VendorContactManager projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading vendors...</div> },
        { name: "Materials", icon: Package, component: project ? (
            <div className="materials-content">
                <MaterialLibrary projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading materials...</div> },
        { name: "Automation", icon: Zap, component: project ? (
            <div className="automation-content">
                <AutomationDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading automation...</div> },
        { name: "Reports", icon: BarChart3, component: project ? (
            <div className="reports-content">
                <ReportsDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading reports...</div> },
        { name: "Exports", icon: FileText, component: project ? (
            <div className="exports-content">
                <ExportsDashboard projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading exports...</div> },
        { name: "AI Assistant", icon: Bot, component: (
            <div className="ai-assistant-content">
                <AIDesignDashboard project={project} />
            </div>
        ) },
        { name: "Room Studio", icon: PaintBucket, component: (
            <div className="room-studio-content">
                <RoomRenderingStudio />
            </div>
        ) },
        { name: "Team Chat", icon: MessageSquare, component: project ? (
            <div className="team-chat-content">
                <TeamChat projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading chat...</div> },
        { name: "Punch List", icon: Clipboard, component: project ? (
            <div className="punch-list-content">
                <PunchList projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading punch list...</div> },
        { name: "Shipping", icon: Truck, component: project ? (
            <div className="shipping-content">
                <ShippingTracker projectId={projectId} />
            </div>
        ) : <div className="text-center text-stone-300 py-8">Loading shipping...</div> },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 mr-2 animate-spin text-[#D4C5A9]" /> 
                <span className="text-stone-300">Loading project...</span>
            </div>
        );
    }
    
    if (!project) {
        return <div className="text-center text-stone-300">Project not found.</div>;
    }

    return (
        <div className="space-y-8 text-[#D4C5A9] min-h-screen bg-gray-900 p-6">
            <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center text-[#D4C5A9] hover:text-[#D4C5A9] transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to All Projects
                </Link>
            </div>

            <div className="space-y-4">
                <h1 className="text-6xl font-bold" style={{color: '#8B7355'}}>{project.name}</h1>
                <p className="text-stone-300 mt-1 text-lg">{project.client_info?.full_name || project.client_name} - {project.client_info?.address || project.address}</p>
            </div>

            <div className="border-b border-stone-700">
                <nav className="-mb-px flex flex-wrap space-x-4" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.name}
                                onClick={() => handleTabChange(tab.name)}
                                className={`whitespace-nowrap py-3 px-4 border-b-4 font-bold text-sm flex items-center space-x-2 rounded-t-lg transition-all ${
                                    activeTab === tab.name
                                        ? 'text-[#D4A574] border-[#D4A574]'
                                        : 'border-transparent text-[#D4C5A9] hover:text-[#D4A574] hover:border-[#B49B7E]'
                                }`}
                                style={activeTab === tab.name ? {
                                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                                  boxShadow: '0 0 20px rgba(212, 165, 116, 0.4), inset 0 0 35px rgba(212, 165, 116, 0.08)',
                                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(212, 165, 116, 0.5)'
                                } : {
                                  background: 'linear-gradient(135deg, rgba(15,15,25,0.8) 0%, rgba(35,35,45,0.7) 50%, rgba(15,15,25,0.8) 100%)'
                                }}
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