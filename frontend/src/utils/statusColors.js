// MASTER STATUS COLOR PALETTE - COMPLETELY DISTINCT HUES
// Used across ALL components: Checklist, FFE, Status Breakdown, Pie Charts

export const STATUS_COLORS = {
  '': '#6B7280',                        // Gray - Blank
  'TO BE SELECTED': '#94A3B8',          // Light slate
  'RESEARCHING': '#3B82F6',             // Bright blue
  'PENDING APPROVAL': '#F59E0B',        // Amber/Yellow
  'APPROVED': '#10B981',                // Emerald green
  'ORDERED': '#06B6D4',                 // Cyan (NOT green)
  'ORDER SAMPLES': '#818CF8',           // Violet - NEW
  'CHANGE OUT': '#F472B6',              // Pink - NEW
  'ASK NEIL': '#FBBF24',                // Amber/Yellow - NEW
  'ASK JALA': '#EC4899',                // Pink - NEW
  'PICKED': '#FFD700',                  // Gold
  'CONFIRMED': '#84CC16',               // Lime (yellow-green)
  'IN PRODUCTION': '#F97316',           // Orange
  'SHIPPED': '#0EA5E9',                 // Sky blue
  'IN TRANSIT': '#8B5CF6',              // Purple
  'OUT FOR DELIVERY': '#6366F1',        // Indigo
  'DELIVERED TO RECEIVER': '#A855F7',   // Light purple
  'DELIVERED TO JOB SITE': '#EC4899',   // Pink
  'RECEIVED': '#D946EF',                // Magenta
  'READY FOR INSTALL': '#14B8A6',       // Teal
  'INSTALLING': '#22C55E',              // Green (different from approved)
  'INSTALLED': '#65A30D',               // Yellow-green
  'ON HOLD': '#EF4444',                 // Bright red
  'BACKORDERED': '#DC2626',             // Dark red
  'DAMAGED': '#991B1B',                 // Maroon
  'RETURNED': '#FB923C',                // Light orange
  'CANCELLED': '#7C2D12'                // Brown-red
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6B7280';
};
