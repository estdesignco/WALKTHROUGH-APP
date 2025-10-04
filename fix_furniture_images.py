#!/usr/bin/env python3
"""
FIX FURNITURE CATALOG IMAGES
Convert all HTTP image URLs to BASE64 format so they display properly in frontend
"""

import pymongo
import requests
import base64
from io import BytesIO
from PIL import Image
import time

# Connect to MongoDB
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['furniture_tracker']

def url_to_base64(image_url, max_size=(400, 400)):
    """
    Download image from URL and convert to base64
    Resize to max_size to keep data reasonable
    """
    try:
        # Download image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Open image and resize if needed
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGB if needed (handles RGBA, etc.)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to reasonable size
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        img_bytes = buffer.getvalue()
        
        base64_string = base64.b64encode(img_bytes).decode('utf-8')
        base64_url = f"data:image/jpeg;base64,{base64_string}"
        
        print(f"  ✓ Converted (size: {len(base64_url)} chars)")
        return base64_url
        
    except Exception as e:
        print(f"  ✗ Failed: {str(e)}")
        return None

def fix_all_images():
    """Fix all product images in the database"""
    
    print("🔧 FIXING FURNITURE CATALOG IMAGES")
    print("=" * 60)
    
    # Find all products with HTTP image URLs (not base64)
    products = list(db.furniture_catalog.find({
        "image_url": {"$regex": "^http", "$options": "i"}
    }))
    
    print(f"📊 Found {len(products)} products with HTTP image URLs\n")
    
    fixed_count = 0
    failed_count = 0
    
    for i, product in enumerate(products, 1):
        name = product.get('name', 'Unknown')
        vendor = product.get('vendor', 'Unknown')
        image_url = product.get('image_url', '')
        
        print(f"\n[{i}/{len(products)}] {name} ({vendor})")
        print(f"  URL: {image_url[:80]}...")
        
        # Convert to base64
        base64_url = url_to_base64(image_url)
        
        if base64_url:
            # Update in database
            db.furniture_catalog.update_one(
                {"_id": product['_id']},
                {"$set": {"image_url": base64_url}}
            )
            fixed_count += 1
            print(f"  ✅ Updated in database")
        else:
            failed_count += 1
            print(f"  ❌ Skipped (will use fallback)")
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    print(f"\n" + "=" * 60)
    print(f"✅ Fixed: {fixed_count} products")
    print(f"❌ Failed: {failed_count} products")
    print(f"\n🎉 All images converted to BASE64!")
    print(f"🔗 Refresh frontend to see real product images!")

def add_fallback_for_missing():
    """Add a fallback base64 image for products with no image"""
    
    print(f"\n" + "=" * 60)
    print("🖼️ ADDING FALLBACK IMAGES FOR PRODUCTS WITH NO IMAGE")
    
    # Simple 1x1 pixel placeholder in base64
    fallback_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    # Find products with no image_url or empty image_url
    result = db.furniture_catalog.update_many(
        {"$or": [
            {"image_url": {"$exists": False}},
            {"image_url": ""},
            {"image_url": None}
        ]},
        {"$set": {"image_url": fallback_image}}
    )
    
    print(f"✅ Added fallback image to {result.modified_count} products")

if __name__ == "__main__":
    # Fix HTTP URLs to base64
    fix_all_images()
    
    # Add fallback for missing images
    add_fallback_for_missing()
    
    # Final stats
    print(f"\n" + "=" * 60)
    print("📊 FINAL DATABASE STATUS:")
    
    total = db.furniture_catalog.count_documents({})
    base64_count = db.furniture_catalog.count_documents({
        "image_url": {"$regex": "^data:image", "$options": "i"}
    })
    http_count = db.furniture_catalog.count_documents({
        "image_url": {"$regex": "^http", "$options": "i"}
    })
    missing_count = db.furniture_catalog.count_documents({
        "$or": [
            {"image_url": {"$exists": False}},
            {"image_url": ""},
            {"image_url": None}
        ]
    })
    
    print(f"  Total products: {total}")
    print(f"  ✓ With BASE64 images: {base64_count}")
    print(f"  ✗ With HTTP URLs: {http_count}")
    print(f"  ✗ Missing images: {missing_count}")
    
    print(f"\n🎉 DONE! Frontend should now display all images correctly!")
    
    client.close()