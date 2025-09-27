#!/usr/bin/env python3
"""
Script to revert the headers back to original muted colors while keeping darker gradients in content areas
"""

import os

def revert_walkthrough_header():
    """Revert WalkthroughDashboard header to original styling"""
    
    walkthrough_header_replacement = '''  return (
    <div className="max-w-full mx-auto bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      {/* TOP HEADER */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ color: '#8b7355' }}>GREENE</h1>
          <p style={{ color: '#F5F5DC', opacity: '0.8' }}>Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
        </div>

        {!hideNavigation && (
          <>
            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-8 mb-6">
              <a href={`/project/${projectId}/questionnaire`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>📋</span>
                <span>Questionnaire</span>
              </a>
              <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>🚶</span>
                <span>Walkthrough</span>
              </a>
              <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>✅</span>
                <span>Checklist</span>
              </a>
              <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
                <span>📊</span>
                <span className="font-semibold">FF&E</span>
              </div>
            </div>
          </>
        )}

        {/* LOGO BANNER */}
        <div className="rounded-lg mb-6" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
            alt="Established Design Co. Logo" 
            style={{ height: '200px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>

      {/* Main Content Container - MAXIMUM WIDTH with Darker Gradient */}
      <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        
        {/* Page Title - Luxury Style */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">WALKTHROUGH - GREENE</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
        </div>

        {!hideNavigation && (
          <>
            {/* Action Buttons - Same style as Studio Dashboard */}
            <div className="flex justify-center gap-4 mb-8">
              <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                      style={{ color: '#F5F5DC' }}>
                <span>📥</span>
                <span>Export FF&E</span>
              </button>
              <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                      style={{ color: '#F5F5DC' }}>
                <span>📋</span>
                <span>Spec Sheet</span>
              </button>
            </div>

            {/* Search and Controls - Darker Gradient to Match Content Areas */}
            <div className="flex items-center justify-between mt-6 p-6 bg-gradient-to-b from-black via-gray-900 to-black rounded-2xl border border-[#B49B7E]/20 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-4 flex-1">
                <input
                  type="text"
                  placeholder="Search Items..."
                  className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
                />
                <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                  <option>All Rooms</option>
                </select>
                <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                  <option>All Statuses</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-full shadow-xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide ml-4 font-medium"
                style={{ color: '#F5F5DC' }}
              >
                ➕ Add Room
              </button>
            </div>
          </>
        )}'''

    # Read the current WalkthroughDashboard file
    walkthrough_file = '/app/frontend/src/components/WalkthroughDashboard.js'
    with open(walkthrough_file, 'r') as f:
        content = f.read()

    # Find the return statement and replace everything up to the PIE CHART section
    start_marker = 'return ('
    end_marker = '        {/* PIE CHART AND STATUS BREAKDOWN - ALWAYS VISIBLE */'
    
    start_index = content.find(start_marker)
    end_index = content.find(end_marker)
    
    if start_index != -1 and end_index != -1:
        new_content = content[:start_index] + walkthrough_header_replacement + '\n\n' + content[end_index:]
        
        with open(walkthrough_file, 'w') as f:
            f.write(new_content)
        
        print("✅ Reverted WalkthroughDashboard header to original muted colors")
    else:
        print("❌ Could not find markers in WalkthroughDashboard")

if __name__ == "__main__":
    print("🔄 Reverting headers to original muted colors...")
    revert_walkthrough_header()
    print("✨ Header reversion complete!")