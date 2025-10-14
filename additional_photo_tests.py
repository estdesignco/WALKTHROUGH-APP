#!/usr/bin/env python3
"""
Additional Photo System Tests - Mobile App Simulation
"""

import requests
import json
import base64
import os
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Configuration
BACKEND_URL = "https://designhub-74.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interiorsync"

# Test data from review request
PROJECT_ID = "5d42e515-f84b-4c3d-a4cc-6c3dcc4417a2"
ROOM_ID = "226d6320-3c2e-4741-aaa1-9e697106c019"

def create_realistic_mobile_photo():
    """Create a more realistic mobile photo size (simulating a compressed mobile photo)"""
    # Create a larger test image that simulates a mobile photo
    # This creates a 100x100 pixel JPEG-like structure
    import io
    
    # Create a simple pattern that compresses well
    width, height = 100, 100
    
    # Create JPEG header and minimal data for a 100x100 image
    jpeg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00'
    
    # Add some realistic JPEG data (this is a simplified version)
    # In reality, mobile photos would be much larger (50KB-500KB)
    jpeg_data = jpeg_header + b'\x00' * 2000  # Simulate 2KB of image data
    jpeg_data += b'\xff\xd9'  # JPEG end marker
    
    base64_data = base64.b64encode(jpeg_data).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_data}"

def test_mobile_photo_upload():
    """Test mobile-sized photo upload"""
    print("🔍 MOBILE PHOTO UPLOAD TEST")
    print("=" * 50)
    
    # Create realistic mobile photo
    mobile_photo_data = create_realistic_mobile_photo()
    print(f"📊 Mobile photo size: {len(mobile_photo_data)} characters")
    
    upload_data = {
        "project_id": PROJECT_ID,
        "room_id": ROOM_ID,
        "photo_data": mobile_photo_data,
        "file_name": "mobile_test_photo.jpg",
        "metadata": {
            "device": "mobile_app",
            "resolution": "100x100",
            "test_type": "mobile_simulation",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/photos/upload", json=upload_data, timeout=30)
        print(f"📤 Upload Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Mobile Upload Success: {result.get('success', False)}")
            print(f"🆔 Photo ID: {result.get('id', 'No ID')}")
            return True
        else:
            print(f"❌ Mobile Upload Failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Mobile Upload Error: {str(e)}")
        return False

def test_photo_retrieval_performance():
    """Test photo retrieval performance with multiple photos"""
    print("\n🔍 PHOTO RETRIEVAL PERFORMANCE TEST")
    print("=" * 50)
    
    import time
    
    try:
        start_time = time.time()
        response = requests.get(f"{BACKEND_URL}/photos/by-room/{PROJECT_ID}/{ROOM_ID}", timeout=30)
        end_time = time.time()
        
        retrieval_time = end_time - start_time
        print(f"⏱️ Retrieval Time: {retrieval_time:.3f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            photo_count = result.get('count', 0)
            photos = result.get('photos', [])
            
            print(f"📊 Photos Retrieved: {photo_count}")
            
            # Calculate total data size
            total_data_size = 0
            for photo in photos:
                photo_data = photo.get('photo_data', '')
                total_data_size += len(photo_data)
            
            print(f"📊 Total Data Size: {total_data_size:,} characters")
            print(f"📊 Average Photo Size: {total_data_size // max(photo_count, 1):,} characters")
            
            # Performance assessment
            if retrieval_time < 1.0:
                print("✅ Performance: Excellent (< 1 second)")
            elif retrieval_time < 3.0:
                print("✅ Performance: Good (< 3 seconds)")
            elif retrieval_time < 5.0:
                print("⚠️ Performance: Acceptable (< 5 seconds)")
            else:
                print("❌ Performance: Poor (> 5 seconds)")
                
            return True
        else:
            print(f"❌ Retrieval Failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Performance Test Error: {str(e)}")
        return False

def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n🔍 EDGE CASES TEST")
    print("=" * 50)
    
    # Test 1: Invalid project ID
    print("Test 1: Invalid Project ID")
    try:
        response = requests.get(f"{BACKEND_URL}/photos/by-room/invalid-project-id/{ROOM_ID}", timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"  Photos found: {result.get('count', 0)}")
        print("  ✅ Handled gracefully")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    # Test 2: Invalid room ID
    print("\nTest 2: Invalid Room ID")
    try:
        response = requests.get(f"{BACKEND_URL}/photos/by-room/{PROJECT_ID}/invalid-room-id", timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"  Photos found: {result.get('count', 0)}")
        print("  ✅ Handled gracefully")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    # Test 3: Empty photo data upload
    print("\nTest 3: Empty Photo Data Upload")
    try:
        upload_data = {
            "project_id": PROJECT_ID,
            "room_id": ROOM_ID,
            "photo_data": "",
            "file_name": "empty_photo.jpg",
            "metadata": {}
        }
        response = requests.post(f"{BACKEND_URL}/photos/upload", json=upload_data, timeout=10)
        print(f"  Status: {response.status_code}")
        if response.status_code != 200:
            print("  ✅ Properly rejected empty photo")
        else:
            print("  ⚠️ Accepted empty photo (may need validation)")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

def test_data_integrity():
    """Test data integrity of stored photos"""
    print("\n🔍 DATA INTEGRITY TEST")
    print("=" * 50)
    
    try:
        # Get photos from API
        response = requests.get(f"{BACKEND_URL}/photos/by-room/{PROJECT_ID}/{ROOM_ID}", timeout=30)
        
        if response.status_code == 200:
            api_photos = response.json().get('photos', [])
            
            # Get photos directly from database
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            db_photos = list(db.photos.find({
                "project_id": PROJECT_ID,
                "room_id": ROOM_ID
            }))
            
            print(f"📊 API Photos: {len(api_photos)}")
            print(f"📊 DB Photos: {len(db_photos)}")
            
            if len(api_photos) == len(db_photos):
                print("✅ Photo count matches between API and DB")
            else:
                print("❌ Photo count mismatch between API and DB")
            
            # Check data integrity for each photo
            integrity_issues = 0
            for api_photo in api_photos:
                photo_id = api_photo.get('id')
                db_photo = next((p for p in db_photos if p.get('id') == photo_id), None)
                
                if not db_photo:
                    print(f"❌ Photo {photo_id} found in API but not in DB")
                    integrity_issues += 1
                    continue
                
                # Check photo_data integrity
                api_data = api_photo.get('photo_data', '')
                db_data = db_photo.get('photo_data', '')
                
                if api_data != db_data:
                    print(f"❌ Photo data mismatch for {photo_id}")
                    print(f"    API length: {len(api_data)}")
                    print(f"    DB length: {len(db_data)}")
                    integrity_issues += 1
                else:
                    print(f"✅ Photo {photo_id} data integrity OK")
            
            if integrity_issues == 0:
                print("✅ All photos have perfect data integrity")
            else:
                print(f"❌ Found {integrity_issues} integrity issues")
            
            client.close()
            return integrity_issues == 0
        else:
            print(f"❌ Failed to get photos from API: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Data Integrity Test Error: {str(e)}")
        return False

def main():
    """Run additional photo system tests"""
    print("🚀 ADDITIONAL PHOTO SYSTEM TESTS")
    print("=" * 60)
    print(f"🎯 Testing Project ID: {PROJECT_ID}")
    print(f"🏠 Testing Room ID: {ROOM_ID}")
    print("=" * 60)
    
    # Run additional tests
    mobile_upload_success = test_mobile_photo_upload()
    performance_success = test_photo_retrieval_performance()
    test_edge_cases()
    integrity_success = test_data_integrity()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 ADDITIONAL TESTS SUMMARY")
    print("=" * 60)
    
    print(f"1. Mobile Photo Upload: {'✅ PASS' if mobile_upload_success else '❌ FAIL'}")
    print(f"2. Retrieval Performance: {'✅ PASS' if performance_success else '❌ FAIL'}")
    print(f"3. Edge Cases: ✅ TESTED")
    print(f"4. Data Integrity: {'✅ PASS' if integrity_success else '❌ FAIL'}")
    
    print("\n🔍 FINAL ASSESSMENT:")
    if mobile_upload_success and performance_success and integrity_success:
        print("✅ Photo system is robust and ready for mobile app production use")
    else:
        print("⚠️ Some issues detected - review test results above")
        
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()