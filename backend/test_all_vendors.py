import asyncio
import aiohttp
import json

BACKEND_URL = "http://localhost:8001"

# Test URLs for each vendor
VENDOR_TESTS = [
    ("Four Hands", "https://fourhands.com/product/230750-001"),
    ("Uttermost", "https://www.uttermost.com/product/17996"),
    ("Global Views", "https://www.globalviews.com/products/9.90066"),
    ("Regina Andrew", "https://www.reginaandrew.com/ambrose-table-lamp-natural-13-1403"),
    ("Bernhardt", "https://www.bernhardt.com/products/?"Loloi", "https://www.loloirugs.com/products/?"
]

async def test_vendor(session, vendor_name, url):
    print(f"\nTesting: {vendor_name}")
    print(f"URL: {url[:60]}...")
    
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
                
                print(f"  Name: {name or 'N/A'}")
                print(f"  SKU: {sku or 'N/A'}")
                print(f"  Price: {price or 'N/A'}")
                
                success = bool(name)
                print(f"  STATUS: {'SUCCESS' if success else 'FAILED'}")
                return (vendor_name, success)
            else:
                print(f"  ERROR: HTTP {response.status}")
                return (vendor_name, False)
    except Exception as e:
        print(f"  ERROR: {e}")
        return (vendor_name, False)

async def main():
    print("="*50)
    print("VENDOR SCRAPING TEST")
    print("="*50)
    
    async with aiohttp.ClientSession() as session:
        results = []
        for vendor_name, url in VENDOR_TESTS:
            result = await test_vendor(session, vendor_name, url)
            results.append(result)
        
        print("\n" + "="*50)
        print("SUMMARY")
        print("="*50)
        success = sum(1 for r in results if r[1])
        print(f"Success: {success}/{len(results)}")

if __name__ == "__main__":
    asyncio.run(main())
