import React, { useState } from 'react';

const AddCategoryModal = ({ onClose, onSubmit, categoryColors, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const commonCategories = [
    'Lighting',
    'Furniture & Storage', 
    'Plumbing & Fixtures',
    'Decor & Accessories',
    'Seating',
    'Equipment & Furniture',
    'Installed',
    'Portable',
    'Fireplace',
    'Kitchen Appliances',
    'Built-ins',
    'Window Treatments',
    'Flooring',
    'Hardware'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting category:', err);
    }
  };

  const handleQuickSelect = (categoryName) => {
    setFormData({ ...formData, name: categoryName });
  };

  const getPreviewColor = () => {
    return categoryColors[formData.name.toLowerCase()] || '#104131';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Category</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter category name..."
                required
              />
              
              {/* Color Preview */}
              {formData.name && (
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getPreviewColor() }}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Category color: {getPreviewColor()}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quick Select Common Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleQuickSelect(category)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.name === category
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: categoryColors[category.toLowerCase()] || '#104131' }}
                      ></div>
                      <span>{category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Add any notes about this category..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;