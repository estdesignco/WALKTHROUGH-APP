import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const ProjectNavigation = ({ projectId, activeTab = '' }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname.includes(path);

  // Navigation structure with dropdowns
  const navItems = [
    { 
      type: 'single', 
      label: 'QUESTIONNAIRE', 
      icon: '📋', 
      path: `/project/${projectId}/questionnaire` 
    },
    { 
      type: 'single', 
      label: 'WALKTHROUGH', 
      icon: '🚶', 
      path: `/project/${projectId}/walkthrough` 
    },
    { 
      type: 'single', 
      label: 'CHECKLIST', 
      icon: '✅', 
      path: `/project/${projectId}/checklist` 
    },
    { 
      type: 'single', 
      label: 'FF&E', 
      icon: '🛋️', 
      path: `/project/${projectId}/ffe` 
    },
    { 
      type: 'single', 
      label: 'WHOLE HOME FINISHES', 
      icon: '🎨', 
      path: `/master-materials` 
    },
    { 
      type: 'dropdown', 
      label: 'TASKS', 
      icon: '📝',
      items: [
        { label: 'TO DO', icon: '✓', path: `/master-todo` },
        { label: 'PUNCH LIST', icon: '🔨', path: `/project/${projectId}/punch-list` }
      ]
    },
    { 
      type: 'single', 
      label: 'CALENDAR', 
      icon: '📅', 
      path: `/project/${projectId}/calendar` 
    },
    { 
      type: 'single', 
      label: 'DESIGN', 
      icon: '🖼️', 
      path: `/project/${projectId}/design` 
    },
    { 
      type: 'dropdown', 
      label: 'TOOLS', 
      icon: '🔧',
      items: [
        { label: 'DESIGN TOOLS', icon: '✏️', path: `/design-tools` },
        { label: 'CALCULATORS', icon: '🧮', path: `/calculators` }
      ]
    },
    { 
      type: 'dropdown', 
      label: 'LOGISTICS', 
      icon: '📦',
      items: [
        { label: 'SHIPPING', icon: '🚚', path: `/project/${projectId}/shipping` },
        { label: 'DELIVERIES', icon: '📬', path: `/project/${projectId}/deliveries` },
        { label: 'CRITICAL PATH', icon: '🛤️', path: `/project/${projectId}/critical-path` }
      ]
    },
    { 
      type: 'dropdown', 
      label: 'FINANCIAL', 
      icon: '💰',
      items: [
        { label: 'BUDGET', icon: '📊', path: `/project/${projectId}/budget` },
        { label: 'FINANCE', icon: '💵', path: `/project/${projectId}/finance` },
        { label: 'TRADE DISCOUNT', icon: '🏷️', path: `/project/${projectId}/trade-discount` }
      ]
    },
    { 
      type: 'single', 
      label: 'AUTOMATION', 
      icon: '⚡', 
      path: `/project/${projectId}/automation` 
    },
    { 
      type: 'dropdown', 
      label: 'REPORTS', 
      icon: '📈',
      items: [
        { label: 'REPORTS', icon: '📄', path: `/project/${projectId}/reports` },
        { label: 'EXPORTS', icon: '📤', path: `/project/${projectId}/exports` },
        { label: 'AI ASSISTANT', icon: '🤖', path: `/project/${projectId}/ai-assistant` }
      ]
    },
    { 
      type: 'dropdown', 
      label: 'PEOPLE', 
      icon: '👥',
      items: [
        { label: 'CONTACTS', icon: '📇', path: `/master-contacts` },
        { label: 'VENDORS', icon: '🏪', path: `/master-contacts?type=vendor` }
      ]
    },
    { 
      type: 'single', 
      label: 'SAMPLES', 
      icon: '🧪', 
      path: `/project/${projectId}/samples` 
    },
    { 
      type: 'single', 
      label: 'MEASUREMENTS', 
      icon: '📏', 
      path: `/project/${projectId}/measurements` 
    }
  ];

  const renderNavItem = (item, index) => {
    if (item.type === 'single') {
      const active = isActive(item.path) || activeTab === item.label.toLowerCase();
      return (
        <Link
          key={index}
          to={item.path}
          className={`px-3 py-2 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center gap-1 ${
            active 
              ? 'bg-[#D4A574] text-black' 
              : 'text-[#F5F5DC] hover:bg-[#D4A574]/20'
          }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      );
    }

    // Dropdown menu
    const isOpen = openDropdown === index;
    const hasActiveChild = item.items.some(child => isActive(child.path));

    return (
      <div key={index} className="relative" ref={isOpen ? dropdownRef : null}>
        <button
          onClick={() => setOpenDropdown(isOpen ? null : index)}
          className={`px-3 py-2 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center gap-1 ${
            hasActiveChild 
              ? 'bg-[#D4A574] text-black' 
              : 'text-[#F5F5DC] hover:bg-[#D4A574]/20'
          }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-[#D4A574]/30 rounded-lg shadow-xl z-50 min-w-[160px]">
            {item.items.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                to={subItem.path}
                onClick={() => setOpenDropdown(null)}
                className={`block px-4 py-2 text-xs transition-all flex items-center gap-2 ${
                  isActive(subItem.path)
                    ? 'bg-[#D4A574]/20 text-[#D4A574]'
                    : 'text-[#F5F5DC] hover:bg-[#D4A574]/10'
                }`}
              >
                <span>{subItem.icon}</span>
                <span>{subItem.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-[#D4A574]/30 sticky top-0 z-40">
      <div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto">
        {navItems.map((item, index) => renderNavItem(item, index))}
      </div>
    </nav>
  );
};

export default ProjectNavigation;
