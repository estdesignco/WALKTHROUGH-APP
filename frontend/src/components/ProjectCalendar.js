import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Event type colors matching desktop aesthetics
const EVENT_TYPES = {
  shipping: { label: 'Shipping', color: '#3B82F6', icon: '🚚' },
  delivery: { label: 'Delivery', color: '#22C55E', icon: '📦' },
  install: { label: 'Install', color: '#EF4444', icon: '🔧' },
  order: { label: 'Order', color: '#F59E0B', icon: '🛒' },
  restock: { label: 'Restock', color: '#8B5CF6', icon: '📋' },
  project: { label: 'Project', color: '#D4A574', icon: '🏠' },
};

// Shimmer CSS
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-gold {
    position: relative;
    overflow: hidden;
  }
  .shimmer-gold::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.1) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
`;

const ProjectCalendar = ({ onEventClick, compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState(Object.keys(EVENT_TYPES));
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'project',
    description: '',
    project_id: ''
  });
  const [projects, setProjects] = useState([]);

  // Fetch all projects and extract dates
  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects`);
      const projects = await response.json();
      
      const calendarEvents = [];
      
      for (const project of projects) {
        // Add project dates
        if (project.start_date) {
          calendarEvents.push({
            id: `project-start-${project.id}`,
            type: 'project',
            title: `${project.name} - Start`,
            date: new Date(project.start_date),
            project: project.name,
            projectId: project.id,
          });
        }
        if (project.end_date) {
          calendarEvents.push({
            id: `project-end-${project.id}`,
            type: 'project',
            title: `${project.name} - End`,
            date: new Date(project.end_date),
            project: project.name,
            projectId: project.id,
          });
        }
        if (project.install_date) {
          calendarEvents.push({
            id: `project-install-${project.id}`,
            type: 'install',
            title: `${project.name} - Install`,
            date: new Date(project.install_date),
            project: project.name,
            projectId: project.id,
          });
        }

        // Fetch items for this project to get shipping/order dates
        try {
          const itemsResponse = await fetch(`${API_URL}/projects/${project.id}?sheet_type=ffe`);
          const projectData = await itemsResponse.json();
          
          for (const room of projectData.rooms || []) {
            for (const category of room.categories || []) {
              for (const subcategory of category.subcategories || []) {
                for (const item of subcategory.items || []) {
                  // Order date
                  if (item.order_date) {
                    calendarEvents.push({
                      id: `order-${item.id}`,
                      type: 'order',
                      title: item.name,
                      date: new Date(item.order_date),
                      project: project.name,
                      projectId: project.id,
                      room: room.name,
                      vendor: item.vendor,
                    });
                  }
                  // Expected delivery
                  if (item.expected_delivery) {
                    calendarEvents.push({
                      id: `delivery-${item.id}`,
                      type: 'delivery',
                      title: item.name,
                      date: new Date(item.expected_delivery),
                      project: project.name,
                      projectId: project.id,
                      room: room.name,
                      vendor: item.vendor,
                    });
                  }
                  // Shipping date (from tracking)
                  if (item.ship_date) {
                    calendarEvents.push({
                      id: `shipping-${item.id}`,
                      type: 'shipping',
                      title: item.name,
                      date: new Date(item.ship_date),
                      project: project.name,
                      projectId: project.id,
                      room: room.name,
                      vendor: item.vendor,
                      tracking: item.tracking_number,
                    });
                  }
                  // Install date
                  if (item.install_date) {
                    calendarEvents.push({
                      id: `install-${item.id}`,
                      type: 'install',
                      title: item.name,
                      date: new Date(item.install_date),
                      project: project.name,
                      projectId: project.id,
                      room: room.name,
                    });
                  }
                  // Restock date
                  if (item.restock_date) {
                    calendarEvents.push({
                      id: `restock-${item.id}`,
                      type: 'restock',
                      title: item.name,
                      date: new Date(item.restock_date),
                      project: project.name,
                      projectId: project.id,
                      room: room.name,
                      vendor: item.vendor,
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch items for project ${project.id}:`, err);
        }
      }
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedFilters.includes(event.type));
  }, [events, selectedFilters]);

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year &&
               eventDate.getMonth() === month &&
               eventDate.getDate() === i;
      });
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate, filteredEvents]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleFilter = (type) => {
    setSelectedFilters(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const selectAllFilters = () => setSelectedFilters(Object.keys(EVENT_TYPES));
  const clearAllFilters = () => setSelectedFilters([]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Count events by type for legend
  const eventCounts = useMemo(() => {
    const counts = {};
    Object.keys(EVENT_TYPES).forEach(type => {
      counts[type] = events.filter(e => e.type === type).length;
    });
    return counts;
  }, [events]);

  if (loading) {
    return (
      <div className="rounded-lg p-8 text-center" style={{
        background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
        border: '1px solid #8b7355',
      }}>
        <div className="text-stone-300 text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      border: '1px solid #8b7355',
      boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)',
    }}>
      <style>{shimmerStyle}</style>
      
      {/* Header */}
      <div className="p-4 shimmer-gold" style={{
        background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">📅 Project Calendar</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Today
            </button>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-full hover:bg-black/20 transition-colors text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-xl font-semibold text-white min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-full hover:bg-black/20 transition-colors text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Filter size={18} />
              Filter ({selectedFilters.length}/{Object.keys(EVENT_TYPES).length})
            </button>
            
            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 z-50 rounded-lg shadow-xl p-4 min-w-[250px]"
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #8b7355',
                }}>
                <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid #8b7355' }}>
                  <span className="font-semibold text-stone-200">Filter Events</span>
                  <button onClick={() => setShowFilterMenu(false)} className="text-stone-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <button onClick={selectAllFilters} className="text-xs px-2 py-1 rounded bg-green-600/30 text-green-400 hover:bg-green-600/50">
                    Select All
                  </button>
                  <button onClick={clearAllFilters} className="text-xs px-2 py-1 rounded bg-red-600/30 text-red-400 hover:bg-red-600/50">
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(EVENT_TYPES).map(([type, config]) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(type)}
                        onChange={() => toggleFilter(type)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: config.color }}
                      />
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-stone-200 flex-1">{config.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: config.color + '30', color: config.color }}>
                        {eventCounts[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold py-2" style={{ color: '#d4af37' }}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <div
              key={index}
              onClick={() => day.events?.length > 0 && setSelectedDay(day)}
              className={`min-h-[100px] p-1 rounded-lg transition-all cursor-pointer ${
                day.isCurrentMonth ? 'hover:bg-white/5' : 'opacity-40'
              } ${isToday(day.date) ? 'ring-2 ring-[#d4af37]' : ''}`}
              style={{
                background: day.isCurrentMonth ? 'rgba(255,255,255,0.02)' : 'transparent',
                border: '1px solid rgba(139, 115, 85, 0.2)',
              }}
            >
              <div className={`text-right text-sm mb-1 ${
                isToday(day.date) ? 'font-bold text-[#d4af37]' : 'text-stone-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              {/* Event Dots/Pills */}
              <div className="space-y-0.5">
                {day.events?.slice(0, 3).map((event, i) => (
                  <div
                    key={event.id}
                    onMouseEnter={() => setHoveredEvent(event)}
                    onMouseLeave={() => setHoveredEvent(null)}
                    className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:scale-105 transition-transform"
                    style={{
                      background: EVENT_TYPES[event.type].color + '40',
                      color: EVENT_TYPES[event.type].color,
                      border: `1px solid ${EVENT_TYPES[event.type].color}50`,
                    }}
                  >
                    {EVENT_TYPES[event.type].icon} {event.title.substring(0, 15)}...
                  </div>
                ))}
                {day.events?.length > 3 && (
                  <div className="text-[10px] text-stone-400 text-center">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-4 justify-center p-3 rounded-lg" style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(139, 115, 85, 0.3)',
        }}>
          {Object.entries(EVENT_TYPES).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: config.color }}></div>
              <span className="text-sm text-stone-300">{config.icon} {config.label}</span>
              <span className="text-xs text-stone-500">({eventCounts[type]})</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Day Modal */}
      {selectedDay && selectedDay.events?.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
          <div
            className="max-w-lg w-full max-h-[80vh] overflow-auto rounded-lg"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
              border: '1px solid #8b7355',
            }}
          >
            <div className="p-4 sticky top-0" style={{
              background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
            }}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-white hover:bg-black/20 p-1 rounded">
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/70 text-sm">{selectedDay.events.length} event(s)</p>
            </div>
            
            <div className="p-4 space-y-3">
              {selectedDay.events.map(event => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg cursor-pointer hover:scale-102 transition-transform"
                  style={{
                    background: EVENT_TYPES[event.type].color + '15',
                    border: `1px solid ${EVENT_TYPES[event.type].color}50`,
                  }}
                  onClick={() => onEventClick && onEventClick(event)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{EVENT_TYPES[event.type].icon}</span>
                    <span className="font-bold text-stone-200">{event.title}</span>
                  </div>
                  <div className="space-y-1 text-sm text-stone-400">
                    <div>📁 Project: <span className="text-[#d4af37]">{event.project}</span></div>
                    {event.room && <div>🏠 Room: {event.room}</div>}
                    {event.vendor && <div>🏪 Vendor: {event.vendor}</div>}
                    {event.tracking && <div>📦 Tracking: {event.tracking}</div>}
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(139, 115, 85, 0.3)' }}>
                      <span className="px-2 py-1 rounded text-xs" style={{
                        background: EVENT_TYPES[event.type].color + '30',
                        color: EVENT_TYPES[event.type].color,
                      }}>
                        {EVENT_TYPES[event.type].label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Hover Tooltip */}
      {hoveredEvent && (
        <div className="fixed z-50 p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
          style={{
            background: '#2a2a2a',
            border: `1px solid ${EVENT_TYPES[hoveredEvent.type].color}`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
          <div className="font-bold text-stone-200">{hoveredEvent.title}</div>
          <div className="text-sm text-stone-400">{hoveredEvent.project}</div>
          <div className="text-xs mt-1" style={{ color: EVENT_TYPES[hoveredEvent.type].color }}>
            {EVENT_TYPES[hoveredEvent.type].icon} {EVENT_TYPES[hoveredEvent.type].label}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCalendar;
