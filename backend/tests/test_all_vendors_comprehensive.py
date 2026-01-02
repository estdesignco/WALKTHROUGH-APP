#!/usr/bin/env python3
"""
Comprehensive Vendor Scraper Test
Tests ALL 22 vendors and reports status for each required field.
"""
import asyncio
import aiohttp
import os
import json
from datetime import datetime

# Test URLs for each vendor - using known product URLs
VENDOR_TEST_URLS = {
    "Four Hands": "https://www.fourhands.com/product/232775-001",
    "Jaipur Living": "https://www.jaipurliving.com/syntax-syn03.html",
    "Loloi Rugs": "https://www.loloirugs.com/products/layla-lay-13-ocean-multi",
    "Visual Comfort": "https://www.visualcomfort.com/signature-medium-wall-lantern-chd2950/",
    "Uttermost": "https://www.uttermost.com/quill-9-light-chandelier-21572/",
    "Rowe Furniture": "https://www.rowefurniture.com/products/p390-002-sectional",
    "Regina Andrew": "https://www.reginaandrew.com/natural-linen-drum-chandelier-small",
    "Bernhardt": "https://www.bernhardt.com/browse/santa-barbara",
    "Global Views": "https://www.globalviews.com/products/furniture/",
    "HVL Group": "https://www.hvlgroup.com/product/",
    "Surya": "https://www.surya.com/area-rugs/",
    "Flow Decor": "https://www.flowdecor.com/products/",
    "Eichholtz": "https://www.eichholtz.com/en/products/",
    "Crestview Collection": "https://www.crestviewcollection.com/products/",
    "Bassett Mirror": "https://www.bassettmirror.com/products/",
    "MYO America": "https://myohamerica.com/products/",
    "Safavieh": "https://safavieh.com/products/",
    "Zeev Lighting": "https://zeevlighting.com/products/",
    "Hubbardton Forge": "https://hubbardtonforge.com/products/",
    "Hinkley": "https://www.hinkley.com/products/",
    "Elegant Lighting": "https://www.elegantlighting.com/products/",
    "Gabby Home": "https://www.gabbyhome.com/products/",
}

REQUIRED_FIELDS = ['name', 'sku', 'price', 'size', 'finish_color', 'image_url', 'finish_image']


async def test_vendor(session, api_url, vendor_name, product_url, timeout=120):
    """Test a single vendor and return results"""
    print(f"\n🔍 Testing {vendor_name}...")
    
    try:
        async with session.post(
            f"{api_url}/api/scrape-product",
            json={"url": product_url},
            timeout=aiohttp.ClientTimeout(total=timeout)
        ) as response:
            result = await response.json()
            
            data = result.get('data', {})
            bot_warning = result.get('bot_detection_warning')
            
            # Check each required field
            fields_status = {}
            for field in REQUIRED_FIELDS:
                value = data.get(field)
                # Check for garbage data
                is_garbage = False
                if value:
                    value_lower = str(value).lower()
                    is_garbage = any(x in value_lower for x in ['page not found', '404', 'page cannot be found'])
                
                fields_status[field] = bool(value) and not is_garbage
            
            fields_extracted = sum(fields_status.values())
            
            return {
                'vendor': vendor_name,
                'url': product_url,
                'success': result.get('success', False),
                'bot_warning': bot_warning,
                'fields_extracted': fields_extracted,
                'fields_total': len(REQUIRED_FIELDS),
                'fields_status': fields_status,
                'name_value': data.get('name', '')[:50] if data.get('name') else None,
                'price_value': data.get('price'),
                'error': None
            }
            
    except asyncio.TimeoutError:
        return {
            'vendor': vendor_name,
            'url': product_url,
            'success': False,
            'bot_warning': None,
            'fields_extracted': 0,
            'fields_total': len(REQUIRED_FIELDS),
            'fields_status': {f: False for f in REQUIRED_FIELDS},
            'name_value': None,
            'price_value': None,
            'error': 'TIMEOUT'
        }
    except Exception as e:
        return {
            'vendor': vendor_name,
            'url': product_url,
            'success': False,
            'bot_warning': None,
            'fields_extracted': 0,
            'fields_total': len(REQUIRED_FIELDS),
            'fields_status': {f: False for f in REQUIRED_FIELDS},
            'name_value': None,
            'price_value': None,
            'error': str(e)
        }


async def run_all_tests():
    """Run tests for all vendors"""
    api_url = os.environ.get('API_URL', 'https://furnscape.preview.emergentagent.com')
    
    print("=" * 60)
    print("COMPREHENSIVE VENDOR SCRAPER TEST")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"API URL: {api_url}")
    print("=" * 60)
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        # Test vendors one at a time (to avoid overwhelming the server)
        for vendor_name, url in VENDOR_TEST_URLS.items():
            result = await test_vendor(session, api_url, vendor_name, url)
            results.append(result)
            
            # Print immediate result
            status = "✅ WORKING" if result['fields_extracted'] >= 5 else "⚠️ PARTIAL" if result['fields_extracted'] >= 2 else "❌ BLOCKED"
            print(f"   {status} - {result['fields_extracted']}/{result['fields_total']} fields")
            if result['error']:
                print(f"   Error: {result['error']}")
            if result['bot_warning']:
                print(f"   Bot Warning: Yes")
    
    # Generate report
    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    
    working = [r for r in results if r['fields_extracted'] >= 5]
    partial = [r for r in results if 2 <= r['fields_extracted'] < 5]
    blocked = [r for r in results if r['fields_extracted'] < 2]
    
    print(f"\n✅ FULLY WORKING ({len(working)}):")
    for r in working:
        print(f"   - {r['vendor']}: {r['fields_extracted']}/7 fields, Price: ${r['price_value'] or 'N/A'}")
    
    print(f"\n⚠️ PARTIAL ({len(partial)}):")
    for r in partial:
        print(f"   - {r['vendor']}: {r['fields_extracted']}/7 fields")
    
    print(f"\n❌ BLOCKED/FAILED ({len(blocked)}):")
    for r in blocked:
        reason = r['error'] or ('Bot Detection' if r['bot_warning'] else 'Unknown')
        print(f"   - {r['vendor']}: {reason}")
    
    # Save results to JSON
    report_path = '/app/test_reports/vendor_scraping_status.json'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'working': len(working),
                'partial': len(partial),
                'blocked': len(blocked),
                'total': len(results)
            },
            'results': results
        }, f, indent=2)
    
    print(f"\nReport saved to: {report_path}")
    
    return results


if __name__ == '__main__':
    asyncio.run(run_all_tests())
