import React, { useState, useEffect } from 'react';

const QuestionnaireView = ({ project }) => {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project?.questionnaire_answers) {
      setAnswers(project.questionnaire_answers);
    }
  }, [project]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveAnswers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${project.id}/questionnaire`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers })
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const questions = [
    { id: 'style_preference', text: 'What is your preferred interior design style?', type: 'text' },
    { id: 'budget_range', text: 'What is your budget range for this project?', type: 'select', options: ['$10k-25k', '$25k-50k', '$50k-100k', '$100k+'] },
    { id: 'timeline', text: 'What is your desired timeline for completion?', type: 'text' },
    { id: 'rooms_involved', text: 'Which rooms are involved in this project?', type: 'textarea' },
    { id: 'special_requirements', text: 'Any special requirements or considerations?', type: 'textarea' },
    { id: 'color_preferences', text: 'Do you have any color preferences?', type: 'text' },
    { id: 'functionality_needs', text: 'What are your main functionality needs?', type: 'textarea' }
  ];

  return (
    <div className="bg-stone-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Project Questionnaire</h2>
        <div className="flex items-center space-x-4">
          {saved && (
            <span className="text-green-400 text-sm">✓ Saved</span>
          )}
          <button
            onClick={saveAnswers}
            disabled={loading}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors duration-200"
          >
            {loading ? 'Saving...' : 'Save Answers'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="">
            <label className="block text-stone-300 font-medium mb-2">
              {question.text}
            </label>
            
            {question.type === 'text' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full p-3 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="Enter your answer..."
              />
            )}
            
            {question.type === 'select' && (
              <select
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full p-3 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select an option...</option>
                {question.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {question.type === 'textarea' && (
              <textarea
                rows={4}
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full p-3 bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500 resize-vertical"
                placeholder="Enter your answer..."
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-stone-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-stone-400">Name:</span>
            <span className="text-white ml-2">{project?.client_info?.full_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-stone-400">Email:</span>
            <span className="text-white ml-2">{project?.client_info?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-stone-400">Phone:</span>
            <span className="text-white ml-2">{project?.client_info?.phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-stone-400">Address:</span>
            <span className="text-white ml-2">{project?.client_info?.address || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireView;