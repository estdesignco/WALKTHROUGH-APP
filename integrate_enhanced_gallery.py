#!/usr/bin/env python3
"""
Integrate enhanced gallery system into the existing frontend
"""

import os
import shutil

def integrate_enhanced_gallery():
    """Replace the existing component with enhanced version"""
    
    print("🎨 INTEGRATING ENHANCED GALLERY SYSTEM")
    print("=" * 50)
    
    # Backup original file
    original_file = '/app/frontend/src/components/UnifiedFurnitureSearch.js'
    backup_file = '/app/frontend/src/components/UnifiedFurnitureSearch.js.backup'
    
    if os.path.exists(original_file):
        shutil.copy(original_file, backup_file)
        print(f"✅ Backed up original file to {backup_file}")
    
    # Copy enhanced version
    enhanced_file = '/app/enhanced_furniture_search_component.js'
    
    if os.path.exists(enhanced_file):
        shutil.copy(enhanced_file, original_file)
        print(f"✅ Integrated enhanced gallery system")
        print(f"   - Larger images (h-64 instead of h-48)")
        print(f"   - Click to zoom functionality")
        print(f"   - Multiple image gallery")
        print(f"   - Color variation support")
        print(f"   - Enhanced badges and indicators")
        
        # Restart frontend to apply changes
        print(f"\n🔄 Restarting frontend to apply changes...")
        os.system('sudo supervisorctl restart frontend')
        print(f"✅ Frontend restarted")
        
        print(f"\n🔗 ENHANCED GALLERY NOW ACTIVE:")
        print(f"1. Larger product images")
        print(f"2. Click any image to open gallery")
        print(f"3. Zoom, navigation, color options")
        print(f"4. Enhanced product cards with more info")
        
        return True
    else:
        print(f"❌ Enhanced file not found: {enhanced_file}")
        return False

if __name__ == "__main__":
    success = integrate_enhanced_gallery()
    
    if success:
        print(f"\n🎉 ENHANCED GALLERY INTEGRATION COMPLETE!")
        print(f"\n📱 TEST THE ENHANCEMENTS:")
        print(f"1. Go to: https://designflow-master.preview.emergentagent.com/furniture-search")
        print(f"2. Notice larger product images")
        print(f"3. Click on any product image (not VIEW button)")
        print(f"4. Gallery should open with zoom/navigation")
        print(f"5. Use arrow keys, zoom buttons, ESC to close")
    else:
        print(f"\n❌ Integration failed")
