#!/usr/bin/env python3
"""
Test script for AI categorization API endpoint
"""
import asyncio
import httpx
import json

async def test_ai_categorization_api():
    """Test the AI categorization API endpoint"""
    
    # Test cases
    test_cases = [
        {"item_name": "Modern Table Lamp", "description": "Brass table lamp with white shade"},
        {"item_name": "Dining Chair", "description": "Upholstered chair in navy fabric"},
        {"item_name": "Persian Rug", "description": "Traditional area rug 8x10"},
    ]
    
    print("Testing AI Categorization API Endpoint")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        for test_case in test_cases:
            try:
                # Test the API endpoint
                response = await client.post(
                    "http://localhost:8001/api/ai/suggest-category",
                    params=test_case,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✓ {test_case['item_name']:<20} | Category: {result['category']:<15} | Method: {result['method']} | Confidence: {result.get('confidence', 'N/A')}")
                else:
                    print(f"✗ {test_case['item_name']:<20} | HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"✗ {test_case['item_name']:<20} | Error: {str(e)}")
    
    print("\nAPI test completed!")

if __name__ == "__main__":
    asyncio.run(test_ai_categorization_api())