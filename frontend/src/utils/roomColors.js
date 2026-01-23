// MASTER ROOM COLOR PALETTE - DISTINCT COLORS FOR DARK THEME
// Used across ENTIRE app - Mobile & Desktop
// Each room gets a UNIQUE, DISTINCT color

// 30 COMPLETELY DISTINCT colors - NO REPEATS within a project
export const DISTINCT_ROOM_COLORS = [
  '#E67E22',  // 1.  Carrot Orange
  '#3498DB',  // 2.  Bright Blue
  '#27AE60',  // 3.  Emerald Green
  '#9B59B6',  // 4.  Amethyst Purple
  '#F1C40F',  // 5.  Sunflower Yellow
  '#E74C3C',  // 6.  Alizarin Red
  '#1ABC9C',  // 7.  Turquoise
  '#34495E',  // 8.  Wet Asphalt
  '#E91E63',  // 9.  Pink
  '#00BCD4',  // 10. Cyan
  '#8BC34A',  // 11. Light Green
  '#FF9800',  // 12. Orange
  '#673AB7',  // 13. Deep Purple
  '#009688',  // 14. Teal
  '#CDDC39',  // 15. Lime
  '#FF5722',  // 16. Deep Orange
  '#607D8B',  // 17. Blue Grey
  '#795548',  // 18. Brown
  '#4CAF50',  // 19. Green
  '#2196F3',  // 20. Blue
  '#FFC107',  // 21. Amber
  '#03A9F4',  // 22. Light Blue
  '#8D6E63',  // 23. Brown (lighter)
  '#78909C',  // 24. Blue Grey (lighter)
  '#AED581',  // 25. Light Green (lighter)
  '#FFB74D',  // 26. Orange (lighter)
  '#BA68C8',  // 27. Purple (lighter)
  '#4DB6AC',  // 28. Teal (lighter)
  '#A1887F',  // 29. Brown (medium)
  '#90A4AE',  // 30. Blue Grey (medium)
];

// Track color assignments per project to avoid duplicates
const projectColorAssignments = new Map();

/**
 * Get a unique color for a room based on its index within the project
 * @param {string} roomName - The name of the room
 * @param {number} roomIndex - The index of the room in the list (0-based)
 * @param {string} projectId - Optional project ID to scope colors
 */
export const getRoomColor = (roomName, roomIndex = 0, projectId = 'default') => {
  // If roomIndex is provided and valid, use it directly for color selection
  if (typeof roomIndex === 'number' && roomIndex >= 0) {
    return DISTINCT_ROOM_COLORS[roomIndex % DISTINCT_ROOM_COLORS.length];
  }
  
  // Fallback: use room name to get consistent color
  if (!roomName) return DISTINCT_ROOM_COLORS[0];
  
  const lowerName = roomName.toLowerCase().trim();
  
  // Get or create project color map
  if (!projectColorAssignments.has(projectId)) {
    projectColorAssignments.set(projectId, new Map());
  }
  const projectColors = projectColorAssignments.get(projectId);
  
  // If we've seen this room name before in this project, return its assigned color
  if (projectColors.has(lowerName)) {
    return projectColors.get(lowerName);
  }
  
  // Assign the next available color
  const nextIndex = projectColors.size % DISTINCT_ROOM_COLORS.length;
  const color = DISTINCT_ROOM_COLORS[nextIndex];
  projectColors.set(lowerName, color);
  
  return color;
};

/**
 * Reset color assignments for a project (call when rooms are reordered)
 */
export const resetProjectColors = (projectId = 'default') => {
  projectColorAssignments.delete(projectId);
};

/**
 * Get color by index directly (for when you know the room's position)
 */
export const getColorByIndex = (index) => {
  return DISTINCT_ROOM_COLORS[index % DISTINCT_ROOM_COLORS.length];
};

export const getCategoryColor = () => '#065F46';
