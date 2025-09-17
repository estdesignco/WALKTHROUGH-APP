import React, { useState, useEffect } from 'react';

const SimpleChecklistSpreadsheet = ({ 
  project, 
  roomColors, 
  categoryColors, 
  itemStatuses = [],
  vendorTypes = [],
  carrierTypes = [],
  onDeleteRoom, 
  onAddRoom,
  onReload 
}) => {
  console.log('🎯 SimpleChecklistSpreadsheet rendering with project:', project);

  // Status colors mapping for checklist
  const getStatusColor = (status) => {
    const statusColors = {
      '': '#6B7280',                        // Gray for blank/default
      'BLANK': '#6B7280',                   // Gray for blank
      'PICKED': '#3B82F6',                  // Blue
      'ORDER SAMPLES': '#10B981',           // Green
      'SAMPLES ARRIVED': '#8B5CF6',         // Purple
      'ASK NEIL': '#F59E0B',                // Yellow
      'ASK CHARLENE': '#EF4444',            // Red
      'ASK JALA': '#EC4899',                // Pink
      'GET QUOTE': '#06B6D4',               // Cyan
      'WAITING ON QT': '#F97316',           // Orange
      'READY FOR PRESENTATION': '#84CC16'   // Lime
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };

  if (!project) {
    return (
      <div className="text-center text-red-400 py-8 bg-red-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO PROJECT DATA</p>
      </div>
    );
  }

  if (!project.rooms || project.rooms.length === 0) {
    return (
      <div className="text-center text-yellow-400 py-8 bg-yellow-900 m-4 p-4 rounded">
        <p className="text-lg">🚨 SimpleChecklistSpreadsheet: NO ROOMS</p>
        <p className="text-sm mt-2">Project has {project.rooms?.length || 0} rooms</p>
      </div>
    );
  }

  console.log('✅ SimpleChecklistSpreadsheet: Rendering with', project.rooms.length, 'rooms');

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A' }}>
      
      {/* DEBUG INFO */}
      <div className="text-white p-4 bg-green-900 mb-4">
        <p>✅ SimpleChecklistSpreadsheet loaded successfully!</p>
        <p>Rooms: {project.rooms.length}</p>
        <p>First room: {project.rooms[0]?.name}</p>
      </div>

      {/* BASIC FILTER SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search Items..."
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">🔍 FILTER</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded">CLEAR</button>
          <button 
            onClick={onAddRoom}
            className="px-4 py-2 bg-amber-600 text-white rounded"
          >
            ✚ ADD ROOM
          </button>
        </div>
      </div>

      {/* BASIC CHECKLIST TABLE */}
      <div className="w-full">
        {project.rooms.map((room) => (
          <div key={room.id} className="mb-8">
            {/* ROOM HEADER */}
            <div 
              className="px-4 py-2 text-white font-bold mb-4"
              style={{ backgroundColor: '#7C3AED' }}
            >
              <div className="flex justify-between items-center">
                <span>{room.name.toUpperCase()}</span>
                <button
                  onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                  className="text-red-300 hover:text-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* CATEGORIES */}
            {room.categories?.map((category) => (
              <div key={category.id} className="mb-6">
                {/* CATEGORY HEADER */}
                <div 
                  className="px-4 py-2 text-white font-bold mb-2"
                  style={{ backgroundColor: '#065F46' }}
                >
                  {category.name.toUpperCase()}
                </div>

                {/* CHECKLIST TABLE - 7 COLUMNS */}
                <table className="w-full border-collapse border border-gray-400 mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>ITEM</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-20" style={{ backgroundColor: '#8B4444' }}>LINK</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.subcategories?.map((subcategory) => 
                      subcategory.items?.map((item, itemIndex) => (
                        <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.name}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center">{item.quantity || ''}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.size || ''}</td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                            <select 
                              className="bg-gray-800 text-white text-xs border-none w-full"
                              value={item.status || ''}
                              style={{ backgroundColor: getStatusColor(item.status || ''), color: 'white' }}
                            >
                              <option value="" style={{ backgroundColor: '#6B7280', color: 'white' }}>Select Status</option>
                              <option value="PICKED" style={{ backgroundColor: '#3B82F6', color: 'white' }}>PICKED</option>
                              <option value="ORDER SAMPLES" style={{ backgroundColor: '#10B981', color: 'white' }}>ORDER SAMPLES</option>
                              <option value="SAMPLES ARRIVED" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>SAMPLES ARRIVED</option>
                              <option value="ASK NEIL" style={{ backgroundColor: '#F59E0B', color: 'white' }}>ASK NEIL</option>
                              <option value="ASK CHARLENE" style={{ backgroundColor: '#EF4444', color: 'white' }}>ASK CHARLENE</option>
                              <option value="ASK JALA" style={{ backgroundColor: '#EC4899', color: 'white' }}>ASK JALA</option>
                              <option value="GET QUOTE" style={{ backgroundColor: '#06B6D4', color: 'white' }}>GET QUOTE</option>
                              <option value="WAITING ON QT" style={{ backgroundColor: '#F97316', color: 'white' }}>WAITING ON QT</option>
                              <option value="READY FOR PRESENTATION" style={{ backgroundColor: '#84CC16', color: 'white' }}>READY FOR PRESENTATION</option>
                            </select>
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                            ) : ''}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20">
                            <input
                              type="url"
                              placeholder="Canva URL..."
                              className="w-full bg-transparent text-white text-xs border border-gray-500 rounded px-1"
                            />
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-white text-sm">{item.remarks || ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* ADD ITEM BUTTON */}
                <div className="mb-4">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">
                    + Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChecklistSpreadsheet;