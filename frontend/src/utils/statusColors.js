// MASTER STATUS COLOR PALETTE - EVERY STATUS HAS A UNIQUE COLOR
// Used across ALL components: Checklist, FFE, Status Breakdown, Pie Charts

export const STATUS_COLORS = {
  '': '#6B7280',                        // Gray - Blank
  'TO BE SELECTED': '#94A3B8',          // Slate
  'RESEARCHING': '#3B82F6',             // Blue
  'PENDING APPROVAL': '#F59E0B',        // Amber
  'APPROVED': '#10B981',                // Emerald
  'ORDERED': '#06B6D4',                 // Cyan
  'ORDER SAMPLES': '#818CF8',           // Violet
  'SAMPLES ORDERED': '#6D28D9',         // Deep purple
  'CHANGE OUT': '#F472B6',              // Pink
  'REPLACEMENT': '#FF4500',             // Orange-Red
  'ASK NEIL': '#FBBF24',               // Gold
  'ASK CHARLENE': '#E11D48',            // Rose-red
  'ASK JALA': '#DB2777',               // Magenta-pink
  'ASK AVERI': '#9333EA',              // Bright purple
  'GET QUOTE': '#22D3EE',              // Light cyan
  'WAITING ON QT': '#EA580C',          // Dark orange
  'READY FOR PRESENTATION': '#84CC16', // Lime
  'ON HOLD': '#EF4444',                // Bright red
  'PICKED': '#FFD700',                 // Gold
  'CONFIRMED': '#059669',              // Dark emerald
  'IN PRODUCTION': '#D97706',          // Dark amber
  'SHIPPED': '#0EA5E9',                // Sky blue
  'IN TRANSIT': '#7C3AED',             // Purple
  'OUT FOR DELIVERY': '#4F46E5',       // Indigo
  'DELIVERED TO RECEIVER': '#A855F7',  // Light purple
  'DELIVERED TO JOB SITE': '#C026D3',  // Fuchsia
  'RECEIVED': '#D946EF',               // Magenta
  'READY FOR INSTALL': '#14B8A6',      // Teal
  'INSTALLING': '#16A34A',             // Green
  'INSTALLED': '#65A30D',              // Yellow-green
  'BACKORDERED': '#DC2626',            // Dark red
  'DAMAGED': '#991B1B',                // Maroon
  'RETURNED': '#FB923C',               // Light orange
  'CANCELLED': '#78350F'               // Brown
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6B7280';
};
