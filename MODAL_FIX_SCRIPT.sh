#!/bin/bash
# Fix all modal positioning - change items-center to items-start and add overflow-y-auto

cd /app/frontend/src/components

# Fix AddCategoryModal
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto/g' AddCategoryModal.js

# Fix AddSubCategoryModal  
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto/g' AddSubCategoryModal.js

# Fix CanvaIntegrationModal
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto/g' CanvaIntegrationModal.js

# Fix ProductClipperModal
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto/g' ProductClipperModal.js

# Fix BarcodeScannerModal
sed -i 's/fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50/fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 overflow-y-auto/g' BarcodeScannerModal.js

# Fix CanvaBoardImporter
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto/g' CanvaBoardImporter.js

# Fix RoomSpecificCanvaImporter
sed -i 's/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50/fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto/g' RoomSpecificCanvaImporter.js

echo "✅ Fixed all modal positioning!"