#!/usr/bin/env python3
"""
Test product scraping for all vendor websites.
Run with: python3 test_all_vendors.py
"""

import asyncio
import aiohttp
import json
from datetime import datetime

# Test URLs for each vendor - these are sample/demo URLs that may need updating
# User should provide valid URLs for their specific products
VENDOR_TEST_URLS = {
    "Four Hands": "https://fourhands.com/product/230750-001",  # Known working
    "Uttermost": "https://uttermost.com/",  # Home page - needs product URL
    "Global Views": "https://www.globalviews.com/",  # Home page - needs product URL
    "Rowe Furniture": "https://rowefurniture.com/",  # Home page - needs product URL
    "Regina Andrew": "https://www.reginaandrew.com/",  # Home page - needs product URL
    "Bernhardt": "https://www.bernhardt.com/",  # Home page - needs product URL
    "Loloi Rugs": "https://www.loloirugs.com/",  # Home page - needs product URL
    "Visual Comfort": "https://www.visualcomfort.com/",  # Home page - needs product URL
    "HVL Group": "https://www.hvlgroup.com/",  # Home page - needs product URL
    "V and H": "https://vandh.com/",  # Home page - needs product URL
    "Flow Decor": "https://www.flowdecor.com/",  # Home page - needs product URL
    "Crestview Collection": "https://www.crestviewcollection.com/",  # Home page - needs product URL
    "Bassett Mirror": "https://www.bassettmirror.com/",  # Home page - needs product URL
    "Eichholtz": "https://www.eichholtz.com/",  # Home page - needs product URL
    "MYO America": "https://myohamerica.com/",  # Home page - needs product URL
    "Safavieh": "https://safavieh.com/",  # Home page - needs product URL
    "Surya": "https://www.surya.com/",  # Home page - needs product URL
    "Zeev Lighting": "https://zeevlighting.com/",  # Home page - needs product URL
    "Hubbardton Forge": "https://hubbardtonforge.com/",  # Home page - needs product URL
    "Hinkley": "https://www.hinkley.com/",  # Home page - needs product URL
    "Elegant Lighting": "https://www.elegantlighting.com/",  # Home page - needs product URL
    "Gabby Home": "https://gabby.com/",  # Home page - needs product URL
}

async def test_vendor(session, vendor_name, url):
    """Test scraping for a single vendor"""
    print(f"\n{'='*60}")
    print(f"Testing: {vendor_name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        async with session.post(
            "http://localhost:8001/api/scrape-product",
            json={"url": url},
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            result = await response.json()
            
            if result.get("success"):
                data = result.get("data", {})
                print(f"✅ SUCCESS")
                print(f"   Name: {data.get('name', 'N/A')[:50]}...")
                print(f"   SKU: {data.get('sku', 'N/A')}")
                print(f"   Price: ${data.get('price', 'N/A')}")
                print(f"   Dimensions: {data.get('dimensions', 'N/A')}")
                print(f"   Image: {'Yes' if data.get('image_url') else 'No'}")
                print(f"   Vendor: {data.get('vendor', 'N/A')}")
                
                # Score the result
                score = 0
                if data.get('name') and 'not found' not in data.get('name', '').lower():
                    score += 1
                if data.get('price'):
                    score += 1
                if data.get('sku'):
                    score += 1
                if data.get('image_url'):
                    score += 1
                if data.get('dimensions'):
                    score += 1
                
                return {
                    "vendor": vendor_name,
                    "success": True,
                    "score": score,
                    "max_score": 5,
                    "data": data
                }
            else:
                print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
                return {
                    "vendor": vendor_name,
                    "success": False,
                    "score": 0,
                    "max_score": 5,
                    "error": result.get("error")
                }
    except asyncio.TimeoutError:
        print(f"⏰ TIMEOUT after 180 seconds")
        return {
            "vendor": vendor_name,
            "success": False,
            "score": 0,
            "max_score": 5,
            "error": "Timeout"
        }
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return {
            "vendor": vendor_name,
            "success": False,
            "score": 0,
            "max_score": 5,
            "error": str(e)
        }

async def main():
    """Run tests for all vendors"""
    print("\n" + "="*70)
    print("   VENDOR PRODUCT SCRAPING TEST SUITE")
    print("   Testing all 22 wholesale vendor websites")
    print("="*70)
    print(f"   Started: {datetime.now().isoformat()}")
    print("="*70)
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        # Test vendors sequentially to avoid overwhelming the server
        for vendor_name, url in VENDOR_TEST_URLS.items():
            result = await test_vendor(session, vendor_name, url)
            results.append(result)
    
    # Summary
    print("\n" + "="*70)
    print("   TEST SUMMARY")
    print("="*70)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    print(f"\n✅ Successful: {len(successful)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    
    # Detailed scores
    print("\n   Extraction Quality Scores (out of 5):")
    for r in sorted(results, key=lambda x: -x["score"]):
        status = "✅" if r["success"] else "❌"
        print(f"   {status} {r['vendor']:25} - Score: {r['score']}/{r['max_score']}")
    
    # Save results to file
    with open('/app/test_result.md', 'a') as f:
        f.write(f"\n\n## Vendor Scraping Test Results - {datetime.now().isoformat()}\n\n")
        f.write(f"| Vendor | Status | Score | Name | Price | SKU |\n")
        f.write(f"|--------|--------|-------|------|-------|-----|\n")
        for r in results:
            status = "✅" if r["success"] else "❌"
            data = r.get("data", {})
            name = (data.get("name", "")[:30] + "...") if data.get("name") else "N/A"
            price = f"${data.get('price')}" if data.get("price") else "N/A"
            sku = data.get("sku", "N/A") or "N/A"
            f.write(f"| {r['vendor']} | {status} | {r['score']}/5 | {name} | {price} | {sku} |\n")
    
    print(f"\n   Results saved to /app/test_result.md")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(main())
