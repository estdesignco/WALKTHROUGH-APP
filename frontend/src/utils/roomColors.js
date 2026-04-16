// MASTER ROOM COLOR PALETTE - 96 GOLDEN-ANGLE DISTRIBUTED COLORS
// Uses golden angle (137.5°) hue rotation for MAXIMUM visual distance between consecutive colors
// No two adjacent rooms will ever look similar

export const DISTINCT_ROOM_COLORS = [
  '#ED2A2A', '#05DF45', '#B062E8', '#EDD52A', '#05BBDF', '#E862AB', '#5BED2A', '#0F05DF',
  '#E88F62', '#2AEDA4', '#CD05DF', '#CCE862', '#2A8BED', '#DF0532', '#62E86E', '#742AED',
  '#DF9705', '#62E8E3', '#ED2ABC', '#69DF05', '#6278E8', '#ED432A', '#05DF61', '#C262E8',
  '#EDED2A', '#059FDF', '#E8629A', '#42ED2A', '#2A05DF', '#E8A062', '#2AEDBD', '#DF05D5',
  '#BBE862', '#2A73ED', '#DF0516', '#62E87F', '#8D2AED', '#DFB305', '#62DCE8', '#ED2AA3',
  '#4DDF05', '#6267E8', '#ED5C2A', '#05DF7D', '#D362E8', '#D4ED2A', '#0583DF', '#E86289',
  '#2AED2B', '#4605DF', '#E8B162', '#2AEDD6', '#DF05B9', '#AAE862', '#2A5AED', '#DF1005',
  '#62E890', '#A62AED', '#DFCF05', '#62CBE8', '#ED2A8A', '#31DF05', '#6F62E8', '#ED752A',
  '#05DF98', '#E462E8', '#BBED2A', '#0567DF', '#E86277', '#2AED44', '#6205DF', '#E8C262',
  '#2AEBED', '#DF059E', '#99E862', '#2A41ED', '#DF2C05', '#62E8A1', '#BF2AED', '#D4DF05',
  '#62BAE8', '#ED2A71', '#15DF05', '#8062E8', '#ED8E2A', '#05DFB4', '#E862DB', '#A2ED2A',
  '#054BDF', '#E86266', '#2AED5D', '#7E05DF', '#E8D462', '#2AD2ED', '#DF0582', '#88E862',
];

/**
 * Get a unique color for a room based on its index
 */
export const getRoomColor = (roomName, roomIndex = 0) => {
  if (typeof roomIndex === 'number' && roomIndex >= 0) {
    return DISTINCT_ROOM_COLORS[roomIndex % DISTINCT_ROOM_COLORS.length];
  }
  if (!roomName) return DISTINCT_ROOM_COLORS[0];
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
