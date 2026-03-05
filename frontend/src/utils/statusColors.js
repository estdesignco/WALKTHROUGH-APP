// MASTER STATUS COLOR PALETTE - EVERY STATUS IS A COMPLETELY DIFFERENT COLOR
// These colors are picked from opposite ends of the color wheel
// NO two colors are even close to each other

export const STATUS_COLORS = {
  '':                       '#6B7280',  // Gray
  'TO BE PICKED':           '#6B7280',  // Gray
  'TO BE SELECTED':         '#94A3B8',  // Light gray
  'RESEARCHING':            '#0000FF',  // Pure blue
  'PENDING APPROVAL':       '#E6B800',  // Dark yellow
  'APPROVED':               '#00CC00',  // Bright green
  'ORDERED':                '#FF6600',  // Bright orange
  'ORDER SAMPLES':          '#8B00FF',  // Violet
  'SAMPLES ORDERED':        '#00CED1',  // Dark turquoise
  'CHANGE OUT':             '#FF0000',  // Pure red
  'REPLACEMENT':            '#FF1493',  // Deep pink
  'ASK NEIL':               '#FFD700',  // Gold
  'ASK CHARLENE':           '#DC143C',  // Crimson
  'ASK JALA':               '#FF00FF',  // Magenta
  'ASK AVERI':              '#4B0082',  // Indigo
  'GET QUOTE':              '#00FF7F',  // Spring green
  'WAITING ON QT':          '#FF4500',  // Red-orange
  'READY FOR PRESENTATION': '#32CD32',  // Lime green
  'ON HOLD':                '#B22222',  // Firebrick red
  'PICKED':                 '#1E90FF',  // Dodger blue
  'CONFIRMED':              '#228B22',  // Forest green
  'IN PRODUCTION':          '#DAA520',  // Goldenrod
  'SHIPPED':                '#4169E1',  // Royal blue
  'IN TRANSIT':             '#9400D3',  // Dark violet
  'OUT FOR DELIVERY':       '#FF8C00',  // Dark orange
  'DELIVERED TO RECEIVER':  '#2E8B57',  // Sea green
  'DELIVERED TO JOB SITE':  '#C71585',  // Medium violet-red
  'RECEIVED':               '#008B8B',  // Dark cyan
  'READY FOR INSTALL':      '#20B2AA',  // Light sea green
  'INSTALLING':             '#ADFF2F',  // Green-yellow
  'INSTALLED':              '#006400',  // Dark green
  'BACKORDERED':            '#8B0000',  // Dark red
  'DAMAGED':                '#800000',  // Maroon
  'RETURNED':               '#CD853F',  // Peru/tan
  'CANCELLED':              '#696969',  // Dim gray
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6B7280';
};
