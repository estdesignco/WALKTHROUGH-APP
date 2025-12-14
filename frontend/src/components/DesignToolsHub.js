import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Layout, 
  Palette, 
  Camera, 
  Lightbulb, 
  ArrowLeft,
  Smartphone,
  Monitor,
  Ruler,
  Sparkles,
  Box,
  Pin
} from 'lucide-react';

/**
 * Design Tools Hub
 * Central dashboard for all interior design tools:
 * - Pinterest Integration
 * - Furniture Layout Planner (Desktop)
 * - Color Palette Extractor 
 * - AR Furniture Preview (Desktop + Mobile)
 * - Lighting Simulator
 * - 3D Room Scanner (Desktop + Mobile)
 */
export default function DesignToolsHub({ projectId: propProjectId }) {
  const navigate = useNavigate();
  const { projectId: paramProjectId } = useParams();
  const projectId = propProjectId || paramProjectId;

  const tools = [
    {
      id: 'pinterest',
      name: 'Pinterest Inspiration',
      description: 'Browse Pinterest for design ideas and save your favorites to your project',
      icon: Pin,
      color: 'from-red-500 to-red-700',
      borderColor: '#E60023',
      platforms: ['desktop', 'mobile'],
      route: `/project/${projectId}/design-tools/pinterest`,
      features: ['Browse inspiration', 'Save to rooms', 'Category filters', 'Design ideas']
    },
    {
      id: 'room-scanner',
      name: '3D Room Scanner',
      description: 'Capture room dimensions using your phone camera - perfect for on-site measurements!',
      icon: Box,
      color: 'from-cyan-500 to-teal-600',
      borderColor: '#14B8A6',
      platforms: ['desktop', 'mobile'],
      route: `/project/${projectId}/design-tools/room-scanner`,
      features: ['Camera-guided scan', 'AI dimension estimation', 'Add doors & windows', 'Export floor plans']
    },
    {
      id: 'layout-planner',
      name: 'Furniture Layout Planner',
      description: 'Drag & drop YOUR furniture from FFE to create room layouts to scale',
      icon: Layout,
      color: 'from-blue-500 to-blue-700',
      borderColor: '#4A90D9',
      platforms: ['desktop'],
      route: `/project/${projectId}/design-tools/layout-planner`,
      features: ['Load items from FFE', 'Real dimensions', 'Zoom & rotate', 'Save & export']
    },
    {
      id: 'color-extractor',
      name: 'Color Palette Extractor',
      description: 'Upload inspiration images and get paint matches from Benjamin Moore & Sherwin Williams',
      icon: Palette,
      color: 'from-purple-500 to-purple-700',
      borderColor: '#9370DB',
      platforms: ['desktop', 'mobile'],
      route: `/project/${projectId}/design-tools/color-extractor`,
      features: ['AI color extraction', 'Paint brand matching', 'Complementary colors', 'Mood detection']
    },
    {
      id: 'ar-preview',
      name: 'AR Furniture Preview',
      description: 'Use your camera to see how furniture looks in real space - perfect for on-site visits!',
      icon: Camera,
      color: 'from-green-500 to-green-700',
      borderColor: '#10B981',
      platforms: ['desktop', 'mobile'],
      route: `/project/${projectId}/design-tools/ar-preview`,
      features: ['Live camera feed', 'Place FFE items', 'Scale & rotate', 'Capture screenshots']
    },
    {
      id: 'lighting-simulator',
      name: 'Lighting Simulator',
      description: 'Preview how different lighting will look in a room photo before installing',
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-500',
      borderColor: '#FFD700',
      platforms: ['desktop', 'mobile'],
      route: `/project/${projectId}/design-tools/lighting-simulator`,
      features: ['Time of day presets', 'Color temperature', 'Brightness control', 'Shadow depth']
    }
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Sparkles size={40} className="text-[#D4A574]" />
            <h1 className="text-4xl font-bold text-[#D4A574]">Design Tools Suite</h1>
            <Sparkles size={40} className="text-[#D4A574]" />
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Professional interior design tools powered by AI - visualize, plan, and perfect your designs
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => navigate(tool.route)}
              className="group cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              style={{ 
                borderColor: tool.borderColor,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.85) 100%)',
                boxShadow: `0 0 30px ${tool.borderColor}20`
              }}
            >
              {/* Tool Header */}
              <div className={`p-6 bg-gradient-to-r ${tool.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/20">
                      <IconComponent size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{tool.name}</h3>
                      {/* Platform badges */}
                      <div className="flex items-center gap-2 mt-1">
                        {tool.platforms.includes('desktop') && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-white text-xs">
                            <Monitor size={12} />
                            Desktop
                          </span>
                        )}
                        {tool.platforms.includes('mobile') && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-white text-xs">
                            <Smartphone size={12} />
                            Mobile
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ArrowLeft size={24} className="text-white transform rotate-180" />
                  </div>
                </div>
              </div>

              {/* Tool Body */}
              <div className="p-6">
                <p className="text-gray-300 mb-4">{tool.description}</p>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tool.borderColor }} />
                      <span className="text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover effect bar */}
              <div 
                className="h-1 w-0 group-hover:w-full transition-all duration-500"
                style={{ backgroundColor: tool.borderColor }}
              />
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="max-w-6xl mx-auto mt-8 p-6 rounded-2xl border border-[#D4A574]/30" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <h3 className="text-[#D4A574] font-bold text-lg mb-4 flex items-center gap-2">
          <Ruler size={20} />
          Pro Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Box size={16} className="text-teal-400" />
            </div>
            <p className="text-gray-400">
              <strong className="text-gray-300">Room Scanner:</strong> Point at corners for best dimension accuracy
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Layout size={16} className="text-blue-400" />
            </div>
            <p className="text-gray-400">
              <strong className="text-gray-300">Layout Planner:</strong> Add dimensions to your FFE items for accurate scale planning
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Camera size={16} className="text-green-400" />
            </div>
            <p className="text-gray-400">
              <strong className="text-gray-300">AR Preview:</strong> Use on-site to show clients exactly how furniture will look
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Palette size={16} className="text-purple-400" />
            </div>
            <p className="text-gray-400">
              <strong className="text-gray-300">Color Extractor:</strong> Snap photos of inspiration and get instant paint codes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
