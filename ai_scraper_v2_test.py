#!/usr/bin/env python3
"""
AI-Powered Product Scraper V2 Testing
Tests the /api/ai-scrape-v2 endpoint across multiple furniture/decor vendor websites
"""

import requests
import json
import time
from typing import Dict, List, Any
import sys
from urllib.parse import urljoin

# Backend URL from environment
BACKEND_URL = "https://devdoctors.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class VendorScrapeTest:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def test_vendor_scraping(self, vendor_name: str, product_url: str, expected_fields: List[str] = None) -> Dict[str, Any]:
        """Test scraping a specific vendor product page"""
        print(f"\n🔍 Testing {vendor_name}: {product_url}")
        
        if expected_fields is None:
            expected_fields = ['name', 'sku', 'price', 'msrp', 'size', 'finish_color', 'vendor', 'swatch_image_url']
        
        try:
            # First, crawl the page to get content
            print(f"  📄 Crawling page content...")
            page_response = self.session.get(product_url, timeout=30)
            page_response.raise_for_status()
            
            # Extract basic text content (simplified)
            page_text = page_response.text
            
            # Create mock image data (in real implementation, this would be extracted from page)
            mock_images = [
                {
                    "url": f"{product_url}/image1.jpg",
                    "type": "img",
                    "width": 300,
                    "height": 300,
                    "isSwatchLike": True,
                    "isSelected": False,
                    "isSmallSquare": True,
                    "context": {
                        "title": "Color Swatch",
                        "alt": "Product color option",
                        "nearbyText": "Available Colors"
                    }
                },
                {
                    "url": f"{product_url}/main.jpg",
                    "type": "img", 
                    "width": 800,
                    "height": 600,
                    "isSwatchLike": False,
                    "isSelected": True,
                    "isSmallSquare": False,
                    "context": {
                        "title": "Main Product Image",
                        "alt": "Product photo"
                    }
                }
            ]
            
            # Prepare AI scraper request
            scraper_request = {
                "page_text": page_text[:8000],  # Truncate to avoid token limits
                "page_url": product_url,
                "all_images": mock_images,
                "main_image": f"{product_url}/main.jpg"
            }
            
            print(f"  🤖 Calling AI scraper endpoint...")
            start_time = time.time()
            
            # Call the AI scraper endpoint
            scraper_response = self.session.post(
                f"{API_BASE}/ai-scrape-v2",
                json=scraper_request,
                timeout=120
            )
            
            response_time = time.time() - start_time
            print(f"  ⏱️  Response time: {response_time:.2f}s")
            
            if scraper_response.status_code != 200:
                error_msg = f"HTTP {scraper_response.status_code}: {scraper_response.text}"
                print(f"  ❌ API Error: {error_msg}")
                return {
                    'vendor': vendor_name,
                    'url': product_url,
                    'success': False,
                    'error': error_msg,
                    'response_time': response_time,
                    'fields_extracted': 0,
                    'missing_fields': expected_fields
                }
            
            # Parse response
            scraped_data = scraper_response.json()
            print(f"  📊 Scraped data: {json.dumps(scraped_data, indent=2)}")
            
            # Analyze extracted fields
            extracted_fields = []
            missing_fields = []
            
            for field in expected_fields:
                value = scraped_data.get(field)
                if value is not None and value != "":
                    extracted_fields.append(field)
                    print(f"  ✅ {field}: {value}")
                else:
                    missing_fields.append(field)
                    print(f"  ❌ {field}: Missing or null")
            
            success = len(missing_fields) == 0
            fields_extracted = len(extracted_fields)
            
            result = {
                'vendor': vendor_name,
                'url': product_url,
                'success': success,
                'response_time': response_time,
                'fields_extracted': fields_extracted,
                'total_fields': len(expected_fields),
                'extracted_fields': extracted_fields,
                'missing_fields': missing_fields,
                'scraped_data': scraped_data
            }
            
            if success:
                print(f"  🎉 SUCCESS: All {fields_extracted} fields extracted")
            else:
                print(f"  ⚠️  PARTIAL: {fields_extracted}/{len(expected_fields)} fields extracted")
            
            return result
            
        except requests.exceptions.Timeout:
            error_msg = "Request timeout"
            print(f"  ❌ {error_msg}")
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': False,
                'error': error_msg,
                'response_time': 120.0,
                'fields_extracted': 0,
                'missing_fields': expected_fields
            }
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            print(f"  ❌ {error_msg}")
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': False,
                'error': error_msg,
                'response_time': 0.0,
                'fields_extracted': 0,
                'missing_fields': expected_fields
            }
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(f"  ❌ {error_msg}")
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': False,
                'error': error_msg,
                'response_time': 0.0,
                'fields_extracted': 0,
                'missing_fields': expected_fields
            }

    def run_comprehensive_test(self):
        """Run comprehensive tests across all vendor sites"""
        print("🚀 Starting AI-Powered Product Scraper V2 Testing")
        print("=" * 60)
        
        # Test vendor sites as requested
        test_cases = [
            ("Uttermost", "https://www.uttermost.com/quill-9-light-chandelier-21572/"),
            ("Four Hands", "https://www.fourhands.com/product/232775-001"),
            ("Loloi Rugs", "https://www.loloirugs.com/products/layla-lay-13-ocean-multi"),
            ("Visual Comfort", "https://www.visualcomfort.com/bau-28-pendant-700tdbau28/"),
            ("Hudson Valley", "https://www.hvlgroup.com/product/8034-pn"),
            ("Bernhardt", "https://www.bernhardt.com/browse/santa-barbara"),
            ("Surya", "https://www.surya.com/product/alfresco-alf-9673"),
            ("Regina Andrew", "https://www.reginaandrew.com/natural-linen-drum-chandelier-small"),
            ("Global Views", "https://www.globalviews.com/product/faux-bois-side-table"),
            ("Gabby", "https://www.gabby.com/product/sch-240505")
        ]
        
        # Run tests
        for vendor_name, product_url in test_cases:
            result = self.test_vendor_scraping(vendor_name, product_url)
            self.results.append(result)
            
            # Brief pause between tests
            time.sleep(2)
        
        # Generate summary report
        self.generate_summary_report()

    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 60)
        print("📊 AI SCRAPER V2 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - successful_tests
        
        print(f"\n📈 OVERALL STATISTICS:")
        print(f"  Total Vendors Tested: {total_tests}")
        print(f"  Successful Extractions: {successful_tests}")
        print(f"  Failed Extractions: {failed_tests}")
        print(f"  Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        # Detailed results table
        print(f"\n📋 DETAILED RESULTS:")
        print(f"{'Vendor':<20} {'Status':<10} {'Fields':<8} {'Response Time':<15} {'Issues'}")
        print("-" * 80)
        
        for result in self.results:
            vendor = result['vendor'][:19]
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            fields = f"{result['fields_extracted']}/8"
            response_time = f"{result['response_time']:.1f}s"
            issues = result.get('error', 'None')[:30] if not result['success'] else 'None'
            
            print(f"{vendor:<20} {status:<10} {fields:<8} {response_time:<15} {issues}")
        
        # Critical issues analysis
        print(f"\n🚨 CRITICAL ISSUES IDENTIFIED:")
        critical_issues = []
        
        for result in self.results:
            if not result['success']:
                if 'timeout' in result.get('error', '').lower():
                    critical_issues.append(f"  • {result['vendor']}: Request timeout")
                elif 'http' in result.get('error', '').lower():
                    critical_issues.append(f"  • {result['vendor']}: HTTP error - {result.get('error', '')}")
                else:
                    critical_issues.append(f"  • {result['vendor']}: {result.get('error', 'Unknown error')}")
        
        if critical_issues:
            for issue in critical_issues:
                print(issue)
        else:
            print("  No critical issues found!")
        
        # Field extraction analysis
        print(f"\n🔍 FIELD EXTRACTION ANALYSIS:")
        field_stats = {}
        for result in self.results:
            for field in result.get('extracted_fields', []):
                field_stats[field] = field_stats.get(field, 0) + 1
        
        for field, count in sorted(field_stats.items()):
            percentage = (count / total_tests) * 100
            print(f"  • {field}: {count}/{total_tests} vendors ({percentage:.1f}%)")
        
        # Performance analysis
        print(f"\n⚡ PERFORMANCE ANALYSIS:")
        response_times = [r['response_time'] for r in self.results if r['response_time'] > 0]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            min_time = min(response_times)
            print(f"  • Average Response Time: {avg_time:.2f}s")
            print(f"  • Fastest Response: {min_time:.2f}s")
            print(f"  • Slowest Response: {max_time:.2f}s")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if successful_tests < total_tests:
            print(f"  • {failed_tests} vendors need attention for complete field extraction")
            print(f"  • Review error logs for failed vendors")
            print(f"  • Consider vendor-specific extraction improvements")
        
        if successful_tests == total_tests:
            print(f"  • All vendors successfully tested!")
            print(f"  • AI scraper V2 is working correctly across all tested sites")
        
        print(f"\n✅ Testing completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    """Main test execution"""
    tester = VendorScrapeTest()
    
    try:
        # Test API availability first
        print("🔗 Testing API connectivity...")
        response = requests.get(f"{BACKEND_URL}/api/projects", timeout=10)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
        else:
            print(f"❌ Backend API error: {response.status_code}")
            return
            
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Run comprehensive tests
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()