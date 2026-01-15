#!/usr/bin/env python3
"""
Photo Storage and Retrieval System Test
Testing photo upload and retrieval functionality for mobile app
"""

import requests
import json
import base64
import os
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Configuration
BACKEND_URL = "https://designflow-app-9.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "interiorsync"

# Test data from review request
PROJECT_ID = "5d42e515-f84b-4c3d-a4cc-6c3dcc4417a2"
ROOM_ID = "226d6320-3c2e-4741-aaa1-9e697106c019"

def create_test_base64_image():
    """Create a small test image in base64 format"""
    # Create a simple 1x1 pixel PNG image in base64
    # This is a valid PNG image data
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
    base64_data = base64.b64encode(png_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"

def create_test_jpeg_image():
    """Create a test JPEG image in base64 format"""
    # Minimal JPEG header and data
    jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xaa\xff\xd9'
    base64_data = base64.b64encode(jpeg_data).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_data}"

def test_photo_upload():
    """Test 1: Photo Upload Test - POST /api/photos/upload"""
    print("🔍 TEST 1: Photo Upload Test")
    print("=" * 50)
    
    # Create test photo data
    test_photo_data = create_test_jpeg_image()
    
    upload_data = {
        "project_id": PROJECT_ID,
        "room_id": ROOM_ID,
        "photo_data": test_photo_data,
        "file_name": "test_photo_upload.jpg",
        "metadata": {
            "test": True,
            "uploaded_by": "backend_test",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/photos/upload", json=upload_data, timeout=30)
        print(f"📤 Upload Request Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload Success: {result.get('success', False)}")
            print(f"📝 Message: {result.get('message', 'No message')}")
            print(f"🆔 Photo ID: {result.get('id', 'No ID')}")
            print(f"⏰ Uploaded At: {result.get('uploaded_at', 'No timestamp')}")
            return result.get('id')
        else:
            print(f"❌ Upload Failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload Error: {str(e)}")
        return None

def test_photo_retrieval():
    """Test 2: Photo Retrieval Test - GET /api/photos/by-room/{project_id}/{room_id}"""
    print("\n🔍 TEST 2: Photo Retrieval Test")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BACKEND_URL}/photos/by-room/{PROJECT_ID}/{ROOM_ID}", timeout=30)
        print(f"📥 Retrieval Request Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Retrieval Success: {result.get('success', False)}")
            print(f"📊 Photo Count: {result.get('count', 0)}")
            
            photos = result.get('photos', [])
            folder = result.get('folder', {})
            
            print(f"📁 Folder Info: {folder.get('folder_name', 'No folder') if folder else 'No folder found'}")
            
            if photos:
                print(f"\n📸 Found {len(photos)} photos:")
                for i, photo in enumerate(photos, 1):
                    print(f"  Photo {i}:")
                    print(f"    🆔 ID: {photo.get('id', 'No ID')}")
                    print(f"    📄 File: {photo.get('file_name', 'No filename')}")
                    print(f"    🗂️ Project ID: {photo.get('project_id', 'No project ID')}")
                    print(f"    🏠 Room ID: {photo.get('room_id', 'No room ID')}")
                    print(f"    ⏰ Uploaded: {photo.get('uploaded_at', 'No timestamp')}")
                    
                    # Check photo_data format
                    photo_data = photo.get('photo_data', '')
                    if photo_data:
                        print(f"    📊 Data Length: {len(photo_data)} characters")
                        if photo_data.startswith('data:image/'):
                            print(f"    ✅ Has proper data URI prefix")
                            if 'base64,' in photo_data:
                                print(f"    ✅ Contains base64 data")
                                base64_part = photo_data.split('base64,')[1]
                                print(f"    📊 Base64 Length: {len(base64_part)} characters")
                            else:
                                print(f"    ❌ Missing base64 data")
                        else:
                            print(f"    ❌ Missing data URI prefix")
                            print(f"    📄 Data starts with: {photo_data[:50]}...")
                    else:
                        print(f"    ❌ No photo_data found")
            else:
                print("📭 No photos found")
                
            return photos
        else:
            print(f"❌ Retrieval Failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Retrieval Error: {str(e)}")
        return []

def test_data_format_verification(photos):
    """Test 3: Data Format Verification"""
    print("\n🔍 TEST 3: Data Format Verification")
    print("=" * 50)
    
    if not photos:
        print("❌ No photos to verify")
        return False
    
    all_valid = True
    
    for i, photo in enumerate(photos, 1):
        print(f"\n📸 Verifying Photo {i}: {photo.get('file_name', 'Unknown')}")
        
        photo_data = photo.get('photo_data', '')
        
        # Check if photo_data exists
        if not photo_data:
            print(f"    ❌ No photo_data field")
            all_valid = False
            continue
            
        # Check data URI format
        if not photo_data.startswith('data:image/'):
            print(f"    ❌ Missing 'data:image/' prefix")
            print(f"    📄 Starts with: {photo_data[:50]}...")
            all_valid = False
            continue
        else:
            print(f"    ✅ Has proper 'data:image/' prefix")
            
        # Check for base64 marker
        if ';base64,' not in photo_data:
            print(f"    ❌ Missing ';base64,' marker")
            all_valid = False
            continue
        else:
            print(f"    ✅ Has ';base64,' marker")
            
        # Extract and verify base64 data
        try:
            base64_part = photo_data.split(';base64,')[1]
            print(f"    📊 Base64 data length: {len(base64_part)} characters")
            
            # Try to decode base64
            decoded = base64.b64decode(base64_part)
            print(f"    📊 Decoded data length: {len(decoded)} bytes")
            print(f"    ✅ Base64 data is valid")
            
            # Check image format
            if photo_data.startswith('data:image/jpeg'):
                print(f"    📷 Format: JPEG")
            elif photo_data.startswith('data:image/png'):
                print(f"    📷 Format: PNG")
            else:
                print(f"    📷 Format: Other")
                
        except Exception as e:
            print(f"    ❌ Invalid base64 data: {str(e)}")
            all_valid = False
            
    return all_valid

def test_database_direct_check():
    """Test 4: Database Direct Check"""
    print("\n🔍 TEST 4: Database Direct Check")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("✅ Connected to MongoDB")
        
        # Check photos collection
        photos_collection = db.photos
        photo_count = photos_collection.count_documents({})
        print(f"📊 Total photos in collection: {photo_count}")
        
        # Check photos for our specific room
        room_photos = list(photos_collection.find({
            "project_id": PROJECT_ID,
            "room_id": ROOM_ID
        }))
        
        print(f"📊 Photos for room {ROOM_ID}: {len(room_photos)}")
        
        if room_photos:
            print("\n📸 Room Photos Details:")
            for i, photo in enumerate(room_photos, 1):
                print(f"  Photo {i}:")
                print(f"    🆔 ID: {photo.get('id', 'No ID')}")
                print(f"    📄 File: {photo.get('file_name', 'No filename')}")
                print(f"    ⏰ Uploaded: {photo.get('uploaded_at', 'No timestamp')}")
                print(f"    🔄 Synced: {photo.get('synced', 'Unknown')}")
                
                # Check photo_data structure
                photo_data = photo.get('photo_data', '')
                if photo_data:
                    print(f"    📊 Data Length: {len(photo_data)} characters")
                    if photo_data.startswith('data:image/'):
                        print(f"    ✅ Proper data URI format")
                    else:
                        print(f"    ❌ Invalid data URI format")
                        print(f"    📄 Starts with: {photo_data[:50]}...")
                else:
                    print(f"    ❌ No photo_data field")
        
        # Check photo_folders collection
        folders_collection = db.photo_folders
        folder_count = folders_collection.count_documents({})
        print(f"\n📁 Total photo folders: {folder_count}")
        
        room_folder = folders_collection.find_one({"room_id": ROOM_ID})
        if room_folder:
            print(f"📁 Room folder found: {room_folder.get('folder_name', 'No name')}")
            print(f"📊 Photos in folder: {len(room_folder.get('photos', []))}")
        else:
            print(f"📁 No folder found for room {ROOM_ID}")
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Database Error: {str(e)}")
        return False

def main():
    """Run all photo storage and retrieval tests"""
    print("🚀 PHOTO STORAGE AND RETRIEVAL SYSTEM TEST")
    print("=" * 60)
    print(f"🎯 Testing Project ID: {PROJECT_ID}")
    print(f"🏠 Testing Room ID: {ROOM_ID}")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    # Test 1: Photo Upload
    uploaded_photo_id = test_photo_upload()
    
    # Test 2: Photo Retrieval
    photos = test_photo_retrieval()
    
    # Test 3: Data Format Verification
    format_valid = test_data_format_verification(photos)
    
    # Test 4: Database Direct Check
    db_check_success = test_database_direct_check()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    print(f"1. Photo Upload: {'✅ PASS' if uploaded_photo_id else '❌ FAIL'}")
    print(f"2. Photo Retrieval: {'✅ PASS' if photos else '❌ FAIL'}")
    print(f"3. Data Format: {'✅ PASS' if format_valid else '❌ FAIL'}")
    print(f"4. Database Check: {'✅ PASS' if db_check_success else '❌ FAIL'}")
    
    # Diagnosis
    print("\n🔍 DIAGNOSIS:")
    if not photos:
        print("❌ CRITICAL: No photos found for the specified room")
        print("   - Photos may not be uploading correctly")
        print("   - Database storage may be failing")
        print("   - Room/Project IDs may be incorrect")
    elif not format_valid:
        print("❌ CRITICAL: Photo data format issues detected")
        print("   - Base64 encoding may be corrupted")
        print("   - Data URI prefix may be missing")
        print("   - This would cause display issues in mobile app")
    else:
        print("✅ Photo storage and retrieval system appears to be working correctly")
        
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()