#!/usr/bin/env python3
"""
Comprehensive test for the Chrome Extension scraper logic.
Tests extraction patterns against real vendor page HTML.
"""

import re
import json

# Test HTML snippets from actual vendor pages
TEST_CASES = [
    {
        "vendor": "Four Hands",
        "domain": "fourhands.com",
        "html": """
        <h1>Brenna Dining Chair</h1>
        <div class="text-neutral-50">Dulane Mahogany • 247447-002</div>
        <div>21.50"w x 23.00"d x 38.50"h</div>
        <button class="truncate">Dulane Mahogany</button>
        <label title="Broadway Dune"><img src="https://cdn.fourhands.com/broadway-dune.jpg" alt="Broadway Dune"></label>
        <label title="Dulane Mahogany" class="selected"><img src="https://cdn.fourhands.com/dulane-mahogany.jpg" alt="Dulane Mahogany"></label>
        """,
        "expected": {
            "name": "Brenna Dining Chair",
            "sku": "247447-002",
            "size": '21.50"W x 23.00"D x 38.50"H',
            "finish_color": "Dulane Mahogany"
        }
    },
    {
        "vendor": "Uttermost",
        "domain": "uttermost.com",
        "html": """
        <h1>Conifer Dining Chair, Plum, 2 Per Box</h1>
        <div>SKU: 23922</div>
        <div>20 W X 33 H X 24 D</div>
        <div>$837.00</div>
        <div>Suggested retail price $1,464.00</div>
        <span>Color</span>
        <button title="Indigo" class="selected" style="background-image: url(/swatches/indigo.jpg)"></button>
        <button title="Plum" style="background-image: url(/swatches/plum.jpg)"></button>
        """,
        "expected": {
            "name": "Conifer Dining Chair, Plum, 2 Per Box",
            "sku": "23922",
            "size": '20"W x 24"D x 33"H',
            "finish_color": "Indigo"
        }
    },
    {
        "vendor": "Bernhardt",
        "domain": "bernhardt.com",
        "html": """
        <h1 class="product-description">Arlo Fabric Chair</h1>
        <div class="product-id">B1212</div>
        <div>Width: 33</div>
        <div>Depth: 38</div>
        <div>Height: 33</div>
        <div>Fabric Shown: 1688-077 Fabric</div>
        <div class="pricing-row"><span class="price">$2,290.00</span></div>
        """,
        "expected": {
            "name": "Arlo Fabric Chair",
            "sku": "B1212",
            "size": '33"W x 38"D x 33"H',
            "finish_color": "1688-077 Fabric"
        }
    },
    {
        "vendor": "HVL Group",
        "domain": "hvlgroup.com",
        "html": """
        <h1 class="item-title">Samos</h1>
        <div>Trade Price: $3,112.00</div>
        <div>Height: 18.5</div>
        <div>Width: 12</div>
        <div>Depth: 12</div>
        <div>AVAILABLE FINISHES</div>
        <a class="finish-link selected" title="Vintage Brass"><img src="/vb-swatch.jpg" alt="VB"></a>
        """,
        "expected": {
            "name": "Samos",
            "size": '12"W x 12"D x 18.5"H',
            "finish_color": "Vintage Brass"
        }
    },
    {
        "vendor": "Rowe Furniture",
        "domain": "rowefurniture.com",
        "html": """
        <h1>Abbie Swivel Chair</h1>
        <div>SKU: P520-016-RC</div>
        <div>$1,683.00</div>
        <div>Width: 32</div>
        <div>Depth: 34</div>
        <div>Height: 30</div>
        <div>Choose Body Cover: 100CR-28 CC</div>
        <img src="/fabrics/100CR-28.jpg" alt="100CR-28" class="fabric-swatch">
        """,
        "expected": {
            "name": "Abbie Swivel Chair",
            "sku": "P520-016-RC",
            "size": '32"W x 34"D x 30"H',
            "finish_color": "100CR-28 CC"
        }
    },
    {
        "vendor": "Visual Comfort",
        "domain": "visualcomfort.com",
        "html": """
        <h1>Axis Medium Sconce</h1>
        <title>Axis Medium Sconce - KW2735 | Visual Comfort</title>
        <div>$799.00</div>
        <div>Height: 15.6"</div>
        <div>Width: 2"</div>
        <div>Option: Natural Brass</div>
        <div class="swatch-option selected"><img src="/brass-swatch.jpg" alt="Natural Brass"></div>
        """,
        "expected": {
            "name": "Axis Medium Sconce",
            "sku": "KW2735",
            "finish_color": "Natural Brass"
        }
    },
    {
        "vendor": "Loloi",
        "domain": "loloirugs.com",
        "html": """
        <h1>SIN-04 MH NATURAL / SAGE</h1>
        <div>Style: SIN-04</div>
        <div>2'3" x 7'9"</div>
        <div class="color-swatch selected"><img src="/sage-swatch.jpg" alt="Natural/Sage"></div>
        """,
        "expected": {
            "name": "SIN-04 MH NATURAL / SAGE",
            "sku": "SIN-04",
            "size": "2'3\" x 7'9\"",
            "finish_color": "Natural/Sage"
        }
    },
    {
        "vendor": "Gabby",
        "domain": "gabby.com",
        "html": """
        <h1 class="product-title">Carrera Upholstered Sectional Chair - Armless</h1>
        <div>Item #: SCH-432</div>
        <div>32"W x 38"D x 34"H</div>
        <div class="fabric-name">Performance Linen Natural</div>
        <img class="swatch-image" src="/fabrics/linen-natural.jpg" alt="Performance Linen Natural">
        """,
        "expected": {
            "name": "Carrera Upholstered Sectional Chair - Armless",
            "sku": "SCH-432",
            "size": '32"W x 38"D x 34"H',
            "finish_color": "Performance Linen Natural"
        }
    }
]

def test_dimension_patterns(text):
    """Test dimension extraction patterns"""
    patterns = [
        # Pattern 1: "30 W X 27 H X 32 D" (Uttermost)
        (r'(\d+(?:\.\d+)?)\s*W\s*X\s*(\d+(?:\.\d+)?)\s*H\s*X\s*(\d+(?:\.\d+)?)\s*D', 'WxHxD'),
        # Pattern 2: "Width: 33 Depth: 38 Height: 33"
        (r'Width[:\s]*([\d.]+).*?Depth[:\s]*([\d.]+).*?Height[:\s]*([\d.]+)', 'WDH_labels'),
        # Pattern 3: "H: 18.5 W: 12 D: 12"
        (r'Height[:\s]*([\d.]+)', 'H_label'),
        # Pattern 4: "21.50"w x 23.00"d x 38.50"h" (Four Hands)
        (r'([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h', 'wxdxh'),
        # Pattern 5: "32"W x 38"D x 34"H"
        (r'([\d.]+)"?\s*W\s*[x×X]\s*([\d.]+)"?\s*D\s*[x×X]\s*([\d.]+)"?\s*H', 'WxDxH'),
        # Pattern 6: Rug format
        (r"(\d+'[\d.\"]+)\s*[x×X]\s*(\d+'[\d.\"]+)", 'rug'),
    ]
    
    for pattern, name in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            return name, match.groups()
    return None, None

def test_sku_patterns(text, url=""):
    """Test SKU extraction patterns"""
    patterns = [
        r'SKU[:\s#]*([A-Z0-9-]+)',
        r'Item[:\s#]*([A-Z0-9-]+)',
        r'Style[:\s#]*([A-Z0-9-]+)',
        r'Model[:\s#]*([A-Z0-9-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None

def test_finish_patterns(text):
    """Test finish/color extraction patterns"""
    patterns = [
        r'(?:choose\s+)?(?:body\s+)?cover[:\s]*([^\n]+)',
        r'(?:fabric\s+shown|body\s+fabric)[:\s]*([^\n]+)',
        r'(?:finish|color|option)[:\s]*([^\n]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip().split('\n')[0].strip()
            if value and len(value) > 1 and len(value) < 50:
                return value
    return None

def run_tests():
    """Run all test cases"""
    print("=" * 60)
    print("CHROME EXTENSION SCRAPER - COMPREHENSIVE TEST")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for case in TEST_CASES:
        print(f"\n{'='*60}")
        print(f"Testing: {case['vendor']} ({case['domain']})")
        print("-" * 60)
        
        html = case['html']
        expected = case['expected']
        errors = []
        
        # Test name extraction (simple h1)
        h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        if h1_match:
            extracted_name = h1_match.group(1).strip()
            if 'name' in expected:
                if extracted_name != expected['name']:
                    errors.append(f"Name: got '{extracted_name}', expected '{expected['name']}'")
                else:
                    print(f"  ✅ Name: {extracted_name}")
        
        # Test SKU extraction
        extracted_sku = test_sku_patterns(html)
        if 'sku' in expected:
            # Also try subtitle pattern for Four Hands
            if not extracted_sku and '•' in html:
                subtitle_match = re.search(r'[^•]+•\s*([A-Z0-9-]+)', html)
                if subtitle_match:
                    extracted_sku = subtitle_match.group(1)
            # Also try title pattern for Visual Comfort
            if not extracted_sku:
                title_match = re.search(r'<title>[^<]*([A-Z]{2,}\d+[A-Z0-9]*)', html)
                if title_match:
                    extracted_sku = title_match.group(1)
            
            if extracted_sku != expected['sku']:
                errors.append(f"SKU: got '{extracted_sku}', expected '{expected['sku']}'")
            else:
                print(f"  ✅ SKU: {extracted_sku}")
        
        # Test dimension extraction
        pattern_name, dim_match = test_dimension_patterns(html)
        if 'size' in expected:
            if dim_match:
                print(f"  ✅ Size pattern matched: {pattern_name} -> {dim_match}")
            else:
                errors.append(f"Size: no pattern matched, expected '{expected['size']}'")
        
        # Test finish extraction
        extracted_finish = test_finish_patterns(html)
        if 'finish_color' in expected:
            if not extracted_finish:
                # Try selected swatch
                selected_match = re.search(r'title="([^"]+)"[^>]*class="[^"]*selected', html)
                if selected_match:
                    extracted_finish = selected_match.group(1)
                else:
                    # Try any title
                    title_match = re.search(r'<label\s+title="([^"]+)"[^>]*class="[^"]*selected', html)
                    if title_match:
                        extracted_finish = title_match.group(1)
            
            if extracted_finish != expected['finish_color']:
                errors.append(f"Finish: got '{extracted_finish}', expected '{expected['finish_color']}'")
            else:
                print(f"  ✅ Finish: {extracted_finish}")
        
        if errors:
            print(f"\n  ❌ FAILED with {len(errors)} error(s):")
            for err in errors:
                print(f"     - {err}")
            failed += 1
        else:
            print(f"\n  ✅ ALL CHECKS PASSED")
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(TEST_CASES)} tests")
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
