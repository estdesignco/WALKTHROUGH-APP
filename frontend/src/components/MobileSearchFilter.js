import React, { useState, useEffect } from 'react';

export default function MobileSearchFilter({ 
  project, 
  onFilterChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showOnlyChecked, setShowOnlyChecked] = useState(false);
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState(false);

  // Get unique rooms and categories
  const rooms = project?.rooms || [];
  const allCategories = rooms.flatMap(r => r.categories || []);
  const uniqueCategories = [...new Set(allCategories.map(c => c.name))];

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterRoom, filterCategory, filterStatus, showOnlyChecked, showOnlyUnchecked]);

  const applyFilters = () => {
    if (!project) return;

    let filtered = JSON.parse(JSON.stringify(project)); // Deep clone

    // Apply filters
    filtered.rooms = filtered.rooms.map(room => {
      // Room filter
      if (filterRoom && room.id !== filterRoom) {
        return { ...room, categories: [] };
      }

      // Filter categories and items
      room.categories = room.categories.map(category => {
        // Category filter
        if (filterCategory && category.name !== filterCategory) {
          return { ...category, subcategories: [] };
        }

        // Filter items
        category.subcategories = category.subcategories.map(subcategory => {
          subcategory.items = subcategory.items.filter(item => {
            // Search term
            if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              const matchesSearch = 
                item.name?.toLowerCase().includes(searchLower) ||
                item.vendor?.toLowerCase().includes(searchLower) ||
                item.sku?.toLowerCase().includes(searchLower) ||
                item.notes?.toLowerCase().includes(searchLower);
              
              if (!matchesSearch) return false;
            }

            // Status filter
            if (filterStatus && item.status !== filterStatus) {
              return false;
            }

            // Checked filter
            if (showOnlyChecked && !item.checked) return false;
            if (showOnlyUnchecked && item.checked) return false;

            return true;
          });

          return subcategory;
        });

        return category;
      });

      return room;
    });

    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRoom('');
    setFilterCategory('');
    setFilterStatus('');
    setShowOnlyChecked(false);
    setShowOnlyUnchecked(false);
    onFilterChange(project); // Reset to original
  };

  const hasActiveFilters = searchTerm || filterRoom || filterCategory || filterStatus || showOnlyChecked || showOnlyUnchecked;

  return (
    <div className="bg-gray-800 p-4 border-b border-gray-700 space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search items, vendors, SKU..."
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg pl-4 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowOnlyChecked(!showOnlyChecked)}
          className={`flex-1 py-2 px-3 rounded font-bold text-sm ${
            showOnlyChecked
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ✓ Checked Only
        </button>
        <button
          onClick={() => setShowOnlyUnchecked(!showOnlyUnchecked)}
          className={`flex-1 py-2 px-3 rounded font-bold text-sm ${
            showOnlyUnchecked
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ☐ Unchecked Only
        </button>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 gap-2">
        {/* Room Filter */}
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          <option value="">All Rooms</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="Ordered">Ordered</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Installed">Installed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold text-sm"
        >
          ✕ Clear All Filters
        </button>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
              Search: "{searchTerm}"
            </span>
          )}
          {filterRoom && (
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
              Room: {rooms.find(r => r.id === filterRoom)?.name}
            </span>
          )}
          {filterCategory && (
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
              Category: {filterCategory}
            </span>
          )}
          {filterStatus && (
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs">
              Status: {filterStatus}
            </span>
          )}
          {showOnlyChecked && (
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
              ✓ Checked
            </span>
          )}
          {showOnlyUnchecked && (
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs">
              ☐ Unchecked
            </span>
          )}
        </div>
      )}
    </div>
  );
}