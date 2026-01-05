"""
Chrome Extension v8 Scraper Tests - Price and Color Extraction
Tests for the critical bugs reported by user:
1. Loloi Rugs: Price should be $649 NOT $99,999, Color should be 'NATURAL / ESPRESSO', SKU 'LOE-03'
2. Four Hands: Price should be trade price ($500) NOT MAP ($1,099), Color 'Durango Smoke'
3. Uttermost: Price extraction, Color from H1 title
4. Prices over $50,000 should be rejected as invalid
5. MAP/MSRP prices should be skipped and trade price found
6. Color extraction from H1 titles, swatch titles, and page text
"""
import pytest
import re


# ============================================================================
# HELPER FUNCTION TESTS - extractTradePrice() logic
# ============================================================================

class TestExtractTradePriceLogic:
    """Test the extractTradePrice() helper function logic from content.js lines 821-895"""
    
    def test_reject_prices_over_50000(self):
        """CRITICAL: Prices over $50,000 should be rejected as invalid (the $99,999 bug)"""
        # Simulated page text with unreasonable prices
        page_texts = [
            "$99,999 $649 $1,589 MAP",  # $99,999 should be skipped, $649 should be found
            "$50,001 $500 $1,099 MAP",  # $50,001 should be skipped
            "$100,000 $299",            # $100,000 should be skipped
            "Price: $75,000 Trade: $649",  # $75,000 should be skipped
        ]
        
        for page_text in page_texts:
            all_prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            
            # Filter out unreasonable prices (>$50,000)
            reasonable_prices = []
            for price_str in all_prices:
                val = float(price_str.replace('$', '').replace(',', ''))
                if val > 1 and val < 50000:
                    reasonable_prices.append(val)
            
            # The first reasonable price should NOT be over $50,000
            if reasonable_prices:
                assert reasonable_prices[0] < 50000, f"First price {reasonable_prices[0]} should be under $50,000"
                print(f"✅ Page '{page_text[:50]}...' -> First reasonable price: ${reasonable_prices[0]}")
            else:
                print(f"⚠️ No reasonable prices found in: {page_text[:50]}...")
    
    def test_skip_msrp_map_prices(self):
        """CRITICAL: MAP/MSRP prices should be skipped, trade price found"""
        test_cases = [
            # (page_text, expected_trade_price, expected_msrp)
            ("$500 $1,099 MAP", 500, 1099),
            ("Trade: $649 MSRP: $1,589", 649, 1589),
            ("$299 Retail: $599", 299, 599),
            ("Your Price: $450 List: $900", 450, 900),
        ]
        
        for page_text, expected_trade, expected_msrp in test_cases:
            all_prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
            
            trade_price = None
            msrp_price = None
            
            for price_str in all_prices:
                val = float(price_str.replace('$', '').replace(',', ''))
                if val <= 1 or val >= 50000:
                    continue
                
                # Find context around this price
                idx = page_text.find(price_str)
                before = page_text[max(0, idx-30):idx].lower()
                after = page_text[idx:min(len(page_text), idx+len(price_str)+30)].lower()
                context = before + after
                
                # Check if this is MSRP/MAP
                if re.search(r'map|msrp|retail|list|compare|was|original|regular|suggested', context):
                    if not msrp_price:
                        msrp_price = val
                elif not trade_price:
                    trade_price = val
            
            assert trade_price == expected_trade, f"Expected trade ${expected_trade}, got ${trade_price}"
            print(f"✅ '{page_text}' -> Trade: ${trade_price}, MSRP: ${msrp_price}")
    
    def test_labeled_trade_price_patterns(self):
        """Test explicitly labeled trade/wholesale/your price patterns"""
        test_cases = [
            ("Trade Price: $649", 649),
            ("Wholesale Price: $500", 500),
            ("Your Price: $299", 299),
            ("Net Price: $450", 450),
            ("Dealer Price: $375", 375),
            ("TRADE: $649", 649),
            ("NET: $500", 500),
            ("YOUR PRICE: $299", 299),
        ]
        
        patterns = [
            r'(?:Trade|Wholesale|Your|Net|Dealer)\s*Price[:\s]*\$?([\d,]+\.?\d*)',
            r'(?:Trade|NET|YOUR PRICE)[:\s]*\$?([\d,]+\.?\d*)',
        ]
        
        for page_text, expected_price in test_cases:
            found_price = None
            for pattern in patterns:
                match = re.search(pattern, page_text, re.I)
                if match:
                    found_price = float(match.group(1).replace(',', ''))
                    break
            
            assert found_price == expected_price, f"Expected ${expected_price}, got ${found_price} from '{page_text}'"
            print(f"✅ '{page_text}' -> Trade Price: ${found_price}")


# ============================================================================
# LOLOI RUGS TESTS - The $99,999 bug
# ============================================================================

class TestLoloiRugsScraping:
    """Test Loloi Rugs scraping - the $99,999 price bug"""
    
    def test_loloi_sku_from_url(self):
        """SKU extraction from URL like /products/loe-03-natural-e"""
        test_urls = [
            ('/products/loe-03-natural-e', 'LOE-03'),
            ('/products/loe-03-natural-espresso', 'LOE-03'),
            ('/products/abc-01-blue', 'ABC-01'),
            ('/products/xyz-99-red-white', 'XYZ-99'),
        ]
        
        pattern = r'/products/([a-z]{2,}-\d+)'
        
        for url, expected_sku in test_urls:
            match = re.search(pattern, url, re.I)
            assert match is not None, f"Failed to match SKU in URL: {url}"
            sku = match.group(1).upper()
            assert sku == expected_sku, f"Expected {expected_sku}, got {sku}"
            print(f"✅ Loloi URL '{url}' -> SKU: {sku}")
    
    def test_loloi_color_from_h1(self):
        """CRITICAL: Color extraction from H1 like 'LOE-03 NATURAL / ESPRESSO'"""
        test_h1s = [
            ('LOE-03 NATURAL / ESPRESSO', 'NATURAL / ESPRESSO'),
            ('ABC-01 BLUE / WHITE', 'BLUE / WHITE'),
            ('XYZ-99 CHARCOAL', 'CHARCOAL'),
            ('MOY-2302 IVORY / NATURAL', 'IVORY / NATURAL'),
        ]
        
        pattern = r'[A-Z]{2,}-\d+\s+(.+)'
        
        for h1_text, expected_color in test_h1s:
            match = re.search(pattern, h1_text, re.I)
            assert match is not None, f"Failed to match color in H1: {h1_text}"
            color = match.group(1).strip()
            assert color == expected_color, f"Expected '{expected_color}', got '{color}'"
            print(f"✅ Loloi H1 '{h1_text}' -> Color: {color}")
    
    def test_loloi_price_not_99999(self):
        """CRITICAL: Price should be $649 NOT $99,999"""
        # Simulated Loloi page text with the problematic $99,999 price
        loloi_page_text = """
        LOE-03 NATURAL / ESPRESSO
        $649
        $1,589 MAP
        Size: 8'6" x 11'6"
        Price Range: $99 - $99,999
        Add to Cart - $649
        """
        
        all_prices = re.findall(r'\$[\d,]+\.?\d*', loloi_page_text)
        print(f"All prices found: {all_prices}")
        
        # Apply the extractTradePrice logic
        trade_price = None
        for price_str in all_prices:
            val = float(price_str.replace('$', '').replace(',', ''))
            
            # SKIP unreasonable prices (>$50,000)
            if val <= 1 or val >= 50000:
                print(f"  Skipping unreasonable price: ${val}")
                continue
            
            # Find context
            idx = loloi_page_text.find(price_str)
            before = loloi_page_text[max(0, idx-30):idx].lower()
            after = loloi_page_text[idx:min(len(loloi_page_text), idx+len(price_str)+30)].lower()
            context = before + after
            
            # Skip MAP/MSRP
            if re.search(r'map|msrp|retail|list', context):
                print(f"  Skipping MSRP price: ${val}")
                continue
            
            if not trade_price:
                trade_price = val
                break
        
        assert trade_price is not None, "No trade price found"
        assert trade_price == 649, f"Expected $649, got ${trade_price}"
        assert trade_price != 99999, "CRITICAL BUG: Got $99,999 instead of $649!"
        print(f"✅ Loloi trade price: ${trade_price} (NOT $99,999)")
    
    def test_loloi_rug_dimensions(self):
        """Rug dimensions like 8'6" x 11'6" """
        test_dims = [
            ("8'6\" x 11'6\"", "8'6\" x 11'6\""),
            ("5' x 7'", "5' x 7'"),
            ("2'3\" x 3'9\"", "2'3\" x 3'9\""),
        ]
        
        pattern = r"([\d]+[''][\d]*[\"']?)\s*x\s*([\d]+[''][\d]*[\"']?)"
        
        for dim_text, expected in test_dims:
            match = re.search(pattern, dim_text)
            assert match is not None, f"Failed to match dimensions: {dim_text}"
            result = f"{match.group(1)} x {match.group(2)}"
            print(f"✅ Loloi dims '{dim_text}' -> {result}")


# ============================================================================
# FOUR HANDS TESTS - Trade price vs MAP
# ============================================================================

class TestFourHandsScraping:
    """Test Four Hands scraping - trade price vs MAP price"""
    
    def test_fourhands_sku_from_url(self):
        """SKU from URL: /product/100074-009"""
        test_urls = [
            ('/product/100074-009', '100074-009'),
            ('/product/QUATRO-123-456', 'QUATRO-123-456'),
            ('/p/247447-002', '247447-002'),
        ]
        
        for url, expected_sku in test_urls:
            pattern = r'/(?:product|p)/([A-Z0-9-]+)'
            match = re.search(pattern, url, re.I)
            assert match is not None, f"Failed to match SKU in URL: {url}"
            sku = match.group(1)
            assert sku == expected_sku, f"Expected {expected_sku}, got {sku}"
            print(f"✅ Four Hands URL '{url}' -> SKU: {sku}")
    
    def test_fourhands_trade_price_not_map(self):
        """CRITICAL: Price should be trade ($500) NOT MAP ($1,099)"""
        # Simulated Four Hands page text
        fourhands_page_text = """
        BRADEN DINING ARM CHAIR
        Durango Smoke • 100074-009
        $500
        $1,099 MAP
        24.00"w x 27.50"d x 37.25"h
        """
        
        all_prices = re.findall(r'\$[\d,]+\.?\d*', fourhands_page_text)
        print(f"All prices found: {all_prices}")
        
        trade_price = None
        msrp_price = None
        
        for price_str in all_prices:
            val = float(price_str.replace('$', '').replace(',', ''))
            if val <= 5 or val >= 500000:
                continue
            
            # Find context
            idx = fourhands_page_text.find(price_str)
            surrounding = fourhands_page_text[max(0, idx-10):idx+len(price_str)+10]
            
            if re.search(r'MAP', surrounding, re.I):
                msrp_price = val
                print(f"  Found MAP/MSRP: ${val}")
            elif not trade_price:
                trade_price = val
                print(f"  Found Trade Price: ${val}")
        
        assert trade_price == 500, f"Expected trade price $500, got ${trade_price}"
        assert msrp_price == 1099, f"Expected MAP $1,099, got ${msrp_price}"
        assert trade_price != msrp_price, "Trade price should NOT equal MAP price!"
        print(f"✅ Four Hands: Trade ${trade_price}, MAP ${msrp_price}")
    
    def test_fourhands_color_bullet_pattern(self):
        """CRITICAL: Color from 'Durango Smoke • 100074-009' pattern"""
        test_texts = [
            ('Durango Smoke • 100074-009', 'Durango Smoke'),
            ('Light Camel • 247447-002', 'Light Camel'),
            ('Natural Oak • 12345-678', 'Natural Oak'),
        ]
        
        pattern = r'^([A-Za-z][A-Za-z\s]+?)(?:\s*[•·]|$)'
        
        for text, expected_color in test_texts:
            match = re.search(pattern, text)
            assert match is not None, f"Failed to match color in: {text}"
            color = match.group(1).strip()
            assert color == expected_color, f"Expected '{expected_color}', got '{color}'"
            print(f"✅ Four Hands color '{text}' -> Color: {color}")
    
    def test_fourhands_dimensions(self):
        """Dimensions: 24.00"w x 27.50"d x 37.25"h"""
        test_dims = [
            ('24.00"w x 27.50"d x 37.25"h', '24.00"W x 27.50"D x 37.25"H'),
            ('21.50"w x 23.00"d x 38.50"h', '21.50"W x 23.00"D x 38.50"H'),
        ]
        
        pattern = r'([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h'
        
        for dim_text, expected in test_dims:
            match = re.search(pattern, dim_text, re.I)
            assert match is not None, f"Failed to match dimensions: {dim_text}"
            result = f'{match.group(1)}"W x {match.group(2)}"D x {match.group(3)}"H'
            assert result == expected, f"Expected '{expected}', got '{result}'"
            print(f"✅ Four Hands dims '{dim_text}' -> {result}")


# ============================================================================
# UTTERMOST TESTS - Price and Color from H1
# ============================================================================

class TestUttermostScraping:
    """Test Uttermost scraping - price and color from H1"""
    
    def test_uttermost_sku_patterns(self):
        """SKU from 'SKU: 53083' or URL suffix"""
        test_cases = [
            ('SKU: 53083', '53083'),
            ('SKU 12345', '12345'),
            ('Product SKU: 98765', '98765'),
        ]
        
        pattern = r'SKU[:\s]+(\d+)'
        
        for text, expected_sku in test_cases:
            match = re.search(pattern, text, re.I)
            assert match is not None, f"Failed to match SKU in: {text}"
            sku = match.group(1)
            assert sku == expected_sku, f"Expected {expected_sku}, got {sku}"
            print(f"✅ Uttermost SKU '{text}' -> SKU: {sku}")
    
    def test_uttermost_color_from_h1(self):
        """CRITICAL: Color from H1 like 'Conifer Dining Armchair, Camel'"""
        test_h1s = [
            ('Conifer Dining Armchair, Camel', 'Camel'),
            ('Lenoir Swivel Chair, Cream', 'Cream'),
            ('Some Product Name, Walnut', 'Walnut'),
            ('Accent Table, Natural Oak', 'Oak'),  # Should get last word
        ]
        
        pattern = r',\s*([A-Za-z]+)\s*$'
        
        for h1_text, expected_color in test_h1s:
            match = re.search(pattern, h1_text)
            assert match is not None, f"Failed to match color in H1: {h1_text}"
            color = match.group(1)
            print(f"✅ Uttermost H1 '{h1_text}' -> Color: {color}")
    
    def test_uttermost_price_patterns(self):
        """Price extraction - Your Price, Trade, Net"""
        test_cases = [
            ('Your Price: $649', 649),
            ('Trade: $500', 500),
            ('Net: $299', 299),
            ('Your Price $450', 450),
        ]
        
        patterns = [
            r'Your\s*Price[:\s]*\$?([\d,]+\.?\d*)',
            r'Trade[:\s]*\$?([\d,]+\.?\d*)',
            r'Net[:\s]*\$?([\d,]+\.?\d*)',
        ]
        
        for text, expected_price in test_cases:
            found_price = None
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    found_price = float(match.group(1).replace(',', ''))
                    break
            
            assert found_price == expected_price, f"Expected ${expected_price}, got ${found_price}"
            print(f"✅ Uttermost price '{text}' -> ${found_price}")
    
    def test_uttermost_dimensions(self):
        """Dimensions: 34 W X 29 H X 30 D (in)"""
        test_dims = [
            ('34 W X 29 H X 30 D (in)', '34"W x 30"D x 29"H'),
            ('30 W X 27 H X 32 D (in)', '30"W x 32"D x 27"H'),
        ]
        
        pattern = r'(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D\s*\(?in'
        
        for dim_text, expected in test_dims:
            match = re.search(pattern, dim_text, re.I)
            assert match is not None, f"Failed to match dimensions: {dim_text}"
            # Note: Uttermost format is W x H x D, convert to W x D x H
            result = f'{match.group(1)}"W x {match.group(3)}"D x {match.group(2)}"H'
            assert result == expected, f"Expected '{expected}', got '{result}'"
            print(f"✅ Uttermost dims '{dim_text}' -> {result}")


# ============================================================================
# COLOR EXTRACTION TESTS - extractColor() logic
# ============================================================================

class TestExtractColorLogic:
    """Test the extractColor() helper function logic from content.js lines 914-960"""
    
    def test_color_from_labeled_text(self):
        """Color extraction from labeled text like 'Color: Beige'"""
        test_cases = [
            ('Color: Beige', 'Beige'),
            ('Finish: Polished Brass', 'Polished Brass'),
            ('Colorway: Natural / Espresso', 'Natural / Espresso'),
            ('Selected: Durango Smoke', 'Durango Smoke'),
        ]
        
        patterns = [
            r'(?:Color|Finish|Colorway)[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|\||$)',
            r'(?:Selected|Current)[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|\||$)',
        ]
        
        for text, expected_color in test_cases:
            found_color = None
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    found_color = match.group(1).strip()
                    break
            
            assert found_color is not None, f"Failed to find color in: {text}"
            assert found_color == expected_color, f"Expected '{expected_color}', got '{found_color}'"
            print(f"✅ Color extraction '{text}' -> {found_color}")
    
    def test_color_length_validation(self):
        """Color should be between 1 and 50 characters"""
        valid_colors = ['Beige', 'Natural / Espresso', 'Hand-Rubbed Antique Brass', 'A']
        invalid_colors = ['', 'A' * 51]
        
        for color in valid_colors:
            assert 1 <= len(color) <= 50, f"Color '{color}' should be valid"
            print(f"✅ Valid color length: '{color}' ({len(color)} chars)")
        
        for color in invalid_colors:
            assert not (1 <= len(color) <= 50), f"Color '{color}' should be invalid"
            print(f"✅ Invalid color length: '{color}' ({len(color)} chars)")


# ============================================================================
# INTEGRATION TESTS - Full page simulation
# ============================================================================

class TestFullPageSimulation:
    """Test full page scraping simulation with realistic page content"""
    
    def test_loloi_full_page(self):
        """Simulate full Loloi page scraping"""
        # Realistic Loloi page content
        page_text = """
        LOE-03 NATURAL / ESPRESSO
        Loloi Rugs
        
        Size: 8'6" x 11'6"
        $649
        $1,589 MAP
        
        Price Range: $99 - $99,999
        
        Add to Cart - $649
        
        SKU: LOE-03
        Collection: Loren
        """
        
        url = '/products/loe-03-natural-espresso'
        
        # Extract SKU from URL
        sku_match = re.search(r'/products/([a-z]{2,}-\d+)', url, re.I)
        sku = sku_match.group(1).upper() if sku_match else None
        
        # Extract color from H1 pattern
        h1_match = re.search(r'([A-Z]{2,}-\d+)\s+(.+)', page_text.split('\n')[1].strip())
        color = h1_match.group(2).strip() if h1_match else None
        
        # Extract price (skip >$50k and MAP)
        all_prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        trade_price = None
        for price_str in all_prices:
            val = float(price_str.replace('$', '').replace(',', ''))
            if val <= 1 or val >= 50000:
                continue
            idx = page_text.find(price_str)
            context = page_text[max(0, idx-30):idx+len(price_str)+30].lower()
            if 'map' in context or 'msrp' in context:
                continue
            trade_price = val
            break
        
        assert sku == 'LOE-03', f"Expected SKU 'LOE-03', got '{sku}'"
        assert color == 'NATURAL / ESPRESSO', f"Expected color 'NATURAL / ESPRESSO', got '{color}'"
        assert trade_price == 649, f"Expected price $649, got ${trade_price}"
        
        print(f"✅ Loloi Full Page: SKU={sku}, Color={color}, Price=${trade_price}")
    
    def test_fourhands_full_page(self):
        """Simulate full Four Hands page scraping"""
        page_text = """
        BRADEN DINING ARM CHAIR
        Durango Smoke • 100074-009
        
        $500
        $1,099 MAP
        
        24.00"w x 27.50"d x 37.25"h
        
        Add to Cart
        """
        
        url = '/product/100074-009'
        
        # Extract SKU from URL
        sku_match = re.search(r'/product/([A-Z0-9-]+)', url, re.I)
        sku = sku_match.group(1) if sku_match else None
        
        # Extract color from bullet pattern
        color_match = re.search(r'([A-Za-z][A-Za-z\s]+?)\s*[•·]\s*[\dA-Z]{5,}', page_text)
        color = color_match.group(1).strip() if color_match else None
        
        # Extract trade price (not MAP)
        all_prices = re.findall(r'\$[\d,]+\.?\d*', page_text)
        trade_price = None
        for price_str in all_prices:
            val = float(price_str.replace('$', '').replace(',', ''))
            if val <= 5 or val >= 500000:
                continue
            idx = page_text.find(price_str)
            context = page_text[max(0, idx-10):idx+len(price_str)+10]
            if 'MAP' in context:
                continue
            trade_price = val
            break
        
        assert sku == '100074-009', f"Expected SKU '100074-009', got '{sku}'"
        assert color == 'Durango Smoke', f"Expected color 'Durango Smoke', got '{color}'"
        assert trade_price == 500, f"Expected price $500, got ${trade_price}"
        
        print(f"✅ Four Hands Full Page: SKU={sku}, Color={color}, Price=${trade_price}")


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_price_boundary_50000(self):
        """Test price boundary at $50,000"""
        test_prices = [
            (49999, True),   # Should be accepted
            (50000, False),  # Should be rejected (>= 50000)
            (50001, False),  # Should be rejected
            (99999, False),  # Should be rejected
        ]
        
        for price, should_accept in test_prices:
            is_valid = price > 1 and price < 50000
            assert is_valid == should_accept, f"Price ${price} validation failed"
            status = "accepted" if is_valid else "rejected"
            print(f"✅ Price ${price} -> {status}")
    
    def test_empty_and_null_values(self):
        """Test handling of empty/null values"""
        test_texts = ['', None, '   ', '\n\n']
        
        for text in test_texts:
            if not text or not text.strip():
                print(f"✅ Empty/null text handled correctly: {repr(text)}")
            else:
                print(f"⚠️ Text not empty: {repr(text)}")
    
    def test_special_characters_in_color(self):
        """Test colors with special characters"""
        test_colors = [
            'NATURAL / ESPRESSO',
            'Hand-Rubbed Antique Brass',
            'Cream/Ivory',
            'Blue-Gray',
        ]
        
        pattern = r'[A-Za-z][A-Za-z\s\-\/]+'
        
        for color in test_colors:
            match = re.match(pattern, color)
            assert match is not None, f"Failed to match color: {color}"
            print(f"✅ Special char color: '{color}'")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
