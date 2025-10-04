#!/usr/bin/env python3
"""
FOUR HANDS → HOUZZ CLIPPER → OUR APP
1. Login to Four Hands (trade site)
2. Navigate to products
3. Trigger Houzz clipper (or simulate)
4. Products go to ideaboard 2321925
5. Pull into our app
"""
import asyncio
from playwright.async_api import async_playwright
import pandas as pd
import os

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/pw-browsers'

async def clip_fourhands_to_houzz():
    """
    Login to Four Hands, browse products, clip with Houzz
    """
    
    print("\n" + "="*80)
    print("🪑 FOUR HANDS → HOUZZ PRO CLIPPER")
    print("="*80)
    print("This will:")
    print("1. Login to Four Hands trade site")
    print("2. Navigate to products from your Excel")
    print("3. Use Houzz clipper to save them")
    print("4. Products go to ideaboard 2321925 with images!")
    print("="*80 + "\n")
    
    # Get products from Excel
    df1 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='PRICE CHANGE')
    df2 = pd.read_excel('/app/fourhands_catalog.xlsx', sheet_name='NO CHANGE')
    df1.rename(columns={'NEW COST': 'COST'}, inplace=True)
    df = pd.concat([df1, df2])
    df_stock = df[df['STATUS'].str.contains('In Stk', na=False)].reset_index(drop=True)
    
    print(f"📊 Ready to clip {len(df_stock)} Four Hands products")
    print(f"🎯 Testing with first 3 products\n")
    
    # Four Hands credentials - DO YOU HAVE THESE?
    print("⚠️  IMPORTANT: I need your Four Hands trade login credentials!")
    print("   Email: ?")
    print("   Password: ?")
    print("\n   Please provide these so I can login to fourhands.com\n")
    
    # For now, let me show you the product URLs that need clipping
    print("📋 First 5 products to clip:")
    for i in range(5):
        row = df_stock.iloc[i]
        sku = str(row['PRODUCT MASTER CODE']).strip()
        name = str(row['DESCRIPTION']).strip()
        cost = float(row['COST'])
        
        # Build Four Hands product URL
        product_url = f"https://fourhands.com/search?q={sku}"
        
        print(f"\n{i+1}. {name}")
        print(f"   SKU: {sku}")
        print(f"   Cost: ${cost:.2f}")
        print(f"   URL: {product_url}")
        print(f"   → Use Houzz clipper on this page")
    
    print("\n" + "="*80)
    print("🔑 NEXT STEPS:")
    print("="*80)
    print("Option A: Provide Four Hands login - I'll automate everything")
    print("Option B: You manually clip a few products, I'll test pulling them")
    print("Option C: I simulate clipper by extracting data (if you give login)")
    print("\nWhat would you like to do?")

asyncio.run(clip_fourhands_to_houzz())
