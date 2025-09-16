import React from 'react';

const SimpleChecklistSpreadsheet = ({ project }) => {
  
  // SIMPLE CHECKLIST COMPONENT - MATCHES FF&E STRUCTURE

  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      
      {/* SIMPLE CHECKLIST SPREADSHEET - SAME AS WALKTHROUGH */}
      <div className="overflow-x-auto">
        
        {/* LIVING ROOM HEADER (PURPLE) */}
        <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#7C3AED' }}>
          LIVING ROOM
        </div>
        
        {/* LIGHTING CATEGORY HEADER (GREEN) */}
        <div className="mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#065F46' }}>
          LIGHTING
        </div>
        
        {/* TABLE WITH CORRECT FF&E HEADERS ORDER - NO EDIT BOXES */}
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-white font-bold bg-red-800">INSTALLED</th>
              <th className="border border-gray-400 px-3 py-2 text-white font-bold bg-orange-800">VENDOR/SKU</th>
              <th className="border border-gray-400 px-3 py-2 text-white font-bold bg-orange-800">QTY</th>
              <th className="border border-gray-400 px-3 py-2 text-white font-bold bg-orange-800">SIZE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Recessed Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Chandelier</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Sconces</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Track Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Ceiling Fan w/ Light</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Art Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Pendant Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Under Cabinet Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Cove Lighting</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 text-white">Picture Lights</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
              <td className="border border-gray-400 px-3 py-2 text-white">1</td>
              <td className="border border-gray-400 px-3 py-2 text-white"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleChecklistSpreadsheet;