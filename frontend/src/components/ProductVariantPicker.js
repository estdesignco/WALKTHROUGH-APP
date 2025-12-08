import React, { useState, useEffect } from 'react';

/**
 * ProductVariantPicker - Shows available variants (finishes, colors, sizes) for a product
 * Displays images for each variant and allows selection
 */
const ProductVariantPicker = ({ 
  baseSku, 
  onSelectVariant, 
  onClose,
  currentSelection 
}) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [finishLibrary, setFinishLibrary] = useState({});

  useEffect(() => {
    fetchVariants();
    fetchFinishLibrary();
  }, [baseSku]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/product-variants/${encodeURIComponent(baseSku)}`);
      const data = await response.json();
      
      if (data.success) {
        setVariants(data.variants || []);
        // Pre-select current variant if exists
        if (currentSelection) {
          const current = data.variants.find(v => v.sku === currentSelection);
          if (current) setSelectedVariant(current);
        }
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinishLibrary = async () => {
    try {
      const backendUrl = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/finish-library`);
      const data = await response.json();
      
      if (data.success) {
        // Convert to lookup object
        const lookup = {};
        data.finishes.forEach(f => {
          lookup[f.code] = f;
        });
        setFinishLibrary(lookup);
      }
    } catch (error) {
      console.error('Error fetching finish library:', error);
    }
  };

  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant);
  };

  const handleConfirm = () => {
    if (selectedVariant && onSelectVariant) {
      onSelectVariant(selectedVariant);
    }
    if (onClose) onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-center">Loading variants...</p>
        </div>
      </div>
    );
  }

  if (variants.length <= 1) {
    // No variants to choose from
    if (onClose) onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Select Finish / Variant</h2>
            <p className="text-gray-400 text-sm mt-1">
              {variants.length} options available
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Variants Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.sku === variant.sku;
              
              return (
                <div
                  key={variant.sku}
                  onClick={() => handleSelectVariant(variant)}
                  className={`
                    cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                    ${isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-500/50' 
                      : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-700 relative">
                    {variant.image_url ? (
                      <img 
                        src={variant.image_url} 
                        alt={variant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center text-4xl bg-gray-700 ${variant.image_url ? 'hidden' : ''}`}
                    >
                      📦
                    </div>
                    
                    {/* Finish color swatches */}
                    {variant.finish_codes?.length > 0 && (
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {variant.finish_codes.map((code) => {
                          const finish = finishLibrary[code];
                          return (
                            <div
                              key={code}
                              className="w-5 h-5 rounded-full border border-white shadow-lg"
                              style={{ backgroundColor: finish?.hex_color || '#888' }}
                              title={finish?.name || code}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 bg-gray-750">
                    <p className="text-white text-sm font-medium truncate">{variant.sku}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {variant.finish_names?.join(', ') || 'Standard'}
                    </p>
                    <p className="text-green-400 text-sm font-medium mt-1">
                      ${(variant.cost || variant.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-750">
          <div>
            {selectedVariant && (
              <div className="text-white">
                <span className="text-gray-400">Selected: </span>
                <span className="font-medium">{selectedVariant.sku}</span>
                {selectedVariant.finish_names?.length > 0 && (
                  <span className="text-gray-400"> - {selectedVariant.finish_names.join(', ')}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedVariant}
              className={`
                px-6 py-2 rounded-lg font-medium transition
                ${selectedVariant 
                  ? 'bg-blue-600 text-white hover:bg-blue-500' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Select Variant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantPicker;
