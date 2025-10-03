#!/usr/bin/env python3
"""
Analyze the Four Hands catalog Excel file to understand structure
"""

import pandas as pd
import openpyxl

def analyze_excel_file():
    """Analyze the Four Hands Excel catalog"""
    
    file_path = '/app/fourhands_catalog.xlsx'
    
    print("📊 FOUR HANDS CATALOG ANALYSIS")
    print("=" * 50)
    
    try:
        # Load the Excel file to see sheet names
        xl_file = pd.ExcelFile(file_path)
        sheet_names = xl_file.sheet_names
        
        print(f"📋 Found {len(sheet_names)} sheets:")
        for i, sheet in enumerate(sheet_names, 1):
            print(f"   {i}. {sheet}")
        
        print("\n" + "=" * 50)
        
        # Analyze each sheet
        for sheet_name in sheet_names:
            print(f"\n🔍 ANALYZING SHEET: {sheet_name}")
            print("-" * 30)
            
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                
                print(f"📏 Dimensions: {df.shape[0]} rows × {df.shape[1]} columns")
                print(f"📝 Columns: {list(df.columns)}")
                
                # Show first few rows
                print(f"\n📋 First 3 rows:")
                print(df.head(3).to_string())
                
                # Look for key product info columns
                key_columns = []
                for col in df.columns:
                    col_lower = str(col).lower()
                    if any(keyword in col_lower for keyword in ['sku', 'item', 'product', 'name', 'description', 'price', 'cost', 'model']):
                        key_columns.append(col)
                
                if key_columns:
                    print(f"\n🔑 Key product columns identified: {key_columns}")
                
                # Sample a few rows to see data quality
                print(f"\n📊 Sample data types:")
                for col in df.columns[:10]:  # First 10 columns
                    sample_values = df[col].dropna().head(3).tolist()
                    print(f"   {col}: {sample_values}")
                    
            except Exception as e:
                print(f"❌ Error reading sheet {sheet_name}: {str(e)}")
        
        print("\n" + "=" * 50)
        print("📝 SUMMARY:")
        print("- Use this data to understand column mapping")
        print("- Identify SKU column for matching with retail sites")
        print("- Map product names, prices, and other key fields")
        
    except Exception as e:
        print(f"❌ Error analyzing file: {str(e)}")

if __name__ == "__main__":
    analyze_excel_file()
