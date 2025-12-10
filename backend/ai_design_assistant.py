"""
AI-Powered Interior Design Assistant
=====================================
Features:
1. Room Rendering/Visualization
2. Design Suggestions & Analysis
3. Style Analysis from Images
4. Budget Optimization
5. Punch List AI Suggestions
6. Voice Notes Transcription
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

class RoomRenderRequest(BaseModel):
    room_type: str  # "living room", "kitchen", "bedroom", etc.
    style: str  # "modern", "traditional", "minimalist", etc.
    color_palette: Optional[List[str]] = None
    features: Optional[List[str]] = None  # "fireplace", "large windows", etc.
    dimensions: Optional[str] = None  # "20x15 feet"
    additional_notes: Optional[str] = None

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
