#!/usr/bin/env python3
"""
Calculator Testing Script - Drapery and Hardware Calculators
Testing the exact payloads from the review request
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://app-stability-fix-4.preview.emergentagent.com/api"

def test_drapery_calculator():
    """Test the drapery calculator with exact payload from review request"""
    print("\n" + "="*80)
    print("TESTING DRAPERY CALCULATOR")
    print("="*80)
    
    url = f"{BACKEND_URL}/calculators/drapery"
    payload = {
        "window_width": 60,
        "finished_length": 84,
        "pleat_type": "pinch_pleat",
        "fullness_ratio": 2.5,
        "fabric_width": 54,
        "pattern_repeat": None,
        "include_lining": False
    }
    
    print(f"\n📍 URL: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        print(f"\n✅ Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS - Response Body:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ ERROR - Status: {response.status_code}")
            print(f"❌ Response Body:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST EXCEPTION: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return False

def test_hardware_calculator():
    """Test the hardware calculator with exact payload from review request"""
    print("\n" + "="*80)
    print("TESTING HARDWARE CALCULATOR")
    print("="*80)
    
    url = f"{BACKEND_URL}/calculators/hardware"
    payload = {
        "window_width": 60,
        "rod_overhang_per_side": 6,
        "rod_diameter": 1.0,
        "drapery_weight": "medium"
    }
    
    print(f"\n📍 URL: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        print(f"\n✅ Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS - Response Body:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"❌ ERROR - Status: {response.status_code}")
            print(f"❌ Response Body:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST EXCEPTION: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return False

def check_backend_logs():
    """Check backend logs for any errors"""
    print("\n" + "="*80)
    print("CHECKING BACKEND LOGS")
    print("="*80)
    
    import subprocess
    try:
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.stdout:
            print("\n📋 Backend Error Logs (last 50 lines):")
            print(result.stdout)
        else:
            print("\n✅ No recent errors in backend logs")
    except Exception as e:
        print(f"⚠️ Could not read backend logs: {str(e)}")

def main():
    print("\n" + "="*80)
    print("🧪 CALCULATOR API TESTING - DRAPERY & HARDWARE")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    
    # Test both calculators
    drapery_result = test_drapery_calculator()
    hardware_result = test_hardware_calculator()
    
    # Check backend logs
    check_backend_logs()
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Drapery Calculator: {'✅ PASS' if drapery_result else '❌ FAIL'}")
    print(f"Hardware Calculator: {'✅ PASS' if hardware_result else '❌ FAIL'}")
    
    if drapery_result and hardware_result:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED - See details above")
        sys.exit(1)

if __name__ == "__main__":
    main()
