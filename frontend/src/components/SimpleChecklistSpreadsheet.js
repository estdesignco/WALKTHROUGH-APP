import React from 'react';

const SimpleChecklistSpreadsheet = ({ project }) => {
  
  // Status colors mapping
  const getStatusColor = (status) => {
    const statusColors = {
      'PICKED': '#3B82F6',           // Blue
      'ORDER SAMPLES': '#10B981',    // Green
      'SAMPLES ARRIVED': '#8B5CF6',  // Purple
      'ASK NEIL': '#F59E0B',         // Yellow
      'ASK CHARLENE': '#EF4444',     // Red
      'ASK JALA': '#EC4899',         // Pink
      'GET QUOTE': '#06B6D4',        // Cyan
      'WAITING ON QT': '#F97316',    // Orange
      'READY FOR PRESENTATION': '#84CC16' // Lime
    };
    return statusColors[status] || '#6B7280'; // Default gray
  };
  
  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
      {/* FILTER AND SEARCH SECTION */}
      <div className="mb-6 p-4" style={{ backgroundColor: '#1E293B' }}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search Items, Vendors, SKUs..."
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Rooms</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Categories</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Vendors</option>
            </select>
            <select className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
              <option value="">All Status</option>
            </select>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">
              🔍 FILTER
            </button>
            <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold">
              CLEAR
            </button>
          </div>
          
          {/* Add Room Button */}
          <div className="flex justify-end">
            <button className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded font-bold">
              + ADD ROOM
            </button>
          </div>
        </div>
      </div>
      
      {/* CHECKLIST SPREADSHEET - 7 COLUMNS */}
      <div className="overflow-x-auto">
        
        {/* LIVING ROOM HEADER (PURPLE) */}
        <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#7C3AED' }}>
          LIVING ROOM
        </div>
        
        {/* LIGHTING CATEGORY HEADER (GREEN) */}
        <div className="mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#065F46' }}>
          LIGHTING
        </div>
        
        {/* TABLE WITH CHECKLIST HEADERS - 7 COLUMNS */}
        <table className="w-full border-collapse border border-gray-400">
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
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Recessed Lighting</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-800 text-white text-xs border-none w-full">
                  <option value="">Select Status</option>
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
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Chandelier</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-800 text-white text-xs border-none w-full">
                  <option value="">Select Status</option>
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
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Sconces</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-800 text-white text-xs border-none w-full">
                  <option value="">Select Status</option>
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
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Track Lighting</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-800 text-white text-xs border-none w-full">
                  <option value="">Select Status</option>
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
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-800 text-white text-xs border-none w-full">
                  <option value="">Select Status</option>
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
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm w-20"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
          </tbody>
        </table>
        
        {/* ADD ITEM BUTTON - Same code as FFE */}
        <div className="mt-4 flex gap-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
            + Add Item
          </button>
          <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded">
            🗑 Delete Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleChecklistSpreadsheet;