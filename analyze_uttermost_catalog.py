#!/usr/bin/env python3
"""
Analyze the Uttermost catalog and find a good test product
"""

import pandas as pd
import random

def analyze_uttermost_catalog():
    """Analyze the Uttermost catalog and pick a test product"""
    
    file_path = '/app/uttermost_catalog.xlsx'
    
    print("📊 UTTERMOST CATALOG ANALYSIS")
    print("=" * 50)
    
    try:
        # Load the Excel file to see sheet names
        xl_file = pd.ExcelFile(file_path)
        sheet_names = xl_file.sheet_names
        
        print(f"📋 Found {len(sheet_names)} sheets:")
        for i, sheet in enumerate(sheet_names, 1):
            print(f"   {i}. {sheet}")
        
        # Analyze the main sheet (usually first one)
        main_sheet = sheet_names[0]
        print(f"\n🔍 ANALYZING MAIN SHEET: {main_sheet}")
        print("-" * 30)
        
        df = pd.read_excel(file_path, sheet_name=main_sheet)
        
        print(f"📏 Dimensions: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"📝 Columns: {list(df.columns)}")
        
        # Show first few rows
        print(f"\n📋 First 3 rows:")
        print(df.head(3).to_string())
        
        # Look for key product info columns
        key_columns = []
        for col in df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['sku', 'item', 'product', 'name', 'description', 'price', 'cost', 'model', 'number']):
                key_columns.append(col)
        
        if key_columns:
            print(f"\n🔑 Key product columns identified: {key_columns}")
        
        # Find a good test product - let's look for furniture items
        print(f"\n🔍 FINDING TEST PRODUCTS...")
        
        # Look for furniture-related keywords
        furniture_keywords = ['chair', 'table', 'sofa', 'bench', 'cabinet', 'console', 'stool', 'ottoman']
        
        furniture_items = []
        
        for idx, row in df.iterrows():
            # Look in description or product name columns
            for col in df.columns:
                cell_value = str(row[col]).lower()
                if any(keyword in cell_value for keyword in furniture_keywords):
                    furniture_items.append({
                        'index': idx,
                        'row_data': dict(row)
                    })
                    break
        
        print(f"Found {len(furniture_items)} furniture items")
        
        if furniture_items:
            # Pick 3 random test candidates
            test_candidates = random.sample(furniture_items, min(3, len(furniture_items)))
            
            print(f"\n🎯 TEST PRODUCT CANDIDATES:")
            for i, candidate in enumerate(test_candidates, 1):
                row_data = candidate['row_data']
                print(f"\n  {i}. Index {candidate['index']}:")
                
                # Show key fields
                for col, value in row_data.items():
                    if any(keyword in str(col).lower() for keyword in ['sku', 'item', 'product', 'description', 'name', 'cost', 'price']):
                        print(f"     {col}: {value}")
            
            # Recommend the first one
            recommended = test_candidates[0]
            print(f"\n🎆 RECOMMENDED TEST PRODUCT:")
            print(f"   Index: {recommended['index']}")
            for col, value in recommended['row_data'].items():
                print(f"   {col}: {value}")
        
        else:
            print("⚠️ No furniture items found, showing random products:")
            sample_rows = df.sample(n=min(3, len(df)))
            for idx, row in sample_rows.iterrows():
                print(f"\n  Row {idx}:")
                for col, value in row.items():
                    print(f"     {col}: {value}")
        
    except Exception as e:
        print(f"❌ Error analyzing file: {str(e)}")

if __name__ == "__main__":
    analyze_uttermost_catalog()
