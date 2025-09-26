import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
import json
from datetime import datetime, timezone
from enhanced_vendor_integration import VendorIntegrationManager, CanvaIntegration, HouzzIntegration, ImageProcessor
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/api/real-time", tags=["real-time-integration"])

# Database connection
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "interior_design_db")
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
products_collection = db.products
integration_logs_collection = db.integration_logs
canva_projects_collection = db.canva_projects
houzz_projects_collection = db.houzz_projects

class RealTimeWorkflow:
    def __init__(self):
        self.vendor_manager = VendorIntegrationManager()
        self.canva = CanvaIntegration({'email': 'EstDesignCo@gmail.com'})
        self.houzz = HouzzIntegration({'username': 'Establisheddesignco.com'})
        self.image_processor = ImageProcessor()
    
    async def process_product_assignment(self, product_data, assignments):
        """Process product assignment to Canva and/or Houzz"""
        results = []
        
        # Process Canva assignment
        if 'canva' in assignments:
            canva_result = await self.assign_to_canva(product_data, assignments['canva'])
            results.append(canva_result)
        
        # Process Houzz assignment
        if 'houzz' in assignments:
            houzz_result = await self.assign_to_houzz(product_data, assignments['houzz'])
            results.append(houzz_result)
        
        # Log the integration
        await self.log_integration(product_data, assignments, results)
        
        return results
    
    async def assign_to_canva(self, product_data, canva_assignment):
        """Assign product to Canva project board"""
        try:
            # Create board if it doesn't exist
            board_result = await self.canva.create_project_board(
                canva_assignment['project_name'],
                canva_assignment['board_name']
            )
            
            if board_result['success']:
                # Download and process image
                if product_data.get('image_url'):
                    image_base64 = await self.image_processor.download_and_convert_image(
                        product_data['image_url']
                    )
                    
                    if image_base64:
                        # Enhance image for presentation
                        enhanced_image = self.image_processor.enhance_image_for_presentation(image_base64)
                        product_data['enhanced_image'] = enhanced_image
                
                # Add product to board
                add_result = await self.canva.add_product_to_board(
                    board_result['board_id'],
                    product_data
                )
                
                # Store in database
                canva_project = {
                    'project_name': canva_assignment['project_name'],
                    'board_name': canva_assignment['board_name'],
                    'board_url': board_result['board_url'],
                    'product_id': product_data['id'],
                    'product_name': product_data['name'],
                    'created_at': datetime.now(timezone.utc)
                }
                await canva_projects_collection.insert_one(canva_project)
                
                return {
                    'platform': 'canva',
                    'success': True,
                    'board_url': board_result['board_url'],
                    'message': f"Added {product_data['name']} to Canva board"
                }
        
        except Exception as e:
            return {
                'platform': 'canva',
                'success': False,
                'error': str(e)
            }
    
    async def assign_to_houzz(self, product_data, houzz_assignment):
        """Assign product to Houzz Pro project"""
        try:
            houzz_result = await self.houzz.add_to_project(houzz_assignment, product_data)
            
            if houzz_result['success']:
                # Store in database
                houzz_project = {
                    'project_name': houzz_assignment['project_name'],
                    'room': houzz_assignment['room'],
                    'product_id': product_data['id'],
                    'product_name': product_data['name'],
                    'cost': houzz_assignment['cost'],
                    'markup': houzz_assignment['markup'],
                    'final_price': houzz_assignment['final_price'],
                    'add_to_selection_board': houzz_assignment.get('add_to_selection_board', False),
                    'created_at': datetime.now(timezone.utc)
                }
                await houzz_projects_collection.insert_one(houzz_project)
            
            return {
                'platform': 'houzz',
                'success': houzz_result['success'],
                'message': houzz_result.get('message', 'Added to Houzz Pro')
            }
            
        except Exception as e:
            return {
                'platform': 'houzz',
                'success': False,
                'error': str(e)
            }
    
    async def log_integration(self, product_data, assignments, results):
        """Log integration activity for tracking"""
        log_entry = {
            'product_id': product_data['id'],
            'product_name': product_data['name'],
            'assignments': assignments,
            'results': results,
            'timestamp': datetime.now(timezone.utc)
        }
        await integration_logs_collection.insert_one(log_entry)

# Initialize workflow manager
workflow_manager = RealTimeWorkflow()

# API Routes
@router.post("/assign-product")
async def assign_product_to_platforms(
    product_id: str,
    assignments: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Assign a product to Canva and/or Houzz platforms"""
    try:
        # Get product data
        product = await products_collection.find_one({"_id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Process assignment in background
        background_tasks.add_task(
            workflow_manager.process_product_assignment,
            product,
            assignments
        )
        
        return {
            'message': 'Product assignment started',
            'product_name': product['name'],
            'platforms': list(assignments.keys())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(e)}")

@router.get("/integration-status/{product_id}")
async def get_integration_status(product_id: str):
    """Get integration status for a product"""
    try:
        # Get Canva assignments
        canva_assignments = await canva_projects_collection.find(
            {"product_id": product_id}
        ).to_list(length=None)
        
        # Get Houzz assignments
        houzz_assignments = await houzz_projects_collection.find(
            {"product_id": product_id}
        ).to_list(length=None)
        
        # Get integration logs
        logs = await integration_logs_collection.find(
            {"product_id": product_id}
        ).sort("timestamp", -1).limit(10).to_list(length=None)
        
        return {
            'product_id': product_id,
            'canva_assignments': len(canva_assignments),
            'houzz_assignments': len(houzz_assignments),
            'canva_projects': [
                {
                    'project': assign['project_name'],
                    'board': assign['board_name'],
                    'url': assign['board_url']
                } for assign in canva_assignments
            ],
            'houzz_projects': [
                {
                    'project': assign['project_name'],
                    'room': assign['room'],
                    'price': assign['final_price']
                } for assign in houzz_assignments
            ],
            'recent_logs': logs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.post("/bulk-scrape")
async def start_bulk_vendor_scraping(background_tasks: BackgroundTasks):
    """Start bulk scraping from all configured vendors"""
    try:
        # Get all vendor credentials from database
        from unified_search_routes import vendor_credentials_collection, fernet
        
        credentials_cursor = vendor_credentials_collection.find({})
        all_credentials = await credentials_cursor.to_list(length=None)
        
        if not all_credentials:
            raise HTTPException(status_code=400, detail="No vendor credentials found")
        
        # Decrypt and organize credentials
        credentials_dict = {}
        for cred in all_credentials:
            vendor_name = cred['vendor_name'].lower().replace(' ', '_').replace('lighting', '').strip()
            if 'four_hands' in vendor_name or 'four hands' in cred['vendor_name'].lower():
                key = 'four_hands'
            elif 'hudson_valley' in vendor_name or 'hudson valley' in cred['vendor_name'].lower():
                key = 'hudson_valley'
            else:
                continue  # Skip unknown vendors for now
            
            credentials_dict[key] = {
                'username': cred['username'],
                'password': fernet.decrypt(cred['password'].encode()).decode()
            }
        
        # Start scraping in background
        background_tasks.add_task(perform_bulk_scraping, credentials_dict)
        
        return {
            'message': 'Bulk scraping started',
            'vendors': list(credentials_dict.keys()),
            'estimated_time': '10-15 minutes'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

async def perform_bulk_scraping(credentials_dict):
    """Background task for bulk vendor scraping"""
    try:
        vendor_manager = VendorIntegrationManager()
        all_products = await vendor_manager.scrape_all_vendors(credentials_dict)
        
        # Process and store products
        for product_data in all_products:
            # Download and store images as base64
            if product_data.get('image_url'):
                image_base64 = await ImageProcessor.download_and_convert_image(
                    product_data['image_url']
                )
                if image_base64:
                    product_data['image_base64'] = image_base64
            
            # Add additional metadata
            product_data.update({
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'status': 'active',
                'source': 'automated_scraping'
            })
            
            # Upsert product
            await products_collection.replace_one(
                {
                    "vendor": product_data["vendor"], 
                    "vendor_sku": product_data["vendor_sku"]
                },
                product_data,
                upsert=True
            )
        
        print(f"✅ Bulk scraping completed. Processed {len(all_products)} products.")
        
    except Exception as e:
        print(f"❌ Bulk scraping error: {e}")

@router.get("/dashboard-stats")
async def get_dashboard_statistics():
    """Get statistics for the dashboard"""
    try:
        # Product statistics
        total_products = await products_collection.count_documents({})
        vendors_count = len(await products_collection.distinct("vendor"))
        
        # Integration statistics
        total_canva_assignments = await canva_projects_collection.count_documents({})
        total_houzz_assignments = await houzz_projects_collection.count_documents({})
        
        # Recent activity
        recent_logs = await integration_logs_collection.find({}).sort(
            "timestamp", -1
        ).limit(5).to_list(length=None)
        
        return {
            'products': {
                'total': total_products,
                'vendors': vendors_count
            },
            'integrations': {
                'canva_assignments': total_canva_assignments,
                'houzz_assignments': total_houzz_assignments
            },
            'recent_activity': recent_logs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")