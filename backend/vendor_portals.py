"""
Vendor Portal Management System
Securely stores credentials and manages authenticated scraping sessions
"""
import os
import base64
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List
from cryptography.fernet import Fernet
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Generate or load encryption key
ENCRYPTION_KEY = os.environ.get('VENDOR_ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # Generate a key if not set (in production, this should be in env)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    
cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def encrypt_password(password: str) -> str:
    """Encrypt a password for secure storage"""
    return cipher.encrypt(password.encode()).decode()

def decrypt_password(encrypted: str) -> str:
    """Decrypt a stored password"""
    return cipher.decrypt(encrypted.encode()).decode()

# Vendor Portal Configurations
VENDOR_PORTALS = {
    "four_hands": {
        "name": "Four Hands",
        "login_url": "https://fourhands.com/login",
        "base_url": "https://fourhands.com",
        "search_url": "https://fourhands.com/search?q={query}",
        "login_type": "account_number",  # Uses account number instead of email
        "selectors": {
            "username_field": "input[placeholder*='email' i], input[placeholder*='customer' i]",
            "password_field": "input[type='password']",
            "login_button": "button:has-text('Continue')",
            "product_image": "img[src*='cloudfront']",
            "product_link": "a[href*='/product/']",
        }
    },
    "uttermost": {
        "name": "Uttermost",
        "login_url": "https://uttermost.com/customer/account/login/",
        "base_url": "https://uttermost.com",
        "search_url": "https://uttermost.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2, button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "bernhardt": {
        "name": "Bernhardt",
        "login_url": "https://www.bernhardt.com/customer/account/login/",
        "base_url": "https://www.bernhardt.com",
        "search_url": "https://www.bernhardt.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2, button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "rowe": {
        "name": "Rowe Furniture",
        "login_url": "https://rowefurniture.com/login",
        "base_url": "https://rowefurniture.com",
        "search_url": "https://rowefurniture.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='email'], input#email",
            "password_field": "input[name='password'], input#password",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a[href*='/product/']",
        }
    },
    "loloi": {
        "name": "Loloi Rugs",
        "login_url": "https://www.loloirugs.com/account/login",
        "base_url": "https://www.loloirugs.com",
        "search_url": "https://www.loloirugs.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='customer[email]'], input#CustomerEmail",
            "password_field": "input[name='customer[password]'], input#CustomerPassword",
            "login_button": "button[type='submit']",
            "product_image": "img.product-featured-image",
            "product_link": "a.product-card__link",
        }
    },
    "visual_comfort": {
        "name": "Visual Comfort",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "base_url": "https://www.visualcomfort.com",
        "search_url": "https://www.visualcomfort.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "hvl_group": {
        "name": "Hudson Valley Lighting Group",
        "login_url": "https://www.hvlgroup.com/Auth/Login",
        "base_url": "https://www.hvlgroup.com",
        "search_url": "https://www.hvlgroup.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='email'], input#email",
            "password_field": "input[name='password'], input#password",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a.product-link",
        }
    },
    "gabby": {
        "name": "Gabby / Summer Classics",
        "login_url": "https://gabby.com/account/login",
        "base_url": "https://gabby.com",
        "search_url": "https://gabby.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='customer[email]']",
            "password_field": "input[name='customer[password]']",
            "login_button": "button[type='submit']",
            "product_image": "img.product-featured-image",
            "product_link": "a.product-card__link",
        }
    },
    "bassett_mirror": {
        "name": "Bassett Mirror",
        "login_url": "https://www.bassettmirror.com/customer/account/login/",
        "base_url": "https://www.bassettmirror.com",
        "search_url": "https://www.bassettmirror.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "surya": {
        "name": "Surya",
        "login_url": "https://www.surya.com/customer/account/login/",
        "base_url": "https://www.surya.com",
        "search_url": "https://www.surya.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "safavieh": {
        "name": "Safavieh",
        "login_url": "https://safavieh.com/dealer-login",
        "base_url": "https://safavieh.com",
        "search_url": "https://safavieh.com/search?q={query}",
        "login_type": "dealer_code",  # Uses dealer code
        "selectors": {
            "username_field": "input[name='dealer_code'], input#dealer_code",
            "password_field": "input[name='password']",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a.product-link",
        }
    },
    "regina_andrew": {
        "name": "Regina Andrew",
        "login_url": "https://www.reginaandrew.com/customer/account/login/",
        "base_url": "https://www.reginaandrew.com",
        "search_url": "https://www.reginaandrew.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "global_views": {
        "name": "Global Views",
        "login_url": "https://www.globalviews.com/customer/account/login/",
        "base_url": "https://www.globalviews.com",
        "search_url": "https://www.globalviews.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
}

class VendorCredentialManager:
    """Manages vendor credentials securely"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.vendor_credentials
    
    async def save_credential(self, vendor_key: str, username: str, password: str, 
                             account_number: str = None, dealer_code: str = None):
        """Save encrypted vendor credentials"""
        encrypted_password = encrypt_password(password)
        
        credential = {
            "vendor_key": vendor_key,
            "vendor_name": VENDOR_PORTALS.get(vendor_key, {}).get("name", vendor_key),
            "username": username,
            "password_encrypted": encrypted_password,
            "account_number": account_number,
            "dealer_code": dealer_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "status": "active"
        }
        
        # Upsert - update if exists, insert if not
        await self.collection.update_one(
            {"vendor_key": vendor_key},
            {"$set": credential},
            upsert=True
        )
        
        return {"success": True, "vendor": vendor_key}
    
    async def get_credential(self, vendor_key: str) -> Optional[Dict]:
        """Get decrypted credentials for a vendor"""
        cred = await self.collection.find_one({"vendor_key": vendor_key})
        if not cred:
            # Try finding by domain
            cred = await self.collection.find_one({"domain": vendor_key})
        if not cred:
            return None
        
        return {
            "vendor_key": cred.get("vendor_key", cred.get("domain", vendor_key)),
            "vendor_name": cred.get("vendor_name", cred.get("name", "")),
            "username": cred.get("username", ""),
            "password": decrypt_password(cred.get("password_encrypted", cred.get("encrypted_password", ""))),
            "account_number": cred.get("account_number"),
            "dealer_code": cred.get("dealer_code"),
            "status": cred.get("status", "active")
        }
    
    async def get_all_credentials(self) -> List[Dict]:
        """Get all vendor credentials (without passwords for listing)"""
        creds = await self.collection.find({}).to_list(100)
        return [
            {
                "vendor_key": c.get("vendor_key", c.get("domain", "")),
                "vendor_name": c.get("vendor_name", c.get("name", "")),
                "username": c.get("username", ""),
                "status": c.get("status", "active"),
                "last_login": c.get("last_login")
            }
            for c in creds
        ]
    
    async def delete_credential(self, vendor_key: str):
        """Delete a vendor credential"""
        await self.collection.delete_one({"vendor_key": vendor_key})
        return {"success": True}
    
    async def update_last_login(self, vendor_key: str):
        """Update the last login timestamp"""
        await self.collection.update_one(
            {"vendor_key": vendor_key},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )


def get_vendor_portal_info(vendor_key: str) -> Optional[Dict]:
    """Get portal configuration for a vendor"""
    return VENDOR_PORTALS.get(vendor_key)


# ---------------------------------------------------------------------------
# URL → vendor_key resolver. Used by the AI assistant's enrichment pipeline
# to map a vendor product link (e.g. https://uttermost.com/...) to the
# corresponding pre-configured portal so we can call the authenticated
# scraper instead of the public one.
# ---------------------------------------------------------------------------
_URL_DOMAIN_TO_KEY = {
    "fourhands.com": "four_hands",
    "uttermost.com": "uttermost",
    "bernhardt.com": "bernhardt",
    "rowefurniture.com": "rowe",
    "loloirugs.com": "loloi",
    "visualcomfort.com": "visual_comfort",
    "hvlgroup.com": "hvl_group",
    "gabby.com": "gabby",
    "bassettmirror.com": "bassett_mirror",
    "surya.com": "surya",
    "safavieh.com": "safavieh",
    "reginaandrew.com": "regina_andrew",
    "globalviews.com": "global_views",
}


def resolve_vendor_key_from_url(url: str) -> Optional[str]:
    """Given a product URL, return the matching vendor_key or None."""
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        host = (urlparse(url).hostname or "").lower().lstrip("www.")
        # strip leading 'www.'
        if host.startswith("www."):
            host = host[4:]
        for domain, key in _URL_DOMAIN_TO_KEY.items():
            if host == domain or host.endswith("." + domain):
                return key
    except Exception:
        pass
    return None


def get_all_vendor_portals() -> List[Dict]:
    """Get list of all supported vendor portals"""
    return [
        {
            "key": key,
            "name": config["name"],
            "login_url": config["login_url"],
            "login_type": config["login_type"]
        }
        for key, config in VENDOR_PORTALS.items()
    ]
