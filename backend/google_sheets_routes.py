"""
Google Sheets Import API Routes
FastAPI routes for importing client questionnaires from Google Sheets
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any, Optional
import logging
from google_sheets_importer import GoogleSheetsImporter
from database import get_database

router = APIRouter(prefix="/api/google-sheets", tags=["Google Sheets Import"])

class GoogleSheetsImportRequest(BaseModel):
    url: str
    start_row: Optional[int] = 1
    create_projects: Optional[bool] = True
    project_prefix: Optional[str] = ""

class ImportPreviewResponse(BaseModel):
    success: bool
    message: str
    total_rows: int
    sample_projects: List[Dict[str, Any]]
    column_mappings: Dict[str, Any]
    errors: List[str]

class ImportExecuteResponse(BaseModel):
    success: bool
    message: str
    projects_created: int
    project_ids: List[str]
    errors: List[str]

# Initialize importer
importer = GoogleSheetsImporter()

@router.get("/mapping-info")
async def get_mapping_info():
    """Get information about supported column mappings"""
    return importer.create_sample_mapping_info()

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(request: GoogleSheetsImportRequest):
    """Preview what will be imported from Google Sheets without creating projects"""
    try:
        # Import data from sheet
        result = importer.import_sheet_data(request.url, request.start_row)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
        
        # Create preview response with sample data
        sample_projects = result['projects_data'][:5]  # First 5 projects for preview
        
        # Get column mapping info
        mapping_info = importer.create_sample_mapping_info()
        
        return ImportPreviewResponse(
            success=True,
            message=f"Found {result['projects_created']} client questionnaires ready for import",
            total_rows=result['projects_created'],
            sample_projects=sample_projects,
            column_mappings=mapping_info,
            errors=result['errors']
        )
        
    except Exception as e:
        logging.error(f"Preview import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import preview failed: {str(e)}")

@router.post("/execute", response_model=ImportExecuteResponse)
async def execute_import(request: GoogleSheetsImportRequest, background_tasks: BackgroundTasks):
    """Execute the Google Sheets import and create projects"""
    try:
        # Import data from sheet
        result = importer.import_sheet_data(request.url, request.start_row)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
        
        if not request.create_projects:
            return ImportExecuteResponse(
                success=True,
                message="Preview only - no projects created",
                projects_created=0,
                project_ids=[],
                errors=result['errors']
            )
        
        # Create projects in database
        db = get_database()
        projects_collection = db.projects
        rooms_collection = db.rooms
        items_collection = db.items
        
        created_project_ids = []
        creation_errors = []
        
        for project_data in result['projects_data']:
            try:
                # Add prefix if specified
                if request.project_prefix:
                    project_data['name'] = f"{request.project_prefix} {project_data['name']}"
                
                # Insert project into database
                project_result = projects_collection.insert_one(project_data)
                project_id = str(project_result.inserted_id)
                project_data['id'] = project_id
                
                created_project_ids.append(project_id)
                
                # Create rooms if specified in questionnaire
                if project_data.get('rooms_involved'):
                    for room_name in project_data['rooms_involved']:
                        room_data = {
                            'project_id': project_id,
                            'name': room_name.strip(),
                            'description': f"Imported from questionnaire",
                            'created_at': project_data.get('created_at'),
                            'source': 'Google Sheets Import'
                        }
                        
                        try:
                            rooms_collection.insert_one(room_data)
                        except Exception as room_error:
                            creation_errors.append(f"Failed to create room '{room_name}': {str(room_error)}")
                
            except Exception as project_error:
                client_name = project_data.get('client_info', {}).get('full_name', 'Unknown')
                creation_errors.append(f"Failed to create project for '{client_name}': {str(project_error)}")
        
        return ImportExecuteResponse(
            success=True,
            message=f"Successfully created {len(created_project_ids)} projects from Google Sheets questionnaires",
            projects_created=len(created_project_ids),
            project_ids=created_project_ids,
            errors=result['errors'] + creation_errors
        )
        
    except Exception as e:
        logging.error(f"Execute import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import execution failed: {str(e)}")

@router.get("/test-url/{path:path}")
async def test_sheet_url(path: str):
    """Test if a Google Sheets URL is accessible"""
    try:
        # Reconstruct the URL
        url = f"https://docs.google.com/spreadsheets/d/{path}"
        
        sheet_id = importer.extract_sheet_id(url)
        if not sheet_id:
            return {"success": False, "message": "Invalid Google Sheets URL format"}
        
        # Try to download a small sample
        df = importer.download_sheet_data(sheet_id)
        if df is None:
            return {"success": False, "message": "Cannot access sheet - check sharing permissions"}
        
        return {
            "success": True,
            "message": "Sheet is accessible",
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns)[:10]  # First 10 column names
        }
        
    except Exception as e:
        return {"success": False, "message": f"Error testing URL: {str(e)}"}

@router.delete("/clear-imported")
async def clear_imported_projects():
    """Clear all projects that were imported from Google Sheets (for testing)"""
    try:
        db = get_database()
        
        # Delete projects with source = 'Google Sheets Import'
        result = db.projects.delete_many({"source": "Google Sheets Import"})
        
        # Delete associated rooms
        db.rooms.delete_many({"source": "Google Sheets Import"})
        
        return {
            "success": True,
            "message": f"Deleted {result.deleted_count} imported projects",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear failed: {str(e)}")