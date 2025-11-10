import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function EditQuestionnairePage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        loadProject();
    }, [projectId]);
    
    const loadProject = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}`);
            setProject(response.data);
            setFormData({
                client_name: response.data.client_info?.full_name || '',
                email: response.data.client_info?.email || '',
                phone: response.data.client_info?.phone || '',
                address: response.data.client_info?.address || '',
                project_name: response.data.name || ''
            });
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    };
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${BACKEND_URL}/api/projects/${projectId}`, {
                name: formData.project_name,
                client_info: {
                    full_name: formData.client_name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                }
            });
            alert('✅ Saved successfully!');
            navigate(`/project/${projectId}?tab=Questionnaire`);
        } catch (error) {
            alert('❌ Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] rounded-t-xl">
                    <h1 className="text-3xl font-bold text-[#D4A574]">Edit Questionnaire</h1>
                </div>
                
                <div className="bg-gray-900 p-8 rounded-b-xl border border-[#D4A574]/30">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[#D4A574] mb-2">Client Name</label>
                            <input
                                type="text"
                                value={formData.client_name}
                                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                                className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[#D4A574] mb-2">Project Name</label>
                            <input
                                type="text"
                                value={formData.project_name}
                                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                                className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[#D4A574] mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[#D4A574] mb-2">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[#D4A574] mb-2">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => navigate(`/project/${projectId}?tab=Questionnaire`)}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-[#D4A574] hover:bg-[#BCA888] text-black rounded font-bold disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
