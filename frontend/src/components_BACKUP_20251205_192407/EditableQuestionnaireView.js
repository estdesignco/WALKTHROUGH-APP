import React from 'react';

const EditableQuestionnaireView = ({ project, editedProject, isEditing, onInputChange }) => {
    if (!project) return <div className="text-center text-stone-300 py-8">Loading...</div>;

    const displayProject = isEditing ? editedProject : project;

    return (
        <div className="space-y-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Client Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedProject?.client_info?.full_name || ''}
                            onChange={(e) => onInputChange('full_name', e.target.value, 'client_info')}
                            className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                        />
                    ) : (
                        <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gradient-to-r from-black/95 to-gray-900/90">
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
                            onChange={(e) => onInputChange('name', e.target.value)}
                            className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                        />
                    ) : (
                        <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gradient-to-r from-black/95 to-gray-900/90">
                            {project.name || 'Not provided'}
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Email</label>
                    {isEditing ? (
                        <input
                            type="email"
                            value={editedProject?.client_info?.email || ''}
                            onChange={(e) => onInputChange('email', e.target.value, 'client_info')}
                            className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                        />
                    ) : (
                        <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gradient-to-r from-black/95 to-gray-900/90">
                            {project.client_info?.email || 'Not provided'}
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Phone</label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={editedProject?.client_info?.phone || ''}
                            onChange={(e) => onInputChange('phone', e.target.value, 'client_info')}
                            className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                        />
                    ) : (
                        <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gradient-to-r from-black/95 to-gray-900/90">
                            {project.client_info?.phone || 'Not provided'}
                        </div>
                    )}
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#D4A574] mb-2">Address</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedProject?.client_info?.address || ''}
                            onChange={(e) => onInputChange('address', e.target.value, 'client_info')}
                            className="w-full p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gray-800"
                        />
                    ) : (
                        <div className="p-3 border border-[#D4A574]/50 rounded text-[#D4C5A9] bg-gradient-to-r from-black/95 to-gray-900/90">
                            {project.client_info?.address || 'Not provided'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(EditableQuestionnaireView);
