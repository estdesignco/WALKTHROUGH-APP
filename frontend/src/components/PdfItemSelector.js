import React, { useState, useEffect } from 'react';

const PdfItemSelector = ({ previewJobId, roomName, onClose, onImport }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const pollJob = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/import/pdf-preview/${previewJobId}`
        );
        
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);
          
          if (jobData.status === 'completed') {
            setLoading(false);
            clearInterval(pollJob);
            // Auto-select all items by default
            if (jobData.items && jobData.items.length > 0) {
              setSelectedIndices(jobData.items.map((_, index) => index));
            }
          } else if (jobData.status === 'failed') {
            setLoading(false);
            clearInterval(pollJob);
          }
        }
      } catch (error) {
        console.error('Error polling preview job:', error);
      }
    }, 2000);

    return () => clearInterval(pollJob);
  }, [previewJobId]);

  const toggleItem = (index) => {
    setSelectedIndices(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedIndices.length === job.items.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(job.items.map((_, index) => index));
    }
  };

  const handleImport = async () => {
    if (selectedIndices.length === 0) {
      alert('Please select at least one item to import');
      return;
    }

    setImporting(true);
    try {
      const queryParams = new URLSearchParams({
        preview_job_id: previewJobId,
        ...selectedIndices.reduce((acc, index, i) => {
          acc[`selected_item_indices`] = index;
          return acc;
        }, {})
      });

      // Build URL with array parameters
      const url = `${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/import/pdf-selected?preview_job_id=${previewJobId}&${selectedIndices.map(i => `selected_item_indices=${i}`).join('&')}`;

      const response = await fetch(url, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully imported ${result.imported_count} items to ${roomName}!`);
        onImport();
      } else {
        const error = await response.json();
        alert(`❌ Import failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading || !job) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%)',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '500px',
          border: '3px solid #D4A574',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#D4A574', fontSize: '24px', marginBottom: '20px' }}>
            📄 Extracting Products from PDF
          </h2>
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #B49B7E'
          }}>
            <p style={{ color: '#B49B7E', marginBottom: '15px' }}>
              {job?.status === 'processing'
                ? `Scraped ${job.scraped_items || 0} of ${job.total_links || 0} products...`
                : 'Analyzing PDF...'}
            </p>
            <div className="animate-spin" style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(212, 165, 116, 0.2)',
              borderTopColor: '#D4A574',
              borderRadius: '50%',
              margin: '0 auto'
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%)',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '500px',
          border: '3px solid #ff6b6b',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ff6b6b', fontSize: '24px', marginBottom: '20px' }}>
            ❌ PDF Extraction Failed
          </h2>
          <p style={{ color: '#B49B7E', marginBottom: '20px' }}>
            {job.errors && job.errors.length > 0 ? job.errors[0] : 'Unknown error'}
          </p>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#B49B7E',
              border: '2px solid #B49B7E',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  const items = job.items || [];
  const selectedCount = selectedIndices.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'auto',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #000 0%, #1e293b 50%, #000 100%)',
        borderRadius: '16px',
        maxWidth: '1200px',
        width: '100%',
        border: '3px solid #D4A574',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '30px',
          borderBottom: '2px solid #D4A574'
        }}>
          <h2 style={{ color: '#D4A574', fontSize: '28px', marginBottom: '10px' }}>
            📄 Select Items to Import
          </h2>
          <p style={{ color: '#B49B7E', fontSize: '14px' }}>
            Found {items.length} products in PDF • Importing to <strong>{roomName}</strong>
          </p>
        </div>

        {/* Selection Controls */}
        <div style={{
          padding: '20px 30px',
          background: 'rgba(30, 41, 59, 0.5)',
          borderBottom: '1px solid rgba(212, 165, 116, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={toggleAll}
              style={{
                padding: '8px 16px',
                background: 'rgba(212, 165, 116, 0.2)',
                color: '#D4A574',
                border: '2px solid #D4A574',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {selectedCount === items.length ? '☐ DESELECT ALL' : '☑ SELECT ALL'}
            </button>
            <span style={{ color: '#B49B7E', fontSize: '14px' }}>
              {selectedCount} of {items.length} selected
            </span>
          </div>
        </div>

        {/* Items Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 30px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {items.map((item, index) => (
              <div
                key={index}
                onClick={() => toggleItem(index)}
                style={{
                  background: selectedIndices.includes(index)
                    ? 'rgba(212, 165, 116, 0.15)'
                    : 'rgba(30, 41, 59, 0.6)',
                  border: selectedIndices.includes(index)
                    ? '3px solid #D4A574'
                    : '2px solid rgba(180, 155, 126, 0.3)',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* Checkbox */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '24px',
                  height: '24px',
                  background: selectedIndices.includes(index) ? '#D4A574' : 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid #D4A574',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {selectedIndices.includes(index) && '✓'}
                </div>

                {/* Image */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
                  display: item.image_url ? 'none' : 'flex',
                  width: '100%',
                  height: '200px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  No Image
                </div>

                {/* Product Info */}
                <h3 style={{
                  color: '#D4A574',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  lineHeight: '1.3',
                  minHeight: '36px'
                }}>
                  {item.name}
                </h3>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px'
                }}>
                  {item.vendor && (
                    <div style={{ color: '#B49B7E' }}>
                      <strong>Vendor:</strong> {item.vendor}
                    </div>
                  )}
                  {item.cost > 0 && (
                    <div style={{ color: '#9ACD32', fontWeight: 'bold' }}>
                      ${item.cost.toFixed(2)}
                    </div>
                  )}
                  {item.sku && (
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      SKU: {item.sku}
                    </div>
                  )}
                  {item.category_name && (
                    <div style={{
                      color: '#D4A574',
                      fontSize: '11px',
                      marginTop: '4px',
                      padding: '2px 6px',
                      background: 'rgba(212, 165, 116, 0.1)',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      → {item.category_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 30px',
          borderTop: '2px solid #D4A574',
          display: 'flex',
          gap: '15px'
        }}>
          <button
            onClick={onClose}
            disabled={importing}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#B49B7E',
              border: '2px solid #B49B7E',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: importing ? 0.5 : 1
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
            style={{
              flex: 2,
              padding: '14px',
              background: selectedCount > 0 ? 'linear-gradient(90deg, #D4A574, #B49B7E)' : 'rgba(100, 100, 100, 0.3)',
              color: selectedCount > 0 ? '#000' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: (importing || selectedCount === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {importing
              ? '⏳ IMPORTING...'
              : `✅ IMPORT ${selectedCount} ITEM${selectedCount !== 1 ? 'S' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfItemSelector;