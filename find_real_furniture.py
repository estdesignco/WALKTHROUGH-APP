#!/usr/bin/env python3
"""
Find actual furniture pieces in Uttermost catalog
"""

import pandas as pd

def find_real_furniture():
    """Find actual furniture pieces, not just finishes"""
    
    file_path = '/app/uttermost_catalog.xlsx'
    
    print("🔍 FINDING REAL FURNITURE PIECES")
    print("=" * 40)
    
    try:
        # Load the Furniture sheet
        df = pd.read_excel(file_path, sheet_name='Furniture')
        
        # Skip the header row
        df = df.iloc[1:].copy()
        
        # Rename columns for easier access
        df.columns = ['SKU', 'Name', 'Weight', 'Size', 'Ship_Class', 'Price']
        
        # Look for actual furniture keywords
        furniture_keywords = ['table', 'chair', 'bench', 'console', 'cabinet', 'stool', 'ottoman', 'desk', 'bookcase', 'shelf']
        
        real_furniture = []
        
        for idx, row in df.iterrows():
            name = str(row['Name']).lower()
            sku = str(row['SKU'])
            price = row['Price']
            
            # Skip finish samples and look for real furniture
            if (any(keyword in name for keyword in furniture_keywords) and 
                'finish' not in name and 
                'sample' not in name and
                isinstance(price, (int, float)) and 
                price > 50):  # Real furniture should cost more than $50
                
                real_furniture.append({
                    'sku': sku,
                    'name': row['Name'],
                    'price': price,
                    'weight': row['Weight'],
                    'size': row['Size'],
                    'ship_class': row['Ship_Class']
                })
        
        print(f"Found {len(real_furniture)} real furniture pieces")
        
        if real_furniture:
            # Show first 10 pieces
            print(f"\n🎯 REAL FURNITURE FOUND:")
            for i, piece in enumerate(real_furniture[:10], 1):
                print(f"\n  {i}. SKU: {piece['sku']}")
                print(f"     Name: {piece['name']}")
                print(f"     Price: ${piece['price']}")
                print(f"     Size: {piece['size']}")
            
            # Pick a good test product - mid-range price
            test_product = real_furniture[0]
            
            # Try to find something with a reasonable price (not too cheap/expensive)
            for piece in real_furniture:
                if 100 <= piece['price'] <= 1000:
                    test_product = piece
                    break
            
            print(f"\n🎆 SELECTED TEST PRODUCT:")
            print(f"   SKU: {test_product['sku']}")
            print(f"   Name: {test_product['name']}")
            print(f"   Price: ${test_product['price']}")
            print(f"   Size: {test_product['size']}")
            
            return test_product
        else:
            print("⚠️ No real furniture pieces found")
            # Let's just look at all products sorted by price
            print("\nLooking at products by price...")
            
            # Convert price column to numeric
            df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
            
            # Sort by price and show mid-range items
            sorted_df = df[(df['Price'] >= 100) & (df['Price'] <= 1000)].sort_values('Price')
            
            if len(sorted_df) > 0:
                print(f"\nMid-range products ($100-$1000):")
                for idx, row in sorted_df.head(5).iterrows():
                    print(f"  SKU: {row['SKU']} | {row['Name']} | ${row['Price']}")
                
                # Use the first mid-range item
                first_item = sorted_df.iloc[0]
                test_product = {
                    'sku': first_item['SKU'],
                    'name': first_item['Name'],
                    'price': first_item['Price'],
                    'size': first_item['Size'],
                    'weight': first_item['Weight'],
                    'ship_class': first_item['Ship_Class']
                }
                
                print(f"\n🎆 SELECTED TEST PRODUCT:")
                print(f"   SKU: {test_product['sku']}")
                print(f"   Name: {test_product['name']}")
                print(f"   Price: ${test_product['price']}")
                
                return test_product
            
            return None
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    test_product = find_real_furniture()
    if test_product:
        print(f"\n🚀 READY FOR END-TO-END TEST!")
        print(f"Next: Search for '{test_product['name']}' (SKU: {test_product['sku']}) on retail sites")
