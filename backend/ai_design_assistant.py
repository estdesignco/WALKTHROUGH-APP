"""
AI-Powered Interior Design Assistant
=====================================
Features:
1. Room Rendering Studio - Full photo editing & rendering
2. Design Suggestions & Analysis
3. Style Analysis from Images
4. Budget Optimization
5. Punch List AI Suggestions
6. Furniture Color/Fabric Changer
"""

import os
import base64
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

load_dotenv()

# Import emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

router = APIRouter(prefix="/api/ai", tags=["AI Design Assistant"])

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-b2811342c88B9FaBcE')

# ============== MODELS ==============

class RoomEditRequest(BaseModel):
    """Request for editing a room photo"""
    room_image_base64: str  # The original room photo
    edit_type: str  # "clear_furniture", "change_floor", "change_paint", "add_furniture", "change_fabric", "full_render"
    
    # For clearing furniture
    keep_elements: Optional[List[str]] = None  # Elements to keep (e.g., "fireplace", "built-ins")
    
    # For changing surfaces
    new_floor_type: Optional[str] = None  # "hardwood oak", "marble", "tile", etc.
    new_wall_color: Optional[str] = None  # Paint color or "wallpaper: pattern description"
    new_ceiling: Optional[str] = None
    
    # For adding furniture
    furniture_to_add: Optional[List[Dict[str, Any]]] = None  # List of furniture with descriptions
    
    # For fabric/color changes
    item_to_change: Optional[str] = None  # Description of item to change
    new_fabric_color: Optional[str] = None  # New fabric/color description
    
    # Style guidance
    target_style: Optional[str] = None  # "modern", "traditional", etc.
    additional_instructions: Optional[str] = None

class FullRoomRenderRequest(BaseModel):
    """Full room transformation request"""
    original_room_base64: str  # Original room photo
    
    # What to remove
    clear_all_furniture: bool = True
    items_to_keep: Optional[List[str]] = None  # "fireplace", "built-in shelves", etc.
    items_to_remove: Optional[List[str]] = None  # Specific items to remove if not clearing all
    
    # Surface changes
    floor: Optional[str] = None  # "wide plank white oak hardwood", "carrara marble tile", etc.
    walls: Optional[str] = None  # "Benjamin Moore Simply White" or "navy blue grasscloth wallpaper"
    ceiling: Optional[str] = None  # "white coffered ceiling", "exposed beams"
    
    # Lighting changes
    lighting: Optional[List[str]] = None  # ["crystal chandelier", "recessed lighting", "wall sconces"]
    
    # Window treatments
    window_treatments: Optional[str] = None  # "floor-length ivory linen drapes with blackout lining"
    
    # Furniture to add (detailed)
    furniture: Optional[List[Dict[str, str]]] = None  # [{"type": "sofa", "description": "cream boucle sectional", "placement": "facing fireplace"}]
    
    # Style
    design_style: str = "modern"
    color_palette: Optional[List[str]] = None
    mood: Optional[str] = None  # "cozy", "luxurious", "minimalist"
    
    # Quality
    render_quality: str = "high"  # "draft", "medium", "high"
    photorealistic: bool = True

class FurnitureFabricChangeRequest(BaseModel):
    """Request to change fabric/color on furniture"""
    furniture_image_base64: str  # Image of the furniture piece
    current_description: str  # "gray linen sofa"
    new_fabric: str  # "navy blue velvet"
    new_color: Optional[str] = None  # If just changing color
    keep_style: bool = True  # Keep the furniture style, just change material

# ============== ROOM EDITING ENDPOINTS ==============

@router.post("/room-studio/clear-room")
async def clear_room_furniture(request: dict):
    """Step 1: Remove furniture from a room photo to create empty canvas"""
    try:
        room_image = request.get('room_image_base64')
        keep_elements = request.get('keep_elements', [])
        
        # Use GPT-5 vision to analyze the room first
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"clear-room-{datetime.now().timestamp()}",
            system_message="You are an expert at analyzing interior spaces and describing them in detail for AI image generation."
        ).with_model("openai", "gpt-5")
        
        # Analyze the room
        image_content = ImageContent(image_base64=room_image)
        analysis_prompt = f"""Analyze this room photo and describe:
1. Room type and dimensions (estimated)
2. Architectural features (windows, doors, fireplace, built-ins)
3. Current flooring type
4. Wall color/treatment
5. Ceiling details
6. Lighting (natural and fixtures)
7. All furniture pieces present

Elements to KEEP in the cleared room: {', '.join(keep_elements) if keep_elements else 'None - clear everything'}

Provide a detailed description I can use to regenerate this room EMPTY of furniture but keeping the architecture."""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        room_analysis = await chat.send_message(analysis_msg)
        
        # Generate the cleared room - PHOTOREALISTIC NOT CGI
        clear_prompt = f"""REAL PHOTOGRAPH - NOT CGI OR 3D RENDER - of an empty interior room:

{room_analysis}

CRITICAL - THIS MUST LOOK LIKE A REAL PHOTOGRAPH:
- Shot with a professional DSLR camera (Canon 5D or similar)
- Natural imperfections - slight lens distortion, realistic shadows
- Real photography lighting - not perfect CGI lighting
- Visible texture in materials - wood grain, fabric weave, paint texture
- Slight depth of field blur on edges
- Real-world color grading like Architectural Digest or Elle Decor magazine
- NO CGI look, NO video game aesthetic, NO 3D render appearance
- Should be indistinguishable from a real estate listing photo

ROOM REQUIREMENTS:
- Remove ALL furniture, rugs, and decor
- Keep exact same architecture, windows, doors
- Keep same flooring, wall color, ceiling
- Keep built-in features: {', '.join(keep_elements) if keep_elements else 'fireplace, built-in shelves if present'}
- Same natural lighting conditions and camera angle
- Professional interior photography quality"""

        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=clear_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            cleared_image = base64.b64encode(images[0]).decode('utf-8')
            return {
                "success": True,
                "cleared_room_base64": cleared_image,
                "room_analysis": room_analysis,
                "prompt_used": clear_prompt
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate cleared room")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Room clearing failed: {str(e)}")

@router.post("/room-studio/change-surfaces")
async def change_room_surfaces(request: dict):
    """Step 2: Change flooring, walls, ceiling in a room"""
    try:
        room_image = request.get('room_image_base64')
        new_floor = request.get('floor')
        new_walls = request.get('walls')
        new_ceiling = request.get('ceiling')
        
        # Analyze current room
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"surfaces-{datetime.now().timestamp()}",
            system_message="You are an expert interior designer specializing in surface materials and finishes."
        ).with_model("openai", "gpt-5")
        
        image_content = ImageContent(image_base64=room_image)
        
        analysis_prompt = """Describe this room's:
1. Exact layout and dimensions (estimate)
2. Window and door positions
3. Architectural features
4. Current flooring
5. Current wall treatment
6. Current ceiling
7. Lighting conditions
8. Camera angle and perspective"""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        room_analysis = await chat.send_message(analysis_msg)
        
        # Build the transformation prompt
        surface_changes = []
        if new_floor:
            surface_changes.append(f"Flooring: {new_floor}")
        if new_walls:
            surface_changes.append(f"Walls: {new_walls}")
        if new_ceiling:
            surface_changes.append(f"Ceiling: {new_ceiling}")
        
        render_prompt = f"""REAL PHOTOGRAPH - NOT CGI OR 3D RENDER - of this interior room with surface changes:

ORIGINAL ROOM ANALYSIS:
{room_analysis}

CHANGES TO MAKE:
{chr(10).join(surface_changes)}

CRITICAL - THIS MUST LOOK LIKE A REAL PHOTOGRAPH TAKEN WITH A CAMERA:
- Shot with professional DSLR camera - natural lens characteristics
- Real photography lighting with natural shadows and highlights
- Visible material textures - wood grain, stone veins, fabric weave
- Slight camera imperfections - minor vignette, natural color
- Depth of field like a real interior photo
- Magazine quality like Architectural Digest, Elle Decor, Dwell
- NO CGI appearance, NO 3D render look, NO video game aesthetic
- Must be INDISTINGUISHABLE from a real photograph

ROOM REQUIREMENTS:
- Keep EXACT same room layout, dimensions, architecture
- Keep EXACT same camera angle and perspective
- Keep same windows, doors, architectural features
- Keep any furniture in same positions
- Only change the specified surfaces
- Natural lighting that matches original photo
- Only change the specified surfaces
- Photorealistic rendering, professional interior photography
- Natural lighting, 8K quality"""

        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=render_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return {
                "success": True,
                "rendered_room_base64": base64.b64encode(images[0]).decode('utf-8'),
                "changes_applied": surface_changes,
                "room_analysis": room_analysis
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to render surface changes")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surface change failed: {str(e)}")

@router.post("/room-studio/add-furniture")
async def add_furniture_to_room(request: dict):
    """Step 3: Add furniture pieces to a room"""
    try:
        room_image = request.get('room_image_base64')
        furniture_list = request.get('furniture', [])
        style = request.get('style', 'modern')
        
        # Analyze the room
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"furniture-{datetime.now().timestamp()}",
            system_message="You are an expert interior designer and space planner."
        ).with_model("openai", "gpt-5")
        
        image_content = ImageContent(image_base64=room_image)
        
        analysis_prompt = """Describe this room in detail:
1. Room type and approximate dimensions
2. Layout and traffic flow areas
3. Focal points (fireplace, windows, etc.)
4. Existing furniture (if any)
5. Available floor space for new furniture
6. Lighting conditions
7. Camera angle"""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        room_analysis = await chat.send_message(analysis_msg)
        
        # Format furniture list
        furniture_desc = "\n".join([
            f"- {item.get('type', 'furniture')}: {item.get('description', '')} - Placement: {item.get('placement', 'appropriate location')}"
            for item in furniture_list
        ])
        
        render_prompt = f"""REAL PHOTOGRAPH - NOT CGI OR 3D RENDER - of this furnished interior room:

ROOM DESCRIPTION:
{room_analysis}

FURNITURE TO ADD:
{furniture_desc}

DESIGN STYLE: {style}

CRITICAL - THIS MUST LOOK LIKE A REAL PHOTOGRAPH TAKEN WITH A CAMERA:
- Shot with professional DSLR - real lens characteristics, natural bokeh
- Real photography lighting - natural shadows under furniture, realistic highlights
- REAL furniture textures - visible fabric weave, leather grain, wood grain
- Furniture should look like REAL products you can buy, not CGI models
- Natural imperfections - slight wrinkles in fabric, realistic wear
- Magazine quality - Architectural Digest, Elle Decor, House Beautiful
- NO CGI look, NO 3D render aesthetic, NO video game appearance
- Must be COMPLETELY INDISTINGUISHABLE from a real interior photograph

ROOM REQUIREMENTS:
- Keep exact same room architecture, walls, floors, windows
- Keep exact same camera angle and perspective  
- Furniture in realistic positions with proper scale
- Furniture naturally placed on floor, not floating
- Proper realistic shadows under and behind furniture
- Natural lighting that wraps around furniture realistically
- Furniture should look like it belongs in a real home"""

        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=render_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return {
                "success": True,
                "furnished_room_base64": base64.b64encode(images[0]).decode('utf-8'),
                "furniture_added": furniture_list,
                "room_analysis": room_analysis
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to add furniture")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Furniture addition failed: {str(e)}")

@router.post("/room-studio/change-fabric")
async def change_furniture_fabric(request: dict):
    """Change fabric/color on a furniture piece"""
    try:
        image_base64 = request.get('image_base64')
        item_description = request.get('current_item', 'sofa')
        new_fabric = request.get('new_fabric')
        new_color = request.get('new_color')
        
        change_desc = new_fabric if new_fabric else f"{new_color} colored"
        
        # Analyze the furniture
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"fabric-{datetime.now().timestamp()}",
            system_message="You are an expert at describing furniture for AI image generation."
        ).with_model("openai", "gpt-5")
        
        image_content = ImageContent(image_base64=image_base64)
        
        analysis_prompt = f"""Describe this {item_description} in detail:
1. Style and shape
2. Current fabric/material
3. Current color
4. Any tufting, buttons, or details
5. Legs/base style
6. Dimensions (estimate)
7. The background/setting"""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        item_analysis = await chat.send_message(analysis_msg)
        
        render_prompt = f"""REAL PHOTOGRAPH - NOT CGI - of this {item_description} with fabric changed:

ORIGINAL FURNITURE:
{item_analysis}

CHANGE: Replace the fabric/material with {change_desc}

CRITICAL - MUST LOOK LIKE A REAL PRODUCT PHOTOGRAPH:
- Shot with professional camera - real lens characteristics
- REAL fabric texture visible - weave pattern, material grain, natural folds
- Natural lighting with realistic soft shadows
- Like a photograph from a furniture catalog or showroom
- The fabric should look like REAL fabric you can touch
- Visible texture details - not smooth CGI material
- Magazine quality product photography
- NO CGI look, NO 3D render appearance
- Should look like a photo of a real piece of furniture

FURNITURE REQUIREMENTS:
- Keep EXACT same furniture shape, style, design
- Keep EXACT same legs/base
- Keep EXACT same proportions and dimensions
- Keep any tufting, buttons, details (update material only)
- Only change fabric/upholstery material and color
- Same lighting angle as original"""

        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=render_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return {
                "success": True,
                "updated_furniture_base64": base64.b64encode(images[0]).decode('utf-8'),
                "original_analysis": item_analysis,
                "change_applied": change_desc
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to change fabric")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fabric change failed: {str(e)}")

@router.post("/room-studio/full-render")
async def full_room_render(request: FullRoomRenderRequest):
    """Complete room transformation - the full pipeline"""
    try:
        # Step 1: Analyze the original room thoroughly
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"full-render-{datetime.now().timestamp()}",
            system_message="""You are a world-class interior designer and architectural visualization expert. 
            You create incredibly detailed descriptions for photorealistic room renderings."""
        ).with_model("openai", "gpt-5")
        
        image_content = ImageContent(image_base64=request.original_room_base64)
        
        # Comprehensive room analysis
        analysis_prompt = """Provide an extremely detailed analysis of this room for rendering:

1. ARCHITECTURE:
   - Room type and function
   - Exact dimensions (estimate in feet)
   - Ceiling height
   - Wall positions and angles
   - Window positions, sizes, and style
   - Door positions
   - Any architectural features (fireplace, columns, moldings)

2. CURRENT STATE:
   - Flooring type and condition
   - Wall treatment
   - Ceiling details
   - Natural lighting direction
   - Time of day (based on light)

3. CAMERA:
   - Exact camera angle
   - Height from floor
   - Focal length (wide/normal)
   - What's visible in frame

Be extremely precise - this will be used to recreate the room exactly."""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        room_analysis = await chat.send_message(analysis_msg)
        
        # Build the comprehensive render prompt - REAL PHOTO NOT CGI
        render_sections = [
            "CRITICAL: Generate a REAL PHOTOGRAPH - NOT CGI, NOT 3D RENDER, NOT VIDEO GAME GRAPHICS",
            "",
            "This MUST look like an actual photograph taken with a professional camera.",
            "It should be indistinguishable from a photo in Architectural Digest or Elle Decor.",
            "",
            "ROOM ARCHITECTURE (recreate exactly from original photo):",
            room_analysis,
            "",
        ]
        
        # Surface changes
        if request.floor or request.walls or request.ceiling:
            render_sections.append("SURFACE CHANGES:")
            if request.floor:
                render_sections.append(f"- Flooring: {request.floor}")
            if request.walls:
                render_sections.append(f"- Walls: {request.walls}")
            if request.ceiling:
                render_sections.append(f"- Ceiling: {request.ceiling}")
            render_sections.append("")
        
        # Lighting
        if request.lighting:
            render_sections.append("LIGHTING FIXTURES:")
            for light in request.lighting:
                render_sections.append(f"- {light}")
            render_sections.append("")
        
        # Window treatments
        if request.window_treatments:
            render_sections.append(f"WINDOW TREATMENTS: {request.window_treatments}")
            render_sections.append("")
        
        # Furniture
        if request.furniture:
            render_sections.append("FURNITURE TO ADD (must look like REAL purchasable products):")
            for item in request.furniture:
                render_sections.append(f"- {item.get('type', 'furniture')}: {item.get('description', '')} - Position: {item.get('placement', 'appropriate')}")
            render_sections.append("")
        
        # Style guidance
        render_sections.extend([
            f"DESIGN STYLE: {request.design_style}",
            f"COLOR PALETTE: {', '.join(request.color_palette) if request.color_palette else 'harmonious with design style'}",
            f"MOOD: {request.mood or 'elegant and inviting'}",
            "",
            "ABSOLUTE REQUIREMENTS FOR PHOTOREALISM:",
            "- Must look like a REAL PHOTOGRAPH taken with a Canon 5D or Sony A7",
            "- Real camera characteristics: natural depth of field, slight vignette, lens blur on edges",
            "- REAL material textures: visible wood grain, fabric weave, leather texture, stone veins",
            "- Natural lighting with realistic shadows - soft shadows under furniture",
            "- Furniture must look like REAL products - not CGI models",
            "- Slight imperfections: fabric wrinkles, natural wear, realistic dust",
            "- Magazine photography quality: Architectural Digest, Elle Decor, House Beautiful",
            "- NO CGI aesthetic, NO 3D render look, NO video game graphics",
            "- NO plastic-looking materials, NO perfect CGI lighting",
            "- Should fool anyone into thinking it's a real photograph",
            "- Same camera angle and perspective as original photo"
        ])
        
        full_prompt = "\n".join(render_sections)
        
        # Generate the render
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=full_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return {
                "success": True,
                "rendered_room_base64": base64.b64encode(images[0]).decode('utf-8'),
                "room_analysis": room_analysis,
                "render_prompt": full_prompt,
                "settings_applied": {
                    "floor": request.floor,
                    "walls": request.walls,
                    "ceiling": request.ceiling,
                    "lighting": request.lighting,
                    "window_treatments": request.window_treatments,
                    "furniture_count": len(request.furniture) if request.furniture else 0,
                    "style": request.design_style
                },
                "generated_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate room render")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full render failed: {str(e)}")

# ============== CHAT-BASED RENDERING (Natural Language) ==============

@router.post("/room-studio/chat-render")
async def chat_render(request: dict):
    """
    Direct room rendering - AI executes EXACTLY what user asks, no suggestions.
    Uses the original room photo for detailed analysis to maintain accuracy.
    """
    try:
        room_image = request.get('room_image_base64')
        user_request = request.get('user_request', '')
        conversation_history = request.get('conversation_history', [])
        
        if not room_image:
            raise HTTPException(status_code=400, detail="Room image is required")
        if not user_request:
            raise HTTPException(status_code=400, detail="Please describe what you want to do with this room")
        
        # CRITICAL: First, analyze the original room in EXTREME detail
        # This ensures the generated image matches the original room
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"room-render-{datetime.now().timestamp()}",
            system_message="""You are an expert interior photographer and designer. Your job is to describe rooms 
in EXTREME photographic detail so an AI image generator can recreate them perfectly. 
Focus on exact architectural elements, materials, lighting, camera angle, and dimensions."""
        ).with_model("openai", "gpt-5")
        
        image_content = ImageContent(image_base64=room_image)
        
        # Get VERY detailed room analysis
        analysis_prompt = """Analyze this room photo in EXTREME DETAIL for AI image recreation:

1. ARCHITECTURE (be VERY specific):
   - Exact room shape and dimensions (estimate in feet)
   - Wall positions and angles
   - Window positions, sizes, shapes, styles (mullions, frames)
   - Door positions, styles
   - Ceiling type (flat, coffered, vaulted, height estimate)
   - Any architectural details (crown molding, baseboards, built-ins, fireplace)

2. MATERIALS & FINISHES (describe textures):
   - Floor material, color, pattern, direction
   - Wall color/wallpaper, finish (matte, eggshell, etc.)
   - Window treatments if any
   - Ceiling color and texture

3. LIGHTING (critical for matching):
   - Natural light source direction
   - Time of day (estimate)
   - Light quality (warm/cool)
   - Shadows and highlights
   - Any artificial lighting visible

4. CAMERA ANGLE (critical for matching):
   - Approximate camera height (standing, seated level?)
   - Angle (straight on, corner view, etc.)
   - Distance from walls
   - Focal length feel (wide angle, normal lens?)
   - What's visible at edges of frame

5. CURRENT FURNITURE & DECOR:
   - List each piece with position
   - Colors and materials
   - Scale relative to room

Provide this as a detailed, structured description I can use to regenerate this EXACT room."""

        analysis_msg = UserMessage(text=analysis_prompt, file_contents=[image_content])
        room_analysis = await chat.send_message(analysis_msg)
        
        # Build a detailed render prompt using the analysis
        render_prompt = f"""PHOTOREALISTIC INTERIOR PHOTOGRAPH - MUST MATCH THE ORIGINAL ROOM EXACTLY

ORIGINAL ROOM DETAILS (MUST PRESERVE THESE EXACTLY):
{room_analysis}

USER'S MODIFICATION REQUEST: "{user_request}"

CRITICAL REQUIREMENTS:
1. This MUST look like a photograph of THE SAME ROOM shown above
2. Keep EXACT same architecture: walls, windows, doors, ceiling, floor
3. Keep EXACT same camera angle, perspective, and framing
4. Keep EXACT same lighting direction and quality
5. Keep EXACT same materials and finishes (unless user asked to change them)
6. Only modify what the user specifically requested

PHOTOREALISM (ABSOLUTELY CRITICAL):
- Must be INDISTINGUISHABLE from a real photograph
- Real camera characteristics: natural depth of field, slight lens characteristics
- Real material textures visible: wood grain, fabric weave, paint texture
- Natural shadows and highlights
- Magazine quality like Architectural Digest photo
- NO CGI look, NO 3D render aesthetic, NO video game graphics
- Professional DSLR photography quality

APPLY ONLY THE USER'S REQUESTED CHANGE:
{user_request}

Keep EVERYTHING else exactly as described in the original room analysis above."""

        # Generate the image
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=render_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Confirm what we did
            user_message = f"✅ Done! I rendered your room with: \"{user_request}\"\n\nThe image preserves your room's architecture, lighting, and camera angle while applying your requested change."
            
            return {
                "success": True,
                "message": user_message,
                "rendered_image_base64": base64.b64encode(images[0]).decode('utf-8'),
                "user_request": user_request,
                "room_analysis": room_analysis  # Include for debugging
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate render")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rendering failed: {str(e)}")

class DesignSuggestionRequest(BaseModel):
    room_type: str
    current_items: List[Dict[str, Any]]  # Existing items in the room
    budget: Optional[float] = None
    style_preferences: Optional[List[str]] = None
    project_id: Optional[str] = None

class StyleAnalysisRequest(BaseModel):
    image_base64: str  # Base64 encoded inspiration image
    analyze_colors: bool = True
    analyze_furniture: bool = True
    analyze_lighting: bool = True

class BudgetOptimizeRequest(BaseModel):
    items: List[Dict[str, Any]]  # Items with prices
    target_budget: float
    priority_categories: Optional[List[str]] = None  # Categories to prioritize

class PunchListRequest(BaseModel):
    project_id: str
    room_name: str
    items: List[Dict[str, Any]]  # Current items in room
    checked_items: List[str]  # IDs of checked items
    project_type: Optional[str] = None  # "renovation", "new build", etc.

class VoiceNoteRequest(BaseModel):
    audio_base64: str  # Base64 encoded audio
    room_id: Optional[str] = None
    item_id: Optional[str] = None

class RoomRenderRequest(BaseModel):
    """Simple room visualization request (for generic renders)"""
    room_type: str  # "living room", "kitchen", "bedroom", etc.
    style: str  # "modern", "traditional", "minimalist", etc.
    color_palette: Optional[List[str]] = None
    features: Optional[List[str]] = None  # "fireplace", "large windows", etc.
    dimensions: Optional[str] = None  # "20x15 feet"
    additional_notes: Optional[str] = None

# ============== ROOM RENDERING ==============

@router.post("/render-room")
async def render_room(request: RoomRenderRequest):
    """Generate an AI visualization of a room design"""
    try:
        # Build detailed prompt for room rendering
        prompt_parts = [
            f"Professional interior design photograph of a {request.style} {request.room_type}.",
            "High-end architectural photography, natural lighting, photorealistic.",
        ]
        
        if request.color_palette:
            prompt_parts.append(f"Color palette: {', '.join(request.color_palette)}.")
        
        if request.features:
            prompt_parts.append(f"Features include: {', '.join(request.features)}.")
        
        if request.dimensions:
            prompt_parts.append(f"Room dimensions approximately {request.dimensions}.")
        
        if request.additional_notes:
            prompt_parts.append(request.additional_notes)
        
        prompt_parts.append("Interior design magazine quality, 8K resolution, professional staging.")
        
        full_prompt = " ".join(prompt_parts)
        
        # Generate image
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=full_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {
                "success": True,
                "image_base64": image_base64,
                "prompt_used": full_prompt,
                "generated_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Room rendering failed: {str(e)}")

# ============== DESIGN SUGGESTIONS ==============

@router.post("/design-suggestions")
async def get_design_suggestions(request: DesignSuggestionRequest):
    """Get AI-powered design suggestions for a room"""
    try:
        # Create chat instance for design suggestions
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"design-{request.room_type}-{datetime.now().timestamp()}",
            system_message="""You are an expert interior designer with 20+ years of experience. 
            You provide detailed, actionable design suggestions tailored to the client's needs, 
            budget, and style preferences. Always be specific with product recommendations, 
            color codes, and placement suggestions. Format your response as JSON."""
        ).with_model("openai", "gpt-5")
        
        # Build context from current items
        items_context = "\n".join([
            f"- {item.get('name', 'Unknown')}: {item.get('vendor', 'N/A')} (${item.get('price', 0):.2f})"
            for item in request.current_items
        ]) if request.current_items else "No items currently selected."
        
        prompt = f"""Analyze this {request.room_type} and provide design suggestions:

CURRENT ITEMS:
{items_context}

BUDGET: ${request.budget if request.budget else 'Not specified'}
STYLE PREFERENCES: {', '.join(request.style_preferences) if request.style_preferences else 'Not specified'}

Please provide:
1. 3-5 additional items that would complement the existing pieces
2. Color palette recommendations (with specific hex codes)
3. Lighting suggestions
4. Layout/arrangement tips
5. Any items that might clash or should be reconsidered

Return your response as JSON with these keys:
- recommended_items (array of objects with name, estimated_price, vendor_suggestions, reason)
- color_palette (array of hex codes with names)
- lighting_suggestions (array of strings)
- layout_tips (array of strings)
- items_to_reconsider (array of strings)
- overall_style_rating (1-10)
- style_notes (string)"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse as JSON
        try:
            # Clean up response if needed
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            suggestions = json.loads(response_text)
        except json.JSONDecodeError:
            suggestions = {"raw_response": response}
        
        return {
            "success": True,
            "suggestions": suggestions,
            "room_type": request.room_type,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Design suggestions failed: {str(e)}")

# ============== STYLE ANALYSIS ==============

@router.post("/analyze-style")
async def analyze_style(request: StyleAnalysisRequest):
    """Analyze an inspiration image to extract style profile"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"style-analysis-{datetime.now().timestamp()}",
            system_message="""You are an expert interior design analyst. 
            Analyze images to identify design styles, color palettes, furniture types, 
            and lighting approaches. Be specific and detailed in your analysis.
            Return your analysis as structured JSON."""
        ).with_model("openai", "gpt-5")
        
        # Create image content
        image_content = ImageContent(image_base64=request.image_base64)
        
        analysis_aspects = []
        if request.analyze_colors:
            analysis_aspects.append("Color palette (identify dominant colors with hex codes)")
        if request.analyze_furniture:
            analysis_aspects.append("Furniture style and types")
        if request.analyze_lighting:
            analysis_aspects.append("Lighting approach and fixtures")
        
        prompt = f"""Analyze this interior design image and provide a detailed style profile.

Focus on:
{chr(10).join(f'- {aspect}' for aspect in analysis_aspects)}

Return your analysis as JSON with these keys:
- primary_style (e.g., "Modern Minimalist", "Traditional", "Bohemian")
- secondary_styles (array of related styles)
- color_palette (array of objects with hex code, name, and usage percentage)
- furniture_types (array of identified furniture with style descriptors)
- lighting_type (e.g., "Natural", "Ambient", "Task")
- lighting_fixtures (array of identified fixtures)
- texture_materials (array of materials spotted)
- mood_keywords (array of descriptive words)
- designer_tips (array of tips to recreate this style)
- estimated_budget_range (low, medium, high)"""

        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        response = await chat.send_message(user_message)
        
        # Parse response
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text)
        except json.JSONDecodeError:
            analysis = {"raw_response": response}
        
        return {
            "success": True,
            "style_analysis": analysis,
            "analyzed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Style analysis failed: {str(e)}")

# ============== BUDGET OPTIMIZER ==============

@router.post("/optimize-budget")
async def optimize_budget(request: BudgetOptimizeRequest):
    """Get AI suggestions for budget optimization"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"budget-{datetime.now().timestamp()}",
            system_message="""You are a savvy interior design budget consultant. 
            You help clients achieve beautiful spaces within their budget by suggesting 
            alternatives, prioritizing spending, and identifying where to save vs splurge.
            Always provide specific, actionable recommendations with estimated savings."""
        ).with_model("openai", "gpt-5")
        
        # Calculate current total
        current_total = sum(item.get('price', 0) for item in request.items)
        over_budget = current_total - request.target_budget
        
        items_list = "\n".join([
            f"- {item.get('name', 'Unknown')} ({item.get('category', 'N/A')}): ${item.get('price', 0):.2f} from {item.get('vendor', 'Unknown')}"
            for item in request.items
        ])
        
        prompt = f"""Budget Optimization Request:

CURRENT ITEMS (Total: ${current_total:.2f}):
{items_list}

TARGET BUDGET: ${request.target_budget:.2f}
OVER BUDGET BY: ${over_budget:.2f}
PRIORITY CATEGORIES: {', '.join(request.priority_categories) if request.priority_categories else 'None specified'}

Please provide:
1. Items to keep (worth the investment)
2. Items to swap for alternatives (with specific suggestions and estimated savings)
3. Items to remove or defer
4. Overall strategy to meet budget

Return as JSON with keys:
- keep_items (array with item names and reasons)
- swap_items (array with original_item, suggested_alternative, estimated_price, savings, vendor_suggestion)
- remove_items (array with item names and reasons)
- defer_items (array with item names and when to purchase later)
- total_savings (number)
- new_estimated_total (number)
- strategy_notes (string)"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            optimization = json.loads(response_text)
        except json.JSONDecodeError:
            optimization = {"raw_response": response}
        
        return {
            "success": True,
            "current_total": current_total,
            "target_budget": request.target_budget,
            "over_budget_by": over_budget,
            "optimization": optimization,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget optimization failed: {str(e)}")

# ============== PUNCH LIST AI ==============

@router.post("/punch-list-suggestions")
async def get_punch_list_suggestions(request: PunchListRequest):
    """Generate AI-powered punch list suggestions based on project"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"punchlist-{request.project_id}-{datetime.now().timestamp()}",
            system_message="""You are an experienced interior design project manager. 
            You help create comprehensive punch lists for final walkthroughs. 
            You know all the details that are commonly missed and provide 
            thorough checklists based on the room type and items installed."""
        ).with_model("openai", "gpt-5")
        
        # Build context
        unchecked_items = [item for item in request.items if item.get('id') not in request.checked_items]
        checked_items = [item for item in request.items if item.get('id') in request.checked_items]
        
        items_context = "\n".join([
            f"- {item.get('name', 'Unknown')} ({item.get('category', 'N/A')}) - {'✓ Checked' if item.get('id') in request.checked_items else '○ Unchecked'}"
            for item in request.items
        ])
        
        prompt = f"""Generate a punch list for final walkthrough:

ROOM: {request.room_name}
PROJECT TYPE: {request.project_type or 'Interior Design'}

ITEMS IN ROOM:
{items_context}

CHECKED ITEMS: {len(checked_items)}
UNCHECKED ITEMS: {len(unchecked_items)}

Please generate a comprehensive punch list that includes:
1. Items to verify are properly installed
2. Quality checks for each category
3. Common issues to look for
4. Safety checks
5. Final touches and details often missed
6. Documentation needed

Return as JSON with keys:
- installation_checks (array with item_name, check_points array)
- quality_checks (array with category, checks array)
- common_issues (array of strings to watch for)
- safety_checks (array of strings)
- final_touches (array of strings)
- documentation_needed (array of strings)
- priority_items (array of most critical items to check)
- estimated_walkthrough_time (string like "45 minutes")"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            punch_list = json.loads(response_text)
        except json.JSONDecodeError:
            punch_list = {"raw_response": response}
        
        return {
            "success": True,
            "room_name": request.room_name,
            "project_id": request.project_id,
            "punch_list": punch_list,
            "items_checked": len(checked_items),
            "items_remaining": len(unchecked_items),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Punch list generation failed: {str(e)}")

# ============== AI PRODUCT MATCHER ==============

@router.post("/match-products")
async def match_products(criteria: Dict[str, Any]):
    """Find products matching specific criteria"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"product-match-{datetime.now().timestamp()}",
            system_message="""You are an interior design product sourcing expert. 
            You know all the major furniture vendors and can suggest specific products 
            that match given criteria. Always provide specific product names, vendors, 
            and estimated prices when possible."""
        ).with_model("openai", "gpt-5")
        
        prompt = f"""Find products matching these criteria:
{json.dumps(criteria, indent=2)}

Please suggest 5-10 products that match. For each product provide:
- Product name
- Vendor/Brand
- Estimated price range
- Key features
- Why it's a good match
- Similar alternatives

Return as JSON with key "products" containing array of matches."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            matches = json.loads(response_text)
        except json.JSONDecodeError:
            matches = {"raw_response": response}
        
        return {
            "success": True,
            "criteria": criteria,
            "matches": matches,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product matching failed: {str(e)}")

# ============== AI CHAT ASSISTANT ==============

class ChatMessage(BaseModel):
    message: str
    session_id: str
    project_context: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat_with_assistant(request: ChatMessage):
    """Chat with the AI design assistant"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.session_id,
            system_message="""You are an expert interior design assistant named "Design AI". 
            You help interior designers with:
            - Room layouts and space planning
            - Color palette selection
            - Furniture and decor recommendations
            - Budget planning
            - Vendor suggestions
            - Style guidance
            
            Be helpful, specific, and professional. When recommending products, 
            mention specific vendors when possible. Always consider budget constraints 
            and practical considerations."""
        ).with_model("openai", "gpt-5")
        
        # Add project context if provided
        context_prefix = ""
        if request.project_context:
            context_prefix = f"Project Context: {json.dumps(request.project_context)}\n\n"
        
        user_message = UserMessage(text=context_prefix + request.message)
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "response": response,
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
