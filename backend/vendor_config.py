"""
Vendor-specific configuration for product scraping.
Updated with aggressive waits and site-specific settings for ALL vendors.
"""

VENDOR_CONFIGS = {
    "fourhands.com": {
        "name": "Four Hands",
        "login_url": "https://fourhands.com/login",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['input[type="text"]', 'input[name="username"]', 'input[name="accountNumber"]', '#username', '#accountNumber'],
        "password_selectors": ['input[type="password"]', '#password', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Sign In")', 'button:has-text("Login")'],
        "wait_after_login": 15000,
        "wait_for_content": 10000,
        "slow_site": True,
    },
    
    "uttermost.com": {
        "name": "Uttermost",
        "login_url": "https://uttermost.com/sign-in",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        # NOTE: Uttermost has TWO login forms - use the VISIBLE ones: #email and #Password
        "username_selectors": ['#email', '#email-login', 'input[name="email"]', 'input[type="email"]'],
        "password_selectors": ['#Password', '#login-password', 'input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button:has-text("Login")', 'button[type="submit"]:has-text("Login")', 'button[type="submit"]'],
        "wait_after_login": 15000,
        "wait_for_content": 10000,
        # WARNING: Uttermost has aggressive bot detection - login may fail even with correct credentials
        "bot_detection_risk": True,
    },
    
    "globalviews.com": {
        "name": "Global Views",
        "login_url": "https://www.globalviews.com/customer/account/login/",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['#email', 'input[type="email"]', 'input[name="login[username]"]'],
        "password_selectors": ['#pass', 'input[type="password"]', 'input[name="login[password]"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "rowefurniture.com": {
        "name": "Rowe Furniture",
        "login_url": "https://rowefurniture.com/account/login",
        "login_type": "direct",
        "extra_wait_before_login": 5000,
        "username_selectors": ['#CustomerEmail', 'input[type="email"]', 'input[name="customer[email]"]'],
        "password_selectors": ['#CustomerPassword', 'input[type="password"]', 'input[name="customer[password]"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "wait_after_login": 5000,
        "wait_for_content": 3000,
    },
    
    "reginaandrew.com": {
        "name": "Regina Andrew",
        "login_url": "https://www.reginaandrew.com/?logoff=T&whence=",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['input[type="email"]', 'input[name="email"]', 'input[name="username"]', '#username', '#email'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]', '#password'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")', 'button:has-text("Login")', 'input[type="submit"]'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "bernhardt.com": {
        "name": "Bernhardt",
        "login_url": "https://www.bernhardt.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Trade")', 'a[href*="login"]', 'a[href*="account"]'],
        "username_selectors": ['input[type="text"]', 'input[name="username"]', 'input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")', 'button:has-text("Login")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "loloirugs.com": {
        "name": "Loloi Rugs",
        "login_url": "https://www.loloirugs.com/account/login",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['#CustomerEmail', 'input[type="email"]', 'input[name="customer[email]"]'],
        "password_selectors": ['#CustomerPassword', 'input[type="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "visualcomfort.com": {
        "name": "Visual Comfort",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['#email', 'input[type="email"]', 'input[name="login[username]"]'],
        "password_selectors": ['#pass', 'input[type="password"]', 'input[name="login[password]"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "hvlgroup.com": {
        "name": "HVL Group",
        "login_url": "https://www.hvlgroup.com/Auth/Login",
        "login_type": "direct",
        "username_selectors": ['#Email', 'input[name="Email"]', 'input[type="email"]', 'input[placeholder="Email"]'],
        "password_selectors": ['#Password', 'input[name="Password"]', 'input[type="password"]', 'input[placeholder="Password"]'],
        "submit_selectors": [
            'button:has-text("Login")', 
            'button:has-text("LOG IN")', 
            'input[type="submit"]', 
            'button[type="submit"]',
            '.login-button',
            'form button'
        ],
        "wait_after_login": 8000,
        "price_selectors": ['.price', '.product-price', '[class*="Price"]', '[class*="price"]']
    },
    
    "vandh.com": {
        "name": "V and H",
        "login_url": "https://vandh.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")', 'a[href*="login"]'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]', '#email'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "flowdecor.com": {
        "name": "Flow Decor",
        "login_url": "https://www.flowdecor.com/sign-in/",
        "login_type": "direct",
        "extra_wait_before_login": 5000,
        "username_selectors": ['input[type="email"]', '#email', 'input[name="email"]', 'input[name="username"]'],
        "password_selectors": ['input[type="password"]', '#password', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "crestviewcollection.com": {
        "name": "Crestview Collection",
        "login_url": "https://www.crestviewcollection.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")', 'a[href*="login"]'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "bassettmirror.com": {
        "name": "Bassett Mirror",
        "login_url": "https://www.bassettmirror.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "eichholtz.com": {
        "name": "Eichholtz",
        "login_url": "https://www.eichholtz.com/en/customer/account/login/",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['#email', 'input[type="email"]', 'input[name="login[username]"]'],
        "password_selectors": ['#pass', 'input[type="password"]', 'input[name="login[password]"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "myohamerica.com": {
        "name": "MYO America",
        "login_url": "https://myohamerica.com/customer/account/login/",
        "login_type": "direct",
        "extra_wait_before_login": 8000,
        "username_selectors": ['#email', 'input[type="email"]', 'input[name="login[username]"]'],
        "password_selectors": ['#pass', 'input[type="password"]', 'input[name="login[password]"]'],
        "submit_selectors": ['#send2', 'button[type="submit"]'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "safavieh.com": {
        "name": "Safavieh",
        "login_url": "https://safavieh.com/dealer-login?redirect_to=/",
        "login_type": "direct",
        "extra_wait_before_login": 5000,
        "username_selectors": ['#user_login', 'input[name="log"]', 'input[name="username"]', 'input[type="text"]'],
        "password_selectors": ['#user_pass', 'input[name="pwd"]', 'input[type="password"]'],
        "submit_selectors": ['#wp-submit', 'input[type="submit"]', 'button[type="submit"]'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "surya.com": {
        "name": "Surya",
        "login_url": "https://www.surya.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'a:has-text("Sign In")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "zeevlighting.com": {
        "name": "Zeev Lighting",
        "login_url": "https://zeevlighting.com/",
        "login_type": "direct",
        "extra_wait_before_login": 5000,
        "username_selectors": ['input[type="email"]', 'input[name="email"]', 'input[type="text"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Login")'],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
    
    "hubbardtonforge.com": {
        "name": "Hubbardton Forge",
        "login_url": "https://hubbardtonforge.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "hinkley.com": {
        "name": "Hinkley",
        "login_url": "https://www.hinkley.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "elegantlighting.com": {
        "name": "Elegant Lighting",
        "login_url": "https://www.elegantlighting.com/",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'button:has-text("Sign In")'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    },
    
    "gabby.com": {
        "name": "Gabby Home",
        "login_url": "https://onlinestore.gabbyhome.com/gh/e/1/login",
        "login_type": "direct",
        "extra_wait_before_login": 5000,
        "username_selectors": [
            '#username',
            'input[name="username"]',
            'input[type="text"][id="username"]',
        ],
        "password_selectors": [
            '#password',
            'input[name="password"]',
            'input[type="password"]',
        ],
        "submit_selectors": [
            'input[type="submit"]',
            'button[type="submit"]',
        ],
        "wait_after_login": 8000,
        "wait_for_content": 5000,
    },
}


def get_vendor_config(domain: str) -> dict:
    """Get vendor configuration for a domain."""
    clean_domain = domain.lower().replace('www.', '')
    
    if clean_domain in VENDOR_CONFIGS:
        return VENDOR_CONFIGS[clean_domain]
    
    for vendor_domain, config in VENDOR_CONFIGS.items():
        if vendor_domain in clean_domain or clean_domain in vendor_domain:
            return config
    
    # Default config for unknown vendors
    return {
        "name": clean_domain.replace('.com', '').title(),
        "login_url": f"https://{clean_domain}",
        "login_type": "modal",
        "extra_wait_before_login": 8000,
        "trade_button_selectors": ['a:has-text("Trade")', 'a:has-text("Login")', 'button:has-text("Sign In")'],
        "username_selectors": ['input[type="email"]', 'input[name="email"]', 'input[type="text"]'],
        "password_selectors": ['input[type="password"]', 'input[name="password"]'],
        "submit_selectors": ['button[type="submit"]', 'input[type="submit"]'],
        "wait_after_login": 10000,
        "wait_for_content": 8000,
    }
