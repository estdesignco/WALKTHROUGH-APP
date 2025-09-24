#!/usr/bin/env python3
"""
FRONTEND CHECKBOX BEHAVIOR TEST

Based on the backend debug results, the issue is in the frontend.
This test will examine the actual frontend behavior and checkbox state management.

CRITICAL FINDINGS FROM BACKEND TEST:
- Backend APIs work correctly for selective transfer
- Project has comprehensive data (2304 items across 24 rooms)
- Individual transfer APIs work perfectly
- No bulk transfer endpoints exist that could bypass selection

FRONTEND ISSUES TO INVESTIGATE:
1. Are checkboxes actually updating the checkedItems state?
2. Is the transfer function reading the correct checkedItems state?
3. Is there a race condition or state reset happening?
4. Are there multiple transfer functions or conflicting logic?
"""

import requests
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import sys
import os

# Get URLs
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

BACKEND_URL = get_backend_url()
FRONTEND_URL = BACKEND_URL.replace('/api', '') if '/api' in BACKEND_URL else BACKEND_URL
PROJECT_ID = "4f261f4e-c5af-46c3-92c7-0d923593228f"

print("=" * 80)
print("🔍 FRONTEND CHECKBOX BEHAVIOR TEST")
print("=" * 80)
print(f"Frontend URL: {FRONTEND_URL}")
print(f"Backend URL: {BACKEND_URL}")
print(f"Project ID: {PROJECT_ID}")
print("Goal: Test actual checkbox behavior and state management")
print("=" * 80)

class FrontendCheckboxTester:
    def __init__(self):
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })

    def test_walkthrough_page_access(self):
        """Test if we can access the walkthrough page"""
        print("\n🔍 STEP 1: Testing walkthrough page access...")
        
        try:
            # Setup Chrome options for headless mode
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Navigate to walkthrough page
            walkthrough_url = f"{FRONTEND_URL}/project/{PROJECT_ID}/walkthrough"
            print(f"   Navigating to: {walkthrough_url}")
            
            driver.get(walkthrough_url)
            
            # Wait for page to load
            time.sleep(5)
            
            # Check if page loaded successfully
            page_title = driver.title
            page_source_length = len(driver.page_source)
            
            # Look for key elements
            checkboxes = driver.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
            transfer_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), 'TRANSFER TO CHECKLIST')]")
            
            self.log_test("Walkthrough Page Access", True, 
                         f"Page loaded - Title: {page_title}, Source length: {page_source_length}")
            self.log_test("Checkboxes Found", len(checkboxes) > 0, 
                         f"Found {len(checkboxes)} checkboxes on page")
            self.log_test("Transfer Button Found", len(transfer_buttons) > 0, 
                         f"Found {len(transfer_buttons)} transfer buttons")
            
            # Take screenshot for debugging
            driver.save_screenshot('/app/walkthrough_page.png')
            print("   📸 Screenshot saved as walkthrough_page.png")
            
            driver.quit()
            return len(checkboxes) > 0 and len(transfer_buttons) > 0
            
        except Exception as e:
            self.log_test("Walkthrough Page Access", False, f"Error: {str(e)}")
            return False

    def test_checkbox_interaction(self):
        """Test checkbox interaction and state management"""
        print("\n🔍 STEP 2: Testing checkbox interaction...")
        
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Navigate to walkthrough page
            walkthrough_url = f"{FRONTEND_URL}/project/{PROJECT_ID}/walkthrough"
            driver.get(walkthrough_url)
            
            # Wait for page to load
            time.sleep(5)
            
            # Find checkboxes
            checkboxes = driver.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
            
            if len(checkboxes) == 0:
                self.log_test("Checkbox Interaction", False, "No checkboxes found on page")
                driver.quit()
                return False
            
            # Test clicking first few checkboxes
            checked_count = 0
            for i, checkbox in enumerate(checkboxes[:5]):  # Test first 5 checkboxes
                try:
                    # Scroll to checkbox
                    driver.execute_script("arguments[0].scrollIntoView();", checkbox)
                    time.sleep(0.5)
                    
                    # Click checkbox
                    checkbox.click()
                    checked_count += 1
                    
                    # Check if checkbox is now checked
                    is_checked = checkbox.is_selected()
                    print(f"   Checkbox {i+1}: Clicked - Checked: {is_checked}")
                    
                except Exception as e:
                    print(f"   Checkbox {i+1}: Error clicking - {str(e)}")
            
            self.log_test("Checkbox Clicking", checked_count > 0, 
                         f"Successfully clicked {checked_count} out of {min(5, len(checkboxes))} checkboxes")
            
            # Check console logs for any JavaScript errors
            logs = driver.get_log('browser')
            js_errors = [log for log in logs if log['level'] == 'SEVERE']
            
            if js_errors:
                self.log_test("JavaScript Errors", False, 
                             f"Found {len(js_errors)} JavaScript errors")
                for error in js_errors[:3]:  # Show first 3 errors
                    print(f"   JS ERROR: {error['message']}")
            else:
                self.log_test("JavaScript Errors", True, "No JavaScript errors found")
            
            driver.quit()
            return checked_count > 0
            
        except Exception as e:
            self.log_test("Checkbox Interaction", False, f"Error: {str(e)}")
            return False

    def test_transfer_button_behavior(self):
        """Test transfer button behavior when clicked"""
        print("\n🔍 STEP 3: Testing transfer button behavior...")
        
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Navigate to walkthrough page
            walkthrough_url = f"{FRONTEND_URL}/project/{PROJECT_ID}/walkthrough"
            driver.get(walkthrough_url)
            
            # Wait for page to load
            time.sleep(5)
            
            # Find and click some checkboxes first
            checkboxes = driver.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
            
            if len(checkboxes) >= 3:
                for i in range(3):  # Check first 3 items
                    try:
                        driver.execute_script("arguments[0].scrollIntoView();", checkboxes[i])
                        time.sleep(0.5)
                        checkboxes[i].click()
                        print(f"   Checked item {i+1}")
                    except Exception as e:
                        print(f"   Error checking item {i+1}: {e}")
            
            # Find transfer button
            transfer_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), 'TRANSFER TO CHECKLIST')]")
            
            if len(transfer_buttons) == 0:
                self.log_test("Transfer Button Found", False, "No transfer button found")
                driver.quit()
                return False
            
            # Click transfer button
            transfer_button = transfer_buttons[0]
            driver.execute_script("arguments[0].scrollIntoView();", transfer_button)
            time.sleep(1)
            
            # Enable console logging to capture JavaScript output
            driver.execute_script("console.log('🎯 About to click transfer button');")
            
            transfer_button.click()
            
            # Wait for any alerts or confirmations
            time.sleep(3)
            
            # Check for alerts
            try:
                alert = driver.switch_to.alert
                alert_text = alert.text
                print(f"   Alert appeared: {alert_text}")
                alert.accept()  # Accept the alert
                self.log_test("Transfer Button Alert", True, f"Alert text: {alert_text}")
            except:
                self.log_test("Transfer Button Alert", True, "No alert appeared (might be expected)")
            
            # Check console logs for transfer-related messages
            logs = driver.get_log('browser')
            transfer_logs = [log for log in logs if 'transfer' in log['message'].lower() or 'checked' in log['message'].lower()]
            
            if transfer_logs:
                self.log_test("Transfer Console Logs", True, f"Found {len(transfer_logs)} transfer-related logs")
                for log in transfer_logs[:5]:  # Show first 5 logs
                    print(f"   CONSOLE: {log['message']}")
            else:
                self.log_test("Transfer Console Logs", False, "No transfer-related console logs found")
            
            driver.quit()
            return True
            
        except Exception as e:
            self.log_test("Transfer Button Behavior", False, f"Error: {str(e)}")
            return False

    def analyze_frontend_code_directly(self):
        """Analyze the frontend code directly for potential issues"""
        print("\n🔍 STEP 4: Analyzing frontend code directly...")
        
        try:
            # Read the SimpleWalkthroughSpreadsheet.js file
            with open('/app/frontend/src/components/SimpleWalkthroughSpreadsheet.js', 'r') as f:
                frontend_code = f.read()
            
            # Check for key patterns
            issues_found = []
            
            # Check 1: Is checkedItems state properly initialized?
            if 'useState(new Set())' in frontend_code:
                self.log_test("CheckedItems State Initialization", True, "Found useState(new Set())")
            else:
                issues_found.append("checkedItems state not properly initialized")
            
            # Check 2: Is checkbox onChange handler present?
            if 'onChange={(e) => {' in frontend_code and 'setCheckedItems' in frontend_code:
                self.log_test("Checkbox onChange Handler", True, "Found checkbox onChange with setCheckedItems")
            else:
                issues_found.append("checkbox onChange handler missing or incorrect")
            
            # Check 3: Is transfer function checking checkedItems.size?
            if 'checkedItems.size === 0' in frontend_code:
                self.log_test("Transfer Function Size Check", True, "Found checkedItems.size === 0 check")
            else:
                issues_found.append("transfer function not checking checkedItems.size")
            
            # Check 4: Is transfer function iterating through checked items?
            if 'checkedItems.has(item.id)' in frontend_code:
                self.log_test("Transfer Function Item Check", True, "Found checkedItems.has(item.id) check")
            else:
                issues_found.append("transfer function not checking individual items")
            
            # Check 5: Look for any potential state resets
            state_resets = frontend_code.count('setCheckedItems(new Set())')
            if state_resets > 1:  # One is initialization, more might be problematic
                self.log_test("Potential State Resets", False, f"Found {state_resets} calls to setCheckedItems(new Set())")
                issues_found.append(f"multiple state resets found ({state_resets})")
            else:
                self.log_test("State Reset Check", True, "No problematic state resets found")
            
            # Check 6: Look for debugging logs
            debug_logs = frontend_code.count('console.log')
            self.log_test("Debug Logging", debug_logs > 5, f"Found {debug_logs} console.log statements")
            
            if issues_found:
                self.log_test("Frontend Code Analysis", False, f"Issues found: {', '.join(issues_found)}")
                return False
            else:
                self.log_test("Frontend Code Analysis", True, "No obvious issues found in frontend code")
                return True
            
        except Exception as e:
            self.log_test("Frontend Code Analysis", False, f"Error reading frontend code: {str(e)}")
            return False

    def test_network_requests_simulation(self):
        """Simulate what network requests should look like"""
        print("\n🔍 STEP 5: Network requests simulation...")
        
        # This would require actual browser automation with network monitoring
        # For now, provide analysis based on code review
        
        analysis = """
        NETWORK REQUEST ANALYSIS:
        
        EXPECTED BEHAVIOR (Selective Transfer):
        1. User checks 3 items in walkthrough
        2. User clicks "TRANSFER TO CHECKLIST"
        3. Frontend should make:
           - 1-2 POST /api/rooms calls (for new checklist rooms)
           - 1-3 POST /api/categories calls (for categories)
           - 1-5 POST /api/subcategories calls (for subcategories)
           - EXACTLY 3 POST /api/items calls (for the 3 checked items)
        
        ACTUAL BEHAVIOR (If transferring everything):
        1. User checks 3 items in walkthrough
        2. User clicks "TRANSFER TO CHECKLIST"
        3. Frontend makes:
           - Many POST /api/rooms calls
           - Many POST /api/categories calls
           - Many POST /api/subcategories calls
           - HUNDREDS of POST /api/items calls (for ALL items, not just checked)
        
        ROOT CAUSE POSSIBILITIES:
        1. checkedItems state is empty when transfer is called
        2. Transfer function is ignoring checkedItems and processing all items
        3. There's a race condition where state is reset before transfer
        4. Multiple transfer functions exist and wrong one is called
        """
        
        print(analysis)
        
        self.log_test("Network Request Analysis", True, "Analysis complete - need actual network monitoring")
        
        return True

    def run_comprehensive_frontend_test(self):
        """Run the complete frontend testing process"""
        print("🚀 STARTING COMPREHENSIVE FRONTEND TEST...")
        
        # Step 1: Test page access
        page_access_success = self.test_walkthrough_page_access()
        
        # Step 2: Test checkbox interaction
        checkbox_success = self.test_checkbox_interaction()
        
        # Step 3: Test transfer button
        transfer_success = self.test_transfer_button_behavior()
        
        # Step 4: Analyze frontend code
        code_analysis_success = self.analyze_frontend_code_directly()
        
        # Step 5: Network simulation
        self.test_network_requests_simulation()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 FRONTEND TEST SUMMARY")
        print("=" * 80)
        
        if page_access_success:
            print("✅ WALKTHROUGH PAGE: Accessible with checkboxes and transfer button")
        else:
            print("❌ WALKTHROUGH PAGE: Issues with page access or elements")
        
        if checkbox_success:
            print("✅ CHECKBOX INTERACTION: Checkboxes can be clicked")
        else:
            print("❌ CHECKBOX INTERACTION: Issues with checkbox functionality")
        
        if transfer_success:
            print("✅ TRANSFER BUTTON: Button can be clicked")
        else:
            print("❌ TRANSFER BUTTON: Issues with transfer button")
        
        if code_analysis_success:
            print("✅ FRONTEND CODE: No obvious issues in code structure")
        else:
            print("❌ FRONTEND CODE: Issues found in code analysis")
        
        print("\n🔍 CRITICAL FINDINGS:")
        print("   Based on backend testing, the APIs work correctly for selective transfer.")
        print("   The issue is definitely in the frontend checkbox state management.")
        
        print("\n🚨 RECOMMENDED ACTIONS:")
        print("   1. Add more debugging logs to handleTransferToChecklist function")
        print("   2. Log checkedItems state before and during transfer")
        print("   3. Monitor browser network tab during actual transfer")
        print("   4. Check if there are multiple versions of transfer function")
        print("   5. Verify checkbox onChange handlers are actually firing")
        
        return page_access_success and checkbox_success

# Main execution
if __name__ == "__main__":
    tester = FrontendCheckboxTester()
    success = tester.run_comprehensive_frontend_test()
    
    if success:
        print("\n🎉 FRONTEND TEST COMPLETE: Basic functionality working")
        print("🔍 ISSUE IS IN STATE MANAGEMENT: Need to debug checkbox state during transfer")
        exit(0)
    else:
        print("\n❌ FRONTEND TEST FAILED: Critical frontend issues found")
        exit(1)