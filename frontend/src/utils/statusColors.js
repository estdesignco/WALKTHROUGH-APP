// MASTER STATUS COLOR PALETTE - EVERY STATUS HAS A TRULY UNIQUE COLOR
// Used across ALL components: Checklist, FFE, Status Breakdown, Pie Charts
// Colors chosen from across the entire color wheel - no two are similar

export const STATUS_COLORS = {
  '':                       '#6B7280',  // Gray (blank/unset)
  'TO BE PICKED':           '#6B7280',  // Gray
  'TO BE SELECTED':         '#94A3B8',  // Silver-slate
  'RESEARCHING':            '#2563EB',  // Vivid blue
  'PENDING APPROVAL':       '#F59E0B',  // Amber-yellow
  'APPROVED':               '#16A34A',  // Kelly green
  'ORDERED':                '#0891B2',  // Teal-cyan
  'ORDER SAMPLES':          '#7C3AED',  // Vivid violet
  'SAMPLES ORDERED':        '#4338CA',  // Deep indigo
  'CHANGE OUT':             '#E11D48',  // Crimson red
  'REPLACEMENT':            '#FF4500',  // Orange-red
  'ASK NEIL':               '#CA8A04',  // Dark gold
  'ASK CHARLENE':           '#BE185D',  // Deep pink
  'ASK JALA':               '#A21CAF',  // Magenta-purple
  'ASK AVERI':              '#6D28D9',  // Rich purple
  'GET QUOTE':              '#0E7490',  // Dark cyan
  'WAITING ON QT':          '#EA580C',  // Burnt orange
  'READY FOR PRESENTATION': '#65A30D',  // Yellow-green/lime
  'ON HOLD':                '#DC2626',  // Bright red
  'PICKED':                 '#D97706',  // Dark amber
  'CONFIRMED':              '#047857',  // Dark emerald
  'IN PRODUCTION':          '#B45309',  // Brown-orange
  'SHIPPED':                '#0284C7',  // Sky blue
  'IN TRANSIT':             '#7E22CE',  // Purple
  'OUT FOR DELIVERY':       '#4F46E5',  // Indigo
  'DELIVERED TO RECEIVER':  '#9333EA',  // Bright purple
  'DELIVERED TO JOB SITE':  '#C026D3',  // Fuchsia
  'RECEIVED':               '#059669',  // Emerald
  'READY FOR INSTALL':      '#14B8A6',  // Teal
  'INSTALLING':             '#15803D',  // Forest green
  'INSTALLED':              '#166534',  // Dark green
  'BACKORDERED':            '#991B1B',  // Maroon
  'DAMAGED':                '#7F1D1D',  // Dark maroon
  'RETURNED':               '#C2410C',  // Rust orange
  'CANCELLED':              '#78350F',  // Brown
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6B7280';
};
