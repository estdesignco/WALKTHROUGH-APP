// MASTER ROOM COLOR PALETTE - Used across ENTIRE app
// DO NOT modify without updating ALL components

export const ROOM_COLORS = {
  'living room': '#7C3AED',      // Purple
  'dining room': '#DC2626',      // Red
  'kitchen': '#EA580C',          // Orange  
  'primary bedroom': '#059669',  // Emerald Green
  'master bedroom': '#059669',   // Emerald Green (same as primary)
  'bedroom 2': '#10B981',        // Light Green
  'bedroom 3': '#14B8A6',        // Teal
  'primary bathroom': '#2563EB', // Blue
  'bathroom': '#2563EB',         // Blue (same as primary)
  'master bathroom': '#2563EB',  // Blue (same as primary)
  'powder room': '#7C2D12',      // Brown
  'guest room': '#BE185D',       // Pink
  'office': '#6366F1',           // Indigo
  'family room': '#CA8A04',      // Yellow/Gold
  'laundry room': '#16A34A',     // Forest Green
  'mudroom': '#0891B2',          // Cyan
  'basement': '#6B7280',         // Gray
  'attic storage': '#78716C',    // Stone
  'garage': '#374151',           // Dark Gray
  'pantry': '#F59E0B',           // Amber
  'closet': '#8B5CF6',           // Violet
  'playroom': '#EC4899',         // Hot Pink
  'library': '#0EA5E9',          // Sky Blue
  'wine cellar': '#9333EA',      // Purple
  'patio': '#EF4444',            // Bright Red
  'balcony': '#F97316',          // Orange Red
  'foyer': '#A855F7',            // Light Purple
  'hallway': '#22D3EE',          // Bright Cyan
  'gym': '#84CC16',              // Lime
  'media room': '#6366F1',       // Indigo
  'sunroom': '#FBBF24',          // Bright Yellow
};

export const getRoomColor = (roomName) => {
  return ROOM_COLORS[roomName.toLowerCase()] || '#7C3AED';
};

export const getCategoryColor = () => '#065F46';
