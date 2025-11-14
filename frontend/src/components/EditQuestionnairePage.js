import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const GOOGLE_MAPS_LIBRARIES = ['places'];

export default function EditQuestionnairePage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([{ name: '', role: '', phone: '' }]);
    const [autocompleteAddress, setAutocompleteAddress] = useState(null);
    const [autocompleteNewBuild, setAutocompleteNewBuild] = useState(null);
    const [autocompleteRenovation, setAutocompleteRenovation] = useState(null);
    
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    });
    
    useEffect(() => {
        loadData();
    }, [projectId]);
    
    const loadData = async () => {
        try {
            setLoading(true);
            const [projectRes, questionnaireRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/projects/${projectId}`),
                axios.get(`${BACKEND_URL}/api/questionnaire/${projectId}`)
            ]);
            
            setProject(projectRes.data);
            setAnswers(questionnaireRes.data.answers || {});
            
            if (questionnaireRes.data.answers?.new_build_other_team) {
                const parsed = questionnaireRes.data.answers.new_build_other_team.split('\\n').map(line => {
                    const parts = line.split('-').map(p => p.trim());
                    return { name: parts[0] || '', role: parts[1] || '', phone: parts[2] || '' };
                });
                setTeamMembers(parsed.length > 0 ? parsed : [{ name: '', role: '', phone: '' }]);
            }
        } catch (error) {
            console.error('Failed to load:', error);
            alert('Failed to load questionnaire data. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (field, value) => {
        if (field.includes('phone')) {
            const onlyNums = value.replace(/[^\\d]/g, '');
            if (onlyNums.length > 6) {
                value = `${onlyNums.slice(0,3)}-${onlyNums.slice(3,6)}-${onlyNums.slice(6,10)}`;
            } else if (onlyNums.length > 3) {
                value = `${onlyNums.slice(0,3)}-${onlyNums.slice(3)}`;
            } else {
                value = onlyNums;
            }
        }
        setAnswers(prev => ({ ...prev, [field]: value }));
    };
    
    const addTeamMember = () => {
        setTeamMembers([...teamMembers, { name: '', role: '', phone: '' }]);
    };
    
    const removeTeamMember = (index) => {
        setTeamMembers(teamMembers.filter((_, i) => i !== index));
    };
    
    const handleTeamChange = (index, field, value) => {
        const updated = [...teamMembers];
        if (field === 'phone') {
            const onlyNums = value.replace(/[^\\d]/g, '');
            if (onlyNums.length > 6) {
                value = `${onlyNums.slice(0,3)}-${onlyNums.slice(3,6)}-${onlyNums.slice(6,10)}`;
            } else if (onlyNums.length > 3) {
                value = `${onlyNums.slice(0,3)}-${onlyNums.slice(3)}`;
            } else {
                value = onlyNums;
            }
        }
        updated[index][field] = value;
        setTeamMembers(updated);
    };
    
    const handleSave = async () => {
        setSaving(true);
        try {
            const teamString = teamMembers.map(m => `${m.name} - ${m.role} - ${m.phone}`).join('\\n');
            const finalAnswers = { ...answers, new_build_other_team: teamString };
            
            await Promise.all([
                axios.put(`${BACKEND_URL}/api/projects/${projectId}`, {
                    name: answers.name || project.name,
                    client_info: {
                        full_name: answers.client_name || project.client_info?.full_name,
                        email: answers.email || project.client_info?.email,
                        phone: answers.phone || project.client_info?.phone,
                        address: answers.address || project.client_info?.address
                    }
                }),
                axios.post(`${BACKEND_URL}/api/questionnaire/${projectId}`, {
                    answers: finalAnswers,
                    completion_percentage: 100,
                    completed_at: new Date().toISOString()
                })
            ]);
            
            alert('✅ All changes saved successfully!');
            navigate(`/project/${projectId}?tab=Questionnaire`);
        } catch (error) {
            alert('❌ Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };
    
    const inputClass = "w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded focus:border-[#D4A574] focus:outline-none";
    const labelClass = "block text-[#D4A574] mb-2 font-semibold";
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A574] mb-4"></div>
                    <p className="text-[#D4A574] text-xl">Loading questionnaire data...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 border-b-4 border-[#D4A574] shadow-2xl rounded-t-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-[#D4A574] drop-shadow-lg" style={{textShadow: '0 0 20px rgba(212, 165, 116, 0.3)'}}>Edit Questionnaire Answers</h1>
                        <p className="text-[#D4C5A9] mt-2">Update any information below and save changes</p>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-b-xl border-2 border-[#D4A574]/30 shadow-2xl">
                    <div className="space-y-8">
                        <section className="border-b-2 border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">CLIENT INFORMATION</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Full Name *</label><input type="text" value={answers.client_name || ''} onChange={(e) => handleChange('client_name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Project Name *</label><input type="text" value={answers.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Email</label><input type="email" value={answers.email || ''} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Phone</label><input type="tel" value={answers.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                                <div><label className={labelClass}>Spouse/Partner Name</label><input type="text" value={answers.spouse_partner_name || ''} onChange={(e) => handleChange('spouse_partner_name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Spouse/Partner Phone</label><input type="tel" value={answers.spouse_partner_phone || ''} onChange={(e) => handleChange('spouse_partner_phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Project Address</label>
                                    {isLoaded ? (
                                        <Autocomplete onLoad={(auto) => setAutocompleteAddress(auto)} onPlaceChanged={() => { if (autocompleteAddress) { const place = autocompleteAddress.getPlace(); handleChange('address', place.formatted_address || ''); } }}>
                                            <input type="text" value={answers.address || ''} onChange={(e) => handleChange('address', e.target.value)} className={inputClass} placeholder="Start typing address..." />
                                        </Autocomplete>
                                    ) : (
                                        <input type="text" value={answers.address || ''} onChange={(e) => handleChange('address', e.target.value)} className={inputClass} />
                                    )}
                                </div>
                            </div>
                        </section>
                        
                        <section className="border-b-2 border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">NEW BUILD TEAM</h2>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div><label className={labelClass}>Architect Name</label><input type="text" value={answers.new_build_architect || ''} onChange={(e) => handleChange('new_build_architect', e.target.value)} className={inputClass} placeholder="Name" /></div>
                                <div><label className={labelClass}>Architect Phone</label><input type="tel" value={answers.new_build_architect_phone || ''} onChange={(e) => handleChange('new_build_architect_phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                                <div></div>
                                <div><label className={labelClass}>Builder Name</label><input type="text" value={answers.new_build_builder || ''} onChange={(e) => handleChange('new_build_builder', e.target.value)} className={inputClass} placeholder="Name" /></div>
                                <div><label className={labelClass}>Builder Phone</label><input type="tel" value={answers.new_build_builder_phone || ''} onChange={(e) => handleChange('new_build_builder_phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                            </div>
                            
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-[#D4A574]">Other Team Members (Electrician, Plumber, etc.)</h3>
                                    <button onClick={addTeamMember} className="px-4 py-2 bg-[#D4A574] hover:bg-[#BCA888] text-black rounded font-bold">+ Add Team Member</button>
                                </div>
                                {teamMembers.map((member, idx) => (
                                    <div key={idx} className="grid grid-cols-4 gap-4 mb-3">
                                        <input type="text" value={member.name} onChange={(e) => handleTeamChange(idx, 'name', e.target.value)} placeholder="Name" className={inputClass} />
                                        <input type="text" value={member.role} onChange={(e) => handleTeamChange(idx, 'role', e.target.value)} placeholder="Role (Electrician, Plumber)" className={inputClass} />
                                        <input type="tel" value={member.phone} onChange={(e) => handleTeamChange(idx, 'phone', e.target.value)} placeholder="XXX-XXX-XXXX" className={inputClass} />
                                        <button onClick={() => removeTeamMember(idx)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold">Remove</button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4">
                                <label className={labelClass}>New Build Address</label>
                                {isLoaded ? (
                                    <Autocomplete onLoad={(auto) => setAutocompleteNewBuild(auto)} onPlaceChanged={() => { if (autocompleteNewBuild) { const place = autocompleteNewBuild.getPlace(); handleChange('new_build_address', place.formatted_address || ''); } }}>
                                        <textarea value={answers.new_build_address || ''} onChange={(e) => handleChange('new_build_address', e.target.value)} rows={2} className={inputClass} placeholder="Start typing address..." />
                                    </Autocomplete>
                                ) : (
                                    <textarea value={answers.new_build_address || ''} onChange={(e) => handleChange('new_build_address', e.target.value)} rows={2} className={inputClass} />
                                )}
                            </div>
                        </section>
                        
                        <section className="border-b-2 border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">RENOVATION TEAM</h2>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div><label className={labelClass}>Architect Name</label><input type="text" value={answers.renovation_architect || ''} onChange={(e) => handleChange('renovation_architect', e.target.value)} className={inputClass} placeholder="Name" /></div>
                                <div><label className={labelClass}>Architect Phone</label><input type="tel" value={answers.renovation_architect_phone || ''} onChange={(e) => handleChange('renovation_architect_phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                                <div></div>
                                <div><label className={labelClass}>Builder Name</label><input type="text" value={answers.renovation_builder || ''} onChange={(e) => handleChange('renovation_builder', e.target.value)} className={inputClass} placeholder="Name" /></div>
                                <div><label className={labelClass}>Builder Phone</label><input type="tel" value={answers.renovation_builder_phone || ''} onChange={(e) => handleChange('renovation_builder_phone', e.target.value)} className={inputClass} placeholder="XXX-XXX-XXXX" /></div>
                            </div>
                            
                            <div className="mt-4">
                                <label className={labelClass}>Renovation Address</label>
                                {isLoaded ? (
                                    <Autocomplete onLoad={(auto) => setAutocompleteRenovation(auto)} onPlaceChanged={() => { if (autocompleteRenovation) { const place = autocompleteRenovation.getPlace(); handleChange('renovation_address', place.formatted_address || ''); } }}>
                                        <textarea value={answers.renovation_address || ''} onChange={(e) => handleChange('renovation_address', e.target.value)} rows={2} className={inputClass} placeholder="Start typing address..." />
                                    </Autocomplete>
                                ) : (
                                    <textarea value={answers.renovation_address || ''} onChange={(e) => handleChange('renovation_address', e.target.value)} rows={2} className={inputClass} />
                                )}
                            </div>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">DESIGN PREFERENCES</h2>
                            <div className="space-y-4">
                                <div><label className={labelClass}>What you love about current home</label><textarea value={answers.design_love_home || ''} onChange={(e) => handleChange('design_love_home', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Space usage</label><textarea value={answers.design_space_use || ''} onChange={(e) => handleChange('design_space_use', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Design styles you prefer</label><input type="text" value={answers.design_styles_preference || ''} onChange={(e) => handleChange('design_styles_preference', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>What you like about these styles</label><textarea value={answers.design_styles_love || ''} onChange={(e) => handleChange('design_styles_love', e.target.value)} rows={3} className={inputClass} /></div>
                            </div>
                        </section>
                    </div>
                    
                    <div className="flex gap-4 mt-8 pt-6 border-t-2 border-[#D4A574]/30">
                        <button onClick={() => navigate(`/project/${projectId}?tab=Questionnaire`)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-[#D4A574] to-[#BCA888] hover:from-[#E4B584] hover:to-[#C49564] text-black rounded-xl font-bold disabled:opacity-50 shadow-lg transition-all">{saving ? 'Saving...' : 'Save All Changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
