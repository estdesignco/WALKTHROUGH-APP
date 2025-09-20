"""
UNIFIED FURNITURE SEARCH ENGINE - "THE DREAM"
Revolutionary database that scrapes all furniture vendor sites into one searchable interface
"""
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from playwright.async_api import async_playwright
import re
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection for furniture database
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# COMPREHENSIVE VENDOR CONFIGURATION
VENDOR_SITES = {
    'Four Hands': {
        'base_url': 'https://fourhands.com',
        'search_paths': [
            '/collections/seating',
            '/collections/tables',
            '/collections/lighting',
            '/collections/storage',
            '/collections/bedroom',
            '/collections/dining',
            '/collections/office'
        ],
        'product_selectors': {
            'name': 'h1.product-title, .product-info h1',
            'price': '.price, .product-price, .current-price',
            'image': '.product-gallery img, .product-images img',
            'description': '.product-description, .product-details',
            'sku': '.product-sku, .sku',
            'dimensions': '.dimensions, .product-dimensions',
            'materials': '.materials, .product-materials'
        }
    },
    'Uttermost': {
        'base_url': 'https://uttermost.com',
        'search_paths': [
            '/lighting',
            '/furniture',
            '/mirrors',
            '/wall-art',
            '/accessories',
            '/rugs'
        ],
        'product_selectors': {
            'name': 'h1.product-title, .product-name h1',
            'price': '.price-box .price, .product-price',
            'image': '.product-media img, .featured-image img',
            'description': '.product-description',
            'sku': '.product-sku',
            'dimensions': '.dimensions',
            'materials': '.materials'
        }
    },
    'Bernhardt': {
        'base_url': 'https://bernhardt.com',
        'search_paths': [
            '/furniture/living-room',
            '/furniture/dining-room', 
            '/furniture/bedroom',
            '/furniture/office',
            '/furniture/outdoor'
        ],
        'product_selectors': {
            'name': '.product-info h1, h1.product-title',
            'price': '.pricing .price, .product-pricing',
            'image': '.product-slider img, .product-images img',
            'description': '.product-description',
            'sku': '.product-code, .sku',
            'dimensions': '.specifications .dimensions',
            'materials': '.specifications .materials'
        }
    },
    'Visual Comfort': {
        'base_url': 'https://visualcomfort.com',
        'search_paths': [
            '/lighting/chandeliers',
            '/lighting/pendants',
            '/lighting/table-lamps',
            '/lighting/floor-lamps',
            '/lighting/sconces',
            '/lighting/ceiling'
        ],
        'product_selectors': {
            'name': '.product-header h1, h1.product-title',
            'price': '.pricing .current-price, .product-price',
            'image': '.product-gallery .main img, .zoom-image img',
            'description': '.product-details, .description',
            'sku': '.product-number, .sku',
            'dimensions': '.specifications .size',
            'materials': '.specifications .finish'
        }
    },
    'Loloi Rugs': {
        'base_url': 'https://loloirugs.com',
        'search_paths': [
            '/collections/traditional',
            '/collections/contemporary',
            '/collections/vintage',
            '/collections/outdoor',
            '/collections/pillows'
        ],
        'product_selectors': {
            'name': '.product-info h1, h1.product-title',
            'price': '.price, .product-price',
            'image': '.product-photos img, .featured img',
            'description': '.product-description',
            'sku': '.product-sku',
            'dimensions': '.size-options, .dimensions',
            'materials': '.construction, .materials'
        }
    }
}

class FurnitureDatabase:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.scraped_products = []
        
    async def scrape_all_vendors(self) -> Dict[str, Any]:
        """
        Scrape all vendor sites and populate unified database
        This is the revolutionary function that creates "THE DREAM"
        """
        self.logger.info("🚀 Starting UNIFIED FURNITURE DATABASE scraping...")
        
        results = {
            'total_products': 0,
            'vendors_scraped': 0,
            'new_products': 0,
            'updated_products': 0,
            'errors': []
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for vendor_name, config in VENDOR_SITES.items():
                try:
                    self.logger.info(f"🔍 Scraping {vendor_name}...")
                    vendor_results = await self._scrape_vendor(browser, vendor_name, config)
                    
                    results['total_products'] += vendor_results['products_found']
                    results['vendors_scraped'] += 1
                    
                    self.logger.info(f"✅ {vendor_name}: {vendor_results['products_found']} products scraped")
                    
                except Exception as e:
                    error_msg = f"❌ {vendor_name} scraping failed: {str(e)}"
                    self.logger.error(error_msg)
                    results['errors'].append(error_msg)
            
            await browser.close()
        
        # Save all scraped products to database
        if self.scraped_products:
            save_results = await self._save_to_database(self.scraped_products)
            results['new_products'] = save_results['new_count']
            results['updated_products'] = save_results['updated_count']
        
        self.logger.info(f"🎉 FURNITURE DATABASE COMPLETE: {results['total_products']} products from {results['vendors_scraped']} vendors")
        
        return results
    
    async def _scrape_vendor(self, browser, vendor_name: str, config: Dict) -> Dict[str, Any]:
        """Scrape all products from a specific vendor"""
        page = await browser.new_page()
        products_found = 0
        
        try:
            for search_path in config['search_paths']:
                url = config['base_url'] + search_path
                
                try:
                    await page.goto(url, wait_until='networkidle', timeout=30000)
                    
                    # Get all product links on this category page
                    product_links = await self._extract_product_links(page, config['base_url'])
                    
                    # Scrape each individual product
                    for product_url in product_links[:20]:  # Limit to 20 per category for now
                        try:
                            product_data = await self._scrape_single_product(
                                page, product_url, vendor_name, config['product_selectors']
                            )
                            
                            if product_data:
                                self.scraped_products.append(product_data)
                                products_found += 1
                                
                        except Exception as e:
                            self.logger.warning(f"Failed to scrape product {product_url}: {str(e)}")
                            continue
                    
                except Exception as e:
                    self.logger.warning(f"Failed to scrape category {search_path}: {str(e)}")
                    continue
        
        finally:
            await page.close()
        
        return {'products_found': products_found}
    
    async def _extract_product_links(self, page, base_url: str) -> List[str]:
        """Extract all product links from a category page"""
        try:
            # Common product link selectors across furniture sites
            link_selectors = [
                'a[href*="/products/"]',
                'a[href*="/product/"]', 
                'a[href*="/items/"]',
                '.product-item a',
                '.product-card a',
                '.product-grid a'
            ]
            
            product_links = []
            
            for selector in link_selectors:
                elements = await page.query_selector_all(selector)
                for element in elements:
                    href = await element.get_attribute('href')
                    if href:
                        # Make absolute URL
                        if href.startswith('/'):
                            href = base_url + href
                        elif not href.startswith('http'):
                            continue
                        
                        if href not in product_links:
                            product_links.append(href)
            
            return product_links[:50]  # Limit for performance
            
        except Exception as e:
            self.logger.error(f"Failed to extract product links: {str(e)}")
            return []
    
    async def _scrape_single_product(self, page, product_url: str, vendor: str, selectors: Dict) -> Optional[Dict]:
        """Scrape detailed information from a single product page"""
        try:
            await page.goto(product_url, wait_until='networkidle', timeout=20000)
            
            product_data = {
                'vendor': vendor,
                'url': product_url,
                'scraped_at': datetime.utcnow(),
                'name': '',
                'price': '',
                'image_url': '',
                'description': '',
                'sku': '',
                'dimensions': '',
                'materials': '',
                'category': self._extract_category_from_url(product_url),
                'availability': 'Available'  # Default
            }
            
            # Extract each field using the vendor-specific selectors
            for field, selector in selectors.items():
                try:
                    element = await page.query_selector(selector)
                    if element:
                        if field == 'image':
                            src = await element.get_attribute('src')
                            if src:
                                # Make absolute URL
                                if src.startswith('//'):
                                    src = 'https:' + src
                                elif src.startswith('/'):
                                    src = urljoin(product_url, src)
                                product_data['image_url'] = src
                        else:
                            text = await element.text_content()
                            if text and text.strip():
                                if field == 'price':
                                    # Extract price with regex
                                    price_match = re.search(r'\$[\d,]+\.?\d*', text)
                                    if price_match:
                                        product_data['price'] = price_match.group().replace(',', '')
                                else:
                                    product_data[field] = text.strip()[:500]  # Limit length
                                    
                except Exception as e:
                    self.logger.debug(f"Failed to extract {field}: {str(e)}")
                    continue
            
            # Only return if we got essential data
            if product_data['name'] and (product_data['price'] or product_data['image_url']):
                return product_data
            
            return None
            
        except Exception as e:
            self.logger.error(f"Failed to scrape product {product_url}: {str(e)}")
            return None
    
    def _extract_category_from_url(self, url: str) -> str:
        """Extract product category from URL path"""
        try:
            path = urlparse(url).path.lower()
            
            category_mapping = {
                'seating': 'Seating',
                'chairs': 'Seating', 
                'sofas': 'Seating',
                'tables': 'Tables',
                'dining': 'Dining Room',
                'bedroom': 'Bedroom',
                'lighting': 'Lighting',
                'lamps': 'Lighting',
                'storage': 'Storage',
                'mirrors': 'Mirrors & Wall Art',
                'wall-art': 'Mirrors & Wall Art',
                'rugs': 'Rugs & Textiles',
                'accessories': 'Accessories',
                'outdoor': 'Outdoor'
            }
            
            for key, category in category_mapping.items():
                if key in path:
                    return category
            
            return 'General'
            
        except Exception:
            return 'General'
    
    async def _save_to_database(self, products: List[Dict]) -> Dict[str, int]:
        """Save scraped products to MongoDB with deduplication"""
        new_count = 0
        updated_count = 0
        
        try:
            for product in products:
                # Create unique identifier based on vendor + name + sku
                unique_id = f"{product['vendor']}_{product['name']}_{product['sku']}".lower()
                unique_id = re.sub(r'[^a-z0-9_]', '', unique_id)
                
                # Check if product already exists
                existing = await db.furniture_products.find_one({'unique_id': unique_id})
                
                product['unique_id'] = unique_id
                product['last_updated'] = datetime.utcnow()
                
                if existing:
                    # Update existing product
                    await db.furniture_products.update_one(
                        {'unique_id': unique_id},
                        {'$set': product}
                    )
                    updated_count += 1
                else:
                    # Insert new product
                    await db.furniture_products.insert_one(product)
                    new_count += 1
            
            self.logger.info(f"💾 Database updated: {new_count} new, {updated_count} updated")
            
        except Exception as e:
            self.logger.error(f"Database save failed: {str(e)}")
        
        return {'new_count': new_count, 'updated_count': updated_count}
    
    async def search_furniture(self, query: str, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Search the unified furniture database - THIS IS THE DREAM!
        No more 1000 tabs - search ALL vendors in one place!
        """
        try:
            # Build search query
            search_conditions = []
            
            if query:
                search_conditions.append({
                    '$or': [
                        {'name': {'$regex': query, '$options': 'i'}},
                        {'description': {'$regex': query, '$options': 'i'}},
                        {'category': {'$regex': query, '$options': 'i'}}
                    ]
                })
            
            # Apply filters
            if filters:
                if filters.get('vendor'):
                    search_conditions.append({'vendor': filters['vendor']})
                
                if filters.get('category'):
                    search_conditions.append({'category': filters['category']})
                
                if filters.get('min_price'):
                    # Convert price string to number for comparison
                    search_conditions.append({'price': {'$regex': f'\\$[{filters["min_price"][0]}\\d-9]'}})
                
                if filters.get('max_price'):
                    search_conditions.append({'price': {'$regex': f'\\$[0-{filters["max_price"][0]}\\d]'}})
            
            # Combine all conditions
            if search_conditions:
                query_doc = {'$and': search_conditions}
            else:
                query_doc = {}
            
            # Execute search
            cursor = db.furniture_products.find(query_doc).sort('last_updated', -1).limit(100)
            results = await cursor.to_list(length=100)
            
            return results
            
        except Exception as e:
            self.logger.error(f"Furniture search failed: {str(e)}")
            return []

# Global instance
furniture_db = FurnitureDatabase()

async def scrape_all_furniture_vendors():
    """Convenience function to scrape all vendors"""
    return await furniture_db.scrape_all_vendors()

async def search_unified_furniture(query: str, filters: Optional[Dict] = None):
    """Convenience function to search furniture database"""
    return await furniture_db.search_furniture(query, filters)