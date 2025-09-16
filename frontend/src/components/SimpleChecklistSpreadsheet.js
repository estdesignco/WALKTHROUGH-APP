import React from 'react';

const SimpleChecklistSpreadsheet = ({ project }) => {
  
  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
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
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>INSTALLED</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>QTY</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>SIZE</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>STATUS</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>IMAGE</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>LINK</th>
              <th className="border border-gray-400 px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: '#8B4444' }}>VENDOR/SKU</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Recessed Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                <select className="bg-gray-800 text-white text-sm border-none">
                  <option value="">Select Status</option>
                  <option value="PICKED">PICKED</option>
                  <option value="TO BE SELECTED">TO BE SELECTED</option>
                  <option value="RESEARCHING">RESEARCHING</option>
                </select>
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Chandelier</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                <select className="bg-gray-800 text-white text-sm border-none">
                  <option value="">Select Status</option>
                  <option value="PICKED">PICKED</option>
                  <option value="TO BE SELECTED">TO BE SELECTED</option>
                  <option value="RESEARCHING">RESEARCHING</option>
                </select>
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Sconces</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                <select className="bg-gray-800 text-white text-sm border-none">
                  <option value="">Select Status</option>
                  <option value="PICKED">PICKED</option>
                  <option value="TO BE SELECTED">TO BE SELECTED</option>
                  <option value="RESEARCHING">RESEARCHING</option>
                </select>
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Track Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                <select className="bg-gray-800 text-white text-sm border-none">
                  <option value="">Select Status</option>
                  <option value="PICKED">PICKED</option>
                  <option value="TO BE SELECTED">TO BE SELECTED</option>
                  <option value="RESEARCHING">RESEARCHING</option>
                </select>
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm text-center">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm">
                <select className="bg-gray-800 text-white text-sm border-none">
                  <option value="">Select Status</option>
                  <option value="PICKED">PICKED</option>
                  <option value="TO BE SELECTED">TO BE SELECTED</option>
                  <option value="RESEARCHING">RESEARCHING</option>
                </select>
              </td>
              <td className="border border-gray-400 px-3 py-2 text-white text-sm"></td>
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

export default SimpleChecklistSpreadsheet;