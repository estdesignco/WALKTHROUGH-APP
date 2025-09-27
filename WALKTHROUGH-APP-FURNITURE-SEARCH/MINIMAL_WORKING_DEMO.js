// MINIMAL WORKING DEMO - UnifiedFurnitureSearch.js
// Copy this EXACT code to test basic functionality

import React, { useState } from 'react';

const UnifiedFurnitureSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([
    // Sample data for testing
    {
      id: '1',
      name: 'Four Hands Sample Chair',
      vendor: 'Four Hands',
      vendor_sku: 'FH-001',
      price: 299.99,
      category: 'Seating',
      room_type: 'Living Room'
    },
    {
      id: '2', 
      name: 'Hudson Valley Sample Light',
      vendor: 'Hudson Valley Lighting',
      vendor_sku: 'HVL-001',
      price: 459.99,
      category: 'Lighting',
      room_type: 'Dining Room'
    }
  ]);

  const handleSearch = () => {
    console.log('Search clicked:', searchQuery);
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <div style={{ 
      background: 'linear-gradient(to-b, black, #1a1a1a)', 
      padding: '2rem', 
      borderRadius: '1.5rem',
      border: '1px solid #B49B7E33',
      maxWidth: '95%',
      margin: '2rem auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ 
          color: '#B49B7E', 
          fontSize: '2rem', 
          fontWeight: '300',
          marginBottom: '1rem' 
        }}>
          🔍 UNIFIED FURNITURE SEARCH ENGINE
        </h2>
        <div style={{
          width: '8rem',
          height: '2px', 
          background: 'linear-gradient(to-r, transparent, #B49B7E, transparent)',
          margin: '0 auto 1.5rem'
        }}></div>
        <p style={{ color: '#F5F5DC', opacity: '0.8', fontSize: '1.1rem' }}>
          Search ALL your vendor products in one place - The DREAM!
        </p>
      </div>

      {/* Search Section */}
      <div style={{
        background: 'linear-gradient(135deg, #00000080, #1a1a1a90)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #B49B7E33',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#B49B7E', marginBottom: '1.5rem' }}>Search Products</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lamps, chairs, tables..."
            style={{
              flex: 1,
              background: '#00000066',
              border: '1px solid #B49B7E50',
              color: '#F5F5DC',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              background: 'linear-gradient(135deg, #B49B7E, #A08B6F)',
              color: '#F5F5DC',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{
        background: 'linear-gradient(135deg, #00000080, #1a1a1a90)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #B49B7E33'
      }}>
        <h3 style={{ color: '#B49B7E', marginBottom: '1.5rem' }}>
          Search Results ({products.length} items)
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {products.map((product) => (
            <div key={product.id} style={{
              background: '#00000099',
              border: '1px solid #B49B7E33',
              borderRadius: '0.5rem',
              padding: '1rem',
              transition: 'border-color 0.3s'
            }}>
              {/* Product Image Placeholder */}
              <div style={{
                width: '100%',
                height: '12rem',
                background: '#374151',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                🖼️
              </div>

              {/* Product Info */}
              <h4 style={{ color: '#B49B7E', marginBottom: '0.5rem', fontWeight: '500' }}>
                {product.name}
              </h4>
              
              <p style={{ color: '#F5F5DC', opacity: '0.7', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {product.vendor} • {product.vendor_sku}
              </p>
              
              <p style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: '500', marginBottom: '1rem' }}>
                ${product.price.toFixed(2)}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{
                  background: '#B49B7E33',
                  color: '#B49B7E',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem'
                }}>
                  {product.category}
                </span>
                <span style={{
                  background: '#3B82F633',
                  color: '#60A5FA',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem'
                }}>
                  {product.room_type}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => alert(`Adding "${product.name}" to checklist`)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #B49B7E, #A08B6F)',
                    color: '#F5F5DC',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✅ Checklist
                </button>
                <button
                  onClick={() => alert(`Adding "${product.name}" to Canva`)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    color: '#F5F5DC',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🎨 Canva
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnifiedFurnitureSearch;