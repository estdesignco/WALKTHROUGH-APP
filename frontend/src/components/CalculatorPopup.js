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
  
  // Form fields for different calculators
  const [formData, setFormData] = useState({
    // General
    costPerUnit: 0,
    quantity: 1,
    
    // Wallpaper
    wallWidth: 0,
    wallHeight: 0,
    rollWidth: 27,
    rollLength: 27,
    patternRepeat: 0,
    pricePerRoll: 0,
    
    // Drapery/Fabric
    windowWidth: 0,
    windowHeight: 0,
    fullness: 2.5,
    fabricWidth: 54,
    pricePerYard: 0,
    
    // Paint
    roomLength: 0,
    roomWidth: 0,
    ceilingHeight: 8,
    coats: 2,
    pricePerGallon: 0,
    
    // Tile/Flooring
    areaLength: 0,
    areaWidth: 0,
    tileSize: 12,
    groutWidth: 0.125,
    wasteFactor: 10,
    pricePerSqFt: 0,
    
    // Hardware
    numberOfPieces: 1,
    pricePerPiece: 0
  });

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
    
    switch (calculatorType) {
      case 'wallpaper':
        const wallArea = formData.wallWidth * formData.wallHeight;
        const usableRollArea = (formData.rollWidth / 12) * (formData.rollLength - formData.patternRepeat);
        const rollsNeeded = Math.ceil(wallArea / usableRollArea);
        total = rollsNeeded * formData.pricePerRoll;
        break;
        
      case 'drapery':
        const widthYards = (formData.windowWidth * formData.fullness) / 36;
        const heightYards = (formData.windowHeight + 12) / 36; // Add 12" for hems
        const panels = Math.ceil(widthYards * 36 / formData.fabricWidth);
        const yardsNeeded = panels * heightYards;
        total = Math.ceil(yardsNeeded) * formData.pricePerYard;
        break;
        
      case 'paint':
        const wallSqFt = 2 * (formData.roomLength + formData.roomWidth) * formData.ceilingHeight;
        const sqFtPerGallon = 350;
        const gallonsNeeded = Math.ceil((wallSqFt * formData.coats) / sqFtPerGallon);
        total = gallonsNeeded * formData.pricePerGallon;
        break;
        
      case 'tile':
        const areaSqFt = formData.areaLength * formData.areaWidth;
        const withWaste = areaSqFt * (1 + formData.wasteFactor / 100);
        total = withWaste * formData.pricePerSqFt;
        break;
        
      case 'hardware':
        total = formData.numberOfPieces * formData.pricePerPiece;
        break;
        
      default: // general
        total = formData.costPerUnit * formData.quantity;
    }
    
    setCalculatedCost(Math.round(total * 100) / 100);
    return Math.round(total * 100) / 100;
  };

  const handleApply = () => {
    const total = calculate();
    onCalculate(total);
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
              { id: 'hardware', label: '🔩 Hardware' }
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
                  onChange={(e) => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
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
                  onChange={(e) => setFormData({...formData, wallWidth: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Wall Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wallHeight}
                  onChange={(e) => setFormData({...formData, wallHeight: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Roll Width (in)</label>
                <input
                  type="number"
                  value={formData.rollWidth}
                  onChange={(e) => setFormData({...formData, rollWidth: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Roll Length (ft)</label>
                <input
                  type="number"
                  value={formData.rollLength}
                  onChange={(e) => setFormData({...formData, rollLength: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Pattern Repeat (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.patternRepeat}
                  onChange={(e) => setFormData({...formData, patternRepeat: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Roll ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerRoll}
                  onChange={(e) => setFormData({...formData, pricePerRoll: parseFloat(e.target.value) || 0})}
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
                  onChange={(e) => setFormData({...formData, windowWidth: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Window Height (in)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.windowHeight}
                  onChange={(e) => setFormData({...formData, windowHeight: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fullness (2-3x)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.fullness}
                  onChange={(e) => setFormData({...formData, fullness: parseFloat(e.target.value) || 2.5})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fabric Width (in)</label>
                <input
                  type="number"
                  value={formData.fabricWidth}
                  onChange={(e) => setFormData({...formData, fabricWidth: parseFloat(e.target.value) || 54})}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Price Per Yard ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerYard}
                  onChange={(e) => setFormData({...formData, pricePerYard: parseFloat(e.target.value) || 0})}
                  className={inputClass}
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
                  onChange={(e) => setFormData({...formData, roomLength: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Room Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.roomWidth}
                  onChange={(e) => setFormData({...formData, roomWidth: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ceiling Height (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ceilingHeight}
                  onChange={(e) => setFormData({...formData, ceilingHeight: parseFloat(e.target.value) || 8})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Number of Coats</label>
                <input
                  type="number"
                  value={formData.coats}
                  onChange={(e) => setFormData({...formData, coats: parseInt(e.target.value) || 2})}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Price Per Gallon ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerGallon}
                  onChange={(e) => setFormData({...formData, pricePerGallon: parseFloat(e.target.value) || 0})}
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
                  onChange={(e) => setFormData({...formData, areaLength: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Area Width (ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.areaWidth}
                  onChange={(e) => setFormData({...formData, areaWidth: parseFloat(e.target.value) || 0})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Waste Factor (%)</label>
                <input
                  type="number"
                  value={formData.wasteFactor}
                  onChange={(e) => setFormData({...formData, wasteFactor: parseFloat(e.target.value) || 10})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Sq Ft ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerSqFt}
                  onChange={(e) => setFormData({...formData, pricePerSqFt: parseFloat(e.target.value) || 0})}
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
                  onChange={(e) => setFormData({...formData, numberOfPieces: parseInt(e.target.value) || 1})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price Per Piece ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerPiece}
                  onChange={(e) => setFormData({...formData, pricePerPiece: parseFloat(e.target.value) || 0})}
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
          
          <div className="flex items-center justify-between bg-gradient-to-r from-[#8B7355]/20 to-[#6B5745]/20 rounded-lg p-4 border border-[#8B7355]/30">
            <span className="text-stone-400">Total Cost:</span>
            <span className="text-2xl font-bold text-[#D4C5A9]">${calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
            Apply Cost
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPopup;
