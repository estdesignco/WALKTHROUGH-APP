"""
Vendor-specific configuration for product scraping.
Each vendor has unique login pages and product page structures.
"""

# Vendor configurations with login URLs and extraction settings
VENDOR_CONFIGS = {
    # ===== FURNITURE VENDORS =====
    "fourhands.com": {
        "name": "Four Hands",
        "login_url": "https://fourhands.com",  # Trade button opens modal
        "login_type": "modal",  # modal, direct, or none
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a[href*="trade"]',
            'button:has-text("Trade")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="email" i]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("SIGN IN")',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
            '[class*="product"][class*="name"]',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
            '[data-price]',
        ],
        "sku_selectors": [
            '[itemProp="sku"]',
            '.sku',
            '[class*="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            'picture img',
            '[class*="Gallery"] img',
        ],
        "dimensions_selectors": [
            '.dimensions',
            '[class*="dimension"]',
            '.specifications',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "uttermost.com": {
        "name": "Uttermost",
        "login_url": "https://uttermost.com/customer/account/login/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
            '#send2',
        ],
        "name_selectors": [
            'h1.page-title span',
            'h1',
            '.product-info-main h1',
        ],
        "price_selectors": [
            '.price-wrapper .price',
            '.price',
            '[data-price-type="finalPrice"]',
        ],
        "sku_selectors": [
            '.product.attribute.sku .value',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.gallery-placeholder img',
            '.product-image-photo',
        ],
        "dimensions_selectors": [
            '.product.attribute.dimensions',
            '.additional-attributes',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "globalviews.com": {
        "name": "Global Views",
        "login_url": "https://www.globalviews.com/customer/account/login/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
            '#send2',
        ],
        "name_selectors": [
            'h1.page-title span',
            'h1',
            '.product-info-main h1',
        ],
        "price_selectors": [
            '.price-wrapper .price',
            '.price',
        ],
        "sku_selectors": [
            '.product.attribute.sku .value',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.gallery-placeholder img',
        ],
        "dimensions_selectors": [
            '.product.attribute.dimensions',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "rowefurniture.com": {
        "name": "Rowe Furniture",
        "login_url": "https://rowefurniture.com/login",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#CustomerEmail',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#CustomerPassword',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "reginaandrew.com": {
        "name": "Regina Andrew",
        "login_url": "https://www.reginaandrew.com/?logoff=T&whence=",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="username"]',
            '#username',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign In")',
            'button:has-text("Login")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
            '.product-name',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
            '.product-sku',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
            '.main-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
            '.product-dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "bernhardt.com": {
        "name": "Bernhardt",
        "login_url": "https://www.bernhardt.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'button:has-text("Trade")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="username"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    # ===== RUG VENDORS =====
    "loloirugs.com": {
        "name": "Loloi Rugs",
        "login_url": "https://www.loloirugs.com/collections/rugs-collections",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'button:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "surya.com": {
        "name": "Surya",
        "login_url": "https://www.surya.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "safavieh.com": {
        "name": "Safavieh",
        "login_url": "https://safavieh.com/dealer-login?redirect_to=/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="log"]',
            'input[name="username"]',
            'input#user_login',
        ],
        "password_selectors": [
            'input[name="pwd"]',
            'input[name="password"]',
            'input#user_pass',
        ],
        "submit_selectors": [
            'input[type="submit"]',
            'button[type="submit"]',
            '#wp-submit',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== LIGHTING VENDORS =====
    "visualcomfort.com": {
        "name": "Visual Comfort",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
            '#send2',
        ],
        "name_selectors": [
            'h1.page-title span',
            'h1',
        ],
        "price_selectors": [
            '.price',
            '[data-price-type="finalPrice"]',
        ],
        "sku_selectors": [
            '.product.attribute.sku .value',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.gallery-placeholder img',
        ],
        "dimensions_selectors": [
            '.product.attribute.dimensions',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "hvlgroup.com": {
        "name": "HVL Group",
        "login_url": "https://www.hvlgroup.com/Auth/Login?returnUrl=%2F",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[name="Email"]',
            'input[type="email"]',
            '#Email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[name="Password"]',
            'input[type="password"]',
            '#Password',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "hinkley.com": {
        "name": "Hinkley",
        "login_url": "https://www.hinkley.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "zeevlighting.com": {
        "name": "Zeev Lighting",
        "login_url": "https://zeevlighting.com/index.php",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="username"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "hubbardtonforge.com": {
        "name": "Hubbardton Forge",
        "login_url": "https://hubbardtonforge.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "elegantlighting.com": {
        "name": "Elegant Lighting",
        "login_url": "https://www.elegantlighting.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    # ===== DECOR VENDORS =====
    "vandh.com": {
        "name": "V and H",
        "login_url": "https://vandh.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "flowdecor.com": {
        "name": "Flow Decor",
        "login_url": "https://www.flowdecor.com/sign-in/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#password',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "crestviewcollection.com": {
        "name": "Crestview Collection",
        "login_url": "https://www.crestviewcollection.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "bassettmirror.com": {
        "name": "Bassett Mirror",
        "login_url": "https://www.bassettmirror.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "eichholtz.com": {
        "name": "Eichholtz",
        "login_url": "https://www.eichholtz.com/en/customer/account/login/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            '#send2',
        ],
        "name_selectors": [
            'h1.page-title span',
            'h1',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.product.attribute.sku .value',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.gallery-placeholder img',
        ],
        "dimensions_selectors": [
            '.product.attribute.dimensions',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "myohamerica.com": {
        "name": "MYO America",
        "login_url": "https://myohamerica.com/customer/account/login/",
        "login_type": "direct",
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            '#email',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
            '#pass',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            '#send2',
        ],
        "name_selectors": [
            'h1.page-title span',
            'h1',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.product.attribute.sku .value',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.gallery-placeholder img',
        ],
        "dimensions_selectors": [
            '.product.attribute.dimensions',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "gabbyhome.com": {
        "name": "Gabby Home",
        "login_url": "https://gabby.com/",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'a:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
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
    
    # Return default config if no match
    return {
        "name": clean_domain.replace('.com', '').replace('.', ' ').title(),
        "login_url": f"https://{clean_domain}",
        "login_type": "modal",
        "trade_button_selectors": [
            'a:has-text("Trade")',
            'a:has-text("Login")',
            'button:has-text("Sign In")',
        ],
        "username_selectors": [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="username"]',
        ],
        "password_selectors": [
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign In")',
        ],
        "name_selectors": [
            'h1',
            '.product-title',
        ],
        "price_selectors": [
            '.price',
            '[class*="price"]',
        ],
        "sku_selectors": [
            '.sku',
            '[itemProp="sku"]',
        ],
        "image_selectors": [
            'meta[property="og:image"]',
            '.product-image img',
        ],
        "dimensions_selectors": [
            '.dimensions',
        ],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    }
