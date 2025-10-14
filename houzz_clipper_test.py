#!/usr/bin/env python3
"""
Houzz Pro Clipper Integration Test
Tests the /api/real-integrations/add-to-houzz-ideabook endpoint specifically
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://designhub-74.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class HouzzClipperTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str, data: dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
        if data and not success:
            print(f"   Response data: {json.dumps(data, indent=2)}")
    
    async def test_houzz_clipper_endpoint(self):
        """Test the main Houzz Pro Clipper endpoint with sample data"""
        print("\n🔥 TESTING HOUZZ PRO CLIPPER ENDPOINT")
        print("=" * 60)
        
        # Sample request data as specified in the review request
        sample_request = {
            "ideabook_name": "Test Furniture Selection",
            "products": [
                {
                    "id": "1",
                    "title": "Modern Console Table",
                    "price": "$1,299.99",
                    "seller": "Four Hands",
                    "category": "Furniture",
                    "url": "https://fourhands.com/product/modern-console"
                }
            ]
        }
        
        try:
            print(f"📡 Making POST request to: {API_BASE}/real-integrations/add-to-houzz-ideabook")
            print(f"📦 Request payload: {json.dumps(sample_request, indent=2)}")
            
            async with self.session.post(
                f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
                json=sample_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                print(f"📊 Response status: {response.status}")
                print(f"📄 Response headers: {dict(response.headers)}")
                
                if response.status == 200:
                    try:
                        response_data = json.loads(response_text)
                        print(f"📋 Response data: {json.dumps(response_data, indent=2)}")
                        
                        # Validate response structure
                        await self.validate_houzz_response(response_data)
                        
                    except json.JSONDecodeError as e:
                        self.log_result(
                            "Houzz Clipper Response JSON",
                            False,
                            f"Invalid JSON response: {e}",
                            {"raw_response": response_text}
                        )
                else:
                    self.log_result(
                        "Houzz Clipper HTTP Status",
                        False,
                        f"HTTP {response.status}: {response_text}",
                        {"status": response.status, "response": response_text}
                    )
                    
        except Exception as e:
            self.log_result(
                "Houzz Clipper Request",
                False,
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )
    
    async def validate_houzz_response(self, response_data: dict):
        """Validate the Houzz Pro Clipper response structure"""
        print("\n🔍 VALIDATING HOUZZ CLIPPER RESPONSE STRUCTURE")
        print("-" * 50)
        
        # Check if response has success field
        if "success" not in response_data:
            self.log_result(
                "Response Success Field",
                False,
                "Missing 'success' field in response",
                response_data
            )
            return
        
        success = response_data.get("success")
        if not success:
            self.log_result(
                "Houzz Clipper Success",
                False,
                f"API returned success=false: {response_data.get('error', 'Unknown error')}",
                response_data
            )
            return
        
        self.log_result(
            "Houzz Clipper Success",
            True,
            "API returned success=true",
            {"success": success}
        )
        
        # Check for houzz_clipper_data
        if "houzz_clipper_data" not in response_data:
            self.log_result(
                "Houzz Clipper Data Field",
                False,
                "Missing 'houzz_clipper_data' field in response",
                response_data
            )
            return
        
        houzz_data = response_data["houzz_clipper_data"]
        self.log_result(
            "Houzz Clipper Data Field",
            True,
            "Found 'houzz_clipper_data' field",
            {"has_data": True}
        )
        
        # Validate all required fields in houzz_clipper_data
        await self.validate_houzz_clipper_fields(houzz_data)
    
    async def validate_houzz_clipper_fields(self, houzz_data: dict):
        """Validate all required fields in houzz_clipper_data"""
        print("\n📋 VALIDATING HOUZZ CLIPPER DATA FIELDS")
        print("-" * 45)
        
        # Required fields as specified in the review request
        required_fields = {
            # Basic pricing info
            "product_title": "Product title",
            "unit_cost": "Unit cost",
            "markup_percentage": "Markup percentage (should be 125%)",
            "client_price": "Client price",
            "msrp": "MSRP",
            
            # Descriptions
            "description_for_vendor": "Description for vendor",
            "client_description": "Client description",
            
            # Product details
            "sku": "SKU",
            "manufacturer": "Manufacturer",
            "dimensions": "Dimensions",
            "finish_color": "Finish color",
            "materials": "Materials",
            
            # Dropdown values
            "category": "Category",
            "vendor_subcontractor": "Vendor/Subcontractor",
            "project": "Project",
            "room": "Room",
            
            # Images (5 total)
            "image_1": "Image 1",
            "image_2": "Image 2", 
            "image_3": "Image 3",
            "image_4": "Image 4",
            "image_5": "Image 5"
        }
        
        missing_fields = []
        empty_fields = []
        valid_fields = []
        
        for field, description in required_fields.items():
            if field not in houzz_data:
                missing_fields.append(field)
                self.log_result(
                    f"Field: {field}",
                    False,
                    f"Missing required field: {description}",
                    {"field": field}
                )
            else:
                value = houzz_data[field]
                if not value or (isinstance(value, str) and value.strip() == ""):
                    empty_fields.append(field)
                    self.log_result(
                        f"Field: {field}",
                        False,
                        f"Empty value for: {description}",
                        {"field": field, "value": value}
                    )
                else:
                    valid_fields.append(field)
                    self.log_result(
                        f"Field: {field}",
                        True,
                        f"Valid {description}: {str(value)[:50]}{'...' if len(str(value)) > 50 else ''}",
                        {"field": field, "value": value}
                    )
        
        # Validate specific requirements
        await self.validate_specific_requirements(houzz_data)
        
        # Summary
        print(f"\n📊 FIELD VALIDATION SUMMARY:")
        print(f"   ✅ Valid fields: {len(valid_fields)}")
        print(f"   ❌ Missing fields: {len(missing_fields)}")
        print(f"   ⚠️  Empty fields: {len(empty_fields)}")
        print(f"   📋 Total required: {len(required_fields)}")
        
        if missing_fields:
            print(f"   Missing: {', '.join(missing_fields)}")
        if empty_fields:
            print(f"   Empty: {', '.join(empty_fields)}")
    
    async def validate_specific_requirements(self, houzz_data: dict):
        """Validate specific requirements from the review request"""
        print("\n🎯 VALIDATING SPECIFIC REQUIREMENTS")
        print("-" * 40)
        
        # Check markup percentage is 125%
        markup = houzz_data.get("markup_percentage", "")
        if "125" in str(markup):
            self.log_result(
                "Markup Percentage",
                True,
                f"Markup is set to 125% as required: {markup}",
                {"markup": markup}
            )
        else:
            self.log_result(
                "Markup Percentage",
                False,
                f"Markup should be 125%, got: {markup}",
                {"markup": markup}
            )
        
        # Check all 5 images are present
        image_count = 0
        for i in range(1, 6):
            image_field = f"image_{i}"
            if houzz_data.get(image_field):
                image_count += 1
        
        if image_count == 5:
            self.log_result(
                "Image Count",
                True,
                f"All 5 images present as required",
                {"image_count": image_count}
            )
        else:
            self.log_result(
                "Image Count",
                False,
                f"Expected 5 images, found {image_count}",
                {"image_count": image_count}
            )
        
        # Check pricing calculations
        unit_cost_str = houzz_data.get("unit_cost", "")
        client_price_str = houzz_data.get("client_price", "")
        
        try:
            # Extract numeric values
            unit_cost = float(unit_cost_str.replace("$", "").replace(",", ""))
            client_price = float(client_price_str.replace("$", "").replace(",", ""))
            
            # Calculate expected client price (125% markup)
            expected_client_price = unit_cost * 2.25  # 100% + 125% = 225% = 2.25x
            
            if abs(client_price - expected_client_price) < 0.01:
                self.log_result(
                    "Price Calculation",
                    True,
                    f"Client price correctly calculated: ${unit_cost} * 2.25 = ${client_price}",
                    {"unit_cost": unit_cost, "client_price": client_price}
                )
            else:
                self.log_result(
                    "Price Calculation",
                    False,
                    f"Price calculation error: ${unit_cost} * 2.25 should be ${expected_client_price}, got ${client_price}",
                    {"unit_cost": unit_cost, "client_price": client_price, "expected": expected_client_price}
                )
        except (ValueError, AttributeError) as e:
            self.log_result(
                "Price Calculation",
                False,
                f"Could not validate price calculation: {e}",
                {"unit_cost_str": unit_cost_str, "client_price_str": client_price_str}
            )
    
    async def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n🧪 TESTING EDGE CASES")
        print("=" * 30)
        
        # Test with empty products array
        await self.test_empty_products()
        
        # Test with missing required fields
        await self.test_missing_fields()
        
        # Test with invalid data types
        await self.test_invalid_data()
    
    async def test_empty_products(self):
        """Test with empty products array"""
        empty_request = {
            "ideabook_name": "Empty Test",
            "products": []
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
                json=empty_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                
                if response.status == 200:
                    response_data = json.loads(response_text)
                    if response_data.get("success") == False:
                        self.log_result(
                            "Empty Products Handling",
                            True,
                            "Correctly handled empty products array",
                            {"response": response_data}
                        )
                    else:
                        self.log_result(
                            "Empty Products Handling",
                            False,
                            "Should return success=false for empty products",
                            {"response": response_data}
                        )
                else:
                    self.log_result(
                        "Empty Products HTTP",
                        False,
                        f"Unexpected HTTP status {response.status} for empty products",
                        {"status": response.status, "response": response_text}
                    )
                    
        except Exception as e:
            self.log_result(
                "Empty Products Request",
                False,
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )
    
    async def test_missing_fields(self):
        """Test with missing required fields"""
        incomplete_request = {
            "ideabook_name": "Incomplete Test",
            "products": [
                {
                    "id": "1",
                    "title": "Incomplete Product"
                    # Missing price, seller, category, url
                }
            ]
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
                json=incomplete_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                
                if response.status == 200:
                    response_data = json.loads(response_text)
                    # Should still work but with default values
                    self.log_result(
                        "Missing Fields Handling",
                        True,
                        "Handled missing product fields gracefully",
                        {"response": response_data}
                    )
                else:
                    self.log_result(
                        "Missing Fields HTTP",
                        False,
                        f"HTTP {response.status} for incomplete data",
                        {"status": response.status, "response": response_text}
                    )
                    
        except Exception as e:
            self.log_result(
                "Missing Fields Request",
                False,
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )
    
    async def test_invalid_data(self):
        """Test with invalid data types"""
        invalid_request = {
            "ideabook_name": 123,  # Should be string
            "products": "not_an_array"  # Should be array
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/real-integrations/add-to-houzz-ideabook",
                json=invalid_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                
                # Should return 422 for validation error or handle gracefully
                if response.status in [422, 400]:
                    self.log_result(
                        "Invalid Data Validation",
                        True,
                        f"Correctly rejected invalid data with HTTP {response.status}",
                        {"status": response.status}
                    )
                elif response.status == 200:
                    # If it handles gracefully, that's also acceptable
                    self.log_result(
                        "Invalid Data Handling",
                        True,
                        "Handled invalid data gracefully",
                        {"status": response.status}
                    )
                else:
                    self.log_result(
                        "Invalid Data Response",
                        False,
                        f"Unexpected response to invalid data: HTTP {response.status}",
                        {"status": response.status, "response": response_text}
                    )
                    
        except Exception as e:
            self.log_result(
                "Invalid Data Request",
                False,
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 STARTING HOUZZ PRO CLIPPER INTEGRATION TESTS")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print(f"Test started at: {datetime.now().isoformat()}")
        
        await self.setup()
        
        try:
            # Main functionality test
            await self.test_houzz_clipper_endpoint()
            
            # Edge cases
            await self.test_edge_cases()
            
        finally:
            await self.cleanup()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 Total tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🕒 Test completed at: {datetime.now().isoformat()}")
        
        # Return success status
        return failed_tests == 0

async def main():
    """Main test function"""
    tester = HouzzClipperTester()
    success = await tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())