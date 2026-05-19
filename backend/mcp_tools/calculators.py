import math

def calculate_tile_needs(area_m2: float, coverage_per_box: float, wastage_percent: float = 5.0) -> dict:
    """Kalkulasi kebutuhan ubin, semen perekat, dan semen nat (grout)"""
    total_area_needed = area_m2 * (1 + wastage_percent / 100.0)
    boxes_needed = math.ceil(total_area_needed / coverage_per_box)
    
    # Asumsi 1 sak semen perekat (40kg) = 5 m2
    cement_sacks = math.ceil(total_area_needed / 5.0)
    
    # Asumsi 1 bag semen nat (grout - 1kg) = 3 m2
    grout_bags = math.ceil(total_area_needed / 3.0)
    
    return {
        "boxes_needed": boxes_needed,
        "cement_sacks_needed": cement_sacks,
        "grout_bags_needed": grout_bags
    }

def calculate_wood_needs(area_m2: float, coverage_per_panel: float, wastage_percent: float = 8.0) -> dict:
    """Kalkulasi panel kayu/WPC dan pelindung coating"""
    total_area_needed = area_m2 * (1 + wastage_percent / 100.0)
    panels_needed = math.ceil(total_area_needed / coverage_per_panel)
    
    # Asumsi 1 kaleng coating pelindung UV = 10 m2
    coating_cans = math.ceil(total_area_needed / 10.0)
    
    return {
        "panels_needed": panels_needed,
        "coating_cans_needed": coating_cans
    }

def calculate_stone_needs(area_m2: float, coverage_per_unit: float, wastage_percent: float = 10.0) -> dict:
    """Kalkulasi batu alam, heavy-duty bonding agent, dan joint filler"""
    total_area_needed = area_m2 * (1 + wastage_percent / 100.0)
    stone_units_needed = math.ceil(total_area_needed / coverage_per_unit)
    
    # Asumsi 1 sak polymer-cement bonding agent (heavy duty) = 3 m2
    bonding_agent_bags = math.ceil(total_area_needed / 3.0)
    
    # Asumsi 1 sak joint filler khusus batu = 4 m2
    grout_bags = math.ceil(total_area_needed / 4.0)
    
    return {
        "stone_units_needed": stone_units_needed,
        "bonding_agent_bags_needed": bonding_agent_bags,
        "grout_bags_needed": grout_bags
    }

def calculate_paint_needs(area_m2: float, coverage_per_pail: float, coats: int = 2, wastage_percent: float = 5.0) -> dict:
    """Kalkulasi cat utama (double coat) dan cat primer dasar"""
    total_area_needed = area_m2 * (1 + wastage_percent / 100.0)
    total_paint_area = total_area_needed * coats
    pails_needed = math.ceil(total_paint_area / coverage_per_pail)
    
    # Cat primer dasar cukup 1 lapis (1 coat) dengan daya sebar 1.2x cat utama
    primer_pails_needed = math.ceil(total_area_needed / (coverage_per_pail * 1.2))
    
    return {
        "pails_needed": pails_needed,
        "primer_pails_needed": primer_pails_needed
    }

