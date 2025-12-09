"""
Vendor-specific configuration for product scraping.
Each vendor has unique login pages and product page structures.
This is a comprehensive configuration for ALL 22 vendor sites.
"""

# Vendor configurations with login URLs and extraction settings
VENDOR_CONFIGS = {
    # ===== FOUR HANDS (WORKING) =====
    "fourhands.com": {
        "name": "Four Hands",
        "login_url": "https://fourhands.com",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'button:has-text("Trade")',
            'a[href*="trade"]',
        ],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("SIGN IN")'],
        "name_selectors": ['h1', '.product-title', '[class*="ProductTitle"]'],
        "price_selectors": ['.price', '[class*="price"]', '[class*="Price"]'],
        "sku_selectors": ['[itemProp="sku"]', '.sku', '[class*="sku"]', '[class*="Sku"]'],
        "image_selectors": ['meta[property="og:image"]', 'picture img', '.product-image img'],
        "dimensions_selectors": ['.dimensions', '[class*="dimension"]', '[class*="Dimension"]'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== UTTERMOST (Magento-based) =====
    "uttermost.com": {
        "name": "Uttermost",
        "login_url": "https://uttermost.com/customer/account/login/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": [
            'input[type="email"]',
            '#email',
            'input[name="login[username]"]',
            'input[name="email"]',
            'input[placeholder*="Email"]',
        ],
        "password_selectors": [
            'input[type="password"]',
            '#pass',
            '#password',
            'input[name="login[password]"]',
            'input[name="password"]',
            'input[placeholder*="Password"]',
            'input[autocomplete="current-password"]',
        ],
        "submit_selectors": [
            'button:has-text("SIGN IN")',
            'button:has-text("Sign In")',
            '#send2',
            'button[type="submit"]',
        ],
        "name_selectors": ['h1.page-title span', 'h1.page-title', '.product-info-main h1', 'h1'],
        "price_selectors": ['.price-wrapper .price', '[data-price-type="finalPrice"] .price', '.price'],
        "sku_selectors": ['.product.attribute.sku .value', '[itemprop="sku"]', '.sku .value'],
        "image_selectors": ['meta[property="og:image"]', '.gallery-placeholder img', '.product-image-photo'],
        "dimensions_selectors": ['.product.attribute.dimensions .value', '.additional-attributes-wrapper'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== GLOBAL VIEWS (Magento-based) =====
    "globalviews.com": {
        "name": "Global Views",
        "login_url": "https://www.globalviews.com/customer/account/login/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#email', 'input[name="login[username]"]', 'input[type="email"]'],
        "password_selectors": ['#pass', 'input[name="login[password]"]', 'input[type="password"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "name_selectors": ['h1.page-title span', '.product-info-main h1', 'h1'],
        "price_selectors": ['.price-wrapper .price', '.price'],
        "sku_selectors": ['.product.attribute.sku .value', '[itemprop="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.gallery-placeholder img'],
        "dimensions_selectors": ['.product.attribute.dimensions .value'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== ROWE FURNITURE (Shopify-based) =====
    "rowefurniture.com": {
        "name": "Rowe Furniture",
        "login_url": "https://rowefurniture.com/account/login",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#CustomerEmail', 'input[name="customer[email]"]', 'input[type="email"]'],
        "password_selectors": ['#CustomerPassword', 'input[name="customer[password]"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "name_selectors": ['h1.product__title', 'h1', '.product-title'],
        "price_selectors": ['.price__regular .price-item', '.product__price', '.price'],
        "sku_selectors": ['.product__sku', '[data-product-sku]', '.sku'],
        "image_selectors": ['meta[property="og:image"]', '.product__media img', '.product-image img'],
        "dimensions_selectors": ['.product__dimensions', '.metafield-dimension'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== REGINA ANDREW =====
    "reginaandrew.com": {
        "name": "Regina Andrew",
        "login_url": "https://www.reginaandrew.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Trade")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]', '#username'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "name_selectors": ['h1', '.product-name', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]', '.product-sku'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions', '.product-dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== BERNHARDT =====
    "bernhardt.com": {
        "name": "Bernhardt",
        "login_url": "https://www.bernhardt.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-name'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== LOLOI RUGS (Shopify-based) =====
    "loloirugs.com": {
        "name": "Loloi Rugs",
        "login_url": "https://www.loloirugs.com/account/login",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#CustomerEmail', 'input[type="email"]'],
        "password_selectors": ['#CustomerPassword', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1.product__title', 'h1', '.product-title'],
        "price_selectors": ['.price', '.product__price'],
        "sku_selectors": ['.product__sku', '.sku'],
        "image_selectors": ['meta[property="og:image"]', '.product__media img'],
        "dimensions_selectors": ['.product__dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== VISUAL COMFORT (Magento-based) =====
    "visualcomfort.com": {
        "name": "Visual Comfort",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#email', 'input[name="login[username]"]', 'input[type="email"]'],
        "password_selectors": ['#pass', 'input[name="login[password]"]', 'input[type="password"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "name_selectors": ['h1.page-title span', 'h1.page-title', 'h1'],
        "price_selectors": ['.price-wrapper .price', '.price'],
        "sku_selectors": ['.product.attribute.sku .value', '[itemprop="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.gallery-placeholder img'],
        "dimensions_selectors": ['.product.attribute.dimensions .value'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== HVL GROUP =====
    "hvlgroup.com": {
        "name": "HVL Group",
        "login_url": "https://www.hvlgroup.com/Auth/Login",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#Email', 'input[name="Email"]', 'input[type="email"]'],
        "password_selectors": ['#Password', 'input[name="Password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "name_selectors": ['h1', '.product-name', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '.product-sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions', '.product-dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== V AND H =====
    "vandh.com": {
        "name": "V and H",
        "login_url": "https://vandh.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== FLOW DECOR =====
    "flowdecor.com": {
        "name": "Flow Decor",
        "login_url": "https://www.flowdecor.com/sign-in/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#email', 'input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['#password', 'input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "name_selectors": ['h1', '.product-title', '.product-name'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== CRESTVIEW COLLECTION =====
    "crestviewcollection.com": {
        "name": "Crestview Collection",
        "login_url": "https://www.crestviewcollection.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== BASSETT MIRROR =====
    "bassettmirror.com": {
        "name": "Bassett Mirror",
        "login_url": "https://www.bassettmirror.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== EICHHOLTZ (Magento-based) =====
    "eichholtz.com": {
        "name": "Eichholtz",
        "login_url": "https://www.eichholtz.com/en/customer/account/login/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#email', 'input[name="login[username]"]', 'input[type="email"]'],
        "password_selectors": ['#pass', 'input[name="login[password]"]', 'input[type="password"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "name_selectors": ['h1.page-title span', 'h1'],
        "price_selectors": ['.price-wrapper .price', '.price'],
        "sku_selectors": ['.product.attribute.sku .value', '[itemprop="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.gallery-placeholder img'],
        "dimensions_selectors": ['.product.attribute.dimensions .value'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== MYO AMERICA (Magento-based) =====
    "myohamerica.com": {
        "name": "MYO America",
        "login_url": "https://myohamerica.com/customer/account/login/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#email', 'input[type="email"]'],
        "password_selectors": ['#pass', 'input[type="password"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "name_selectors": ['h1.page-title span', 'h1'],
        "price_selectors": ['.price-wrapper .price', '.price'],
        "sku_selectors": ['.product.attribute.sku .value'],
        "image_selectors": ['meta[property="og:image"]', '.gallery-placeholder img'],
        "dimensions_selectors": ['.product.attribute.dimensions .value'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== SAFAVIEH (WordPress-based) =====
    "safavieh.com": {
        "name": "Safavieh",
        "login_url": "https://safavieh.com/dealer-login",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['#user_login', 'input[name="log"]', 'input[name="username"]'],
        "password_selectors": ['#user_pass', 'input[name="pwd"]', 'input[type="password"]'],
        "submit_selectors": ['#wp-submit', 'input[type="submit"]', 'button[type="submit"]'],
        "name_selectors": ['h1', '.product-title', '.product_title'],
        "price_selectors": ['.price', '.woocommerce-Price-amount', '[class*="price"]'],
        "sku_selectors": ['.sku', '.product_meta .sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.woocommerce-product-gallery img'],
        "dimensions_selectors": ['.product_dimensions', '.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== SURYA =====
    "surya.com": {
        "name": "Surya",
        "login_url": "https://www.surya.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'a:has-text("Sign In")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== ZEEV LIGHTING =====
    "zeevlighting.com": {
        "name": "Zeev Lighting",
        "login_url": "https://zeevlighting.com/",
        "login_type": "direct",
        "requires_login": True,
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== HUBBARDTON FORGE =====
    "hubbardtonforge.com": {
        "name": "Hubbardton Forge",
        "login_url": "https://hubbardtonforge.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== HINKLEY =====
    "hinkley.com": {
        "name": "Hinkley",
        "login_url": "https://www.hinkley.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== ELEGANT LIGHTING =====
    "elegantlighting.com": {
        "name": "Elegant Lighting",
        "login_url": "https://www.elegantlighting.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== GABBY HOME =====
    "gabbyhome.com": {
        "name": "Gabby Home",
        "login_url": "https://gabby.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== GABBY.COM (alternate domain) =====
    "gabby.com": {
        "name": "Gabby Home",
        "login_url": "https://gabby.com/",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")'],
        "username_selectors": ['input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['input[name="password"]', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]'],
        "name_selectors": ['h1', '.product-title'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
}


def get_vendor_config(domain: str) -> dict:
    """Get vendor configuration for a domain."""
    # Remove www. prefix and convert to lowercase
    clean_domain = domain.lower().replace('www.', '')
    
    # Try exact match first
    if clean_domain in VENDOR_CONFIGS:
        return VENDOR_CONFIGS[clean_domain]
    
    # Try partial match
    for vendor_domain, config in VENDOR_CONFIGS.items():
        if vendor_domain in clean_domain or clean_domain in vendor_domain:
            return config
    
    # Return default config if no match - will use generic extraction
    return {
        "name": clean_domain.replace('.com', '').replace('.', ' ').title(),
        "login_url": f"https://{clean_domain}",
        "login_type": "modal",
        "requires_login": True,
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'button:has-text("Sign In")',
            'a[href*="login"]',
            'a[href*="account"]',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="username"]',
            '#email',
            '#username',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#password',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign In")',
            'button:has-text("Login")',
        ],
        "name_selectors": ['h1', '.product-title', '.product-name'],
        "price_selectors": ['.price', '[class*="price"]'],
        "sku_selectors": ['.sku', '[class*="sku"]', '[itemprop="sku"]'],
        "image_selectors": ['meta[property="og:image"]', '.product-image img'],
        "dimensions_selectors": ['.dimensions', '[class*="dimension"]'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    }
