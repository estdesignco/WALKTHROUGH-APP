import os
import asyncio
import aiohttp
import base64
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
from cryptography.fernet import Fernet
import json
import re
from bs4 import BeautifulSoup
import logging

router = APIRouter(prefix="/api/search", tags=["unified-search"])

# Database connection (reuse from main server)
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "interior_design_db")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
products_collection = db.products
vendor_credentials_collection = db.vendor_credentials

# Encryption for credentials
def get_encryption_key():
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        # Generate and save a new key (in production, store this securely)
        key = Fernet.generate_key().decode()
        os.environ["ENCRYPTION_KEY"] = key
    return key.encode()

fernet = Fernet(get_encryption_key())

# Pydantic models
class VendorCredentials(BaseModel):
    vendor_name: str
    username: str
    password: str
    additional_data: Optional[Dict[str, Any]] = {}

class ProductSearch(BaseModel):
    query: Optional[str] = None
    vendor: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    room_type: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    size: Optional[str] = None

class Product(BaseModel):
    id: Optional[str] = None
    name: str
    vendor: str
    vendor_sku: str
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    category: Optional[str] = None
    room_type: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    size: Optional[str] = None
    vendor_url: Optional[str] = None
    retail_urls: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Helper functions
def serialize_doc(doc):
    if doc is None:
        return None
    doc['id'] = str(doc['_id'])
    del doc['_id']
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# Vendor-specific scrapers
class FourHandsScraper:
    def __init__(self, credentials: Dict[str, str]):
        self.credentials = credentials
        self.base_url = "https://fourhands.com"
        
    async def login_and_scrape(self, session: aiohttp.ClientSession, max_products: int = 50):
        """Login to Four Hands and scrape products"""
        try:
            # Login logic here (placeholder)
            products = []
            
            # For now, return sample data structure
            sample_product = {
                "name": "Four Hands Sample Product",
                "vendor": "Four Hands",
                "vendor_sku": "FH-SAMPLE-001",
                "price": 299.99,
                "description": "Sample Four Hands product for testing",
                "category": "Seating",
                "room_type": "Living Room",
                "style": "Modern",
                "color": "Natural",
                "material": "Wood",
                "size": "32\" x 32\" x 30\"",
                "vendor_url": f"{self.base_url}/sample-product",
                "retail_urls": ["https://perigold.com/sample", "https://lumens.com/sample"]
            }
            products.append(sample_product)
            
            return products[:max_products]
        except Exception as e:
            logging.error(f"Four Hands scraping error: {e}")
            return []

class HudsonValleyScraper:
    def __init__(self, credentials: Dict[str, str]):
        self.credentials = credentials
        self.base_url = "https://www.hvlgroup.com"
        
    async def login_and_scrape(self, session: aiohttp.ClientSession, max_products: int = 50):
        """Login to Hudson Valley and scrape products"""
        try:
            products = []
            
            # Sample Hudson Valley product
            sample_product = {
                "name": "Hudson Valley Sample Light",
                "vendor": "Hudson Valley Lighting",
                "vendor_sku": "HVL-SAMPLE-001",
                "price": 459.99,
                "description": "Sample Hudson Valley lighting fixture for testing",
                "category": "Lighting",
                "room_type": "Dining Room",
                "style": "Traditional",
                "color": "Brass",
                "material": "Metal",
                "size": "24\" x 12\"",
                "vendor_url": f"{self.base_url}/sample-light",
                "retail_urls": ["https://danielhouse.club/sample"]
            }
            products.append(sample_product)
            
            return products[:max_products]
        except Exception as e:
            logging.error(f"Hudson Valley scraping error: {e}")
            return []

# Routes
@router.post("/vendor-credentials")
async def save_vendor_credentials(credentials: VendorCredentials):
    """Securely save vendor login credentials"""
    try:
        # Encrypt sensitive data
        encrypted_password = fernet.encrypt(credentials.password.encode()).decode()
        
        credential_doc = {
            "vendor_name": credentials.vendor_name,
            "username": credentials.username,
            "password": encrypted_password,
            "additional_data": credentials.additional_data,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Upsert credentials
        await vendor_credentials_collection.replace_one(
            {"vendor_name": credentials.vendor_name},
            credential_doc,
            upsert=True
        )
        
        return {"message": f"Credentials saved for {credentials.vendor_name}", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save credentials: {str(e)}")

@router.get("/vendor-credentials")
async def list_vendor_credentials():
    """List saved vendor names (without sensitive data)"""
    try:
        credentials = await vendor_credentials_collection.find(
            {}, {"vendor_name": 1, "username": 1, "created_at": 1}
        ).to_list(length=None)
        
        return serialize_docs(credentials)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list credentials: {str(e)}")

@router.post("/scrape-products")
async def scrape_products(background_tasks: BackgroundTasks):
    """Scrape products from all configured vendors"""
    try:
        # Get all vendor credentials
        credentials_cursor = vendor_credentials_collection.find({})
        all_credentials = await credentials_cursor.to_list(length=None)
        
        if not all_credentials:
            raise HTTPException(status_code=400, detail="No vendor credentials configured")
        
        # Start scraping in background
        background_tasks.add_task(perform_scraping, all_credentials)
        
        return {"message": "Product scraping started", "vendors": len(all_credentials)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scraping: {str(e)}")

async def perform_scraping(credentials_list):
    """Background task to scrape products from all vendors"""
    try:
        async with aiohttp.ClientSession() as session:
            all_products = []
            
            for cred_doc in credentials_list:
                vendor_name = cred_doc["vendor_name"]
                
                # Decrypt password
                encrypted_password = cred_doc["password"]
                decrypted_password = fernet.decrypt(encrypted_password.encode()).decode()
                
                credentials = {
                    "username": cred_doc["username"],
                    "password": decrypted_password,
                    **cred_doc.get("additional_data", {})
                }
                
                # Initialize appropriate scraper
                if vendor_name.lower() == "four hands":
                    scraper = FourHandsScraper(credentials)
                    products = await scraper.login_and_scrape(session, max_products=100)
                elif vendor_name.lower() == "hudson valley lighting":
                    scraper = HudsonValleyScraper(credentials)
                    products = await scraper.login_and_scrape(session, max_products=100)
                else:
                    logging.warning(f"No scraper available for vendor: {vendor_name}")
                    continue
                
                # Store products in database
                for product_data in products:
                    product_doc = {
                        **product_data,
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    
                    # Upsert product
                    await products_collection.replace_one(
                        {"vendor": product_data["vendor"], "vendor_sku": product_data["vendor_sku"]},
                        product_doc,
                        upsert=True
                    )
                
                all_products.extend(products)
                
        logging.info(f"Scraping completed. Total products: {len(all_products)}")
        
    except Exception as e:
        logging.error(f"Scraping error: {e}")

@router.post("/search")
async def search_products(search_params: ProductSearch):
    """Search products with advanced filters"""
    try:
        # Build MongoDB query
        query = {}
        
        if search_params.query:
            query["$or"] = [
                {"name": {"$regex": search_params.query, "$options": "i"}},
                {"description": {"$regex": search_params.query, "$options": "i"}},
                {"category": {"$regex": search_params.query, "$options": "i"}}
            ]
        
        if search_params.vendor:
            query["vendor"] = {"$regex": search_params.vendor, "$options": "i"}
        
        if search_params.category:
            query["category"] = {"$regex": search_params.category, "$options": "i"}
        
        if search_params.room_type:
            query["room_type"] = {"$regex": search_params.room_type, "$options": "i"}
        
        if search_params.style:
            query["style"] = {"$regex": search_params.style, "$options": "i"}
        
        if search_params.color:
            query["color"] = {"$regex": search_params.color, "$options": "i"}
        
        if search_params.material:
            query["material"] = {"$regex": search_params.material, "$options": "i"}
        
        if search_params.size:
            query["size"] = {"$regex": search_params.size, "$options": "i"}
        
        if search_params.min_price is not None or search_params.max_price is not None:
            price_query = {}
            if search_params.min_price is not None:
                price_query["$gte"] = search_params.min_price
            if search_params.max_price is not None:
                price_query["$lte"] = search_params.max_price
            query["price"] = price_query
        
        # Execute search
        cursor = products_collection.find(query).sort("updated_at", -1).limit(100)
        products = await cursor.to_list(length=None)
        
        return {
            "products": serialize_docs(products),
            "total": len(products),
            "query": query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/products")
async def get_all_products():
    """Get all products with pagination"""
    try:
        cursor = products_collection.find({}).sort("updated_at", -1).limit(50)
        products = await cursor.to_list(length=None)
        
        return {
            "products": serialize_docs(products),
            "total": len(products)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get products: {str(e)}")

@router.get("/vendors")
async def get_vendors():
    """Get list of available vendors"""
    return {
        "supported_vendors": [
            {"name": "Four Hands", "id": "four_hands"},
            {"name": "Hudson Valley Lighting", "id": "hudson_valley_lighting"}
        ]
    }

@router.get("/filters")
async def get_filter_options():
    """Get available filter options from products"""
    try:
        # Get distinct values for filters
        categories = await products_collection.distinct("category")
        room_types = await products_collection.distinct("room_type")
        styles = await products_collection.distinct("style")
        colors = await products_collection.distinct("color")
        materials = await products_collection.distinct("material")
        vendors = await products_collection.distinct("vendor")
        
        return {
            "categories": [cat for cat in categories if cat],
            "room_types": [rt for rt in room_types if rt],
            "styles": [style for style in styles if style],
            "colors": [color for color in colors if color],
            "materials": [mat for mat in materials if mat],
            "vendors": [vendor for vendor in vendors if vendor]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get filters: {str(e)}")

@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product"""
    try:
        result = await products_collection.delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")