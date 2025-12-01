import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * Universal Back/Home Navigation Component
 * Should be used on EVERY page in the app
 */
const BackButton = ({ 
  showHome = true, 
  showBack = true, 
  customBackPath = null,
  className = "",
  style = {} 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (customBackPath) {
      navigate(customBackPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  // Don't show on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-2 mb-4 ${className}`}
      style={style}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-all duration-200 border border-stone-600 hover:border-[#8b7355]"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}
      
      {showHome && (
        <button
          onClick={handleHome}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-all duration-200 border border-stone-600 hover:border-[#8b7355]"
          title="Go to Home"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      )}
    </div>
  );
};

export default BackButton;
