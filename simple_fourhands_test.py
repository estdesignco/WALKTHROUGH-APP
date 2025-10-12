#!/usr/bin/env python3
"""
Simple test of the Four Hands product URL with better error handling
"""

import asyncio
import aiohttp
import json
import traceback

async def test_simple_scraping():
    """Test the scraping endpoint with better error handling"""
    
    url = "https://designflow-master.preview.emergentagent.com/api/scrape-product"
    data = {
        "url": "https://fourhands.com/product/248606-001"
    }
    
    try:
        timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes
        async with aiohttp.ClientSession(timeout=timeout) as session:
            print("🔍 Testing Four Hands scraping...")
            print(f"Endpoint: {url}")
            print(f"Data: {json.dumps(data, indent=2)}")
            
            async with session.post(url, json=data) as response:
                print(f"Status: {response.status}")
                print(f"Headers: {dict(response.headers)}")
                
                try:
                    result = await response.json()
                    print(f"Response: {json.dumps(result, indent=2)}")
                except Exception as json_error:
                    text_result = await response.text()
                    print(f"Raw Response (not JSON): {text_result}")
                    print(f"JSON parse error: {str(json_error)}")
                
    except asyncio.TimeoutError:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_simple_scraping())
