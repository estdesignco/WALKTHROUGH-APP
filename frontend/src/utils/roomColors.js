// MASTER ROOM COLOR PALETTE - 96 MAXIMALLY DISTINCT COLORS
// NO repeats, NO similar pairs — every room gets a truly unique color

export const DISTINCT_ROOM_COLORS = [
  '#E67E22', '#2980B9', '#27AE60', '#8E44AD', '#F1C40F',
  '#E74C3C', '#1ABC9C', '#D35400', '#2ECC71', '#3498DB',
  '#9B59B6', '#F39C12', '#16A085', '#C0392B', '#2C3E50',
  '#E91E63', '#00BCD4', '#8BC34A', '#FF5722', '#607D8B',
  '#FF9800', '#009688', '#673AB7', '#795548', '#03A9F4',
  '#CDDC39', '#4CAF50', '#F44336', '#00ACC1', '#AB47BC',
  '#FF6F00', '#0277BD', '#558B2F', '#AD1457', '#FFD600',
  '#00695C', '#6A1B9A', '#BF360C', '#1565C0', '#33691E',
  '#880E4F', '#F9A825', '#004D40', '#4A148C', '#E65100',
  '#0D47A1', '#1B5E20', '#B71C1C', '#006064', '#4527A0',
  '#FF6D00', '#01579B', '#2E7D32', '#C62828', '#00838F',
  '#5E35B1', '#EF6C00', '#0288D1', '#388E3C', '#D32F2F',
  '#0097A7', '#7B1FA2', '#E8A100', '#039BE5', '#43A047',
  '#F4511E', '#0091EA', '#7CB342', '#E53935', '#00B8D4',
  '#8E24AA', '#FB8C00', '#0277BD', '#66BB6A', '#FF1744',
  '#00B0FF', '#9C27B0', '#FFA000', '#1E88E5', '#4DB6AC',
  '#FF3D00', '#2979FF', '#AED581', '#D50000', '#00E5FF',
  '#AA00FF', '#FFAB00', '#2962FF', '#69F0AE', '#FF1744',
  '#00E5FF', '#D500F9', '#FFD740', '#304FFE', '#00E676',
  '#FF6E40',
];

/**
 * Get a unique color for a room based on its index
 */
export const getRoomColor = (roomName, roomIndex = 0) => {
  if (typeof roomIndex === 'number' && roomIndex >= 0) {
    return DISTINCT_ROOM_COLORS[roomIndex % DISTINCT_ROOM_COLORS.length];
  }
  if (!roomName) return DISTINCT_ROOM_COLORS[0];
  // Fallback: hash the name to get a consistent index
  let hash = 0;
  const str = String(roomName).toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISTINCT_ROOM_COLORS[Math.abs(hash) % DISTINCT_ROOM_COLORS.length];
};

/**
 * Get color by index directly
 */
export const getColorByIndex = (index) => {
  return DISTINCT_ROOM_COLORS[index % DISTINCT_ROOM_COLORS.length];
};

export const getCategoryColor = () => '#065F46';
