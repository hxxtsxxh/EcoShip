import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from services.ups_services import DEMO_ROUTES, UPS_SERVICES, UPSDataLookup


# Configure logging for development debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EcoBadgeLevel(str, Enum):
    """Eco-badge levels for environmental rating."""
    MOST_ECO_FRIENDLY = "most_eco_friendly"
    ECO_FRIENDLY = "eco_friendly"
    STANDARD = "standard"
    HIGH_EMISSION = "high_emission"


@dataclass
class EmissionFactors:
    """Industry-standard carbon emission factors for transportation."""
    
    TRUCK_FACTOR: float = 0.150  # kg CO2e per tonne-km (UPS alternative fuel fleet)
    AIR_FACTOR: float = 0.570    # kg CO2e per tonne-km (commercial aviation)

    GROUND_EFFICIENCY_FACTOR: float = 0.85   # 15% more efficient than standard
    EXPRESS_EFFICIENCY_FACTOR: float = 1.10  # 10% less efficient due to speed

    TREE_OFFSET_KG_PER_YEAR: float = 21.0    # kg CO2 absorbed per tree per year
    CAR_EMISSION_KG_PER_MILE: float = 0.411  # Average passenger car emissions


@dataclass
class CarbonBreakdown:
    """Carbon calculation results with detailed breakdown and context."""
    
    total_co2_kg: float
    air_transport_co2_kg: float
    truck_transport_co2_kg: float
    air_tkm: float
    truck_tkm: float
    trees_offset_equivalent: float
    car_miles_equivalent: float
    service_name: str
    route_key: str
    weight_kg: float
    co2_per_kg: float
    co2_per_km: float


class CarbonCalculator:
    """
    SRP: Single responsibility for carbon footprint calculations.
    Does not handle service management, pricing, or route planning.
    """
    
    def __init__(self):
        self.emission_factors = EmissionFactors()
        logger.info("CarbonCalculator initialized with emission factors")
    
    def calculate_carbon_footprint(
        self, 
        route_key: str, 
        weight_kg: float, 
        service_data: Dict[str, Any]
    ) -> CarbonBreakdown:
        """
        SRP: Calculate detailed carbon footprint for a specific shipment.
        
        Args:
            route_key: Key identifying the shipping route
            weight_kg: Package weight in kilograms
            service_data: UPS service configuration data
            
        Returns:
            CarbonBreakdown: Detailed carbon emission analysis
            
        Raises:
            ValueError: If route not found or invalid inputs
        """
        # Validate inputs
        self._validate_carbon_inputs(route_key, weight_kg, service_data)
        
        # Get route data (handle fallback routes)
        route_data = DEMO_ROUTES.get(route_key)
        if not route_data and route_key.startswith("FALLBACK_"):
            # For fallback routes, we need to get the route data from the quote generator
            # This is a temporary solution - in production, fallback routes would be stored
            logger.warning(f"Fallback route '{route_key}' detected, using average route data")
            # Use average values from existing routes for fallback calculation
            all_routes = list(DEMO_ROUTES.values())
            route_data = {
                "air_distance_km": sum(r["air_distance_km"] for r in all_routes) / len(all_routes),
                "ground_distance_km": sum(r["ground_distance_km"] for r in all_routes) / len(all_routes),
                "route_complexity": "moderate"
            }
        elif not route_data:
            raise ValueError(f"Route '{route_key}' not found in available routes")
        
        # Extract distances and transport mix
        air_distance_km = route_data["air_distance_km"]
        ground_distance_km = route_data["ground_distance_km"]
        air_percentage = service_data["air_percentage"]
        truck_percentage = service_data["truck_percentage"]
        
        # Convert weight to tonnes for calculation
        weight_tonnes = weight_kg / 1000.0
        
        # Calculate tonne-kilometers for each transport mode
        air_tkm = (air_distance_km * air_percentage / 100.0) * weight_tonnes
        truck_tkm = (ground_distance_km * truck_percentage / 100.0) * weight_tonnes
        
        # Apply service-specific efficiency factors
        efficiency_factor = self._get_service_efficiency_factor(service_data)
        
        # Calculate emissions using emission factors
        air_co2_kg = air_tkm * self.emission_factors.AIR_FACTOR
        truck_co2_kg = truck_tkm * self.emission_factors.TRUCK_FACTOR * efficiency_factor
        total_co2_kg = air_co2_kg + truck_co2_kg
        
        # Calculate contextual equivalents
        trees_equivalent = total_co2_kg / self.emission_factors.TREE_OFFSET_KG_PER_YEAR
        car_miles_equivalent = total_co2_kg / self.emission_factors.CAR_EMISSION_KG_PER_MILE
        
        # Calculate efficiency metrics
        total_distance_km = max(air_distance_km, ground_distance_km)
        co2_per_kg = total_co2_kg / weight_kg if weight_kg > 0 else 0
        co2_per_km = total_co2_kg / total_distance_km if total_distance_km > 0 else 0
        
        logger.info(f"Carbon calculated for {service_data['name']}: {total_co2_kg:.3f} kg CO2")
        
        return CarbonBreakdown(
            total_co2_kg=round(total_co2_kg, 3),
            air_transport_co2_kg=round(air_co2_kg, 3),
            truck_transport_co2_kg=round(truck_co2_kg, 3),
            air_tkm=round(air_tkm, 3),
            truck_tkm=round(truck_tkm, 3),
            trees_offset_equivalent=round(trees_equivalent, 2),
            car_miles_equivalent=round(car_miles_equivalent, 1),
            service_name=service_data["name"],
            route_key=route_key,
            weight_kg=weight_kg,
            co2_per_kg=round(co2_per_kg, 4),
            co2_per_km=round(co2_per_km, 4)
        )
    
    def _get_service_efficiency_factor(self, service_data: Dict[str, Any]) -> float:
        """
        SRP: Determine efficiency factor based on service type.
        Ground services are more efficient, express services less efficient.
        """
        service_name = service_data["name"].lower()
        
        if "ground" in service_name:
            return self.emission_factors.GROUND_EFFICIENCY_FACTOR
        elif any(express_term in service_name for express_term in ["next day", "early", "express"]):
            return self.emission_factors.EXPRESS_EFFICIENCY_FACTOR
        else:
            return 1.0  # Standard efficiency
    
    def _validate_carbon_inputs(
        self, 
        route_key: str, 
        weight_kg: float, 
        service_data: Dict[str, Any]
    ) -> None:
        """
        SRP: Validate inputs for carbon calculation.
        """
        if not route_key or not isinstance(route_key, str):
            raise ValueError("Route key must be a non-empty string")
        
        if weight_kg <= 0 or weight_kg > 70:
            raise ValueError("Weight must be between 0 and 70 kg")
        
        if not service_data or not isinstance(service_data, dict):
            raise ValueError("Service data must be a valid dictionary")
        
        required_fields = ["name", "air_percentage", "truck_percentage"]
        for field in required_fields:
            if field not in service_data:
                raise ValueError(f"Service data missing required field: {field}")


class CarbonComparison:
    """
    SRP: Single responsibility for comparing carbon footprints across services.
    Does not handle individual calculations or business logic.
    """
    
    def __init__(self):
        self.calculator = CarbonCalculator()
        logger.info("CarbonComparison initialized")
    
    def carbon_comparison(
        self, 
        route_key: str, 
        weight_kg: float
    ) -> Dict[str, Any]:
        """
        SRP: Compare carbon footprints across all UPS services for given route/weight.
        
        Args:
            route_key: Shipping route identifier
            weight_kg: Package weight in kilograms
            
        Returns:
            Dict containing comparison analysis and eco-badge assignments
        """
        logger.info(f"Starting carbon comparison for route {route_key}, weight {weight_kg}kg")
        
        # Calculate carbon for all services
        carbon_results = []
        for service_key, service_data in UPS_SERVICES.items():
            try:
                carbon_breakdown = self.calculator.calculate_carbon_footprint(
                    route_key, weight_kg, service_data
                )
                carbon_results.append({
                    "service_key": service_key,
                    "service_name": service_data["name"],
                    "carbon_breakdown": carbon_breakdown,
                    "priority_level": service_data["priority_level"]
                })
            except Exception as e:
                logger.warning(f"Failed to calculate carbon for {service_data['name']}: {e}")
                continue
        
        if not carbon_results:
            raise ValueError("No valid carbon calculations could be performed")
        
        # Sort by carbon emissions (lowest first)
        carbon_results.sort(key=lambda x: x["carbon_breakdown"].total_co2_kg)
        
        # Extract carbon values for analysis
        carbon_values = [result["carbon_breakdown"].total_co2_kg for result in carbon_results]
        
        # Calculate statistics
        min_carbon = min(carbon_values)
        max_carbon = max(carbon_values)
        avg_carbon = sum(carbon_values) / len(carbon_values)
        
        # Assign eco-badges and calculate savings
        for result in carbon_results:
            carbon_kg = result["carbon_breakdown"].total_co2_kg
            
            # Calculate percentage savings vs highest emission service
            if max_carbon > 0:
                savings_percentage = ((max_carbon - carbon_kg) / max_carbon) * 100
            else:
                savings_percentage = 0
            
            # Assign eco-badge based on carbon efficiency
            eco_badge = self._assign_eco_badge(carbon_kg, min_carbon, max_carbon, avg_carbon)
            
            result["carbon_savings_percentage"] = round(savings_percentage, 1)
            result["eco_badge"] = eco_badge
        
        # Identify eco-friendly options (below average emissions)
        eco_friendly_services = [
            result["service_name"] 
            for result in carbon_results 
            if result["carbon_breakdown"].total_co2_kg <= avg_carbon
        ]
        
        logger.info(f"Carbon comparison completed. Range: {min_carbon:.3f} - {max_carbon:.3f} kg CO2")
        
        return {
            "carbon_results": carbon_results,
            "statistics": {
                "lowest_carbon_service": carbon_results[0]["service_name"],
                "highest_carbon_service": carbon_results[-1]["service_name"],
                "min_carbon_kg": round(min_carbon, 3),
                "max_carbon_kg": round(max_carbon, 3),
                "avg_carbon_kg": round(avg_carbon, 3),
                "carbon_range_kg": round(max_carbon - min_carbon, 3)
            },
            "eco_friendly_services": eco_friendly_services,
            "route_key": route_key,
            "weight_kg": weight_kg
        }
    
    def _assign_eco_badge(
        self, 
        carbon_kg: float, 
        min_carbon: float, 
        max_carbon: float, 
        avg_carbon: float
    ) -> EcoBadgeLevel:
        """
        SRP: Assign eco-badge based on carbon efficiency relative to other services.
        """
        if carbon_kg == min_carbon:
            return EcoBadgeLevel.MOST_ECO_FRIENDLY
        elif carbon_kg <= avg_carbon:
            return EcoBadgeLevel.ECO_FRIENDLY
        elif carbon_kg >= max_carbon * 0.9:  # Within 10% of highest
            return EcoBadgeLevel.HIGH_EMISSION
        else:
            return EcoBadgeLevel.STANDARD


# Utility functions for easy access
def calculate_carbon_footprint(route_key: str, weight_kg: float, service_data: Dict[str, Any]) -> CarbonBreakdown:
    """
    SRP: Convenience function for carbon footprint calculation.
    """
    calculator = CarbonCalculator()
    return calculator.calculate_carbon_footprint(route_key, weight_kg, service_data)


def carbon_comparison(route_key: str, weight_kg: float) -> Dict[str, Any]:
    """
    SRP: Convenience function for carbon comparison across services.
    """
    comparison = CarbonComparison()
    return comparison.carbon_comparison(route_key, weight_kg)
