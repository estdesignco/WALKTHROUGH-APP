import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CompletePageLayout from './CompletePageLayout';

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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/projects/${projectId}`);
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/questionnaire/${projectId}`);
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/questionnaire/${projectId}`, {
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
    <CompletePageLayout 
      projectId={projectId}
      activeTab="questionnaire"
      title="CLIENT QUESTIONNAIRE & DISCOVERY"
      hideNavigation={false}
    >
      {/* Progress Bar Container */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-sm text-[#F5F5DC]/80 mb-2">
            <span>Progress</span>
            <span>{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 border border-[#B49B7E]/20">
            <div 
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questionnaire Content Container */}
      <div className="rounded-2xl shadow-xl backdrop-blur-sm p-8 border border-[#B49B7E]/20 mb-6" 
           style={{
             background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
           }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#F5F5DC]">
            {currentQuestionSection.title}
          </h2>
          <span className="text-[#B49B7E] text-sm font-medium">
            Section {currentSection + 1} of {questionSections.length}
          </span>
        </div>

        <div className="w-full overflow-x-auto" style={{ backgroundColor: '#0F172A', touchAction: 'pan-x' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', minWidth: '1200px' }}>
            <div className="w-full" style={{ touchAction: 'pan-x pan-y' }}>
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  {currentQuestionSection.questions.map((question, index) => (
                    <tr key={question.id} style={{ 
                      background: index % 2 === 0 
                        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)'
                    }}>
                      <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm" style={{minWidth: '300px'}}>
                        {index + 1}. {question.question}
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-[#D4C5A9] text-sm">
                        {question.type === 'radio' && (
                          <div className="space-y-2">
                            {question.options.map(option => (
                              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="w-3 h-3 text-[#D4A574]"
                                />
                                <span className="text-[#D4C5A9] text-sm">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'checkbox' && (
                          <div className="space-y-2">
                            {question.options.map(option => (
                              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={option}
                                  checked={(answers[question.id] || []).includes(option)}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value, true)}
                                  className="w-3 h-3 text-[#D4A574]"
                                />
                                <span className="text-[#D4C5A9] text-sm">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'text' && (
                          <textarea
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full bg-transparent border-0 text-[#D4C5A9] text-sm focus:outline-none resize-none"
                            rows="3"
                            placeholder="Please provide details..."
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="bg-[#8B4444]/80 hover:bg-[#8B4444] disabled:bg-gray-800/50 disabled:text-[#F5F5DC]/30 text-[#F5F5DC] px-6 py-2 rounded border border-[#B49B7E]/20"
          >
            ← Previous
          </button>
          
          {currentSection < questionSections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(Math.min(questionSections.length - 1, currentSection + 1))}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-black px-6 py-2 rounded border border-[#B49B7E]/20"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={async () => {
                const saved = await saveAnswers();
                if (saved) {
                  alert('Questionnaire completed and saved!');
                }
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-[#F5F5DC] px-8 py-2 rounded border border-[#B49B7E]/20"
            >
              Complete Questionnaire
            </button>
          )}
        </div>
      </div>

      {/* Walkthrough Preparation (if completed) */}
      {completionPercentage === 100 && (
        <div className="rounded-2xl shadow-xl backdrop-blur-sm p-6 border border-[#B49B7E]/20" 
             style={{
               background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
             }}>
          <h3 className="text-lg font-bold text-[#F5F5DC] mb-4">Walkthrough Preparation</h3>
          <p className="text-[#F5F5DC]/80 mb-4">
            Based on your answers, here's what to focus on during the walkthrough:
          </p>
          <ul className="space-y-2">
            {generateWalkthroughPriorities().map((priority, index) => (
              <li key={index} className="flex items-center space-x-2 text-[#F5F5DC]/90">
                <span className="text-[#B49B7E]">✓</span>
                <span>{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CompletePageLayout>
  );
};

export default QuestionnaireSheet;