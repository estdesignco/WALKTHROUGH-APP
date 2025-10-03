#!/usr/bin/env python3
"""
Analyze the Uttermost Furniture sheet specifically
"""

import pandas as pd
import random

def analyze_furniture_sheet():
    """Analyze the Uttermost Furniture sheet"""
    
    file_path = '/app/uttermost_catalog.xlsx'
    
    print("📊 UTTERMOST FURNITURE SHEET ANALYSIS")
    print("=" * 50)
    
    try:
        # Load the Furniture sheet specifically
        df = pd.read_excel(file_path, sheet_name='Furniture')
        
        print(f"📏 Dimensions: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"📝 Columns: {list(df.columns)}")
        
        # Show first few rows
        print(f"\n📋 First 5 rows:")
        print(df.head(5).to_string())
        
        # Clean up column names if they're unnamed
        if 'Unnamed: 0' in df.columns:
            # The first row might contain the actual column headers
            print("\n🔧 Cleaning up column names...")
            
            # Check if first row has better column names
            first_row = df.iloc[0]
            print(f"First row values: {list(first_row)}")
        
        # Look for products with SKUs and prices
        print(f"\n🔍 FINDING FURNITURE PRODUCTS...")
        
        valid_products = []
        
        for idx, row in df.iterrows():
            # Skip header rows or empty rows
            row_values = [str(val) for val in row.values]
            
            # Look for rows that seem to have product data (SKU-like patterns)
            potential_sku = str(row.iloc[0]) if len(row) > 0 else ""
            potential_name = str(row.iloc[1]) if len(row) > 1 else ""
            potential_price = str(row.iloc[-1]) if len(row) > 0 else ""  # Last column often price
            
            # Check if this looks like a valid product row
            if (potential_sku and 
                potential_sku not in ['nan', 'No.', 'Unnamed: 0'] and
                potential_name and 
                potential_name not in ['nan', 'Name', 'Furniture'] and
                len(potential_sku) > 3):
                
                valid_products.append({
                    'index': idx,
                    'sku': potential_sku,
                    'name': potential_name,
                    'price': potential_price,
                    'full_row': dict(row)
                })
        
        print(f"Found {len(valid_products)} valid furniture products")
        
        if valid_products:
            # Show first 5 products
            print(f"\n🎯 FURNITURE PRODUCTS FOUND:")
            for i, product in enumerate(valid_products[:5], 1):
                print(f"\n  {i}. SKU: {product['sku']}")
                print(f"     Name: {product['name']}")
                print(f"     Price: {product['price']}")
                print(f"     Full data: {product['full_row']}")
            
            # Pick the first one as our test product
            test_product = valid_products[0]
            print(f"\n🎆 SELECTED TEST PRODUCT:")
            print(f"   SKU: {test_product['sku']}")
            print(f"   Name: {test_product['name']}")
            print(f"   Price: {test_product['price']}")
            print(f"   Index: {test_product['index']}")
            
            return test_product
        else:
            print("⚠️ No valid furniture products found")
            return None
        
    except Exception as e:
        print(f"❌ Error analyzing furniture sheet: {str(e)}")
        return None

if __name__ == "__main__":
    test_product = analyze_furniture_sheet()
    if test_product:
        print(f"\n🚀 READY TO TEST WITH: {test_product['name']} (SKU: {test_product['sku']})")
