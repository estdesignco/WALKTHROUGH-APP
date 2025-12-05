import React, { useState } from 'react';

const AddSubCategoryModal = ({ onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const commonSubCategories = [
    'Installed',
    'Portable', 
    'Molding',
    'Wood',
    'Tile',
    'Carpet',
    'Concrete',
    'Hardware',
    'Fixtures',
    'Appliances'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting sub-category:', err);
    }
  };

  const handleQuickSelect = (subCategoryName) => {
    setFormData({ ...formData, name: subCategoryName });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Section</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Sub-Category Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Section Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:border-red-500 focus:outline-none"
                placeholder="Enter section name..."
                required
              />
            </div>

            {/* Quick Sub-Category Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Quick Select Common Sections
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonSubCategories.map((subCategory) => (
                  <button
                    key={subCategory}
                    type="button"
                    onClick={() => handleQuickSelect(subCategory)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.name === subCategory
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-red-600"></div>
                      <span>{subCategory}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg border border-neutral-600 focus:border-red-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Add any notes about this section..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-700 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-neutral-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubCategoryModal;