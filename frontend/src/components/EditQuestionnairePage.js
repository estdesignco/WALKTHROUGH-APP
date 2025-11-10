import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function EditQuestionnairePage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [questionnaire, setQuestionnaire] = useState(null);
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        loadQuestionnaire();
    }, [projectId]);
    
    const loadQuestionnaire = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/questionnaire/${projectId}`);
            setQuestionnaire(response.data);
            setAnswers(response.data.answers || {});
        } catch (error) {
            console.error('Failed to load questionnaire:', error);
            setAnswers({});
        }
    };
    
    const handleChange = (field, value) => {
        setAnswers(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${BACKEND_URL}/api/questionnaire/${projectId}`, {
                answers: answers,
                completion_percentage: 100,
                completed_at: new Date().toISOString()
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
            <div className="max-w-6xl mx-auto">
                <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] rounded-t-xl">
                    <h1 className="text-3xl font-bold text-[#D4A574]">Edit Questionnaire Answers</h1>
                </div>
                
                <div className="bg-gray-900 p-8 rounded-b-xl border border-[#D4A574]/30">
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[#D4A574] mb-2">Client Name</label><input type="text" value={answers.client_name || ''} onChange={(e) => handleChange('client_name', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Email</label><input type="email" value={answers.email || ''} onChange={(e) => handleChange('email', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Phone</label><input type="tel" value={answers.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Timeline</label><input type="text" value={answers.timeline || ''} onChange={(e) => handleChange('timeline', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div className="col-span-2"><label className="block text-[#D4A574] mb-2">Address</label><input type="text" value={answers.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Architect Name</label><input type="text" value={answers.new_build_architect || ''} onChange={(e) => handleChange('new_build_architect', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Architect Phone</label><input type="tel" value={answers.new_build_architect_phone || ''} onChange={(e) => handleChange('new_build_architect_phone', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Builder Name</label><input type="text" value={answers.new_build_builder || ''} onChange={(e) => handleChange('new_build_builder', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Builder Phone</label><input type="tel" value={answers.new_build_builder_phone || ''} onChange={(e) => handleChange('new_build_builder_phone', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Spouse/Partner Name</label><input type="text" value={answers.spouse_partner_name || ''} onChange={(e) => handleChange('spouse_partner_name', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div><label className="block text-[#D4A574] mb-2">Spouse/Partner Phone</label><input type="tel" value={answers.spouse_partner_phone || ''} onChange={(e) => handleChange('spouse_partner_phone', e.target.value)} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div className="col-span-2"><label className="block text-[#D4A574] mb-2">Design Preferences</label><textarea value={answers.design_styles_love || ''} onChange={(e) => handleChange('design_styles_love', e.target.value)} rows={4} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                            <div className="col-span-2"><label className="block text-[#D4A574] mb-2">Special Requirements</label><textarea value={answers.design_special_requirements || ''} onChange={(e) => handleChange('design_special_requirements', e.target.value)} rows={4} className="w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded" /></div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => navigate(`/project/${projectId}?tab=Questionnaire`)} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-[#D4A574] hover:bg-[#BCA888] text-black rounded font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Save All Changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
