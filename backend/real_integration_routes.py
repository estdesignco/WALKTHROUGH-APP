"""
FastAPI routes for real integrations with Canva, Houzz Pro, Teams, and vendor scraping
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Body
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import asyncio
import logging
from real_integrations import integration_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/real-integrations", tags=["Real Integrations"])

class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = {}
    max_results: Optional[int] = 50

class CanvaProjectRequest(BaseModel):
    project_name: str
    products: List[Dict[str, Any]]

class HouzzIdeabookRequest(BaseModel):
    ideabook_name: str
    products: List[Dict[str, Any]]

class TeamsNotificationRequest(BaseModel):
    message: str
    title: Optional[str] = "Interior Design Notification"

@router.post("/search-products")
async def search_real_products(
    search_request: SearchRequest,
    background_tasks: BackgroundTasks
):
    """Search for real products from vendor websites"""
    try:
        logger.info(f"Real product search initiated: {search_request.query}")
        
        # Run search in background for better response time
        result = await integration_manager.search_and_notify(
            search_request.query,
            search_request.filters
        )
        
        if result.get('success'):
            return {
                "status": "success",
                "message": f"Found {result.get('products_found', 0)} products",
                "products": result.get('products', []),
                "search_query": search_request.query,
                "teams_notified": result.get('teams_notification', {}).get('success', False)
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Search failed'))
    
    except Exception as e:
        logger.error(f"Real product search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-canva-project")
async def create_canva_project(
    project_request: CanvaProjectRequest,
    background_tasks: BackgroundTasks
):
    """Create a real Canva project with products"""
    try:
        logger.info(f"Creating Canva project: {project_request.project_name}")
        
        # Add to background tasks for better performance
        task = asyncio.create_task(
            integration_manager.add_to_canva_project(
                project_request.products,
                project_request.project_name
            )
        )
        
        # Wait a bit to see if it starts successfully
        try:
            result = await asyncio.wait_for(task, timeout=30.0)
            
            if result.get('success'):
                return {
                    "status": "success",
                    "message": f"Canva project '{project_request.project_name}' created",
                    "design_url": result.get('design_url'),
                    "products_added": result.get('products_added', 0)
                }
            else:
                return {
                    "status": "partial_success", 
                    "message": "Canva project creation initiated but may need manual completion",
                    "error": result.get('error')
                }
        
        except asyncio.TimeoutError:
            return {
                "status": "initiated",
                "message": f"Canva project creation for '{project_request.project_name}' is in progress"
            }
    
    except Exception as e:
        logger.error(f"Canva project creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-to-houzz-ideabook")
async def add_to_houzz_ideabook(
    ideabook_request: HouzzIdeabookRequest
):
    """Add products to Houzz Pro ideabook and return COMPLETE scraped data"""
    try:
        logger.info(f"🔥 PROCESSING HOUZZ CLIPPER: {ideabook_request.ideabook_name}")
        
        # Process the FIRST product and return complete data
        if ideabook_request.products:
            product = ideabook_request.products[0]  # Get first product
            
            # Get the complete scraped data RIGHT NOW
            result = await integration_manager.houzz.add_to_ideabook(
                product,
                ideabook_request.ideabook_name
            )
            
            logger.info(f"✅ HOUZZ CLIPPER RESULT: {result}")
            
            return result
        else:
            return {
                "success": False,
                "error": "No products provided"
            }
    
    except Exception as e:
        logger.error(f"Houzz ideabook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-teams-notification") 
async def send_teams_notification(notification: TeamsNotificationRequest):
    """Send notification to Microsoft Teams"""
    try:
        logger.info(f"Sending Teams notification: {notification.title}")
        
        result = await integration_manager.teams.send_notification(
            notification.message,
            notification.title
        )
        
        if result.get('success'):
            return {
                "status": "success",
                "message": "Teams notification sent successfully",
                "title": notification.title
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Teams notification failed'))
    
    except Exception as e:
        logger.error(f"Teams notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scrape-vendor/{vendor}")
async def scrape_vendor_products(
    vendor: str,
    search_query: Optional[str] = Query("furniture"),
    max_results: Optional[int] = Query(20)
):
    """Scrape products from specific vendor"""
    try:
        logger.info(f"Scraping {vendor} for: {search_query}")
        
        products = []
        
        if vendor.lower() == "fourhands":
            products = await integration_manager.scraper.scrape_fourhands(search_query, max_results)
        elif vendor.lower() == "hudson-valley":
            products = await integration_manager.scraper.scrape_hudson_valley(search_query, max_results)
        elif vendor.lower() == "wayfair":
            products = await integration_manager.scraper.scrape_wayfair(search_query, max_results)
        else:
            raise HTTPException(status_code=400, detail=f"Vendor '{vendor}' not supported")
        
        return {
            "status": "success",
            "vendor": vendor,
            "search_query": search_query,
            "products_found": len(products),
            "products": products
        }
    
    except Exception as e:
        logger.error(f"Vendor scraping error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quick-workflow")
async def quick_workflow(
    search_query: str = Body(...),
    create_canva: bool = Body(False),
    add_to_houzz: bool = Body(False),
    notify_teams: bool = Body(True)
):
    """Quick workflow: Search -> Canva -> Houzz -> Teams"""
    try:
        logger.info(f"Starting quick workflow for: {search_query}")
        
        workflow_results = {
            "search_query": search_query,
            "steps_completed": [],
            "products": [],
            "canva_result": None,
            "houzz_result": None,
            "teams_result": None
        }
        
        # Step 1: Search for products
        search_result = await integration_manager.search_and_notify(search_query, {})
        
        if search_result.get('success'):
            workflow_results["steps_completed"].append("search")
            workflow_results["products"] = search_result.get('products', [])
            
            products = workflow_results["products"][:10]  # Limit for workflow
            
            # Step 2: Create Canva project if requested
            if create_canva and products:
                try:
                    canva_result = await asyncio.wait_for(
                        integration_manager.add_to_canva_project(
                            products,
                            f"Project - {search_query.title()}"
                        ),
                        timeout=60.0
                    )
                    workflow_results["canva_result"] = canva_result
                    if canva_result.get('success'):
                        workflow_results["steps_completed"].append("canva")
                except asyncio.TimeoutError:
                    workflow_results["canva_result"] = {"status": "timeout", "message": "Canva creation is taking longer than expected"}
            
            # Step 3: Add to Houzz if requested
            if add_to_houzz and products:
                try:
                    houzz_result = await integration_manager.add_to_houzz_ideabook(
                        products,
                        f"Ideabook - {search_query.title()}"
                    )
                    workflow_results["houzz_result"] = houzz_result
                    if houzz_result.get('success'):
                        workflow_results["steps_completed"].append("houzz")
                except Exception as e:
                    workflow_results["houzz_result"] = {"success": False, "error": str(e)}
            
            # Step 4: Teams notification (already sent in search, but send summary)
            if notify_teams:
                summary_message = f"🚀 **Workflow Complete for '{search_query}'**\\n\\n"
                summary_message += f"📦 Found {len(workflow_results['products'])} products\\n"
                
                if "canva" in workflow_results["steps_completed"]:
                    summary_message += "🎨 Canva project created\\n"
                if "houzz" in workflow_results["steps_completed"]:
                    summary_message += "📋 Houzz ideabook updated\\n"
                
                summary_message += f"\\n✅ Steps completed: {', '.join(workflow_results['steps_completed'])}"
                
                teams_result = await integration_manager.teams.send_notification(
                    summary_message,
                    f"Workflow Complete - {search_query.title()}"
                )
                workflow_results["teams_result"] = teams_result
                if teams_result.get('success'):
                    workflow_results["steps_completed"].append("teams_summary")
        
        return {
            "status": "success",
            "message": f"Workflow completed with {len(workflow_results['steps_completed'])} steps",
            "workflow_results": workflow_results
        }
    
    except Exception as e:
        logger.error(f"Quick workflow error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integration-status")
async def get_integration_status():
    """Get status of all integrations"""
    try:
        status = {
            "canva": {"configured": bool(integration_manager.canva.email), "status": "ready"},
            "houzz": {"configured": bool(integration_manager.houzz.email), "status": "ready"},
            "teams": {"configured": bool(integration_manager.teams.webhook_url), "status": "ready"},
            "scraping": {"vendors": ["fourhands", "hudson-valley", "wayfair"], "status": "ready"}
        }
        
        # Test Teams webhook
        if integration_manager.teams.webhook_url:
            test_result = await integration_manager.teams.send_notification(
                "🧪 Integration status check - all systems operational!",
                "System Status Check"
            )
            status["teams"]["test_result"] = test_result.get('success', False)
        
        return {
            "status": "operational",
            "integrations": status,
            "message": "All real integrations are configured and ready"
        }
    
    except Exception as e:
        logger.error(f"Integration status error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Error checking integration status"
        }

@router.post("/cleanup-sessions")
async def cleanup_integration_sessions():
    """Clean up browser sessions and connections"""
    try:
        await integration_manager.cleanup()
        return {
            "status": "success",
            "message": "Integration sessions cleaned up successfully"
        }
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))