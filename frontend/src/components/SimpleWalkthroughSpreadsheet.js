import React from 'react';

const SimpleWalkthroughSpreadsheet = ({ project }) => {
  
  // FORCE ERROR TO TEST IF THIS COMPONENT IS BEING USED
  throw new Error("🚨 SimpleWalkthroughSpreadsheet IS BEING CALLED!");
  
  // SIMPLE COMPONENT - NO COMPLEX LOGIC, JUST SHOW THE TABLE

  // SIMPLE RENDER - NO COMPLEX LOGIC

  return (
    <div className="w-full p-4" style={{ backgroundColor: '#0F172A' }}>
      <div className="text-white text-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-red-500">🚨 THIS IS MY SIMPLE WALKTHROUGH COMPONENT!</h1>
        <p className="text-2xl text-red-400">If you see this, the component is working</p>
        {project && (
          <p className="text-lg mt-2 text-red-300">Project: {project.name || 'Unnamed Project'}</p>
        )}
        
        {/* LIVING ROOM HEADER */}
        <div className="mt-8 mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#7C3AED' }}>
          LIVING ROOM
        </div>
        
        {/* LIGHTING CATEGORY HEADER */}
        <div className="mb-4 px-4 py-2 text-white font-bold" style={{ backgroundColor: '#065F46' }}>
          LIGHTING
        </div>
        
        {/* TABLE WITH CORRECT FF&E HEADERS ORDER */}
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

export default SimpleWalkthroughSpreadsheet;