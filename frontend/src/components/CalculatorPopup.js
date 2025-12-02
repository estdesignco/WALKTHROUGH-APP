import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';

/**
 * Calculator Popup Modal
 * Shows the appropriate calculator based on item category
 * Calculates cost and returns the total to the parent
 */
const CalculatorPopup = ({ 
  isOpen, 
  onClose, 
  onCalculate, 
  itemName = '',
  categoryName = '',
  currentCost = 0 
}) => {
  const [calculatorType, setCalculatorType] = useState('general');
  const [calculatedCost, setCalculatedCost] = useState(currentCost || 0);
  const [calculatedQty, setCalculatedQty] = useState(0);
  const [qtyLabel, setQtyLabel] = useState('units');
  const [calculatedSize, setCalculatedSize] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Form fields for different calculators - store as strings to avoid input reset issues
  const [formData, setFormData] = useState({
    // General
    costPerUnit: '',
    quantity: '1',
    
    // Wallpaper
    wallWidth: '',
    wallHeight: '',
    rollWidth: '27',
    rollLength: '27',
    patternRepeat: '',
    pricePerRoll: '',
    
    // Drapery/Fabric
    windowWidth: '',
    windowHeight: '',
    fullness: '2.5',
    fabricWidth: '54',
    pricePerYard: '',
    
    // Paint
    roomLength: '',
    roomWidth: '',
    ceilingHeight: '8',
    coats: '2',
    pricePerGallon: '',
    
    // Tile/Flooring
    areaLength: '',
    areaWidth: '',
    tileSize: '12',
    groutWidth: '0.125',
    wasteFactor: '10',
    pricePerSqFt: '',
    
    // Hardware
    numberOfPieces: '1',
    pricePerPiece: '',
    
    // Upholstery
    pieceType: 'sofa',
    pieceWidth: '',
    pieceDepth: '',
    pieceHeight: '',
    cushionCount: '3',
    fabricPricePerYard: '',
    
    // Drapery - additional fields
    panelsNeeded: '',
    pricePerPanel: ''
  });

  // Helper function to safely parse numeric values
  const parseValue = (value, defaultValue = 0) => {
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  const parseIntValue = (value, defaultValue = 0) => {
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Auto-detect calculator type from category/item name
  const detectedType = React.useMemo(() => {
    const itemLower = itemName.toLowerCase();
    const categoryLower = categoryName.toLowerCase();
    
    if (itemLower.includes('wallpaper') || itemLower.includes('wall covering') || 
        categoryLower.includes('wall treatment') || categoryLower.includes('wallpaper')) {
      return 'wallpaper';
    } else if (itemLower.includes('drapery') || itemLower.includes('drape') || 
               itemLower.includes('curtain') || itemLower.includes('fabric') ||
               categoryLower.includes('window') || categoryLower.includes('textile') ||
               categoryLower.includes('soft good')) {
      return 'drapery';
    } else if (itemLower.includes('paint') || categoryLower.includes('paint')) {
      return 'paint';
    } else if (itemLower.includes('tile') || itemLower.includes('flooring') || 
               itemLower.includes('floor') || itemLower.includes('carpet') ||
               categoryLower.includes('flooring') || categoryLower.includes('tile')) {
      return 'tile';
    } else if (itemLower.includes('hardware') || itemLower.includes('knob') || 
               itemLower.includes('pull') || itemLower.includes('handle') ||
               categoryLower.includes('hardware')) {
      return 'hardware';
    } else if (itemLower.includes('sofa') || itemLower.includes('chair') || 
               itemLower.includes('ottoman') || itemLower.includes('upholster') ||
               itemLower.includes('reupholster') || categoryLower.includes('furniture')) {
      return 'upholstery';
    } else {
      return 'general';
    }
  }, [itemName, categoryName]);
  
  // Set calculator type when detected type changes
  useEffect(() => {
    setCalculatorType(detectedType);
  }, [detectedType]);

  // Calculate cost based on calculator type
  const calculate = () => {
    let total = 0;
    let qty = 0;
    let unitLabel = 'units';
    let sizeStr = '';
    
    switch (calculatorType) {
      case 'wallpaper':
        const wallArea = parseValue(formData.wallWidth) * parseValue(formData.wallHeight);
        const usableRollArea = (parseValue(formData.rollWidth) / 12) * (parseValue(formData.rollLength) - parseValue(formData.patternRepeat));
        const rollsNeeded = Math.ceil(wallArea / usableRollArea) || 0;
        qty = rollsNeeded;
        unitLabel = 'rolls';
        total = rollsNeeded * parseValue(formData.pricePerRoll);
        sizeStr = `${parseValue(formData.wallWidth)}' × ${parseValue(formData.wallHeight)}'`;
        break;
        
      case 'drapery':
        const widthYards = (parseValue(formData.windowWidth) * parseValue(formData.fullness, 2.5)) / 36;
        const heightYards = (parseValue(formData.windowHeight) + 12) / 36; // Add 12" for hems
        const panelsCalc = Math.ceil(widthYards * 36 / parseValue(formData.fabricWidth, 54));
        const yardsNeeded = Math.ceil(panelsCalc * heightYards) || 0;
        
        // For drapery: qty = panels, size = yards
        qty = panelsCalc;
        unitLabel = 'panels';
        sizeStr = `${yardsNeeded} yards fabric`;
        
        // Price can be per yard OR per panel
        if (formData.pricePerPanel && parseValue(formData.pricePerPanel) > 0) {
          total = panelsCalc * parseValue(formData.pricePerPanel);
        } else {
          total = yardsNeeded * parseValue(formData.pricePerYard);
        }
        break;
        
      case 'paint':
        const wallSqFt = 2 * (parseValue(formData.roomLength) + parseValue(formData.roomWidth)) * parseValue(formData.ceilingHeight, 8);
        const sqFtPerGallon = 350;
        const gallonsNeeded = Math.ceil((wallSqFt * parseIntValue(formData.coats, 2)) / sqFtPerGallon) || 0;
        qty = gallonsNeeded;
        unitLabel = 'gallons';
        total = gallonsNeeded * parseValue(formData.pricePerGallon);
        sizeStr = `${Math.round(wallSqFt)} sq ft`;
        break;
        
      case 'tile':
        const areaSqFt = parseValue(formData.areaLength) * parseValue(formData.areaWidth);
        const withWaste = Math.ceil(areaSqFt * (1 + parseValue(formData.wasteFactor, 10) / 100)) || 0;
        qty = withWaste;
        unitLabel = 'sq ft';
        total = withWaste * parseValue(formData.pricePerSqFt);
        sizeStr = `${parseValue(formData.areaLength)}' × ${parseValue(formData.areaWidth)}'`;
        break;
        
      case 'hardware':
        qty = parseIntValue(formData.numberOfPieces, 1);
        unitLabel = 'pieces';
        total = qty * parseValue(formData.pricePerPiece);
        break;
        
      case 'upholstery':
        // Upholstery calculation: estimate fabric needed to cover furniture
        const width = parseValue(formData.pieceWidth);
        const depth = parseValue(formData.pieceDepth);
        const height = parseValue(formData.pieceHeight);
        const cushions = parseIntValue(formData.cushionCount, 3);
        
        // Rough estimate: (W+D)*2 + H*2 for body, plus cushion coverage
        const bodyYards = ((width + depth) * 2 + height * 2) / 36;
        const cushionYards = (cushions * width * depth) / 1296; // sq in to sq yards
        const totalYardsUpholstery = Math.ceil((bodyYards + cushionYards) * 1.2) || 0; // 20% waste
        
        qty = totalYardsUpholstery;
        unitLabel = 'yards';
        total = totalYardsUpholstery * parseValue(formData.fabricPricePerYard);
        sizeStr = `${width}" × ${depth}" × ${height}"`;
        break;
        
      default: // general
        qty = parseIntValue(formData.quantity, 1);
        unitLabel = 'units';
        total = parseValue(formData.costPerUnit) * qty;
    }
    
    setCalculatedCost(Math.round(total * 100) / 100);
    setCalculatedQty(qty);
    setQtyLabel(unitLabel);
    setCalculatedSize(sizeStr);
    return { cost: Math.round(total * 100) / 100, qty, unitLabel, size: sizeStr, remarks };
  };

  const handleApply = () => {
    const result = calculate();
    onCalculate(result.cost, result.qty, result.size, result.remarks);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-[#8B7355]";
  const labelClass = "block text-xs text-stone-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-700 bg-gradient-to-r from-[#8B7355] to-[#6B5745]">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Cost Calculator</h2>
              <p className="text-xs text-white/70">{itemName || 'Calculate Item Cost'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculator Type Selector */}
        <div className="p-4 border-b border-stone-700">
          <label className={labelClass}>Calculator Type</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'general', label: '📝 General' },
              { id: 'wallpaper', label: '🖼️ Wallpaper' },
              { id: 'drapery', label: '🪟 Drapery/Fabric' },
              { id: 'paint', label: '🎨 Paint' },
              { id: 'tile', label: '🔲 Tile/Flooring' },
              { id: 'hardware', label: '🔩 Hardware' },
              { id: 'upholstery', label: '🛋️ Upholstery' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setCalculatorType(type.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  calculatorType === type.id 
                    ? 'bg-[#8B7355] text-white' 
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Form */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {calculatorType === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cost Per Unit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({...formData, costPerUnit: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {calculatorType === 'wallpaper' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Wall Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wallWidth}
                  onChange={(e) => setFormData({...formData, wallWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Wall Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wallHeight}
                  onChange={(e) => setFormData({...formData, wallHeight: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Roll Width (in)</label>
                <input
                  type="number"
                  value={formData.rollWidth}
                  onChange={(e) => setFormData({...formData, rollWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Roll Length (ft)</label>
                <input
                  type="number"
                  value={formData.rollLength}
                  onChange={(e) => setFormData({...formData, rollLength: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Pattern Repeat (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.patternRepeat}
                  onChange={(e) => setFormData({...formData, patternRepeat: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Roll ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerRoll}
                  onChange={(e) => setFormData({...formData, pricePerRoll: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {calculatorType === 'drapery' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Window Width (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.windowWidth}
                  onChange={(e) => setFormData({...formData, windowWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Window Height (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.windowHeight}
                  onChange={(e) => setFormData({...formData, windowHeight: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fullness (2-3x)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.fullness}
                  onChange={(e) => setFormData({...formData, fullness: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fabric Width (in)</label>
                <input
                  type="number"
                  value={formData.fabricWidth}
                  onChange={(e) => setFormData({...formData, fabricWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Yard ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerYard}
                  onChange={(e) => setFormData({...formData, pricePerYard: e.target.value})}
                  className={inputClass}
                  placeholder="Fabric cost"
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Panel ($) <span className="text-xs text-stone-500">(Optional)</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerPanel}
                  onChange={(e) => setFormData({...formData, pricePerPanel: e.target.value})}
                  className={inputClass}
                  placeholder="If pricing by panel"
                />
              </div>
            </div>
          )}

          {calculatorType === 'paint' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Room Length (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.roomLength}
                  onChange={(e) => setFormData({...formData, roomLength: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Room Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.roomWidth}
                  onChange={(e) => setFormData({...formData, roomWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ceiling Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ceilingHeight}
                  onChange={(e) => setFormData({...formData, ceilingHeight: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Number of Coats</label>
                <input
                  type="number"
                  value={formData.coats}
                  onChange={(e) => setFormData({...formData, coats: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Price Per Gallon ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerGallon}
                  onChange={(e) => setFormData({...formData, pricePerGallon: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {calculatorType === 'tile' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Area Length (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.areaLength}
                  onChange={(e) => setFormData({...formData, areaLength: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Area Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.areaWidth}
                  onChange={(e) => setFormData({...formData, areaWidth: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Waste Factor (%)</label>
                <input
                  type="number"
                  value={formData.wasteFactor}
                  onChange={(e) => setFormData({...formData, wasteFactor: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Sq Ft ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerSqFt}
                  onChange={(e) => setFormData({...formData, pricePerSqFt: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {calculatorType === 'hardware' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Number of Pieces</label>
                <input
                  type="number"
                  value={formData.numberOfPieces}
                  onChange={(e) => setFormData({...formData, numberOfPieces: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Piece ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerPiece}
                  onChange={(e) => setFormData({...formData, pricePerPiece: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button and Result */}
        <div className="p-4 border-t border-stone-700 bg-stone-800">
          <button
            onClick={calculate}
            className="w-full mb-3 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculate
          </button>
          
          {/* Results - Show Quantity AND Cost */}
          <div className="space-y-2">
            {calculatedQty > 0 && (
              <div className="flex items-center justify-between bg-[#4a90a4]/20 rounded-lg p-3 border border-[#4a90a4]/30">
                <span className="text-stone-400">Quantity Needed:</span>
                <span className="text-xl font-bold text-[#4a90a4]">{calculatedQty} {qtyLabel}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#8B7355]/20 to-[#6B5745]/20 rounded-lg p-3 border border-[#8B7355]/30">
              <span className="text-stone-400">Total Cost:</span>
              <span className="text-xl font-bold text-[#D4C5A9]">${calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#8B7355] to-[#6B5745] hover:from-[#9B8365] hover:to-[#7B6755] text-white rounded-lg transition-colors font-medium"
          >
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPopup;
