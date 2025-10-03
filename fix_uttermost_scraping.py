#!/usr/bin/env python3
"""
Fix Uttermost scraping - try different approaches
"""

import asyncio
from playwright.async_api import async_playwright
import requests
import base64
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

async def fix_uttermost_product():
    """Fix the Uttermost Cutler Accent Table"""
    
    print("🔧 FIXING UTTERMOST CUTLER ACCENT TABLE")
    
    # Try the page we found but get image differently
    uttermost_url = "https://uttermost.com/products/24461"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto(uttermost_url, timeout=30000)
            await page.wait_for_timeout(5000)
            
            # Try different image selectors for Uttermost
            image_selectors = [
                'img[class*="product"]',
                'img[class*="main"]',
                '.product-single__photo img',
                '.product-photo img',
                'img[alt*="24461"]',
                'img[alt*="Cutler"]',
                'img[src*="24461"]',
                '.hero img',
                '.gallery img'
            ]
            
            for selector in image_selectors:
                try:
                    images = await page.query_selector_all(selector)
                    
                    for img in images[:5]:
                        src = await img.get_attribute('src')
                        
                        if src:
                            if src.startswith('//'):
                                src = 'https:' + src
                            elif src.startswith('/'):
                                src = 'https://uttermost.com' + src
                            
                            print(f"Found image: {src}")
                            
                            if src.startswith('http') and ('24461' in src or 'product' in src.lower()):
                                # Download image
                                try:
                                    response = requests.get(src, timeout=15)
                                    if response.status_code == 200 and len(response.content) > 1000:
                                        image_data = base64.b64encode(response.content).decode('utf-8')
                                        content_type = response.headers.get('content-type', 'image/jpeg')
                                        base64_image = f"data:{content_type};base64,{image_data}"
                                        
                                        print(f"Downloaded image: {len(response.content)} bytes")
                                        
                                        # Update database
                                        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
                                        client = AsyncIOMotorClient(mongo_url)
                                        db = client.get_database('furniture_tracker')
                                        
                                        result = await db.furniture_catalog.update_one(
                                            {"sku": "24461"},
                                            {"$set": {
                                                "product_url": uttermost_url,
                                                "image_url": base64_image,
                                                "images": [base64_image],
                                                "original_image_url": src,
                                                "updated_date": datetime.utcnow()
                                            }}
                                        )
                                        
                                        client.close()
                                        
                                        if result.modified_count > 0:
                                            print(f"✅ Updated Uttermost Cutler Accent Table!")
                                            print(f"   URL: {uttermost_url}")
                                            print(f"   Image: Real product image downloaded")
                                            return True
                                        
                                except Exception as e:
                                    print(f"Download error: {e}")
                                    continue
                                
                except Exception as e:
                    continue
            
            print(f"❌ Could not find suitable image on Uttermost page")
            return False
            
        except Exception as e:
            print(f"Error accessing Uttermost: {e}")
            return False
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(fix_uttermost_product())
