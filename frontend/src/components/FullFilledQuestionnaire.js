import React, { useState } from 'react';
import CompletePageLayout from './CompletePageLayout';

const FullFilledQuestionnaire = ({ project, projectId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(project || {});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const Section = ({ title, description, children }) => (
        <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
             style={{
               background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
             }}>
            <h3 className="text-xl font-bold text-[#D4A574] mb-2">{title}</h3>
            {description && <p className="text-[#D4C5A9]/80 mb-4 text-sm">{description}</p>}
            <div className="space-y-4" style={{
                background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(45,45,55,0.9) 30%, rgba(25,25,35,0.95) 70%, rgba(15,15,25,0.95) 100%)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(212, 165, 116, 0.3)'
            }}>
                {children}
            </div>
        </div>
    );

    const Field = ({ label, value, type = "text", isTextArea = false, options = [], index = 0 }) => (
        <div style={{ 
            background: index % 2 === 0 
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(212, 165, 116, 0.3)',
            marginBottom: '0.5rem'
        }}>
            <label className="block text-sm font-medium text-[#D4A574] mb-2">{label}</label>
            {isTextArea ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => isEditing && handleChange(label.toLowerCase().replace(/\s+/g, '_'), e.target.value)}
                    readOnly={!isEditing}
                    className="w-full p-3 bg-gray-900/50 border border-[#D4A574]/50 rounded text-[#D4A574] min-h-[80px] focus:border-[#D4A574] focus:outline-none"
                />
            ) : type === "select" ? (
                <select
                    value={value || ''}
                    onChange={(e) => isEditing && handleChange(label.toLowerCase().replace(/\s+/g, '_'), e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 bg-gray-900/50 border border-[#D4A574]/50 rounded text-[#D4A574] focus:border-[#D4A574] focus:outline-none"
                >
                    <option value="">Select...</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => isEditing && handleChange(label.toLowerCase().replace(/\s+/g, '_'), e.target.value)}
                    readOnly={!isEditing}
                    className="w-full p-3 bg-gray-900/50 border border-[#D4A574]/50 rounded text-[#D4A574] focus:border-[#D4A574] focus:outline-none"
                />
            )}
        </div>
    );

    return (
        <CompletePageLayout 
            projectId={projectId || project?.id}
            activeTab="questionnaire"
            title="COMPREHENSIVE CLIENT QUESTIONNAIRE"
            hideNavigation={false}
        >
            {/* Header Container with Luxurious Gradient */}
            <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60 mb-6" 
                 style={{
                   background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                 }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#D4A574]">COMPREHENSIVE CLIENT QUESTIONNAIRE</h2>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-gradient-to-r from-[#D4A574] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-4 py-2 rounded text-[#0F172A] font-medium transition-all duration-200 border border-[#D4A574]/30 shadow-lg"
                    >
                        {isEditing ? 'Save Changes' : 'Edit Answers'}
                    </button>
                </div>
            </div>

            {/* Section 1: Client Information */}
            <Section title="CLIENT INFORMATION">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" value={project?.client_info?.full_name} />
                    <Field label="Project Name" value={project?.name} />
                    <Field label="Email Address" value={project?.client_info?.email} type="email" />
                    <Field label="Phone Number" value={project?.client_info?.phone} type="tel" />
                </div>
                <Field label="Project Address" value={project?.client_info?.address} isTextArea />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field 
                        label="Preferred Method of Communication" 
                        value={project?.contact_preferences} 
                    />
                    <Field label="Best Time to Call" value={project?.best_time_to_call} />
                </div>
                <Field 
                    label="Have you worked with a designer before? If not, what are your hesitations?" 
                    value={project?.worked_with_designer_before} 
                    isTextArea 
                />
                <Field label="Who will be the primary decision maker(s) for this project?" value={project?.primary_decision_maker} />
                <Field 
                    label="How involved would you like to be in the design process?" 
                    value={project?.involvement_level} 
                    type="select"
                    options={[
                        "Very involved - I want to approve every detail",
                        "Somewhat involved - I want to approve major decisions", 
                        "Minimally involved - I trust your expertise"
                    ]}
                />
                <Field 
                    label="What is your ideal sofa price point?" 
                    value={project?.ideal_sofa_price} 
                    type="select"
                    options={["$2,000-$4,000", "$4,000-$8,000", "$8,000-$12,000", "$12,000+"]}
                />
            </Section>

            {/* Section 2: Total Scope of Work */}
            <Section title="TOTAL SCOPE OF WORK FOR YOUR PROJECT" description="Please take a moment and think which project best fits your needs and answer the appropriate questions below. (New build, Renovation, Furniture Refresh) And don't forget the ROOMS section, even if you are Building!">
                <Field 
                    label="What type of property is this?" 
                    value={project?.property_type} 
                    type="select"
                    options={["Primary Residence", "Vacation Home", "Rental Property", "Commercial Space", "Other"]}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Desired timeline for project completion" value={project?.timeline} />
                    <Field 
                        label="Investment / Budget Range" 
                        value={project?.budget_range} 
                        type="select"
                        options={["$35k - $65k", "$75k - $100k", "$125k - $500k", "$600k - $1M", "$2M - $5M", "$7M - $10M", "Other"]}
                    />
                </div>
                <Field label="What is your priority for this project? (Check all that apply)" value={project?.project_priority} isTextArea />
            </Section>

            {/* Section 3: Type of Project */}
            <Section title="TYPE OF PROJECT" description="Tell us more about your project and what you would love to accomplish, and how we can best partner with you!">
                <Field 
                    label="Project Type" 
                    value={project?.project_type} 
                    type="select"
                    options={["New Build", "Renovation", "Furniture Refresh"]}
                />
                
                {project?.project_type === "New Build" && (
                    <div className="mt-4 p-4 bg-stone-700 rounded">
                        <h4 className="text-lg font-semibold text-[#8B7355] mb-3">NEW BUILD</h4>
                        <div className="space-y-4">
                            <Field label="Are you currently working with an architect?" value={project?.new_build_architect} />
                            <Field label="Are you currently working with a builder?" value={project?.new_build_builder} />
                            <Field label="What is the approx square footage of your home?" value={project?.new_build_square_footage} />
                        </div>
                    </div>
                )}

                {project?.project_type === "Renovation" && (
                    <div className="mt-4 p-4 bg-stone-700 rounded">
                        <h4 className="text-lg font-semibold text-[#8B7355] mb-3">RENOVATION</h4>
                        <div className="space-y-4">
                            <Field label="Are you currently working with an architect?" value={project?.renovation_architect} />
                            <Field label="Are you currently working with a builder?" value={project?.renovation_builder} />
                            <Field label="What is the approx square footage being renovated?" value={project?.renovation_square_footage} />
                            <Field label="Are you changing the footprint/layout?" value={project?.renovation_layout_change} />
                        </div>
                    </div>
                )}

                {project?.project_type === "Furniture Refresh" && (
                    <div className="mt-4 p-4 bg-stone-700 rounded">
                        <h4 className="text-lg font-semibold text-[#8B7355] mb-3">FURNITURE REFRESH</h4>
                        <div className="space-y-4">
                            <Field label="What is the approx square footage being refreshed?" value={project?.furniture_refresh_square_footage} />
                            <Field label="Are you keeping any existing pieces?" value={project?.furniture_refresh_keeping_pieces} isTextArea />
                        </div>
                    </div>
                )}
            </Section>

            {/* Section 4: Design Questions */}
            <Section title="DESIGN QUESTIONS">
                <div className="space-y-4">
                    <Field label="Describe your style in 3 words" value={project?.design_style_words} />
                    <Field label="What colors do you gravitate towards?" value={project?.design_preferred_colors} />
                    <Field label="What colors do you dislike?" value={project?.design_disliked_colors} />
                    <Field label="Preferred Palette" value={project?.design_preferred_palette} />
                    <Field label="Do you like artwork? What type?" value={project?.design_artwork_preference} isTextArea />
                    <Field label="What design styles do you like?" value={project?.design_styles_preference} isTextArea />
                    <Field label="What design styles do you NOT like?" value={project?.design_styles_dislike} isTextArea />
                    <Field label="Do you like patterns/textures? What kind?" value={project?.finishes_patterns_preference} isTextArea />
                </div>
            </Section>

            {/* Section 5: Getting to Know You Better */}
            <Section title="GETTING TO KNOW YOU BETTER..." description="We want to get to know you better so we can serve you in the best way possible! We not only want to help design your home, but want your experience with us to be tailor-made JUST FOR YOU!">
                <div className="space-y-4">
                    <Field label="Tell us about your family" value={project?.family_info} isTextArea />
                    <Field label="Do you have pets?" value={project?.pets_info} />
                    <Field label="How do you like to entertain?" value={project?.entertaining_style} isTextArea />
                    <Field label="What are your hobbies?" value={project?.hobbies} isTextArea />
                    <Field label="What is your lifestyle like?" value={project?.lifestyle} isTextArea />
                    <Field label="Any special requests or needs?" value={project?.special_requests} isTextArea />
                </div>
            </Section>

            {/* Section 6: How Did You Hear About Us */}
            <Section title="HOW DID YOU HEAR ABOUT US AND HOW TO STAY IN TOUCH">
                <div className="space-y-4">
                    <Field label="How did you hear about us?" value={project?.how_heard_about_us} />
                    <Field label="Would you like to receive our newsletter?" value={project?.newsletter_signup} type="select" options={["Yes", "No"]} />
                    <Field label="Social media preferences" value={project?.social_media_preferences} />
                </div>
            </Section>

            {/* Section 7: Rooms */}
            <Section title="PROJECT ROOMS" description="Rooms that will be included in your project spreadsheets">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {project?.rooms?.map((room, index) => (
                        <div key={room.id || index} className="p-3 bg-stone-700 rounded border border-stone-600">
                            <h4 className="font-semibold text-[#8B7355]">{room.name}</h4>
                            {room.description && <p className="text-sm text-stone-400 mt-1">{room.description}</p>}
                        </div>
                    )) || (
                        <p className="text-stone-400 col-span-full">No rooms specified</p>
                    )}
                </div>
            </Section>

            {isEditing && (
                <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#D4A574]/60" 
                     style={{
                       background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                     }}>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                // Here you would save the data to the backend
                                console.log('Saving questionnaire data:', formData);
                            }}
                            className="bg-gradient-to-r from-[#D4A574] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded text-[#0F172A] font-medium transition-all duration-200 border border-[#D4A574]/30 shadow-lg"
                        >
                            Save All Changes
                        </button>
                    </div>
                </div>
            )}
        </CompletePageLayout>
    );
};

export default FullFilledQuestionnaire;