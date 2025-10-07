#!/usr/bin/env python3
"""
Test script for AI categorization functionality
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from server import fallback_categorize

def test_fallback_categorization():
    """Test the rule-based fallback categorization"""
    
    test_cases = [
        ("Table Lamp", "Modern brass table lamp with white shade", "Lighting"),
        ("Dining Chair", "Upholstered dining chair in navy fabric", "Furniture"),
        ("Area Rug", "Persian style area rug 8x10", "Decor"),
        ("Roman Shade", "Custom roman shade in linen fabric", "Window Treatments"),
        ("Hardwood Floor", "Oak hardwood flooring planks", "Flooring"),
        ("Cabinet Knob", "Brass cabinet knob with crystal detail", "Hardware"),
        ("Kitchen Faucet", "Stainless steel kitchen faucet", "Plumbing Fixtures"),
        ("Refrigerator", "French door refrigerator stainless steel", "Appliances"),
        ("Wall Art", "Abstract canvas painting 24x36", "Art"),
        ("Unknown Item", "Some random product", "Furniture")  # Default case
    ]
    
    print("Testing AI Categorization Fallback Function")
    print("=" * 50)
    
    for item_name, description, expected in test_cases:
        result = fallback_categorize(item_name, description)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        print(f"{status} | {item_name:<20} | Expected: {expected:<15} | Got: {result}")
    
    print("\nFallback categorization test completed!")

if __name__ == "__main__":
    test_fallback_categorization()