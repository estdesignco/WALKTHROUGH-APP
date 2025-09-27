#!/usr/bin/env python3
"""
FF&E Enhanced Endpoints Testing - Test the professional enhanced endpoints
"""

import requests
import json
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

print(f"🎯 TESTING ENHANCED FF&E ENDPOINTS")
print(f"Backend URL: {BASE_URL}")
print("=" * 60)

def make_request(endpoint):
    """Make GET request to endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        response = requests.get(url)
        return response.status_code < 400, response.json() if response.content else {}, response.status_code
    except Exception as e:
        return False, f"Error: {str(e)}", 0

def test_enhanced_status_system():
    """Test enhanced status system with colors"""
    print("\n🎨 ENHANCED STATUS SYSTEM TEST")
    print("-" * 40)
    
    success, data, status_code = make_request('/item-statuses-enhanced')
    
    if not success:
        print(f"❌ Failed to get enhanced statuses: {data} (Status: {status_code})")
        return False
        
    if isinstance(data, dict) and 'data' in data:
        statuses = data['data']
        
        if isinstance(statuses, list) and len(statuses) > 0:
            print(f"✅ Retrieved {len(statuses)} enhanced statuses")
            
            # Check if statuses have color information
            first_status = statuses[0]
            if isinstance(first_status, dict) and 'color' in first_status:
                print(f"✅ Enhanced format with colors detected")
                
                # Group by phases
                phases = {}
                for status in statuses:
                    phase = status.get('phase', 'unknown')
                    if phase not in phases:
                        phases[phase] = []
                    phases[phase].append(status)
                
                print(f"\n📊 STATUS BREAKDOWN BY PHASE:")
                for phase, phase_statuses in phases.items():
                    print(f"   {phase.upper()}: {len(phase_statuses)} statuses")
                    for status in phase_statuses[:3]:  # Show first 3
                        print(f"      • {status.get('status', 'Unknown')}: {status.get('color', 'No color')}")
                    if len(phase_statuses) > 3:
                        print(f"      ... and {len(phase_statuses) - 3} more")
                
                return True
            else:
                print(f"❌ Simple format detected, no color information")
                return False
        else:
            print(f"❌ Invalid statuses format: {statuses}")
            return False
    else:
        print(f"❌ Invalid response format: {data}")
        return False

def test_enhanced_carrier_system():
    """Test enhanced carrier system with colors"""
    print("\n🚚 ENHANCED CARRIER SYSTEM TEST")
    print("-" * 40)
    
    success, data, status_code = make_request('/carrier-options')
    
    if not success:
        print(f"❌ Failed to get enhanced carriers: {data} (Status: {status_code})")
        return False
        
    if isinstance(data, dict) and 'data' in data:
        carriers = data['data']
        
        if isinstance(carriers, list) and len(carriers) > 0:
            print(f"✅ Retrieved {len(carriers)} enhanced carriers")
            
            # Check if carriers have color information
            first_carrier = carriers[0]
            if isinstance(first_carrier, dict) and 'color' in first_carrier:
                print(f"✅ Enhanced format with colors detected")
                
                print(f"\n📦 CARRIER OPTIONS WITH COLORS:")
                for carrier in carriers:
                    name = carrier.get('name', 'Unknown')
                    color = carrier.get('color', 'No color')
                    tracking_url = carrier.get('tracking_url', '')
                    
                    print(f"   • {name}: {color}")
                    if tracking_url:
                        print(f"     └── Tracking: {tracking_url}")
                
                return True
            else:
                print(f"❌ Simple format detected, no color information")
                return False
        else:
            print(f"❌ Invalid carriers format: {carriers}")
            return False
    else:
        print(f"❌ Invalid response format: {data}")
        return False

def test_vendor_database():
    """Test vendor database"""
    print("\n🏪 VENDOR DATABASE TEST")
    print("-" * 40)
    
    success, data, status_code = make_request('/vendor-database')
    
    if not success:
        print(f"❌ Failed to get vendor database: {data} (Status: {status_code})")
        return False
        
    if isinstance(data, dict) and 'data' in data:
        vendors = data['data']
        
        if isinstance(vendors, list) and len(vendors) > 0:
            print(f"✅ Retrieved {len(vendors)} vendors from database")
            
            # Check vendor structure
            first_vendor = vendors[0]
            if isinstance(first_vendor, dict) and 'scraping_supported' in first_vendor:
                print(f"✅ Enhanced vendor format detected")
                
                # Count scraping supported vendors
                scraping_supported = sum(1 for v in vendors if v.get('scraping_supported', False))
                
                print(f"\n📊 VENDOR BREAKDOWN:")
                print(f"   Total vendors: {len(vendors)}")
                print(f"   Scraping supported: {scraping_supported}")
                
                # Show some examples
                print(f"\n🏪 SAMPLE VENDORS:")
                for vendor in vendors[:5]:
                    name = vendor.get('name', 'Unknown')
                    url = vendor.get('url', 'No URL')
                    category = vendor.get('category', 'No category')
                    scraping = "✅" if vendor.get('scraping_supported', False) else "❌"
                    
                    print(f"   {scraping} {name} ({category}) - {url}")
                
                return True
            else:
                print(f"❌ Simple format detected")
                return False
        else:
            print(f"❌ Invalid vendors format: {vendors}")
            return False
    else:
        print(f"❌ Invalid response format: {data}")
        return False

def main():
    """Run all enhanced endpoint tests"""
    
    results = []
    
    # Test enhanced status system
    status_result = test_enhanced_status_system()
    results.append(("Enhanced Status System", status_result))
    
    # Test enhanced carrier system  
    carrier_result = test_enhanced_carrier_system()
    results.append(("Enhanced Carrier System", carrier_result))
    
    # Test vendor database
    vendor_result = test_vendor_database()
    results.append(("Vendor Database", vendor_result))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ENHANCED ENDPOINTS TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}% success rate)")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    if passed == total:
        print(f"\n🎉 ALL ENHANCED ENDPOINTS WORKING!")
    else:
        print(f"\n⚠️ Some enhanced endpoints need attention")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)