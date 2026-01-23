// MASTER ROOM COLOR PALETTE - DISTINCT COLORS FOR DARK THEME
// Used across ENTIRE app - Mobile & Desktop
// Each room gets a UNIQUE, DISTINCT color

export const ROOM_COLORS = {
  // Living spaces - warm tones
  'living room': '#C97335',          // Warm orange
  'family room': '#AA8A44',          // Gold
  'great room': '#D4A574',           // Tan/beige (brand color)
  'den': '#B8956A',                  // Caramel
  
  // Dining
  'dining room': '#A84444',          // Deep red
  'breakfast nook': '#C75050',       // Brighter red
  
  // Kitchen
  'kitchen': '#3D8B6A',              // Teal green
  'pantry': '#2D7A5A',               // Darker teal
  'butler pantry': '#4A9A7A',        // Lighter teal
  
  // Bedrooms - cool tones
  'primary bedroom': '#4A6AB8',      // Blue
  'master bedroom': '#4A6AB8',       // Blue (same as primary)
  'bedroom': '#5A7AC8',              // Lighter blue
  'bedroom 2': '#3A5AA8',            // Medium blue  
  'bedroom 3': '#5A8A98',            // Blue-teal
  'bedroom 4': '#4A7A88',            // Slate blue
  'guest room': '#6A8AB8',           // Soft blue
  'guest bedroom': '#6A8AB8',        // Soft blue
  
  // Bathrooms - aqua/cyan tones
  'primary bathroom': '#2D8A8A',     // Teal
  'bathroom': '#3D9A9A',             // Aqua
  'master bathroom': '#2D8A8A',      // Teal (same as primary)
  'bathroom 2': '#4DAAA0',           // Mint
  'bathroom 3': '#5DBAB0',           // Light mint
  'powder room': '#3D7A7A',          // Dark teal
  'half bath': '#4D8A80',            // Sage teal
  
  // Work spaces - earth tones
  'office': '#8A6A4A',               // Brown
  'home office': '#9A7A5A',          // Light brown
  'study': '#7A5A3A',                // Dark brown
  'library': '#6A7A5A',              // Olive
  
  // Utility - neutral tones
  'laundry room': '#5A7A6A',         // Sage green
  'laundry': '#5A7A6A',              // Sage green
  'mudroom': '#6A8A7A',              // Dusty green
  'garage': '#5A5A6A',               // Charcoal
  'basement': '#6A6A7A',             // Slate
  'attic': '#7A7A8A',                // Light slate
  'attic storage': '#7A7A8A',        // Light slate
  'storage': '#8A8A9A',              // Silver
  
  // Entry/Transit - accent tones
  'foyer': '#9A6A5A',                // Terracotta
  'entry': '#AA7A6A',                // Light terracotta
  'hallway': '#8A7A6A',              // Taupe
  'stairway': '#7A6A5A',             // Mocha
  
  // Closets - muted tones
  'closet': '#6A5A7A',               // Dusty purple
  'master closet': '#7A6A8A',        // Light dusty purple
  'walk-in closet': '#5A4A6A',       // Dark dusty purple
  
  // Special rooms - vibrant accents
  'playroom': '#B85A6A',             // Rose
  'nursery': '#9AAA8A',              // Soft sage
  'media room': '#5A5A8A',           // Indigo
  'home theater': '#4A4A7A',         // Dark indigo
  'gym': '#7A9A5A',                  // Lime green
  'exercise room': '#8AAA6A',        // Light lime
  'wine cellar': '#7A4A5A',          // Burgundy
  'bar': '#8A5A6A',                  // Mauve
  
  // Outdoor - nature tones
  'sunroom': '#CAA544',              // Sunny yellow
  'patio': '#AA6A4A',                // Rust
  'balcony': '#BA7A5A',              // Coral
  'porch': '#9A8A6A',                // Khaki
  'deck': '#8A7A5A',                 // Driftwood
  'outdoor': '#6A8A6A',              // Forest green
  'pool': '#4A8AAA',                 // Pool blue
  'lanai': '#5A9A8A',                // Seafoam
};

// Fallback colors that cycle - all DISTINCT from each other
const FALLBACK_COLORS = [
  '#C97335',  // Orange
  '#A84444',  // Red
  '#3D8B6A',  // Teal
  '#4A6AB8',  // Blue
  '#AA8A44',  // Gold
  '#8A6A4A',  // Brown
  '#5A7A6A',  // Sage
  '#9A6A5A',  // Terracotta
  '#7A9A5A',  // Lime
  '#5A5A8A',  // Indigo
  '#B85A6A',  // Rose
  '#2D8A8A',  // Cyan
  '#6A5A7A',  // Purple
  '#CAA544',  // Yellow
  '#7A4A5A',  // Burgundy
  '#4A8AAA',  // Sky blue
];

// Track used colors to avoid duplicates
const usedFallbackColors = new Map();

export const getRoomColor = (roomName) => {
  if (!roomName) return FALLBACK_COLORS[0];
  
  const lowerName = roomName.toLowerCase().trim();
  
  // Check for exact match
  if (ROOM_COLORS[lowerName]) {
    return ROOM_COLORS[lowerName];
  }
  
  // Check for partial matches
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return color;
    }
  }
  
  // Use consistent fallback based on room name hash
  if (!usedFallbackColors.has(lowerName)) {
    // Create a simple hash from the room name
    let hash = 0;
    for (let i = 0; i < lowerName.length; i++) {
      hash = ((hash << 5) - hash) + lowerName.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;
    usedFallbackColors.set(lowerName, FALLBACK_COLORS[colorIndex]);
  }
  
  return usedFallbackColors.get(lowerName);
};

export const getCategoryColor = () => '#065F46';
