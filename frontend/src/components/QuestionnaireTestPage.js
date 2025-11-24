import React, { useState } from 'react';

export default function QuestionnaireTestPage() {
    const [formData, setFormData] = useState({
        client_name: '',
        email: '',
        phone: '',
        design_love_home: '',
        know_you_household: '',
        rooms_involved: [],
        budget_range: '',
        involvement_level: ''
    });

    const handleChange = (field, value) => {
        console.log(`Field changed: ${field} =`, value);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckbox = (room, checked) => {
        if (checked) {
            setFormData(prev => ({ ...prev, rooms_involved: [...prev.rooms_involved, room] }));
        } else {
            setFormData(prev => ({ ...prev, rooms_involved: prev.rooms_involved.filter(r => r !== room) }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('FORM SUBMITTED:', formData);
        alert('Form Data: ' + JSON.stringify(formData, null, 2));
    };

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-2xl mx-auto bg-gray-900 p-8 rounded-lg">
                <h1 className="text-3xl text-white mb-8">Questionnaire Test Page</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Text Inputs */}
                    <div>
                        <label className="text-white block mb-2">Client Name</label>
                        <input
                            type="text"
                            value={formData.client_name}
                            onChange={(e) => handleChange('client_name', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded"
                        />
                    </div>

                    <div>
                        <label className="text-white block mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded"
                        />
                    </div>

                    <div>
                        <label className="text-white block mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded"
                        />
                    </div>

                    {/* Textarea Test */}
                    <div>
                        <label className="text-white block mb-2">What do you LOVE about your home?</label>
                        <textarea
                            value={formData.design_love_home}
                            onChange={(e) => handleChange('design_love_home', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded min-h-[100px]"
                        />
                    </div>

                    <div>
                        <label className="text-white block mb-2">Tell us about your household</label>
                        <textarea
                            value={formData.know_you_household}
                            onChange={(e) => handleChange('know_you_household', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded min-h-[100px]"
                        />
                    </div>

                    {/* Select Dropdown Test */}
                    <div>
                        <label className="text-white block mb-2">Budget Range</label>
                        <select
                            value={formData.budget_range}
                            onChange={(e) => handleChange('budget_range', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded"
                        >
                            <option value="">Select...</option>
                            <option value="35k-65k">$35k - $65k</option>
                            <option value="125k-500k">$125k - $500k</option>
                            <option value="600k-1M">$600k - $1M</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-white block mb-2">Involvement Level</label>
                        <select
                            value={formData.involvement_level}
                            onChange={(e) => handleChange('involvement_level', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded"
                        >
                            <option value="">Select...</option>
                            <option value="Very involved">Very involved</option>
                            <option value="Somewhat involved">Somewhat involved</option>
                            <option value="Minimally involved">Minimally involved</option>
                        </select>
                    </div>

                    {/* Checkbox Test */}
                    <div>
                        <label className="text-white block mb-4">Rooms Involved</label>
                        <div className="space-y-2">
                            {['Living Room', 'Kitchen', 'Primary Bedroom', 'Dining Room'].map(room => (
                                <div key={room} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={room}
                                        checked={formData.rooms_involved.includes(room)}
                                        onChange={(e) => handleCheckbox(room, e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor={room} className="text-white">{room}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
                    >
                        Submit Test
                    </button>
                </form>

                <div className="mt-8 p-4 bg-gray-800 rounded">
                    <h2 className="text-white text-xl mb-4">Current Form Data:</h2>
                    <pre className="text-green-400 text-sm overflow-auto">
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
