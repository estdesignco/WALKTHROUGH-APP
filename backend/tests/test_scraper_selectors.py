"""
Test suite for Chrome Extension scraper selectors
Tests each vendor's specific patterns against real product pages
"""
import re
import requests
from bs4 import BeautifulSoup
import json

# Simulated page text extraction like the extension does
def get_page_text(html):
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text(' ', strip=True)

def test_regex_patterns():
    """Test regex patterns used in the scraper"""
    results = {}
    
    # Four Hands URL patterns
    fh_urls = [
        '/product/100074-009',
        '/p/QUATRO-123-456',
        '/product/QUATRO-SQ-01'
    ]
    for url in fh_urls:
        match = re.match(r'/product/([A-Z0-9-]+)', url, re.I) or re.match(r'/p/([A-Z0-9-]+)', url, re.I)
        results[f'FourHands URL {url}'] = match.group(1) if match else 'NO MATCH'
    
    # Uttermost patterns
    utt_texts = [
        'SKU: 53083',
        'SKU 12345',
        'Product SKU:  98765'
    ]
    for text in utt_texts:
        match = re.search(r'SKU[:\s]+(\d+)', text, re.I)
        results[f'Uttermost SKU "{text}"'] = match.group(1) if match else 'NO MATCH'
    
    # Uttermost URL patterns
    utt_urls = [
        '/lenoir-swivel-chair-53083',
        '/product-name-12345',
        '/some-item-9876'
    ]
    for url in utt_urls:
        match = re.search(r'-(\d{4,})$', url)
        results[f'Uttermost URL {url}'] = match.group(1) if match else 'NO MATCH'
    
    # Dimension patterns
    dim_texts = [
        '30 W X 27 H X 32 D (in)',
        '24.00"w x 27.50"d x 37.25"h',
        '32"W x 38"D x 34"H',
        'Dimensions: 12"W x 12"D x 24"H'
    ]
    dim_patterns = [
        r'(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D\s*\(?in',
        r'([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h',
        r'([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H',
    ]
    for text in dim_texts:
        found = False
        for pattern in dim_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                results[f'Dimensions "{text}"'] = f'{match.group(1)}"W x {match.group(2)}"D x {match.group(3)}"H'
                found = True
                break
        if not found:
            results[f'Dimensions "{text}"'] = 'NO MATCH'
    
    # Surya SKU pattern
    surya_texts = [
        'AAA-2300',
        'Product: BSY-2306',
        'SKU: MOY-2302'
    ]
    for text in surya_texts:
        match = re.search(r'([A-Z]{2,}-\d+)', text, re.I)
        results[f'Surya SKU "{text}"'] = match.group(1).upper() if match else 'NO MATCH'
    
    # Rug dimension pattern
    rug_texts = [
        "8' x 10'",
        '6 x 9',
        "2' x 3'"
    ]
    for text in rug_texts:
        match = re.search(r"([\d]+)'?\s*\"?\s*[xX×]\s*([\d]+)'?\s*\"?", text)
        results[f'Rug dims "{text}"'] = f"{match.group(1)}' x {match.group(2)}'" if match else 'NO MATCH'
    
    return results

def test_vendor_page(vendor_name, url, expected_patterns):
    """Test scraping a real vendor page"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {'status': 'ERROR', 'message': f'HTTP {response.status_code}'}
        
        html = response.text
        text = get_page_text(html)
        soup = BeautifulSoup(html, 'html.parser')
        
        results = {'status': 'OK', 'vendor': vendor_name, 'url': url}
        
        for field, pattern in expected_patterns.items():
            if pattern.startswith('selector:'):
                selector = pattern.replace('selector:', '')
                el = soup.select_one(selector)
                results[field] = el.get_text(strip=True) if el else 'NOT FOUND'
            else:
                match = re.search(pattern, text, re.I)
                results[field] = match.group(1) if match else 'NOT FOUND'
        
        return results
    except Exception as e:
        return {'status': 'ERROR', 'message': str(e)}

if __name__ == '__main__':
    print("=" * 60)
    print("REGEX PATTERN TESTS")
    print("=" * 60)
    
    regex_results = test_regex_patterns()
    for test_name, result in regex_results.items():
        status = '✅' if result != 'NO MATCH' else '❌'
        print(f"{status} {test_name}: {result}")
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in regex_results.values() if r != 'NO MATCH')
    total = len(regex_results)
    print(f"Passed: {passed}/{total} ({100*passed//total}%)")
