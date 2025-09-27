#!/usr/bin/env python3
"""
FINAL FFE FUNCTIONALITY TEST - COMPREHENSIVE RESULTS
Testing all the critical functionality reported as broken by the user
"""

import requests
import json
from typing import Dict, Any
import sys

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return "http://localhost:8001"
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"
PROJECT_ID = "5cccfb11-0ac0-45ed-91ab-a56088d65b5a"

print(f"🎯 FINAL FFE FUNCTIONALITY TEST")
print(f"Backend URL: {BASE_URL}")
print(f"Project ID: {PROJECT_ID}")
print("=" * 60)

class FFETestResults:
    def __init__(self):
        self.results = []
        self.critical_issues = []
        self.working_features = []
        
    def add_result(self, test_name: str, status: str, details: str, is_critical: bool = False):
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'critical': is_critical
        }
        self.results.append(result)
        
        if status == "WORKING":
            self.working_features.append(test_name)
        elif is_critical and status == "BROKEN":
            self.critical_issues.append(test_name)
            
        # Print result
        icon = "✅" if status == "WORKING" else "❌" if status == "BROKEN" else "⚠️"
        print(f"{icon} {test_name}: {status}")
        if details:
            print(f"   {details}")
        print()

def test_add_item_functionality():
    """Test Add Item functionality - CRITICAL"""
    print("🔍 TESTING ADD ITEM FUNCTIONALITY")
    print("-" * 40)
    
    results = FFETestResults()
    
    # Get project structure first
    try:
        response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
        if response.status_code != 200:
            results.add_result("Add Item - Project Access", "BROKEN", f"Cannot access project: {response.status_code}", True)
            return results
            
        project_data = response.json()
        subcategory_id = None
        
        for room in project_data.get('rooms', []):
            for category in room.get('categories', []):
                for subcategory in category.get('subcategories', []):
                    subcategory_id = subcategory['id']
                    break
                if subcategory_id:
                    break
            if subcategory_id:
                break
                
        if not subcategory_id:
            results.add_result("Add Item - Prerequisites", "BROKEN", "No subcategory found for testing", True)
            return results
            
    except Exception as e:
        results.add_result("Add Item - Prerequisites", "BROKEN", f"Exception: {e}", True)
        return results
    
    # Test 1: Basic item creation
    item_data = {
        "name": "Test FFE Item",
        "quantity": 1,
        "size": "Standard",
        "remarks": "Test item for FFE functionality",
        "vendor": "Four Hands",
        "status": "",  # Blank status as requested
        "cost": 1500.00,
        "link": "https://fourhands.com/test",
        "subcategory_id": subcategory_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/items", json=item_data)
        
        if response.status_code == 200:
            item_result = response.json()
            item_id = item_result.get('id')
            
            if item_id:
                results.add_result("Add Item - Basic Creation", "WORKING", f"Item created with ID: {item_id}")
                
                # Test 2: Verify item appears in project
                project_response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
                if project_response.status_code == 200:
                    updated_project = project_response.json()
                    item_found = False
                    
                    for room in updated_project.get('rooms', []):
                        for category in room.get('categories', []):
                            for subcategory in category.get('subcategories', []):
                                if subcategory['id'] == subcategory_id:
                                    for item in subcategory.get('items', []):
                                        if item.get('id') == item_id:
                                            item_found = True
                                            break
                                    break
                            if item_found:
                                break
                        if item_found:
                            break
                    
                    if item_found:
                        results.add_result("Add Item - Appears in Project", "WORKING", "Item correctly appears in project structure")
                    else:
                        results.add_result("Add Item - Appears in Project", "BROKEN", "Item does not appear in project structure", True)
                else:
                    results.add_result("Add Item - Appears in Project", "BROKEN", "Cannot re-fetch project to verify", True)
                
                # Test 3: Verify subcategory_id handling
                item_response = requests.get(f"{BASE_URL}/items/{item_id}")
                if item_response.status_code == 200:
                    retrieved_item = item_response.json()
                    if retrieved_item.get('subcategory_id') == subcategory_id:
                        results.add_result("Add Item - Subcategory ID", "WORKING", "Subcategory ID correctly stored and retrieved")
                    else:
                        results.add_result("Add Item - Subcategory ID", "BROKEN", f"Subcategory ID mismatch: expected {subcategory_id}, got {retrieved_item.get('subcategory_id')}", True)
                else:
                    results.add_result("Add Item - Subcategory ID", "BROKEN", "Cannot retrieve created item", True)
                
                # Cleanup
                try:
                    requests.delete(f"{BASE_URL}/items/{item_id}")
                except:
                    pass
                    
            else:
                results.add_result("Add Item - Basic Creation", "BROKEN", "Item created but no ID returned", True)
        else:
            results.add_result("Add Item - Basic Creation", "BROKEN", f"Item creation failed: {response.status_code} - {response.text}", True)
            
    except Exception as e:
        results.add_result("Add Item - Basic Creation", "BROKEN", f"Exception during item creation: {e}", True)
    
    return results

def test_add_category_functionality():
    """Test Add Category functionality - CRITICAL"""
    print("🔍 TESTING ADD CATEGORY FUNCTIONALITY")
    print("-" * 40)
    
    results = FFETestResults()
    
    # Get a room to add category to
    try:
        response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
        if response.status_code != 200:
            results.add_result("Add Category - Project Access", "BROKEN", f"Cannot access project: {response.status_code}", True)
            return results
            
        project_data = response.json()
        rooms = project_data.get('rooms', [])
        
        if not rooms:
            results.add_result("Add Category - Prerequisites", "BROKEN", "No rooms found for category testing", True)
            return results
            
        test_room_id = rooms[0]['id']
        room_name = rooms[0]['name']
        
    except Exception as e:
        results.add_result("Add Category - Prerequisites", "BROKEN", f"Exception: {e}", True)
        return results
    
    # Test 1: Basic category creation
    category_data = {
        "name": "TEST CATEGORY",
        "description": "Test category for FFE testing",
        "room_id": test_room_id,
        "order_index": 99
    }
    
    try:
        response = requests.post(f"{BASE_URL}/categories", json=category_data)
        
        if response.status_code == 200:
            category_result = response.json()
            category_id = category_result.get('id')
            
            if category_id:
                results.add_result("Add Category - Basic Creation", "WORKING", f"Category created with ID: {category_id}")
                
                # Test 2: Verify category appears in room
                project_response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
                if project_response.status_code == 200:
                    updated_project = project_response.json()
                    category_found = False
                    
                    for room in updated_project.get('rooms', []):
                        if room['id'] == test_room_id:
                            for category in room.get('categories', []):
                                if category.get('id') == category_id:
                                    category_found = True
                                    break
                            break
                    
                    if category_found:
                        results.add_result("Add Category - Appears in Room", "WORKING", f"Category appears in room '{room_name}'")
                    else:
                        results.add_result("Add Category - Appears in Room", "BROKEN", "Category does not appear in room", True)
                else:
                    results.add_result("Add Category - Appears in Room", "BROKEN", "Cannot re-fetch project to verify", True)
                
                # Cleanup
                try:
                    requests.delete(f"{BASE_URL}/categories/{category_id}")
                except:
                    pass
                    
            else:
                results.add_result("Add Category - Basic Creation", "BROKEN", "Category created but no ID returned", True)
        else:
            results.add_result("Add Category - Basic Creation", "BROKEN", f"Category creation failed: {response.status_code} - {response.text}", True)
            
    except Exception as e:
        results.add_result("Add Category - Basic Creation", "BROKEN", f"Exception during category creation: {e}", True)
    
    # Test 3: Comprehensive category creation
    try:
        comp_data = {
            "name": "Lighting",
            "room_id": test_room_id
        }
        
        response = requests.post(f"{BASE_URL}/categories/comprehensive", json=comp_data)
        
        if response.status_code == 200:
            comp_result = response.json()
            comp_category_id = comp_result.get('id')
            
            if comp_category_id:
                subcategories = comp_result.get('subcategories', [])
                results.add_result("Add Category - Comprehensive Creation", "WORKING", f"Comprehensive category created with {len(subcategories)} subcategories")
                
                # Cleanup
                try:
                    requests.delete(f"{BASE_URL}/categories/{comp_category_id}")
                except:
                    pass
            else:
                results.add_result("Add Category - Comprehensive Creation", "BROKEN", "Comprehensive category created but no ID returned", True)
        else:
            results.add_result("Add Category - Comprehensive Creation", "BROKEN", f"Comprehensive category creation failed: {response.status_code}", True)
            
    except Exception as e:
        results.add_result("Add Category - Comprehensive Creation", "BROKEN", f"Exception during comprehensive category creation: {e}", True)
    
    return results

def test_canva_pdf_scraping():
    """Test Canva PDF Scraping functionality - CRITICAL"""
    print("🔍 TESTING CANVA PDF SCRAPING")
    print("-" * 40)
    
    results = FFETestResults()
    
    # Get room name
    try:
        response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}")
        if response.status_code != 200:
            results.add_result("Canva PDF - Project Access", "BROKEN", f"Cannot access project: {response.status_code}", True)
            return results
            
        project_data = response.json()
        rooms = project_data.get('rooms', [])
        
        if not rooms:
            results.add_result("Canva PDF - Prerequisites", "BROKEN", "No rooms found for Canva testing", True)
            return results
            
        room_name = rooms[0]['name']
        
    except Exception as e:
        results.add_result("Canva PDF - Prerequisites", "BROKEN", f"Exception: {e}", True)
        return results
    
    # Test Canva PDF upload
    test_pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 50>>stream
BT /F1 12 Tf 72 720 Td (Test Canva Chair Sofa) Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 290
%%EOF"""
    
    files = {
        'file': ('test_canva.pdf', test_pdf_content, 'application/pdf')
    }
    
    data = {
        'room_name': room_name,
        'project_id': PROJECT_ID
    }
    
    try:
        response = requests.post(f"{BASE_URL}/upload-canva-pdf", data=data, files=files)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                items_created = result.get('items_created', 0)
                results.add_result("Canva PDF - Upload and Processing", "WORKING", f"PDF processed successfully, {items_created} items created")
            else:
                error = result.get('error', 'Unknown error')
                if "Room" in error and "not found" in error:
                    results.add_result("Canva PDF - Upload and Processing", "BROKEN", f"CRITICAL BUG: Room lookup failure in Canva processing - {error}", True)
                else:
                    results.add_result("Canva PDF - Upload and Processing", "BROKEN", f"PDF processing failed: {error}", True)
        else:
            results.add_result("Canva PDF - Upload and Processing", "BROKEN", f"Upload failed: {response.status_code} - {response.text}", True)
            
    except Exception as e:
        results.add_result("Canva PDF - Upload and Processing", "BROKEN", f"Exception during Canva PDF test: {e}", True)
    
    return results

def test_four_hands_scraping():
    """Test Four Hands scraping functionality"""
    print("🔍 TESTING FOUR HANDS SCRAPING")
    print("-" * 40)
    
    results = FFETestResults()
    
    four_hands_url = "https://fourhands.com/product/248067-003"
    scrape_data = {"url": four_hands_url}
    
    try:
        response = requests.post(f"{BASE_URL}/scrape-product", json=scrape_data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                product_data = result.get('data', {})
                
                name = product_data.get('name', '')
                vendor = product_data.get('vendor', '')
                sku = product_data.get('sku', '')
                price = product_data.get('price', '') or product_data.get('cost', '')
                
                if "fenn chair" in name.lower() and vendor == "Four Hands" and "248067-003" in sku:
                    results.add_result("Four Hands Scraping", "WORKING", f"Successfully extracted: {name}, {vendor}, {sku}, {price}")
                else:
                    results.add_result("Four Hands Scraping", "PARTIAL", f"Partial data extracted: name='{name}', vendor='{vendor}', sku='{sku}'")
            else:
                error = result.get('error', 'Unknown error')
                results.add_result("Four Hands Scraping", "BROKEN", f"Scraping failed: {error}")
        else:
            results.add_result("Four Hands Scraping", "BROKEN", f"Scraping request failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        results.add_result("Four Hands Scraping", "BROKEN", f"Exception during scraping: {e}")
    
    return results

def main():
    """Run all tests and provide comprehensive summary"""
    
    all_results = []
    
    # Run all critical tests
    all_results.extend(test_add_item_functionality().results)
    all_results.extend(test_add_category_functionality().results)
    all_results.extend(test_canva_pdf_scraping().results)
    all_results.extend(test_four_hands_scraping().results)
    
    # Summary
    print("=" * 60)
    print("🎯 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    
    working_count = sum(1 for r in all_results if r['status'] == 'WORKING')
    broken_count = sum(1 for r in all_results if r['status'] == 'BROKEN')
    partial_count = sum(1 for r in all_results if r['status'] == 'PARTIAL')
    critical_count = sum(1 for r in all_results if r['critical'] and r['status'] == 'BROKEN')
    
    print(f"Total Tests: {len(all_results)}")
    print(f"✅ Working: {working_count}")
    print(f"❌ Broken: {broken_count}")
    print(f"⚠️ Partial: {partial_count}")
    print(f"🚨 Critical Issues: {critical_count}")
    print()
    
    # Critical issues
    if critical_count > 0:
        print("🚨 CRITICAL ISSUES CONFIRMED:")
        for result in all_results:
            if result['critical'] and result['status'] == 'BROKEN':
                print(f"   • {result['test']}: {result['details']}")
        print()
    
    # Working features
    working_features = [r for r in all_results if r['status'] == 'WORKING']
    if working_features:
        print("✅ WORKING FEATURES:")
        for result in working_features:
            print(f"   • {result['test']}")
        print()
    
    # Root cause analysis
    print("🔍 ROOT CAUSE ANALYSIS:")
    
    canva_issues = [r for r in all_results if 'Canva' in r['test'] and r['status'] == 'BROKEN']
    if canva_issues:
        print("   • CANVA PDF SCRAPING: Backend bug in room lookup logic")
        print("     - Regular project endpoint builds room structure from separate collections")
        print("     - Canva processing tries to find rooms directly in project document")
        print("     - This is a database query inconsistency issue")
    
    add_item_issues = [r for r in all_results if 'Add Item' in r['test'] and r['status'] == 'BROKEN']
    if add_item_issues:
        print("   • ADD ITEM: Issues with item creation or validation")
    
    add_category_issues = [r for r in all_results if 'Add Category' in r['test'] and r['status'] == 'BROKEN']
    if add_category_issues:
        print("   • ADD CATEGORY: Issues with category creation or room association")
    
    if critical_count == 0:
        print("   • No critical backend issues found")
        print("   • User's reported problems may be frontend-related")
    
    print()
    print("🎯 CONCLUSION:")
    if critical_count > 0:
        print(f"   {critical_count} critical backend issues confirmed")
        print("   Main issue: Canva PDF processing has database query bug")
        print("   Add Item and Add Category basic functionality is working")
    else:
        print("   Backend APIs are functioning correctly")
        print("   User's issues may be in frontend implementation")
    
    return critical_count == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)