import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const QuestionnaireSheet = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentSection, setCurrentSection] = useState(0);

  const questionSections = [
    {
      title: "Client Information & Preferences",
      questions: [
        {
          id: "lifestyle",
          type: "radio",
          question: "How would you describe your lifestyle?",
          options: ["Formal & Traditional", "Casual & Relaxed", "Modern & Minimalist", "Eclectic & Artistic"]
        },
        {
          id: "entertaining",
          type: "radio", 
          question: "How often do you entertain guests?",
          options: ["Frequently (weekly)", "Occasionally (monthly)", "Rarely (holidays only)", "Never"]
        },
        {
          id: "color_preferences",
          type: "checkbox",
          question: "What colors appeal to you? (Select all that apply)",
          options: ["Warm neutrals (beiges, creams)", "Cool neutrals (grays, whites)", "Bold colors (jewel tones)", "Earth tones (browns, greens)", "Monochromatic (black & white)"]
        },
        {
          id: "budget_priority",
          type: "radio",
          question: "What's your budget priority?",
          options: ["Quality over quantity", "Balance of both", "Value and savings", "Luxury regardless of cost"]
        }
      ]
    },
    {
      title: "Functional Requirements",
      questions: [
        {
          id: "storage_needs",
          type: "checkbox",
          question: "What storage needs do you have?",
          options: ["Books & media", "Clothing & accessories", "Dishes & kitchenware", "Office supplies", "Children's toys", "Art & collectibles"]
        },
        {
          id: "technology_needs",
          type: "checkbox",
          question: "What technology integration do you need?",
          options: ["Smart home automation", "Built-in charging stations", "Hidden cable management", "Multi-room audio", "Home theater", "Security systems"]
        },
        {
          id: "accessibility",
          type: "radio",
          question: "Do you have any accessibility requirements?",
          options: ["None needed", "Wheelchair accessibility", "Aging in place features", "Child safety considerations", "Pet-friendly design"]
        }
      ]
    },
    {
      title: "Style & Aesthetic Preferences", 
      questions: [
        {
          id: "design_style",
          type: "radio",
          question: "Which design style resonates with you most?",
          options: ["Traditional", "Contemporary", "Transitional", "Modern Farmhouse", "Industrial", "Scandinavian", "Mediterranean", "Eclectic"]
        },
        {
          id: "texture_preferences", 
          type: "checkbox",
          question: "What textures do you gravitate toward?",
          options: ["Smooth & sleek", "Natural & organic", "Soft & cozy", "Rough & industrial", "Luxurious & plush"]
        },
        {
          id: "pattern_tolerance",
          type: "radio",
          question: "How do you feel about patterns?",
          options: ["Love bold patterns", "Prefer subtle patterns", "Minimal patterns only", "No patterns - solid colors only"]
        }
      ]
    },
    {
      title: "Room-Specific Requirements",
      questions: [
        {
          id: "kitchen_priorities",
          type: "checkbox", 
          question: "Kitchen priorities (if applicable):",
          options: ["Cooking & meal prep", "Entertaining & hosting", "Family gathering space", "Storage & organization", "High-end appliances", "Easy maintenance"]
        },
        {
          id: "bedroom_priorities",
          type: "checkbox",
          question: "Primary bedroom priorities:",
          options: ["Relaxation & comfort", "Storage solutions", "Work/office space", "Reading nook", "Exercise area", "Luxury amenities"]
        },
        {
          id: "living_priorities",
          type: "checkbox",
          question: "Living room priorities:",
          options: ["TV & entertainment", "Conversation & socializing", "Reading & quiet time", "Playing & family time", "Formal presentations", "Flexible multi-use"]
        }
      ]
    }
  ];

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadExistingAnswers();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`https://designflow-24.preview.emergentagent.com/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadExistingAnswers = async () => {
    try {
      // Load any existing questionnaire answers
      const response = await fetch(`https://designflow-24.preview.emergentagent.com/api/questionnaire/${projectId}`);
      if (response.ok) {
        const existingAnswers = await response.json();
        setAnswers(existingAnswers.answers || {});
      }
    } catch (error) {
      console.log('No existing questionnaire found - starting fresh');
    }
  };

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(value)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(item => item !== value)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, value]
          };
        }
      } else {
        return {
          ...prev,
          [questionId]: value
        };
      }
    });
  };

  const saveAnswers = async () => {
    try {
      const response = await fetch(`https://designflow-24.preview.emergentagent.com/api/questionnaire/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          answers: answers,
          completed_at: new Date().toISOString(),
          completion_percentage: calculateCompletionPercentage()
        })
      });

      if (response.ok) {
        console.log('✅ Questionnaire saved successfully');
        return true;
      } else {
        console.error('❌ Failed to save questionnaire');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving questionnaire:', error);
      return false;
    }
  };

  const calculateCompletionPercentage = () => {
    const totalQuestions = questionSections.reduce((total, section) => total + section.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  const generateWalkthroughPriorities = () => {
    // Generate walkthrough priorities based on questionnaire answers
    const priorities = [];

    if (answers.storage_needs?.length > 0) {
      priorities.push("Focus on storage solutions in walkthrough");
    }
    
    if (answers.technology_needs?.length > 0) {
      priorities.push("Document electrical and technology requirements");
    }

    if (answers.entertaining === "Frequently (weekly)") {
      priorities.push("Measure entertaining spaces carefully");
    }

    if (answers.accessibility && answers.accessibility !== "None needed") {
      priorities.push("Document accessibility requirements and measurements");
    }

    return priorities;
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Questionnaire...</p>
        </div>
      </div>
    );
  }

  const currentQuestionSection = questionSections[currentSection];
  const isLastSection = currentSection === questionSections.length - 1;
  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="max-w-full mx-auto bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p className="text-gray-300">Client Questionnaire & Discovery</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
            <span>📋</span>
            <span className="font-semibold">Questionnaire</span>
          </div>
          <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>🚶</span>
            <span>Walkthrough</span>
          </a>
          <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>✅</span>
            <span>Checklist</span>
          </a>
          <a href={`/project/${projectId}/ffe`} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <span>📊</span>
            <span>FF&E</span>
          </a>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questionnaire Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {currentQuestionSection.title}
            </h2>
            <span className="text-gray-400 text-sm">
              Section {currentSection + 1} of {questionSections.length}
            </span>
          </div>

          <div className="space-y-8">
            {currentQuestionSection.questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  {index + 1}. {question.question}
                </h3>

                <div className="space-y-3">
                  {question.type === 'radio' && question.options.map(option => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                      />
                      <span className="text-gray-300">{option}</span>
                    </label>
                  ))}

                  {question.type === 'checkbox' && question.options.map(option => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        value={option}
                        checked={(answers[question.id] || []).includes(option)}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value, true)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="text-gray-300">{option}</span>
                    </label>
                  ))}

                  {question.type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600"
                      rows="4"
                      placeholder="Please provide details..."
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 py-2 rounded"
            >
              ← Previous
            </button>

            <button
              onClick={saveAnswers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              💾 Save Progress
            </button>

            {!isLastSection ? (
              <button
                onClick={() => setCurrentSection(Math.min(questionSections.length - 1, currentSection + 1))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={async () => {
                  const saved = await saveAnswers();
                  if (saved) {
                    alert('Questionnaire completed! Ready to proceed to Walkthrough.');
                    // Navigate to walkthrough
                    window.location.href = `/project/${projectId}/walkthrough`;
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold"
                style={{ backgroundColor: '#8b7355' }}
              >
                Complete → Start Walkthrough
              </button>
            )}
          </div>
        </div>

        {/* Walkthrough Preparation Panel */}
        {completionPercentage > 70 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-4">Walkthrough Preparation</h3>
            <p className="text-gray-300 mb-4">
              Based on your answers, here's what to focus on during the walkthrough:
            </p>
            <ul className="space-y-2">
              {generateWalkthroughPriorities().map((priority, index) => (
                <li key={index} className="flex items-center space-x-2 text-gray-300">
                  <span className="text-green-400">✓</span>
                  <span>{priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireSheet;