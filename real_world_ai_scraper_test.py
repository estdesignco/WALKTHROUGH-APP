#!/usr/bin/env python3
"""
Real-World AI Scraper V2 Testing
Tests the /api/ai-scrape-v2 endpoint with actual web crawling of vendor sites
"""

import requests
import json
import time
from typing import Dict, List, Any
import sys
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse

# Backend URL from environment
BACKEND_URL = "https://furnscape.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class RealWorldScraperTest:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.results = []

    def extract_images_from_page(self, html_content: str, base_url: str) -> List[Dict]:
        """Extract image information from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        images = []
        
        # Find all img tags
        img_tags = soup.find_all('img')
        
        for i, img in enumerate(img_tags[:20]):  # Limit to 20 images
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if not src:
                continue
                
            # Make URL absolute
            if src.startswith('//'):
                src = 'https:' + src
            elif src.startswith('/'):
                src = urljoin(base_url, src)
            elif not src.startswith('http'):
                src = urljoin(base_url, src)
            
            # Get image attributes
            alt = img.get('alt', '')
            title = img.get('title', '')
            width = int(img.get('width', 0)) if img.get('width', '').isdigit() else 0
            height = int(img.get('height', 0)) if img.get('height', '').isdigit() else 0
            
            # Determine if it's swatch-like
            is_swatch_like = any(keyword in (alt + title).lower() for keyword in [
                'swatch', 'color', 'finish', 'fabric', 'material', 'option'
            ])
            
            # Check if it's small and square (likely a swatch)
            is_small_square = (width > 0 and height > 0 and 
                             abs(width - height) <= 20 and 
                             width <= 150 and height <= 150)
            
            # Check if it's selected (has certain classes or attributes)
            is_selected = bool(img.get('class') and any('selected' in str(cls).lower() for cls in img.get('class', [])))
            
            # Get nearby text for context
            nearby_text = ""
            parent = img.parent
            if parent:
                nearby_text = parent.get_text(strip=True)[:100]
            
            image_info = {
                "url": src,
                "type": "img",
                "width": width,
                "height": height,
                "isSwatchLike": is_swatch_like,
                "isSelected": is_selected,
                "isSmallSquare": is_small_square,
                "context": {
                    "title": title,
                    "alt": alt,
                    "nearbyText": nearby_text,
                    "dataColor": img.get('data-color', '')
                }
            }
            
            images.append(image_info)
        
        return images

    def crawl_and_test_vendor(self, vendor_name: str, product_url: str) -> Dict[str, Any]:
        """Crawl a vendor page and test the AI scraper"""
        print(f"\n🔍 Testing {vendor_name}")
        print(f"  URL: {product_url}")
        
        try:
            # Crawl the page
            print(f"  📄 Crawling page content...")
            response = self.session.get(product_url, timeout=30)
            response.raise_for_status()
            
            # Extract text content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            page_text = soup.get_text()
            
            # Clean up text
            lines = (line.strip() for line in page_text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            page_text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Truncate if too long
            if len(page_text) > 8000:
                page_text = page_text[:8000]
            
            print(f"  📝 Extracted {len(page_text)} characters of text")
            
            # Extract images
            images = self.extract_images_from_page(response.text, product_url)
            print(f"  🖼️  Found {len(images)} images")
            
            # Find main image (usually the largest or first product image)
            main_image = None
            if images:
                # Try to find the largest image that's not a swatch
                non_swatch_images = [img for img in images if not img['isSwatchLike']]
                if non_swatch_images:
                    main_image = max(non_swatch_images, key=lambda x: x['width'] * x['height'])['url']
                else:
                    main_image = images[0]['url']
            
            # Prepare AI scraper request
            scraper_request = {
                "page_text": page_text,
                "page_url": product_url,
                "all_images": images,
                "main_image": main_image
            }
            
            print(f"  🤖 Calling AI scraper endpoint...")
            start_time = time.time()
            
            # Call the AI scraper
            scraper_response = self.session.post(
                f"{API_BASE}/ai-scrape-v2",
                json=scraper_request,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            response_time = time.time() - start_time
            print(f"  ⏱️  AI processing time: {response_time:.2f}s")
            
            if scraper_response.status_code != 200:
                error_msg = f"HTTP {scraper_response.status_code}: {scraper_response.text}"
                print(f"  ❌ API Error: {error_msg}")
                return {
                    'vendor': vendor_name,
                    'url': product_url,
                    'success': False,
                    'error': error_msg,
                    'response_time': response_time
                }
            
            # Parse and analyze response
            scraped_data = scraper_response.json()
            print(f"  📊 AI Extraction Results:")
            
            # Expected fields
            expected_fields = ['name', 'sku', 'price', 'msrp', 'size', 'finish_color', 'vendor', 'swatch_image_url']
            extracted_fields = []
            missing_fields = []
            
            for field in expected_fields:
                value = scraped_data.get(field)
                if value is not None and value != "":
                    extracted_fields.append(field)
                    print(f"    ✅ {field}: {value}")
                else:
                    missing_fields.append(field)
                    print(f"    ❌ {field}: Missing or null")
            
            success = len(missing_fields) == 0
            
            result = {
                'vendor': vendor_name,
                'url': product_url,
                'success': success,
                'response_time': response_time,
                'fields_extracted': len(extracted_fields),
                'total_fields': len(expected_fields),
                'extracted_fields': extracted_fields,
                'missing_fields': missing_fields,
                'scraped_data': scraped_data,
                'images_found': len(images),
                'page_text_length': len(page_text)
            }
            
            if success:
                print(f"  🎉 SUCCESS: All {len(extracted_fields)} fields extracted")
            else:
                print(f"  ⚠️  PARTIAL: {len(extracted_fields)}/{len(expected_fields)} fields extracted")
            
            return result
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            print(f"  ❌ {error_msg}")
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': False,
                'error': error_msg,
                'response_time': 0
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(f"  ❌ {error_msg}")
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': False,
                'error': error_msg,
                'response_time': 0
            }

    def run_real_world_tests(self):
        """Run tests with actual vendor websites"""
        print("🚀 Real-World AI Scraper V2 Testing")
        print("=" * 60)
        
        # Test with working vendor URLs (found through web search)
        test_cases = [
            ("Four Hands", "https://fourhands.com/product/247970-001"),  # Toro Coffee Table
            ("Visual Comfort", "https://visualcomfort.com/"),  # Main page to test basic extraction
            ("Uttermost", "https://uttermost.com/"),  # Main page to test basic extraction
        ]
        
        for vendor_name, product_url in test_cases:
            result = self.crawl_and_test_vendor(vendor_name, product_url)
            self.results.append(result)
            
            # Brief pause between tests
            time.sleep(3)
        
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 REAL-WORLD AI SCRAPER V2 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r['success']])
        
        print(f"\n📈 Overall Results:")
        print(f"  Total Tests: {total_tests}")
        print(f"  Successful: {successful_tests}")
        print(f"  Failed: {total_tests - successful_tests}")
        print(f"  Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        print(f"\n📋 Detailed Results:")
        print(f"{'Vendor':<20} {'Status':<10} {'Fields':<8} {'Time':<8} {'Images':<8} {'Text'}")
        print("-" * 80)
        
        for result in self.results:
            vendor = result['vendor'][:19]
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            fields = f"{result.get('fields_extracted', 0)}/8"
            time_str = f"{result.get('response_time', 0):.1f}s"
            images = str(result.get('images_found', 0))
            text_len = f"{result.get('page_text_length', 0)//1000}k"
            
            print(f"{vendor:<20} {status:<10} {fields:<8} {time_str:<8} {images:<8} {text_len}")
        
        # Field extraction analysis
        if successful_tests > 0:
            print(f"\n🔍 Field Extraction Analysis:")
            field_counts = {}
            for result in self.results:
                for field in result.get('extracted_fields', []):
                    field_counts[field] = field_counts.get(field, 0) + 1
            
            for field, count in sorted(field_counts.items()):
                percentage = (count / total_tests) * 100
                print(f"  • {field}: {count}/{total_tests} tests ({percentage:.1f}%)")
        
        # Performance analysis
        response_times = [r['response_time'] for r in self.results if r.get('response_time', 0) > 0]
        if response_times:
            print(f"\n⚡ Performance Analysis:")
            print(f"  • Average AI Processing Time: {sum(response_times)/len(response_times):.2f}s")
            print(f"  • Fastest Processing: {min(response_times):.2f}s")
            print(f"  • Slowest Processing: {max(response_times):.2f}s")
        
        # Recommendations
        print(f"\n💡 Key Findings:")
        if successful_tests == total_tests:
            print(f"  ✅ AI scraper V2 successfully extracts product data from real vendor pages")
            print(f"  ✅ Image detection and swatch selection working correctly")
            print(f"  ✅ All required fields (name, sku, price, msrp, size, finish_color, vendor, swatch_image_url) extracted")
        else:
            print(f"  ⚠️  {total_tests - successful_tests} vendors need attention")
            for result in self.results:
                if not result['success']:
                    print(f"    • {result['vendor']}: {result.get('error', 'Unknown error')}")

def main():
    """Main test execution"""
    try:
        # Test API connectivity
        print("🔗 Testing API connectivity...")
        response = requests.get(f"{BACKEND_URL}/api/projects", timeout=10)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
        else:
            print(f"❌ Backend API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    # Run real-world tests
    tester = RealWorldScraperTest()
    tester.run_real_world_tests()
    
    # Check if all tests passed
    success = all(result['success'] for result in tester.results)
    
    if success:
        print(f"\n✅ All real-world AI scraper tests passed!")
    else:
        print(f"\n⚠️  Some tests failed - see details above")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)