import React, { useState, useEffect } from 'react';

const AdvancedFFEFeatures = ({ project, onUpdate }) => {
  const [bulkActions, setBulkActions] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Bulk selection functionality
  const toggleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllItems = () => {
    const allItemIds = new Set();
    project.rooms.forEach(room => {
      room.categories.forEach(category => {
        category.subcategories.forEach(subcategory => {
          subcategory.items.forEach(item => {
            allItemIds.add(item.id);
          });
        });
      });
    });
    setSelectedItems(allItemIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Bulk operations
  const bulkUpdateStatus = async (newStatus) => {
    try {
      const selectedIds = Array.from(selectedItems);
      console.log(`🔄 Bulk updating ${selectedIds.length} items to status: ${newStatus}`);

      const updatePromises = selectedIds.map(itemId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(updatePromises);
      console.log('✅ Bulk status update completed');
      
      // Refresh page to show changes
      window.location.reload();
    } catch (error) {
      console.error('❌ Bulk update failed:', error);
      alert('Bulk update failed. Please try again.');
    }
  };

  const bulkUpdateCarrier = async (newCarrier) => {
    try {
      const selectedIds = Array.from(selectedItems);
      console.log(`🚚 Bulk updating ${selectedIds.length} items to carrier: ${newCarrier}`);

      const updatePromises = selectedIds.map(itemId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrier: newCarrier })
        })
      );

      await Promise.all(updatePromises);
      console.log('✅ Bulk carrier update completed');
      
      window.location.reload();
    } catch (error) {
      console.error('❌ Bulk carrier update failed:', error);
      alert('Bulk carrier update failed. Please try again.');
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      console.log(`🗑️ Bulk deleting ${selectedIds.length} items`);

      const deletePromises = selectedIds.map(itemId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/items/${itemId}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);
      console.log('✅ Bulk delete completed');
      
      clearSelection();
      window.location.reload();
    } catch (error) {
      console.error('❌ Bulk delete failed:', error);
      alert('Bulk delete failed. Please try again.');
    }
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = [];
    csvData.push(['Room', 'Category', 'Subcategory', 'Item', 'Vendor', 'SKU', 'Quantity', 'Cost', 'Status', 'Carrier']);

    project.rooms.forEach(room => {
      room.categories.forEach(category => {
        category.subcategories.forEach(subcategory => {
          subcategory.items.forEach(item => {
            csvData.push([
              room.name,
              category.name,
              subcategory.name,
              item.name,
              item.vendor || '',
              item.sku || '',
              item.quantity || 1,
              item.cost || '',
              item.status || '',
              item.carrier || ''
            ]);
          });
        });
      });
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FF&E_Schedule_${project.name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    try {
      console.log('📄 Generating PDF export...');
      
      // In a real implementation, this would call a PDF generation service
      const exportData = {
        project_id: project.id,
        project_name: project.name,
        export_type: 'pdf',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `FF&E_Schedule_${project.name}.pdf`;
        link.click();
        console.log('✅ PDF export completed');
      } else {
        throw new Error('PDF export failed');
      }
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  if (selectedItems.size === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear Selection
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Bulk Status Update */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateStatus(e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="">Update Status...</option>
            <option value="PICKED">PICKED</option>
            <option value="ORDERED">ORDERED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED TO JOB SITE">DELIVERED TO JOB SITE</option>
            <option value="INSTALLED">INSTALLED</option>
          </select>

          {/* Bulk Carrier Update */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateCarrier(e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="">Update Carrier...</option>
            <option value="FedEx">FedEx</option>
            <option value="UPS">UPS</option>
            <option value="USPS">USPS</option>
            <option value="DHL">DHL</option>
            <option value="Brooks">Brooks</option>
            <option value="Zenith">Zenith</option>
          </select>

          {/* Export Options */}
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            📊 Export CSV
          </button>
          
          <button
            onClick={exportToPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            📄 Export PDF
          </button>

          {/* Bulk Delete */}
          <button
            onClick={bulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            🗑️ Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFFEFeatures;