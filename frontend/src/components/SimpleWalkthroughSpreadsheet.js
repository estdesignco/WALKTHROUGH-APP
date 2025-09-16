import React from 'react';

const SimpleWalkthroughSpreadsheet = ({ project }) => {
  
  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
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
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8b7355' }}>✓</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#7F1D1D' }}>INSTALLED</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>VENDOR/SKU</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>QTY</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#92400E' }}>SIZE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Recessed Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Chandelier</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Sconces</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Track Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Art Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Pendant Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Under Cabinet Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Cove Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input type="checkbox" className="w-4 h-4" />
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Picture Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
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