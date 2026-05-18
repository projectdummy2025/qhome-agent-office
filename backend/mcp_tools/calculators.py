import math

def calculate_tile_needs(area_m2: float, coverage_per_box: float, wastage_percent: float = 5.0) -> dict:
    """Kalkulasi kebutuhan ubin dan semen"""
    total_area_needed = area_m2 * (1 + wastage_percent / 100.0)
    boxes_needed = math.ceil(total_area_needed / coverage_per_box)
    
    # Asumsi 1 sak semen (40kg) = 5 m2
    cement_sacks = math.ceil(total_area_needed / 5.0)
    
    return {
        "boxes_needed": boxes_needed,
        "cement_sacks_needed": cement_sacks
    }

def calculate_wood_needs(area_m2: float, coverage_per_panel: float) -> dict:
    """Kalkulasi panel kayu/WPC"""
    panels_needed = math.ceil(area_m2 / coverage_per_panel)
    return {
        "panels_needed": panels_needed
    }

def calculate_paint_needs(area_m2: float, coverage_per_pail: float, coats: int = 2) -> dict:
    """Kalkulasi cat (double coat)"""
    total_area = area_m2 * coats
    pails_needed = math.ceil(total_area / coverage_per_pail)
    return {
        "pails_needed": pails_needed
    }
