import React from 'react';

const SimpleWalkthroughSpreadsheet = ({ project }) => {
  
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
      
      {/* FIXED SPREADSHEET - EXACTLY WHAT USER WANTS */}
      <div className="overflow-x-auto">
        
        {/* LIVING ROOM HEADER (PURPLE) */}
        <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#7C3AED' }}>
          LIVING ROOM
        </div>
        
        {/* LIGHTING CATEGORY HEADER (GREEN) */}
        <div className="mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#065F46' }}>
          LIGHTING
        </div>
        
        {/* TABLE WITH CORRECT HEADERS - EXACTLY AS REQUESTED */}
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-1 py-2 text-xs font-bold text-white w-8" style={{ backgroundColor: '#8b7355' }}>✓</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SUB CATEGORY</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white w-16" style={{ backgroundColor: '#8B4444' }}>QTY</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
              <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-1 py-1 text-center w-8">
                <input type="checkbox" className="w-2 h-2" />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm">
                <select className="bg-gray-700 text-white text-xs px-1 py-1 rounded border border-gray-600 w-full">
                  <option value="">Select...</option>
                  <option value="installed">Installed</option>
                  <option value="portable">Portable</option>
                  <option value="piece">Piece</option>
                  <option value="fixture">Fixture</option>
                  <option value="accessory">Accessory</option>
                </select>
              </td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm text-center w-16">1</td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
              <td className="border border-gray-400 px-2 py-1 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Chandelier</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Sconces</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Track Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Art Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Pendant Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Under Cabinet Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Cove Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Picture Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
          </tbody>
        </table>
        
        {/* ADD ITEM BUTTON */}
        <div className="mt-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
            + Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleWalkthroughSpreadsheet;