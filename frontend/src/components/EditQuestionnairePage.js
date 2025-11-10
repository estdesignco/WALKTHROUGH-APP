import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function EditQuestionnairePage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        loadQuestionnaire();
    }, [projectId]);
    
    const loadQuestionnaire = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/questionnaire/${projectId}`);
            setAnswers(response.data.answers || {});
        } catch (error) {
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
            alert('✅ Saved!');
            navigate(`/project/${projectId}?tab=Questionnaire`);
        } catch (error) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setSaving(false);
        }
    };
    
    const inputClass = "w-full p-3 bg-gray-800 text-white border border-[#D4A574]/50 rounded";
    const labelClass = "block text-[#D4A574] mb-2 font-semibold";
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 border-b-4 border-[#D4A574] rounded-t-xl">
                    <h1 className="text-3xl font-bold text-[#D4A574]">Edit Questionnaire Answers</h1>
                </div>
                
                <div className="bg-gray-900 p-8 rounded-b-xl border border-[#D4A574]/30">
                    <div className="space-y-8">
                        {/* CLIENT INFORMATION */}
                        <section className="border-b border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">CLIENT INFORMATION</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Full Name *</label><input type="text" value={answers.client_name || ''} onChange={(e) => handleChange('client_name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Project Name *</label><input type="text" value={answers.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Email</label><input type="email" value={answers.email || ''} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Phone</label><input type="tel" value={answers.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Spouse/Partner Name</label><input type="text" value={answers.spouse_partner_name || ''} onChange={(e) => handleChange('spouse_partner_name', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Spouse/Partner Phone</label><input type="tel" value={answers.spouse_partner_phone || ''} onChange={(e) => handleChange('spouse_partner_phone', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Project Address</label><input type="text" value={answers.address || ''} onChange={(e) => handleChange('address', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Best Time to Call</label><input type="text" value={answers.best_time_to_call || ''} onChange={(e) => handleChange('best_time_to_call', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Worked with designer before?</label><textarea value={answers.worked_with_designer_before || ''} onChange={(e) => handleChange('worked_with_designer_before', e.target.value)} rows={3} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Primary decision maker(s)</label><input type="text" value={answers.primary_decision_maker || ''} onChange={(e) => handleChange('primary_decision_maker', e.target.value)} className={inputClass} /></div>
                            </div>
                        </section>
                        
                        {/* PROJECT SCOPE */}
                        <section className="border-b border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">PROJECT SCOPE</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Timeline</label><input type="text" value={answers.timeline || ''} onChange={(e) => handleChange('timeline', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Budget Range</label><input type="text" value={answers.budget_range || ''} onChange={(e) => handleChange('budget_range', e.target.value)} className={inputClass} /></div>
                            </div>
                        </section>
                        
                        {/* NEW BUILD */}
                        <section className="border-b border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">NEW BUILD</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className={labelClass}>New Build Address</label><textarea value={answers.new_build_address || ''} onChange={(e) => handleChange('new_build_address', e.target.value)} rows={2} className={inputClass} /></div>
                                <div><label className={labelClass}>Architect Name</label><input type="text" value={answers.new_build_architect || ''} onChange={(e) => handleChange('new_build_architect', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Architect Phone</label><input type="tel" value={answers.new_build_architect_phone || ''} onChange={(e) => handleChange('new_build_architect_phone', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Builder Name</label><input type="text" value={answers.new_build_builder || ''} onChange={(e) => handleChange('new_build_builder', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Builder Phone</label><input type="tel" value={answers.new_build_builder_phone || ''} onChange={(e) => handleChange('new_build_builder_phone', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Other Team Members</label><textarea value={answers.new_build_other_team || ''} onChange={(e) => handleChange('new_build_other_team', e.target.value)} rows={4} placeholder="Name - Role - Phone (one per line)" className={inputClass} /></div>
                            </div>
                        </section>
                        
                        {/* RENOVATION */}
                        <section className="border-b border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">RENOVATION</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className={labelClass}>Renovation Address</label><textarea value={answers.renovation_address || ''} onChange={(e) => handleChange('renovation_address', e.target.value)} rows={2} className={inputClass} /></div>
                                <div><label className={labelClass}>Builder Name</label><input type="text" value={answers.renovation_builder || ''} onChange={(e) => handleChange('renovation_builder', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Builder Phone</label><input type="tel" value={answers.renovation_builder_phone || ''} onChange={(e) => handleChange('renovation_builder_phone', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Architect Name</label><input type="text" value={answers.renovation_architect || ''} onChange={(e) => handleChange('renovation_architect', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Architect Phone</label><input type="tel" value={answers.renovation_architect_phone || ''} onChange={(e) => handleChange('renovation_architect_phone', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Other Team Members</label><textarea value={answers.renovation_other_team || ''} onChange={(e) => handleChange('renovation_other_team', e.target.value)} rows={4} placeholder="Name - Role - Phone (one per line)" className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Existing Condition</label><textarea value={answers.renovation_existing_condition || ''} onChange={(e) => handleChange('renovation_existing_condition', e.target.value)} rows={3} className={inputClass} /></div>
                            </div>
                        </section>
                        
                        {/* DESIGN PREFERENCES */}
                        <section className="border-b border-[#D4A574]/30 pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">DESIGN PREFERENCES</h2>
                            <div className="space-y-4">
                                <div><label className={labelClass}>What do you love about your current home?</label><textarea value={answers.design_love_home || ''} onChange={(e) => handleChange('design_love_home', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>How will spaces be used?</label><textarea value={answers.design_space_use || ''} onChange={(e) => handleChange('design_space_use', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>First impression you want?</label><textarea value={answers.design_first_impression || ''} onChange={(e) => handleChange('design_first_impression', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Color palette you love?</label><input type="text" value={answers.design_common_color_palette || ''} onChange={(e) => handleChange('design_common_color_palette', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Colors you dislike?</label><input type="text" value={answers.design_disliked_colors || ''} onChange={(e) => handleChange('design_disliked_colors', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Design styles you prefer?</label><input type="text" value={answers.design_styles_preference || ''} onChange={(e) => handleChange('design_styles_preference', e.target.value)} placeholder="Modern, Traditional, etc." className={inputClass} /></div>
                                <div><label className={labelClass}>What you like about these styles?</label><textarea value={answers.design_styles_love || ''} onChange={(e) => handleChange('design_styles_love', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Meaningful item story</label><textarea value={answers.design_meaningful_item || ''} onChange={(e) => handleChange('design_meaningful_item', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Existing furniture to keep</label><textarea value={answers.design_existing_furniture || ''} onChange={(e) => handleChange('design_existing_furniture', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Special requirements</label><textarea value={answers.design_special_requirements || ''} onChange={(e) => handleChange('design_special_requirements', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Pinterest/Houzz accounts</label><input type="text" value={answers.design_pinterest_houzz || ''} onChange={(e) => handleChange('design_pinterest_houzz', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Additional comments</label><textarea value={answers.design_additional_comments || ''} onChange={(e) => handleChange('design_additional_comments', e.target.value)} rows={4} className={inputClass} /></div>
                            </div>
                        </section>
                        
                        {/* GETTING TO KNOW YOU */}
                        <section className="pb-6">
                            <h2 className="text-2xl font-bold text-[#D4A574] mb-4">GETTING TO KNOW YOU</h2>
                            <div className="space-y-4">
                                <div><label className={labelClass}>Who lives in household?</label><input type="text" value={answers.know_you_household || ''} onChange={(e) => handleChange('know_you_household', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Pets?</label><input type="text" value={answers.know_you_pets || ''} onChange={(e) => handleChange('know_you_pets', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Typical weekday</label><textarea value={answers.know_you_weekday_routine || ''} onChange={(e) => handleChange('know_you_weekday_routine', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Typical weekend</label><textarea value={answers.know_you_weekend_routine || ''} onChange={(e) => handleChange('know_you_weekend_routine', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Lighting preferences</label><input type="text" value={answers.know_you_lighting_preference || ''} onChange={(e) => handleChange('know_you_lighting_preference', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Entertaining style</label><input type="text" value={answers.know_you_entertaining_style || ''} onChange={(e) => handleChange('know_you_entertaining_style', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Relax space</label><input type="text" value={answers.know_you_relax_space || ''} onChange={(e) => handleChange('know_you_relax_space', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Future plans (5-10 years)</label><textarea value={answers.know_you_future_plans || ''} onChange={(e) => handleChange('know_you_future_plans', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Hobbies</label><textarea value={answers.know_you_hobbies || ''} onChange={(e) => handleChange('know_you_hobbies', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>What makes you HAPPY?</label><textarea value={answers.know_you_happy || ''} onChange={(e) => handleChange('know_you_happy', e.target.value)} rows={3} className={inputClass} /></div>
                                <div><label className={labelClass}>Family Birthdays</label><input type="text" value={answers.know_you_family_birthdays || ''} onChange={(e) => handleChange('know_you_family_birthdays', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Anniversary</label><input type="text" value={answers.know_you_anniversary || ''} onChange={(e) => handleChange('know_you_anniversary', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Family activities together</label><input type="text" value={answers.know_you_family_together || ''} onChange={(e) => handleChange('know_you_family_together', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Favorite restaurant</label><input type="text" value={answers.know_you_favorite_restaurant || ''} onChange={(e) => handleChange('know_you_favorite_restaurant', e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>Favorite vacation spot</label><input type="text" value={answers.know_you_favorite_vacation || ''} onChange={(e) => handleChange('know_you_favorite_vacation', e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Favorite foods/drinks</label><textarea value={answers.know_you_favorite_foods || ''} onChange={(e) => handleChange('know_you_favorite_foods', e.target.value)} rows={3} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Space you gravitate toward after long day</label><textarea value={answers.know_you_evoke_space || ''} onChange={(e) => handleChange('know_you_evoke_space', e.target.value)} rows={3} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>How home should support social life</label><textarea value={answers.know_you_support_social_life || ''} onChange={(e) => handleChange('know_you_support_social_life', e.target.value)} rows={3} className={inputClass} /></div>
                                <div className="col-span-2"><label className={labelClass}>Anything else to share?</label><textarea value={answers.know_you_share_more || ''} onChange={(e) => handleChange('know_you_share_more', e.target.value)} rows={4} className={inputClass} /></div>
                            </div>
                        </section>
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
