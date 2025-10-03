// ENHANCED UnifiedFurnitureSearch with Gallery System
// Larger images, zoom, multiple images, color variations

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Gallery Modal Component
const EnhancedGalleryModal = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomOverlay, setShowZoomOverlay] = useState(false);
  const [selectedColorVariation, setSelectedColorVariation] = useState(null);

  const images = product?.image_gallery || (product?.image_url ? [{base64: product.image_url, type: 'main'}] : []);
  const colorVariations = product?.color_variations || {};

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setZoomLevel(1);
      setShowZoomOverlay(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          previousImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentImageIndex, zoomLevel]);

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 5);
    setZoomLevel(newZoom);
    setShowZoomOverlay(newZoom > 1);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 1);
    setZoomLevel(newZoom);
    setShowZoomOverlay(newZoom > 1);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setShowZoomOverlay(false);
  };

  const toggleZoom = () => {
    if (zoomLevel === 1) {
      zoomIn();
    } else {
      resetZoom();
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl z-10 hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
        >
          ×
        </button>
        
        {/* Gallery container */}
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Product info header */}
          <div className="bg-gray-100 p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            <p className="text-gray-600">
              {product.vendor} • {product.sku} • ${product.cost}
            </p>
          </div>
          
          {/* Main image area */}
          <div className="relative bg-gray-50" style={{height: '500px'}}>
            {images[currentImageIndex] && (
              <>
                <img 
                  src={images[currentImageIndex].base64 || images[currentImageIndex].url}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  className={`w-full h-full object-contain ${zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onClick={toggleZoom}
                  style={{
                    transform: showZoomOverlay ? `scale(${zoomLevel})` : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease'
                  }}
                />
                
                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={previousImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button 
                      onClick={nextImage}
                      disabled={currentImageIndex === images.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 disabled:opacity-30"
                    >
                      →
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Thumbnail gallery */}
          {images.length > 1 && (
            <div className="p-4 border-t">
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <img 
                    key={index}
                    src={image.base64 || image.url}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Color variations */}
          {Object.keys(colorVariations).length > 0 && (
            <div className="p-4 border-t">
              <h3 className="font-bold text-gray-800 mb-2">Available Colors:</h3>
              <div className="flex space-x-2 flex-wrap">
                {Object.entries(colorVariations).map(([color, colorImages]) => (
                  <button 
                    key={color}
                    onClick={() => setSelectedColorVariation(color)}
                    className={`px-4 py-2 border rounded hover:bg-gray-100 ${
                      selectedColorVariation === color ? 'bg-blue-100 border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex space-x-2">
              <button 
                onClick={zoomIn}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom In
              </button>
              <button 
                onClick={zoomOut}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom Out
              </button>
              <button 
                onClick={resetZoom}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              {images.length > 0 && `${currentImageIndex + 1} of ${images.length}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Product Card Component
const EnhancedProductCard = ({ product, onImageClick, onViewClick, onSelectProduct }) => {
  const handleImageClick = (e) => {
    e.preventDefault();
    onImageClick(product);
  };

  const handleViewClick = (e) => {
    e.preventDefault();
    if (product.product_url) {
      window.open(product.product_url, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Enhanced image section - LARGER */}
      <div className="relative h-64 overflow-hidden"> {/* Increased from h-48 to h-64 */}
        <img 
          src={product.image_url || '/api/placeholder/300/300'}
          alt={product.name}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={handleImageClick}
        />
        
        {/* Image count badge */}
        {product.image_gallery && product.image_gallery.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            +{product.image_gallery.length - 1} more
          </div>
        )}
        
        {/* Enhanced badge */}
        {product.enhanced_scraping && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            ENHANCED
          </div>
        )}
      </div>
      
      {/* Product info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">{product.vendor}</span>
          <span className="text-lg font-bold text-green-600">${product.cost}</span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">{product.category}</span>
          <span className="text-xs text-blue-600">{product.sku}</span>
        </div>
        
        {/* Color variations indicator */}
        {product.color_variations && Object.keys(product.color_variations).length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">
              {Object.keys(product.color_variations).length} colors available
            </div>
            <div className="flex space-x-1">
              {Object.keys(product.color_variations).slice(0, 5).map(color => (
                <div 
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{backgroundColor: color.toLowerCase()}}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={handleViewClick}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            VIEW
          </button>
          
          {onSelectProduct && (
            <button 
              onClick={() => onSelectProduct(product)}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors text-sm font-medium"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Enhanced Furniture Search Component
const EnhancedUnifiedFurnitureSearch = ({ onSelectProduct, currentProject }) => {
  // ... (keep all existing state and functions)
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    vendor: '',
    category: '',
    min_price: '',
    max_price: '',
    source: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quickCategories, setQuickCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  
  // Enhanced gallery states
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // ... (keep all existing useEffect and functions)
  
  // Enhanced gallery functions
  const handleImageClick = (product) => {
    setGalleryProduct(product);
    setIsGalleryOpen(true);
  };
  
  const closeGallery = () => {
    setIsGalleryOpen(false);
    setGalleryProduct(null);
  };
  
  // ... (keep existing functions like loadVendorsAndCategories, searchFurniture, etc.)
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Enhanced Gallery Modal */}
      <EnhancedGalleryModal 
        product={galleryProduct}
        isOpen={isGalleryOpen}
        onClose={closeGallery}
      />
      
      {/* Header with enhanced stats */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">UNIFIED FURNITURE CATALOG</h1>
        <p className="text-gray-600 mb-4">Enhanced with multiple images, zoom, and color variations</p>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_items?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(stats.vendors || {}).length}</div>
              <div className="text-sm text-gray-600">Trade Vendors</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.categories || {}).length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.recently_clipped || 0}</div>
              <div className="text-sm text-gray-600">Recently Clipped</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Search and Filters */}
      {/* ... (keep existing search and filter UI) */}
      
      {/* Enhanced Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {searchResults.map((product) => (
          <EnhancedProductCard 
            key={product.id}
            product={product}
            onImageClick={handleImageClick}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
      
      {/* No results message */}
      {searchResults.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No furniture found</div>
          <div className="text-sm text-gray-400 mt-2">Try adjusting your search criteria</div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUnifiedFurnitureSearch;
