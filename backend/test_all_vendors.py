import asyncio
import aiohttp
import json

BACKEND_URL = "http://localhost:8001"

# Test URLs for each vendor - these are real product pages
VENDOR_TESTS = [
    ("Four Hands", "https://fourhands.com/product/230750-001"),
    ("Uttermost", "https://www.uttermost.com/product/17996"),
    ("Global Views", "https://www.globalviews.com/products/9.90066"),
    ("Regina Andrew", "https://www.reginaandrew.com/ambrose-table-lamp-natural-13-1403"),
    ("Visual Comfort", "https://www.?"Bernhardt", "https://www.bernhardt.com/products/?"Loloi", "https://www.loloirugs.com/products/?"Surya", "https://www.surya.com/?"HVL Group", "https://?"Hinkley", "https://www.hinkleylighting.com/?"Elegant Lighting", "https://?"Gabby Home", "https://www.?"
]

async def test_vendor(session, vendor_name, url):
    print(f"\n{'='*50}")
    print(f"Testing: {vendor_name}")
    print(f"URL: {url}")
    print('='*50)
    
    try:
        async with session.post(
            f"{BACKEND_URL}/api/scrape-product",
            json={"url": url},
            timeout=aiohttp.ClientTimeout(total=90)
        ) as response:
            if response.status == 200:
                data = await response.json()
                product = data.get('data', {})
                
                name = product.get('name') or product.get('title')
                sku = product.get('sku')
                price = product.get('price') or product.get('cost')
                dimensions = product.get('dimensions') or product.get('size')
                image = bool(product.get('image_url'))
                
                print(f"  Name: {name or 'N/A'}")
                print(f"  SKU: {sku or 'N/A'}")
                print(f"  Price: ${price if price else 'N/A'}")
                print(f"  Dimensions: {dimensions or 'N/A'}")
                print(f"  Image: {'YES' if image else 'NO'}")
                
                success = name and (sku or price)
                print(f"  STATUS: {'SUCCESS' if success else 'PARTIAL'}")
                return (vendor_name, success, name)
            else:
                print(f"  ERROR: HTTP {response.status}")
                return (vendor_name, False, None)
    except asyncio.TimeoutError:
        print(f"  ERROR: Timeout (90s)")
        return (vendor_name, False, None)
    except Exception as e:
        print(f"  ERROR: {e}")
        return (vendor_name, False, None)

async def main():
    print("="*60)
    print("VENDOR SCRAPING TEST - ALL VENDORS")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        results = []
        for vendor_name, url in VENDOR_TESTS:
            if url:  # Skip empty URLs
                result = await test_vendor(session, vendor_name, url)
                results.append(result)
        
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        success_count = sum(1 for r in results if r[1])
        print(f"\nTotal: {len(results)}")
        print(f"Success: {success_count}")
        print(f"Failed: {len(results) - success_count}")
        
        print("\nDetailed Results:")
        for vendor, success, name in results:
            status = "✅" if success else "❌"
            print(f"  {status} {vendor}: {name or 'FAILED'}")

if __name__ == "__main__":
    asyncio.run(main())
