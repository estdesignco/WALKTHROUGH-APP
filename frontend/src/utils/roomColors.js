// MASTER ROOM COLOR PALETTE - MUTED TONES FOR DARK THEME
// Used across ENTIRE app - Mobile & Desktop

export const ROOM_COLORS = {
  'living room': '#7A5A8A',        // Muted purple
  'dining room': '#A84444',        // Muted red
  'kitchen': '#C97335',            // Muted orange  
  'primary bedroom': '#4A8B6A',    // Muted emerald
  'master bedroom': '#4A8B6A',     // Muted emerald (same as primary)
  'bedroom 2': '#5A9A7A',          // Muted green
  'bedroom 3': '#5A8A8A',          // Muted teal
  'primary bathroom': '#4A6AB8',   // Muted blue
  'bathroom': '#4A6AB8',           // Muted blue (same as primary)
  'master bathroom': '#4A6AB8',    // Muted blue (same as primary)
  'powder room': '#7A5544',        // Muted brown
  'guest room': '#9A5A7A',         // Muted pink
  'office': '#5A5A9A',             // Muted indigo
  'family room': '#AA8A44',        // Muted gold
  'laundry room': '#5A8A5A',       // Muted forest green
  'mudroom': '#4A7A8A',            // Muted cyan
  'basement': '#6A6A6A',           // Muted gray
  'attic storage': '#7A7A6A',      // Muted stone
  'garage': '#5A5A5A',             // Dark gray
  'pantry': '#BA8A44',             // Muted amber
  'closet': '#7A5A9A',             // Muted violet
  'playroom': '#B85A8A',           // Muted hot pink
  'library': '#4A8AAA',            // Muted sky blue
  'wine cellar': '#8A5AAA',        // Muted deep purple
  'patio': '#BA5A5A',              // Muted bright red
  'balcony': '#CA6A44',            // Muted orange red
  'foyer': '#9A6AAA',              // Muted light purple
  'hallway': '#4A9AAA',            // Muted bright cyan
  'gym': '#7A9A5A',                // Muted lime
  'media room': '#6A6AAA',         // Muted indigo
  'sunroom': '#CAA544',            // Muted bright yellow
};

export const getRoomColor = (roomName) => {
  return ROOM_COLORS[roomName.toLowerCase()] || '#7A5A8A';
};

export const getCategoryColor = () => '#065F46';
