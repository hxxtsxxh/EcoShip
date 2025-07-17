import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

from services.ups_services import DEMO_ROUTES, UPS_SERVICES, UPSDataLookup, WEIGHT_CATEGORIES
from models.shipping import WeightCategory, EcoBadge


# Configure logging for development debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PricingFactors:
    """UPS-style pricing factors and multipliers."""
    
    # Zone-based distance multipliers
    SHORT_DISTANCE_MULTIPLIER: float = 0.8   # < 1000 km
    MEDIUM_DISTANCE_MULTIPLIER: float = 1.0  # 1000-3000 km  
    LONG_DISTANCE_MULTIPLIER: float = 1.3    # > 3000 km
    
    # Distance thresholds (km)
    SHORT_DISTANCE_THRESHOLD: int = 1000
    LONG_DISTANCE_THRESHOLD: int = 3000
    
    # Fuel surcharge (percentage of base cost)
    FUEL_SURCHARGE_PERCENTAGE: float = 12.5
    
    # Service-specific premium multipliers
    PREMIUM_MULTIPLIERS = {
        "UPS_NEXT_DAY_AIR_EARLY": 1.15,  # 15% premium for early delivery
        "UPS_NEXT_DAY_AIR": 1.05,        # 5% premium for standard next day
        "UPS_NEXT_DAY_AIR_SAVER": 1.0,   # No premium
        "UPS_2ND_DAY_AIR": 0.95,         # 5% discount
        "UPS_3_DAY_SELECT": 0.90,        # 10% discount
        "UPS_GROUND": 0.85               # 15% discount
    }
    
    # Minimum costs by service (USD)
    MINIMUM_COSTS = {
        "UPS_NEXT_DAY_AIR_EARLY": 95.0,
        "UPS_NEXT_DAY_AIR": 75.0,
        "UPS_NEXT_DAY_AIR_SAVER": 65.0,
        "UPS_2ND_DAY_AIR": 35.0,
        "UPS_3_DAY_SELECT": 25.0,
        "UPS_GROUND": 15.0
    }


class ShippingCostCalculator:
    """
    SRP: Single responsibility for calculating shipping costs.
    Does not handle carbon calculations or quote generation.
    """
    
    def __init__(self):
        self.pricing_factors = PricingFactors()
        logger.info("ShippingCostCalculator initialized")
    
    def calculate_shipping_cost(
        self,
        route_data: Dict[str, Any],
        weight_kg: float,
        service_data: Dict[str, Any],
        service_key: str
    ) -> float:
        """
        SRP: Calculate shipping cost using UPS-style pricing structure.
        
        Args:
            route_data: Route information including distances and base cost
            weight_kg: Package weight in kilograms
            service_data: UPS service configuration
            service_key: Service identifier for premium lookup
            
        Returns:
            float: Total shipping cost in USD
        """
        logger.debug(f"Calculating cost for {service_data['name']}, {weight_kg}kg")
        
        # Get base cost components
        base_cost_per_kg = route_data["base_cost_per_kg"]
        service_multiplier = service_data["base_cost_multiplier"]
        distance_km = max(route_data["air_distance_km"], route_data["ground_distance_km"])
        
        # Calculate base cost
        base_cost = weight_kg * base_cost_per_kg * service_multiplier
        
        # Apply zone-based distance multiplier
        distance_multiplier = self._get_distance_multiplier(distance_km)
        base_cost *= distance_multiplier
        
        # Apply weight category adjustment
        weight_category = UPSDataLookup.get_weight_category_for_weight(weight_kg)
        category_data = WEIGHT_CATEGORIES[weight_category]
        base_cost *= category_data["cost_adjustment"]
        
        # Add fuel surcharge
        fuel_surcharge = base_cost * (self.pricing_factors.FUEL_SURCHARGE_PERCENTAGE / 100)
        base_cost += fuel_surcharge
        
        # Apply service-specific premium
        premium_multiplier = self.pricing_factors.PREMIUM_MULTIPLIERS.get(service_key, 1.0)
        final_cost = base_cost * premium_multiplier
        
        # Ensure minimum cost
        minimum_cost = self.pricing_factors.MINIMUM_COSTS.get(service_key, 15.0)
        final_cost = max(final_cost, minimum_cost)
        
        logger.debug(f"Final cost calculated: ${final_cost:.2f}")
        return round(final_cost, 2)
    
    def _get_distance_multiplier(self, distance_km: float) -> float:
        """
        SRP: Determine distance-based pricing multiplier.
        """
        if distance_km < self.pricing_factors.SHORT_DISTANCE_THRESHOLD:
            return self.pricing_factors.SHORT_DISTANCE_MULTIPLIER
        elif distance_km > self.pricing_factors.LONG_DISTANCE_THRESHOLD:
            return self.pricing_factors.LONG_DISTANCE_MULTIPLIER
        else:
            return self.pricing_factors.MEDIUM_DISTANCE_MULTIPLIER


class RouteManager:
    """
    SRP: Single responsibility for route lookup and validation.
    Does not handle pricing or quote generation.
    """
    
    def __init__(self):
        logger.info("RouteManager initialized")
    
    def route_lookup(
        self,
        origin_city: str,
        destination_city: str
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        """
        SRP: Handle bidirectional route matching with fallback options.
        
        Args:
            origin_city: Origin city name
            destination_city: Destination city name
            
        Returns:
            Tuple of (route_key, route_data) or (None, None) if not found
        """
        logger.info(f"Looking up route: {origin_city} → {destination_city}")
        
        # Try direct route lookup
        route_result = UPSDataLookup.find_route_by_cities(origin_city, destination_city)
        if route_result:
            route_key, route_data = route_result
            logger.info(f"Direct route found: {route_key}")
            return route_key, route_data
        
        # Try reverse route lookup (bidirectional)
        route_result = UPSDataLookup.find_route_by_cities(destination_city, origin_city)
        if route_result:
            route_key, route_data = route_result
            logger.info(f"Reverse route found: {route_key}")
            # Return route data with swapped origin/destination for consistency
            swapped_route_data = self._swap_route_direction(route_data)
            return route_key, swapped_route_data
        
        logger.warning(f"No route found for {origin_city} → {destination_city}")
        return None, None
    
    def _swap_route_direction(self, route_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        SRP: Swap origin and destination in route data for bidirectional matching.
        """
        swapped_data = route_data.copy()
        swapped_data["origin"], swapped_data["destination"] = (
            route_data["destination"], 
            route_data["origin"]
        )
        return swapped_data
    
    def get_fallback_route_data(
        self,
        origin_city: str,
        destination_city: str
    ) -> Dict[str, Any]:
        """
        SRP: Provide fallback route data for unsupported routes.
        Uses average values from existing routes.
        """
        logger.info(f"Generating fallback route data for {origin_city} → {destination_city}")
        
        # Calculate average values from existing routes
        all_routes = list(DEMO_ROUTES.values())
        avg_air_distance = sum(r["air_distance_km"] for r in all_routes) / len(all_routes)
        avg_ground_distance = sum(r["ground_distance_km"] for r in all_routes) / len(all_routes)
        avg_base_cost = sum(r["base_cost_per_kg"] for r in all_routes) / len(all_routes)
        
        return {
            "origin": {"city": origin_city, "state": "XX", "zip_code": "00000"},
            "destination": {"city": destination_city, "state": "XX", "zip_code": "00000"},
            "air_distance_km": round(avg_air_distance),
            "ground_distance_km": round(avg_ground_distance),
            "base_cost_per_kg": round(avg_base_cost, 2),
            "route_complexity": "moderate",
            "estimated_ground_days": 4,
            "major_hubs": ["Hub City"],
            "description": f"Estimated route from {origin_city} to {destination_city}",
            "is_fallback": True
        }


class QuoteGenerator:
    """
    SRP: Single responsibility for generating comprehensive shipping quotes.
    Orchestrates cost calculation, carbon analysis, and quote formatting.
    """
    
    def __init__(self):
        self.cost_calculator = ShippingCostCalculator()
        self.route_manager = RouteManager()
        logger.info("QuoteGenerator initialized with all components")
    
    def generate_shipping_quotes(
        self,
        origin_city: str,
        destination_city: str,
        weight_kg: float
    ) -> Dict[str, Any]:
        """
        SRP: Generate comprehensive shipping quotes for all UPS services.
        
        Args:
            origin_city: Origin city name
            destination_city: Destination city name
            weight_kg: Package weight in kilograms
            
        Returns:
            Dict containing quotes, carbon comparison, and route info
            
        Raises:
            ValueError: If inputs are invalid or no quotes can be generated
        """
        logger.info(f"Generating quotes: {origin_city} → {destination_city}, {weight_kg}kg")
        
        # Validate inputs
        self._validate_quote_inputs(origin_city, destination_city, weight_kg)
        
        # Get route data
        route_key, route_data = self.route_manager.route_lookup(origin_city, destination_city)
        
        if not route_data:
            # Use fallback route data for unsupported routes
            route_key = f"FALLBACK_{origin_city.upper()}_{destination_city.upper()}"
            route_data = self.route_manager.get_fallback_route_data(origin_city, destination_city)
            logger.warning(f"Using fallback route data for {route_key}")
        
        # Generate quotes for all services
        quotes = []
        for service_key, service_data in UPS_SERVICES.items():
            try:
                # Calculate shipping cost
                cost_usd = self.cost_calculator.calculate_shipping_cost(
                    route_data, weight_kg, service_data, service_key
                )
                
                # Calculate carbon footprint (import locally to avoid circular import)
                from utils.carbon_calculator import CarbonCalculator
                carbon_calculator = CarbonCalculator()
                carbon_breakdown = carbon_calculator.calculate_carbon_footprint(
                    route_key, weight_kg, service_data
                )
                
                # Create quote
                quote = {
                    "service_key": service_key,
                    "service_name": service_data["name"],
                    "service_code": service_data["code"],
                    "commitment_time": service_data["commitment"],
                    "eta_hours": service_data["eta_hours"],
                    "cost_usd": cost_usd,
                    "carbon_breakdown": carbon_breakdown,
                    "priority_level": service_data["priority_level"],
                    "tracking_included": service_data.get("tracking_included", True),
                    "insurance_included": service_data.get("insurance_included", False),
                    "signature_required": service_data.get("signature_required", False)
                }
                
                quotes.append(quote)
                
            except Exception as e:
                logger.error(f"Failed to generate quote for {service_data['name']}: {e}")
                continue
        
        if not quotes:
            raise ValueError("No valid quotes could be generated")
        
        # Sort quotes: PRIMARY=eta_hours, SECONDARY=carbon_kg, TERTIARY=cost
        quotes.sort(key=lambda q: (
            q["eta_hours"],
            q["carbon_breakdown"].total_co2_kg,
            q["cost_usd"]
        ))
        
        # Get carbon comparison data (import locally to avoid circular import)
        try:
            from utils.carbon_calculator import CarbonComparison
            carbon_comparison = CarbonComparison()
            carbon_comparison_data = carbon_comparison.carbon_comparison(route_key, weight_kg)
        except Exception as e:
            logger.error(f"Carbon comparison failed: {e}")
            carbon_comparison_data = {"error": "An error occurred while calculating carbon comparison data."}
        
        # Add eco-badges and carbon savings to quotes
        self._add_eco_badges_to_quotes(quotes, carbon_comparison_data)
        
        # Calculate summary statistics
        costs = [q["cost_usd"] for q in quotes]
        carbon_values = [q["carbon_breakdown"].total_co2_kg for q in quotes]
        
        result = {
            "quotes": quotes,
            "carbon_comparison": carbon_comparison_data,
            "route_info": {
                "route_key": route_key,
                "origin_city": origin_city,
                "destination_city": destination_city,
                "total_distance_km": max(route_data["air_distance_km"], route_data["ground_distance_km"]),
                "air_distance_km": route_data["air_distance_km"],
                "ground_distance_km": route_data["ground_distance_km"],
                "route_complexity": route_data["route_complexity"],
                "is_fallback": route_data.get("is_fallback", False)
            },
            "summary": {
                "total_quotes": len(quotes),
                "price_range_usd": {"min": min(costs), "max": max(costs)},
                "carbon_range_kg": {"min": min(carbon_values), "max": max(carbon_values)},
                "fastest_service": quotes[0]["service_name"],
                "cheapest_service": min(quotes, key=lambda q: q["cost_usd"])["service_name"],
                "most_eco_friendly": min(quotes, key=lambda q: q["carbon_breakdown"].total_co2_kg)["service_name"]
            },
            "request_metadata": {
                "origin_city": origin_city,
                "destination_city": destination_city,
                "weight_kg": weight_kg,
                "generated_at": datetime.utcnow().isoformat(),
                "quote_valid_until": (datetime.utcnow() + timedelta(hours=24)).isoformat()
            }
        }
        
        logger.info(f"Generated {len(quotes)} quotes successfully")
        return result
    
    def _validate_quote_inputs(
        self,
        origin_city: str,
        destination_city: str,
        weight_kg: float
    ) -> None:
        """
        SRP: Validate inputs for quote generation.
        """
        if not origin_city or not isinstance(origin_city, str) or len(origin_city.strip()) == 0:
            raise ValueError("Origin city must be a non-empty string")
        
        if not destination_city or not isinstance(destination_city, str) or len(destination_city.strip()) == 0:
            raise ValueError("Destination city must be a non-empty string")
        
        if origin_city.strip().lower() == destination_city.strip().lower():
            raise ValueError("Origin and destination cities cannot be the same")
        
        if not isinstance(weight_kg, (int, float)) or weight_kg <= 0:
            raise ValueError("Weight must be a positive number")
        
        if weight_kg > 70:
            raise ValueError("Weight cannot exceed 70kg for standard UPS services")
    
    def _add_eco_badges_to_quotes(
        self,
        quotes: List[Dict[str, Any]],
        carbon_comparison_data: Dict[str, Any]
    ) -> None:
        """
        SRP: Add eco-badges and carbon savings percentages to quotes.
        """
        if "carbon_results" not in carbon_comparison_data:
            return
        
        # Create lookup for carbon savings by service name
        carbon_lookup = {
            result["service_name"]: {
                "eco_badge": result["eco_badge"],
                "carbon_savings_percentage": result["carbon_savings_percentage"]
            }
            for result in carbon_comparison_data["carbon_results"]
        }
        
        # Add eco-badge data to quotes
        for quote in quotes:
            service_name = quote["service_name"]
            if service_name in carbon_lookup:
                quote["eco_badge"] = carbon_lookup[service_name]["eco_badge"]
                quote["carbon_savings_percentage"] = carbon_lookup[service_name]["carbon_savings_percentage"]
            else:
                quote["eco_badge"] = "standard"
                quote["carbon_savings_percentage"] = 0.0


# Convenience functions for easy access
def generate_shipping_quotes(origin_city: str, destination_city: str, weight_kg: float) -> Dict[str, Any]:
    """
    SRP: Convenience function for generating shipping quotes.
    """
    generator = QuoteGenerator()
    return generator.generate_shipping_quotes(origin_city, destination_city, weight_kg)
