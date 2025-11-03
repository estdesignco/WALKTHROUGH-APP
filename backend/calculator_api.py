from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum
import math

router = APIRouter(prefix="/api/calculators", tags=["calculators"])

# ============================================
# WALLPAPER CALCULATOR
# ============================================

class WallpaperType(str, Enum):
    DOUBLE_ROLL = "double_roll"
    MURAL = "mural"
    BY_YARD = "by_yard"

class WallpaperRequest(BaseModel):
    wallpaper_type: WallpaperType
    # Wall dimensions
    wall_width: float = Field(gt=0, description="Wall width in feet")
    wall_height: float = Field(gt=0, description="Wall height in feet")
    # Doors/Windows
    door_widths: List[float] = Field(default=[], description="Door widths in feet")
    door_heights: List[float] = Field(default=[], description="Door heights in feet")
    window_widths: List[float] = Field(default=[], description="Window widths in feet")
    window_heights: List[float] = Field(default=[], description="Window heights in feet")
    # Pattern
    pattern_repeat: float = Field(default=0, ge=0, description="Pattern repeat in inches")
    # Roll specs
    roll_width: float = Field(default=21, description="Roll width in inches")
    roll_length: float = Field(default=33, description="Roll length in feet (for double roll)")
    fabric_width: float = Field(default=54, description="Fabric width in inches (for by-yard)")
    # COST
    cost_per_unit: float = Field(default=0, ge=0, description="Cost per double roll / yard")


@router.post("/wallpaper")
async def calculate_wallpaper(req: WallpaperRequest):
    """
    Calculate wallpaper needed - handles Double Roll, Mural, and By-Yard
    """
    # Calculate wall area in square feet
    wall_area = req.wall_width * req.wall_height
    
    # Calculate opening areas (50% deduction as per industry standard)
    opening_area = 0
    for i, dw in enumerate(req.door_widths):
        if i < len(req.door_heights):
            opening_area += (dw * req.door_heights[i]) * 0.5
    
    for i, ww in enumerate(req.window_widths):
        if i < len(req.window_heights):
            opening_area += (ww * req.window_heights[i]) * 0.5
    
    net_area = wall_area - opening_area
    
    if req.wallpaper_type == WallpaperType.DOUBLE_ROLL:
        # Calculate usable yield based on pattern repeat
        if req.pattern_repeat == 0:
            usable_sqft_per_roll = 50  # No pattern
        elif req.pattern_repeat <= 6:
            usable_sqft_per_roll = 44
        elif req.pattern_repeat <= 12:
            usable_sqft_per_roll = 40
        else:
            usable_sqft_per_roll = 36
        
        # Add 15% waste factor
        area_with_waste = net_area * 1.15
        rolls_needed = math.ceil(area_with_waste / usable_sqft_per_roll)
        
        return {
            "type": "double_roll",
            "wall_area_sqft": round(wall_area, 2),
            "opening_area_sqft": round(opening_area, 2),
            "net_area_sqft": round(net_area, 2),
            "rolls_needed": rolls_needed,
            "usable_sqft_per_roll": usable_sqft_per_roll,
            "total_coverage_sqft": rolls_needed * usable_sqft_per_roll,
            "waste_percentage": 15
        }
    
    elif req.wallpaper_type == WallpaperType.MURAL:
        # Mural calculation - just wall dimensions
        return {
            "type": "mural",
            "wall_width_ft": req.wall_width,
            "wall_height_ft": req.wall_height,
            "wall_width_inches": req.wall_width * 12,
            "wall_height_inches": req.wall_height * 12,
            "recommended_size": f"{math.ceil(req.wall_width * 12)}\" x {math.ceil(req.wall_height * 12)}\"",
            "note": "Order mural slightly larger for trimming flexibility"
        }
    
    else:  # BY_YARD
        # Calculate yardage for commercial wallcovering
        area_with_waste = net_area * 1.10
        
        if req.fabric_width == 48:
            yards_needed = math.ceil(area_with_waste / 12)
        elif req.fabric_width == 54:
            yards_needed = math.ceil(area_with_waste / 13.5)
        else:
            yards_needed = math.ceil(area_with_waste / (req.fabric_width / 3))
        
        return {
            "type": "by_yard",
            "wall_area_sqft": round(wall_area, 2),
            "net_area_sqft": round(net_area, 2),
            "fabric_width_inches": req.fabric_width,
            "yards_needed": yards_needed,
            "waste_percentage": 10
        }

# ============================================
# DRAPERY CALCULATOR  
# ============================================

class PleatType(str, Enum):
    PINCH_PLEAT = "pinch_pleat"
    GOBLET = "goblet"
    GROMMET = "grommet"
    ROD_POCKET = "rod_pocket"
    RIPPLEFOLD = "ripplefold"
    BOX_PLEAT = "box_pleat"
    EURO_PLEAT = "euro_pleat"
    TAB_TOP = "tab_top"

class DraperyRequest(BaseModel):
    window_width: float = Field(gt=0, description="Window width in inches")
    finished_length: float = Field(gt=0, description="Finished length in inches")
    pleat_type: PleatType
    fullness_ratio: float = Field(default=2.5, ge=1.5, le=3.0, description="1.5x, 2x, 2.5x, or 3x")
    fabric_width: float = Field(default=54, description="Fabric width in inches")
    pattern_repeat: Optional[float] = Field(default=None, description="Pattern repeat in inches")
    include_lining: bool = Field(default=False)

@router.post("/drapery")
async def calculate_drapery(req: DraperyRequest):
    """
    Calculate drapery fabric yardage for all pleat types
    """
    # Determine hem allowance based on pleat type
    if req.pleat_type in [PleatType.PINCH_PLEAT, PleatType.GOBLET, PleatType.EURO_PLEAT, PleatType.BOX_PLEAT]:
        hem_allowance = 12.0
    elif req.pleat_type in [PleatType.GROMMET, PleatType.ROD_POCKET, PleatType.TAB_TOP]:
        hem_allowance = 16.0
    else:  # RIPPLEFOLD
        hem_allowance = 8.0
    
    # Calculate cut length
    base_cut_length = req.finished_length + hem_allowance
    
    if req.pattern_repeat and req.pattern_repeat > 0:
        repeats_needed = math.ceil(base_cut_length / req.pattern_repeat)
        cut_length = repeats_needed * req.pattern_repeat
    else:
        cut_length = base_cut_length
    
    # Calculate widths needed
    total_width_needed = req.window_width * req.fullness_ratio
    widths_needed = math.ceil(total_width_needed / req.fabric_width)
    
    # Calculate total yardage
    total_inches = cut_length * widths_needed
    yards = total_inches / 36
    fabric_yardage = math.ceil(yards * 4) / 4  # Round to nearest 1/4 yard
    
    # Calculate lining if requested
    lining_yardage = None
    if req.include_lining:
        lining_cut_length = req.finished_length + 8  # Less hem for lining
        lining_inches = lining_cut_length * widths_needed
        lining_yards = lining_inches / 36
        lining_yardage = math.ceil(lining_yards * 4) / 4
    
    return {
        "fabric_yardage": fabric_yardage,
        "lining_yardage": lining_yardage,
        "widths_needed": widths_needed,
        "cut_length": round(cut_length, 2),
        "hem_allowance": hem_allowance,
        "fullness_ratio": req.fullness_ratio,
        "total_width_needed": round(total_width_needed, 2),
        "pleat_type": req.pleat_type.value
    }

# ============================================
# DRAPERY HARDWARE CALCULATOR
# ============================================

class HardwareRequest(BaseModel):
    window_width: float = Field(gt=0, le=240, description="Window width in inches")
    rod_overhang_per_side: float = Field(default=6, ge=4, le=12, description="Rod extension beyond frame")
    rod_diameter: float = Field(default=1.0, ge=0.5, le=3.0, description="Rod diameter in inches")
    drapery_weight: str = Field(default="medium", description="light, medium, or heavy")

@router.post("/hardware")
async def calculate_hardware(req: HardwareRequest):
    """
    Calculate curtain rod hardware requirements (60-240 inches)
    """
    total_rod_width = req.window_width + (2 * req.rod_overhang_per_side)
    
    # Validate range
    if total_rod_width < 60 or total_rod_width > 240:
        raise HTTPException(
            status_code=400,
            detail=f"Rod width {total_rod_width}\" outside supported range (60-240\")"
        )
    
    # Determine max span based on rod diameter
    span_map = {
        0.5: 70,
        0.75: 80,
        1.0: 90,
        1.25: 105,
        1.5: 105
    }
    
    max_span = span_map.get(req.rod_diameter, 90)
    
    # Adjust for weight
    if req.drapery_weight == "heavy":
        max_span -= 15
    
    # Calculate brackets needed
    if total_rod_width <= max_span:
        brackets_needed = 2  # Just end brackets
        spans = 1
    else:
        spans = math.ceil(total_rod_width / max_span)
        brackets_needed = spans + 1
    
    return {
        "total_rod_width": round(total_rod_width, 2),
        "rod_diameter": req.rod_diameter,
        "brackets_needed": brackets_needed,
        "max_span_per_bracket": max_span,
        "number_of_spans": spans,
        "average_span_width": round(total_rod_width / spans, 2),
        "recommendation": f"{brackets_needed} brackets for {round(total_rod_width, 1)}\" rod"
    }

# ============================================
# SQUARE FOOTAGE CALCULATOR
# ============================================

class SquareFootageRequest(BaseModel):
    room_type: str = Field(default="rectangular")
    # For rectangular rooms
    length: Optional[float] = Field(default=None, description="Length in feet")
    width: Optional[float] = Field(default=None, description="Width in feet")
    # For custom/irregular
    measurements: Optional[List[Dict[str, float]]] = Field(default=None, description="Leica measurements")

@router.post("/square-footage")
async def calculate_square_footage(req: SquareFootageRequest):
    """
    Calculate square footage - supports Leica photo measurements
    """
    if req.room_type == "rectangular" and req.length and req.width:
        sqft = req.length * req.width
        return {
            "square_footage": round(sqft, 2),
            "length": req.length,
            "width": req.width,
            "room_type": "rectangular"
        }
    
    elif req.measurements:
        # Calculate from Leica measurements
        total_sqft = 0
        for m in req.measurements:
            if "length" in m and "width" in m:
                total_sqft += m["length"] * m["width"]
        
        return {
            "square_footage": round(total_sqft, 2),
            "measurement_count": len(req.measurements),
            "room_type": "custom"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Provide either length/width or measurements")

# ============================================
# PAINT CALCULATOR
# ============================================

class PaintRequest(BaseModel):
    room_length: float = Field(gt=0)
    room_width: float = Field(gt=0)
    wall_height: float = Field(gt=0)
    coats: int = Field(default=2, ge=1, le=4)
    coverage_per_gallon: float = Field(default=350, description="Square feet per gallon")

@router.post("/paint")
async def calculate_paint(req: PaintRequest):
    """
    Calculate paint gallons needed
    """
    wall_area = 2 * (req.room_length + req.room_width) * req.wall_height
    total_area = wall_area * req.coats
    gallons = math.ceil(total_area / req.coverage_per_gallon)
    
    return {
        "gallons_needed": gallons,
        "wall_area_sqft": round(wall_area, 2),
        "total_area_with_coats": round(total_area, 2),
        "coats": req.coats
    }

# ============================================
# TILE/FLOORING CALCULATOR
# ============================================

class FlooringRequest(BaseModel):
    room_length: float = Field(gt=0)
    room_width: float = Field(gt=0)
    tile_length: float = Field(default=12, description="Tile length in inches")
    tile_width: float = Field(default=12, description="Tile width in inches")
    waste_factor: float = Field(default=0.10, description="10% waste typical")

@router.post("/flooring")
async def calculate_flooring(req: FlooringRequest):
    """
    Calculate tile/flooring needed
    """
    room_sqft = req.room_length * req.room_width
    room_sqft_with_waste = room_sqft * (1 + req.waste_factor)
    
    tile_sqft = (req.tile_length * req.tile_width) / 144  # Convert to sq ft
    tiles_needed = math.ceil(room_sqft_with_waste / tile_sqft)
    
    # Also calculate boxes if standard 10 tiles per box
    boxes_needed = math.ceil(tiles_needed / 10)
    
    return {
        "room_square_footage": round(room_sqft, 2),
        "tiles_needed": tiles_needed,
        "boxes_needed": boxes_needed,
        "waste_factor_percentage": req.waste_factor * 100,
        "tile_size": f"{req.tile_length}x{req.tile_width} inches"
    }

# ============================================
# LIGHTING CALCULATOR
# ============================================

class LightingRequest(BaseModel):
    room_length: float = Field(gt=0)
    room_width: float = Field(gt=0)
    room_type: str = Field(default="living_room", description="living_room, kitchen, bedroom, bathroom")

@router.post("/lighting")
async def calculate_lighting(req: LightingRequest):
    """
    Calculate lumens needed based on room type
    """
    # Lumens per square foot recommendations
    lumens_map = {
        "living_room": 20,
        "kitchen": 50,
        "bedroom": 20,
        "bathroom": 70,
        "dining_room": 30,
        "office": 50
    }
    
    lumens_per_sqft = lumens_map.get(req.room_type, 30)
    room_sqft = req.room_length * req.room_width
    total_lumens = room_sqft * lumens_per_sqft
    
    # Estimate fixtures (assuming 800 lumens per bulb)
    fixtures_needed = math.ceil(total_lumens / 800)
    
    return {
        "room_square_footage": round(room_sqft, 2),
        "total_lumens_needed": round(total_lumens, 2),
        "lumens_per_sqft": lumens_per_sqft,
        "fixtures_recommended": fixtures_needed,
        "room_type": req.room_type
    }

# ============================================
# MEASUREMENT CONVERTER
# ============================================

class ConversionRequest(BaseModel):
    value: float
    from_unit: str = Field(description="inches, feet, yards, meters, cm")
    to_unit: str = Field(description="inches, feet, yards, meters, cm")

@router.post("/convert")
async def convert_measurement(req: ConversionRequest):
    """
    Convert between measurement units
    """
    # Convert to inches first
    to_inches = {
        "inches": 1,
        "feet": 12,
        "yards": 36,
        "meters": 39.3701,
        "cm": 0.393701
    }
    
    inches = req.value * to_inches[req.from_unit]
    result = inches / to_inches[req.to_unit]
    
    return {
        "original_value": req.value,
        "original_unit": req.from_unit,
        "converted_value": round(result, 4),
        "converted_unit": req.to_unit
    }
