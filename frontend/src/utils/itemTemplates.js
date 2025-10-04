// Common item templates for quick adding

export const ITEM_TEMPLATES = {
  LIGHTING: [
    { name: 'Pendant Light', category: 'LIGHTING', quantity: 1, vendor: '' },
    { name: 'Table Lamp', category: 'LIGHTING', quantity: 2, vendor: '' },
    { name: 'Floor Lamp', category: 'LIGHTING', quantity: 1, vendor: '' },
    { name: 'Chandelier', category: 'LIGHTING', quantity: 1, vendor: '' },
    { name: 'Sconce', category: 'LIGHTING', quantity: 2, vendor: '' },
    { name: 'Ceiling Light', category: 'LIGHTING', quantity: 1, vendor: '' },
  ],
  FURNITURE: [
    { name: 'Sofa', category: 'FURNITURE', quantity: 1, size: '84" W', vendor: '' },
    { name: 'Armchair', category: 'FURNITURE', quantity: 2, size: '32" W', vendor: '' },
    { name: 'Coffee Table', category: 'FURNITURE', quantity: 1, size: '48" x 30"', vendor: '' },
    { name: 'Side Table', category: 'FURNITURE', quantity: 2, size: '24" x 24"', vendor: '' },
    { name: 'Dining Table', category: 'FURNITURE', quantity: 1, size: '72" x 42"', vendor: '' },
    { name: 'Dining Chair', category: 'FURNITURE', quantity: 6, vendor: '' },
    { name: 'Bed Frame', category: 'FURNITURE', quantity: 1, size: 'Queen', vendor: '' },
    { name: 'Nightstand', category: 'FURNITURE', quantity: 2, size: '24" W', vendor: '' },
    { name: 'Dresser', category: 'FURNITURE', quantity: 1, size: '60" W', vendor: '' },
    { name: 'Console Table', category: 'FURNITURE', quantity: 1, size: '60" W', vendor: '' },
    { name: 'Bookshelf', category: 'FURNITURE', quantity: 1, size: '72" H', vendor: '' },
    { name: 'TV Stand', category: 'FURNITURE', quantity: 1, size: '60" W', vendor: '' },
  ],
  TEXTILES: [
    { name: 'Throw Pillow', category: 'TEXTILES', quantity: 4, size: '20" x 20"', vendor: '' },
    { name: 'Throw Blanket', category: 'TEXTILES', quantity: 1, size: '50" x 60"', vendor: '' },
    { name: 'Area Rug', category: 'TEXTILES', quantity: 1, size: '8\' x 10\'', vendor: '' },
    { name: 'Curtains', category: 'TEXTILES', quantity: 2, size: '96" L', vendor: '' },
    { name: 'Duvet Cover', category: 'TEXTILES', quantity: 1, size: 'Queen', vendor: '' },
    { name: 'Bed Sheets', category: 'TEXTILES', quantity: 1, size: 'Queen', vendor: '' },
  ],
  DECOR: [
    { name: 'Wall Art', category: 'DECOR', quantity: 1, size: '36" x 48"', vendor: '' },
    { name: 'Mirror', category: 'DECOR', quantity: 1, size: '30" x 40"', vendor: '' },
    { name: 'Vase', category: 'DECOR', quantity: 1, size: '12" H', vendor: '' },
    { name: 'Candle', category: 'DECOR', quantity: 3, vendor: '' },
    { name: 'Picture Frame', category: 'DECOR', quantity: 3, size: '8" x 10"', vendor: '' },
    { name: 'Decorative Bowl', category: 'DECOR', quantity: 1, vendor: '' },
    { name: 'Plant', category: 'DECOR', quantity: 1, vendor: '' },
  ],
  KITCHEN: [
    { name: 'Bar Stool', category: 'FURNITURE', quantity: 3, size: '30" H', vendor: '' },
    { name: 'Pendant Light', category: 'LIGHTING', quantity: 3, vendor: '' },
    { name: 'Kitchen Island', category: 'FURNITURE', quantity: 1, size: '72" x 36"', vendor: '' },
  ],
  BATHROOM: [
    { name: 'Vanity', category: 'FURNITURE', quantity: 1, size: '48" W', vendor: '' },
    { name: 'Mirror', category: 'DECOR', quantity: 1, size: '30" x 36"', vendor: '' },
    { name: 'Sconce', category: 'LIGHTING', quantity: 2, vendor: '' },
    { name: 'Towel Bar', category: 'HARDWARE', quantity: 1, size: '24"', vendor: '' },
    { name: 'Shower Curtain', category: 'TEXTILES', quantity: 1, size: '72" x 72"', vendor: '' },
  ],
};

export const getTemplatesByRoom = (roomName) => {
  const room = roomName.toLowerCase();
  
  if (room.includes('living') || room.includes('family')) {
    return [...ITEM_TEMPLATES.FURNITURE.slice(0, 6), ...ITEM_TEMPLATES.LIGHTING.slice(0, 3), ...ITEM_TEMPLATES.TEXTILES.slice(0, 3), ...ITEM_TEMPLATES.DECOR.slice(0, 4)];
  }
  
  if (room.includes('bedroom')) {
    return [...ITEM_TEMPLATES.FURNITURE.slice(6, 9), ...ITEM_TEMPLATES.LIGHTING.slice(0, 2), ...ITEM_TEMPLATES.TEXTILES.slice(3, 6), ...ITEM_TEMPLATES.DECOR.slice(0, 2)];
  }
  
  if (room.includes('kitchen')) {
    return ITEM_TEMPLATES.KITCHEN;
  }
  
  if (room.includes('bathroom')) {
    return ITEM_TEMPLATES.BATHROOM;
  }
  
  if (room.includes('dining')) {
    return [...ITEM_TEMPLATES.FURNITURE.slice(4, 6), ...ITEM_TEMPLATES.LIGHTING.slice(3, 4), ...ITEM_TEMPLATES.DECOR];
  }
  
  // Default: return common items
  return [...ITEM_TEMPLATES.FURNITURE.slice(0, 3), ...ITEM_TEMPLATES.LIGHTING.slice(0, 2), ...ITEM_TEMPLATES.TEXTILES.slice(0, 2), ...ITEM_TEMPLATES.DECOR.slice(0, 3)];
};

export const getAllTemplates = () => {
  return Object.values(ITEM_TEMPLATES).flat();
};