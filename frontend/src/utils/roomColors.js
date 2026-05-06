// 96 DRAMATICALLY DISTINCT ROOM COLORS
// 12 base hues (RED, MAGENTA, YELLOW, GOLD, CYAN, ROSE, PURPLE, ORANGE, TEAL, GREEN, SKY, BLUE)
// × 8 brightness/saturation combos, interleaved so no two adjacent colors share a hue family

export const DISTINCT_ROOM_COLORS = [
  '#FF0000', '#FF00FE', '#FEFF00', '#FFBF00', '#00FEFF', '#FF007F', '#7F00FF', '#FF7F00',
  '#00FF7F', '#00FF00', '#007FFF', '#0000FF', '#A50D0D', '#A50DA5', '#A5A50D', '#A57F0D',
  '#0DA5A5', '#A50D59', '#590DA5', '#A5590D', '#0DA559', '#0DA50D', '#0D59A5', '#0D0DA5',
  '#F65555', '#F655F6', '#F6F655', '#F6CD55', '#55F6F6', '#F655A5', '#A555F6', '#F6A555',
  '#55F6A5', '#55F655', '#55A5F6', '#5555F6', '#D60000', '#D600D6', '#D6D600', '#D6A000',
  '#00D6D6', '#D6006B', '#6B00D6', '#D66B00', '#00D66B', '#00D600', '#006BD6', '#0000D6',
  '#E23636', '#E236E2', '#E2E236', '#E2B736', '#36E2E2', '#E2368C', '#8C36E2', '#E28C36',
  '#36E28C', '#36E236', '#368CE2', '#3636E2', '#950303', '#950395', '#959503', '#957003',
  '#039595', '#95034C', '#4C0395', '#954C03', '#03954C', '#039503', '#034C95', '#030395',
  '#EF7575', '#EF75EF', '#EFEF75', '#EFD175', '#75EFEF', '#EF75B2', '#B275EF', '#EFB275',
  '#75EFB2', '#75EF75', '#75B2EF', '#7575EF', '#FF2828', '#FF28FE', '#FEFF28', '#FFC928',
  '#28FEFF', '#FF2893', '#9328FF', '#FF9328', '#28FF93', '#28FF28', '#2893FF', '#2828FF',
];

// =============================================================================
// MUTED ROOM_COLORS (mirrors backend/server.py ROOM_COLORS line 260-295 EXACTLY)
// THIS is the source of truth for room banner colors across the entire app.
// "Kitchen" must look the same muted green on every page of every project.
// Keys are lowercased, trimmed; right-hand side values come straight from the
// backend dict. Any new entry MUST be added on both sides.
// =============================================================================
export const ROOM_COLORS = {
  'living room': '#7A5A8A',
  'kitchen': '#5A7A5A',
  'master bedroom': '#8A5A7A',
  'bedroom 2': '#7A6A5A',
  'bedroom 3': '#5A6A8A',
  'bathroom': '#6A8A5A',
  'master bathroom': '#8A6A5A',
  'primary bathroom': '#6A5A8A',
  'powder room': '#5A8A6A',
  'dining room': '#8A7A5A',
  'office': '#5A5A8A',
  'home office': '#5A5A8A',
  'family room': '#7A5A6A',
  'basement': '#6A6A5A',
  'laundry room': '#5A7A6A',
  'mudroom': '#7A6A6A',
  'pantry': '#6A5A6A',
  'closet': '#5A6A7A',
  'primary closet': '#5A6A7A',
  'walk-in closet': '#8A6A7A',
  'guest room': '#8A5A6A',
  'guest bedroom': '#8A5A6A',
  'playroom': '#6A7A5A',
  'library': '#5A8A7A',
  'wine cellar': '#9A6A8A',
  'garage': '#8A7A6A',
  'patio': '#6A8A7A',
  'deck': '#7A8A6A',
  'screened porch': '#8A7A6A',
  'home gym': '#6A7A8A',
  'foyer': '#9A7A5A',
  'pool area': '#5A9A7A',
  'primary bedroom': '#8A5A7A',
  'primary sitting area': '#7A5A6A',
  'sitting area': '#7A5A6A',
  'guest bathroom': '#6A8A5A',
  'jack and jill bathroom': '#6A8A5A',
  'jack and jill': '#6A8A5A',
  'bunk room': '#7A6A5A',
  'home theater': '#5A8A7A',
  'media room': '#5A8A7A',
  'bar area': '#9A6A8A',
  'breakfast nook': '#8A7A5A',
  'scullery': '#6A5A6A',
  'ladies den': '#7A5A6A',
  'man cave': '#5A5A8A',
  'tv room': '#7A5A8A',
  'music room': '#7A5A8A',
  'landing': '#7A6A6A',
  'outdoor kitchen': '#6A8A7A',
  'back porch': '#7A8A6A',
};

// Default fallback when a room name isn't in the dict above.
const DEFAULT_MUTED_FALLBACK = '#7A5A8A';

/**
 * THE canonical room → muted color lookup.
 * Always returns the muted color from ROOM_COLORS dict by lowercased name.
 * Falls back to DEFAULT_MUTED_FALLBACK if the name isn't recognized.
 *
 * Use THIS in every room banner — Builder Portal, Photos, Manager, etc.
 * It ignores any bright DB-stored room.color and guarantees "Kitchen" looks
 * the same muted green on every page of every project.
 */
export const getMutedRoomColor = (roomName) => {
  if (!roomName) return DEFAULT_MUTED_FALLBACK;
  const key = String(roomName).toLowerCase().trim();
  return ROOM_COLORS[key] || DEFAULT_MUTED_FALLBACK;
};

/**
 * Get a unique, DETERMINISTIC color for a room based on its NAME.
 * Same name → same color, every page, every project, forever.
 * The optional roomIndex is ignored unless roomName is missing.
 *
 * IMPORTANT: callers should preferably pass `room.color` (from DB) first
 * and ONLY use this as a fallback. This function exists so that if a room
 * has no DB color, "Living Room" still gets the same color on every page
 * (FFE, Checklist, Photos, Walkthrough, Builder Portal).
 */
export const getRoomColor = (roomName, roomIndex = 0) => {
  // ALWAYS hash by name first when name is provided so the color is
  // consistent across every page that shows this room.
  if (roomName) {
    let hash = 0;
    const str = String(roomName).toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return DISTINCT_ROOM_COLORS[Math.abs(hash) % DISTINCT_ROOM_COLORS.length];
  }
  // Final fallback: by index (only when name is empty)
  if (typeof roomIndex === 'number' && roomIndex >= 0) {
    return DISTINCT_ROOM_COLORS[roomIndex % DISTINCT_ROOM_COLORS.length];
  }
  return DISTINCT_ROOM_COLORS[0];
};

/**
 * Get color by index directly
 */
export const getColorByIndex = (index) => {
  return DISTINCT_ROOM_COLORS[index % DISTINCT_ROOM_COLORS.length];
};

/**
 * Canonical "muted gradient" room-header style used by the Admin CHECKLIST.
 * The Checklist (the source-of-truth visual reference) wraps every room in a
 * 135deg gradient with edge highlights + a heavy inset shadow that visually
 * darkens the saturated palette colors so text stays readable.
 *
 * Use this EVERYWHERE we render a room banner (FFE, Builder Portal photos,
 * Builder Portal scope manager, etc.) so admin and builder views match the
 * Checklist exactly. Pass the resolved roomColor (e.g.
 * `room.color || getRoomColor(room.name)`).
 */
export const getMutedRoomHeaderStyle = (roomColor) => {
  const c = roomColor || DISTINCT_ROOM_COLORS[0];
  return {
    background: `linear-gradient(135deg, ${c}FF 0%, ${c}AA 20%, ${c} 40%, ${c}AA 80%, ${c}FF 100%)`,
    boxShadow: `0 0 35px ${c}80, inset 0 0 70px rgba(255, 255, 255, 0.16), inset 0 0 110px rgba(0, 0, 0, 0.5)`,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)',
  };
};

export const getCategoryColor = () => '#065F46';
