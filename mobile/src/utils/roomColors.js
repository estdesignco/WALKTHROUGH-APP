// MASTER ROOM COLOR PALETTE - DISTINCT COLORS FOR DARK THEME
// Used across ENTIRE app - Mobile & Desktop (MUST MATCH /app/frontend/src/utils/roomColors.js)
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

/**
 * Get color by index directly (for when you know the room's position)
 */
export const getColorByIndex = (index) => {
  return DISTINCT_ROOM_COLORS[index % DISTINCT_ROOM_COLORS.length];
};

export default {
  DISTINCT_ROOM_COLORS,
  getColorByIndex
};
