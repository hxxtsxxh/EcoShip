from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from models.shipping import WeightCategory, EcoBadge, TransportMode


# SRP: Single responsibility for UPS service definitions
UPS_SERVICES = {
    "UPS_NEXT_DAY_AIR_EARLY": {
        "name": "UPS Next Day Air Early",
        "code": "14",
        "commitment": "Next Business Day by 8:00 AM",
        "eta_hours": 14,  # Next business day early morning
        "air_percentage": 95.0,
        "truck_percentage": 5.0,
        "base_cost_multiplier": 4.5,
        "priority_level": 1,
        "eco_badge": EcoBadge.STANDARD,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": True,
        "carbon_factor_kg_per_km": 0.85,  # High carbon due to priority air transport
        "description": "Fastest delivery option with early morning commitment"
    },
    "UPS_NEXT_DAY_AIR": {
        "name": "UPS Next Day Air",
        "code": "01",
        "commitment": "Next Business Day by 10:30 AM",
        "eta_hours": 16,  # Next business day morning
        "air_percentage": 90.0,
        "truck_percentage": 10.0,
        "base_cost_multiplier": 3.8,
        "priority_level": 2,
        "eco_badge": EcoBadge.STANDARD,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": False,
        "carbon_factor_kg_per_km": 0.78,
        "description": "Premium next-day delivery service"
    },
    "UPS_NEXT_DAY_AIR_SAVER": {
        "name": "UPS Next Day Air Saver",
        "code": "13",
        "commitment": "Next Business Day by 3:00 PM",
        "eta_hours": 20,  # Next business day afternoon
        "air_percentage": 85.0,
        "truck_percentage": 15.0,
        "base_cost_multiplier": 3.2,
        "priority_level": 3,
        "eco_badge": EcoBadge.STANDARD,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": False,
        "carbon_factor_kg_per_km": 0.72,
        "description": "Cost-effective next-day delivery option"
    },
    "UPS_2ND_DAY_AIR": {
        "name": "UPS 2nd Day Air",
        "code": "02",
        "commitment": "2 Business Days by 10:30 AM",
        "eta_hours": 40,  # 2 business days
        "air_percentage": 75.0,
        "truck_percentage": 25.0,
        "base_cost_multiplier": 2.1,
        "priority_level": 4,
        "eco_badge": EcoBadge.ECO_FRIENDLY,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": False,
        "carbon_factor_kg_per_km": 0.58,
        "description": "Reliable 2-day delivery with air transport"
    },
    "UPS_3_DAY_SELECT": {
        "name": "UPS 3-Day Select",
        "code": "12",
        "commitment": "3 Business Days by End of Day",
        "eta_hours": 72,  # 3 business days
        "air_percentage": 40.0,
        "truck_percentage": 60.0,
        "base_cost_multiplier": 1.6,
        "priority_level": 5,
        "eco_badge": EcoBadge.ECO_FRIENDLY,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": False,
        "carbon_factor_kg_per_km": 0.42,
        "description": "Economical 3-day delivery with mixed transport"
    },
    "UPS_GROUND": {
        "name": "UPS Ground",
        "code": "03",
        "commitment": "1-5 Business Days",
        "eta_hours": 120,  # 5 business days maximum
        "air_percentage": 5.0,
        "truck_percentage": 95.0,
        "base_cost_multiplier": 1.0,
        "priority_level": 6,
        "eco_badge": EcoBadge.CARBON_NEUTRAL,
        "tracking_included": True,
        "insurance_included": False,
        "signature_required": False,
        "carbon_factor_kg_per_km": 0.18,
        "description": "Most environmentally friendly ground delivery option"
    }
}


# SRP: Single responsibility for popular US shipping routes data
DEMO_ROUTES = {
    "NYC_LA": {
        "origin": {"city": "New York", "state": "NY", "zip_code": "10001"},
        "destination": {"city": "Los Angeles", "state": "CA", "zip_code": "90210"},
        "air_distance_km": 3944,
        "ground_distance_km": 4501,
        "base_cost_per_kg": 8.50,
        "route_complexity": "complex",
        "estimated_ground_days": 5,
        "major_hubs": ["Chicago", "Denver"],
        "description": "Cross-country route from East Coast to West Coast"
    },
    "SF_CHICAGO": {
        "origin": {"city": "San Francisco", "state": "CA", "zip_code": "94102"},
        "destination": {"city": "Chicago", "state": "IL", "zip_code": "60601"},
        "air_distance_km": 2960,
        "ground_distance_km": 3420,
        "base_cost_per_kg": 7.25,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Denver", "Kansas City"],
        "description": "West Coast to Midwest major business corridor"
    },
    "MIAMI_SEATTLE": {
        "origin": {"city": "Miami", "state": "FL", "zip_code": "33101"},
        "destination": {"city": "Seattle", "state": "WA", "zip_code": "98101"},
        "air_distance_km": 4308,
        "ground_distance_km": 5145,
        "base_cost_per_kg": 9.75,
        "route_complexity": "complex",
        "estimated_ground_days": 5,
        "major_hubs": ["Atlanta", "Chicago", "Denver"],
        "description": "Southeast to Pacific Northwest diagonal route"
    },
    "BOSTON_DALLAS": {
        "origin": {"city": "Boston", "state": "MA", "zip_code": "02101"},
        "destination": {"city": "Dallas", "state": "TX", "zip_code": "75201"},
        "air_distance_km": 2563,
        "ground_distance_km": 3089,
        "base_cost_per_kg": 6.80,
        "route_complexity": "moderate",
        "estimated_ground_days": 3,
        "major_hubs": ["New York", "Atlanta"],
        "description": "Northeast to South-Central business route"
    },
    "DENVER_ATLANTA": {
        "origin": {"city": "Denver", "state": "CO", "zip_code": "80202"},
        "destination": {"city": "Atlanta", "state": "GA", "zip_code": "30303"},
        "air_distance_km": 1770,
        "ground_distance_km": 2092,
        "base_cost_per_kg": 5.90,
        "route_complexity": "simple",
        "estimated_ground_days": 3,
        "major_hubs": ["Kansas City"],
        "description": "Mountain West to Southeast hub-to-hub route"
    },
    "PHOENIX_DETROIT": {
        "origin": {"city": "Phoenix", "state": "AZ", "zip_code": "85001"},
        "destination": {"city": "Detroit", "state": "MI", "zip_code": "48201"},
        "air_distance_km": 2570,
        "ground_distance_km": 2890,
        "base_cost_per_kg": 7.10,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Denver", "Chicago"],
        "description": "Southwest to Great Lakes industrial corridor"
    },
    # Additional routes for expanded coverage
    "PORTLAND_HOUSTON": {
        "origin": {"city": "Portland", "state": "OR", "zip_code": "97201"},
        "destination": {"city": "Houston", "state": "TX", "zip_code": "77001"},
        "air_distance_km": 2890,
        "ground_distance_km": 3420,
        "base_cost_per_kg": 7.80,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["San Francisco", "Los Angeles", "Phoenix"],
        "description": "Pacific Northwest to Gulf Coast energy corridor"
    },
    "ORLANDO_MINNEAPOLIS": {
        "origin": {"city": "Orlando", "state": "FL", "zip_code": "32801"},
        "destination": {"city": "Minneapolis", "state": "MN", "zip_code": "55401"},
        "air_distance_km": 1890,
        "ground_distance_km": 2245,
        "base_cost_per_kg": 6.20,
        "route_complexity": "simple",
        "estimated_ground_days": 3,
        "major_hubs": ["Atlanta", "Chicago"],
        "description": "Southeast tourism hub to Upper Midwest"
    },
    "SALT_LAKE_CITY_PHILADELPHIA": {
        "origin": {"city": "Salt Lake City", "state": "UT", "zip_code": "84101"},
        "destination": {"city": "Philadelphia", "state": "PA", "zip_code": "19101"},
        "air_distance_km": 2890,
        "ground_distance_km": 3380,
        "base_cost_per_kg": 7.60,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Denver", "Chicago"],
        "description": "Mountain West to Northeast corridor"
    },
    "NASHVILLE_SAN_DIEGO": {
        "origin": {"city": "Nashville", "state": "TN", "zip_code": "37201"},
        "destination": {"city": "San Diego", "state": "CA", "zip_code": "92101"},
        "air_distance_km": 2780,
        "ground_distance_km": 3290,
        "base_cost_per_kg": 7.40,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Dallas", "Phoenix"],
        "description": "Music City to Southern California coast"
    },
    "CHARLOTTE_KANSAS_CITY": {
        "origin": {"city": "Charlotte", "state": "NC", "zip_code": "28201"},
        "destination": {"city": "Kansas City", "state": "MO", "zip_code": "64101"},
        "air_distance_km": 1120,
        "ground_distance_km": 1340,
        "base_cost_per_kg": 4.80,
        "route_complexity": "simple",
        "estimated_ground_days": 2,
        "major_hubs": ["Atlanta"],
        "description": "Southeast financial hub to Midwest logistics center"
    },
    "SACRAMENTO_MEMPHIS": {
        "origin": {"city": "Sacramento", "state": "CA", "zip_code": "95814"},
        "destination": {"city": "Memphis", "state": "TN", "zip_code": "38101"},
        "air_distance_km": 2650,
        "ground_distance_km": 3120,
        "base_cost_per_kg": 7.20,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Denver", "Dallas"],
        "description": "California capital to Mid-South distribution hub"
    },
    "BUFFALO_ALBUQUERQUE": {
        "origin": {"city": "Buffalo", "state": "NY", "zip_code": "14201"},
        "destination": {"city": "Albuquerque", "state": "NM", "zip_code": "87101"},
        "air_distance_km": 2420,
        "ground_distance_km": 2890,
        "base_cost_per_kg": 6.90,
        "route_complexity": "moderate",
        "estimated_ground_days": 4,
        "major_hubs": ["Chicago", "Denver"],
        "description": "Great Lakes region to Southwest high desert"
    },
    "RICHMOND_MILWAUKEE": {
        "origin": {"city": "Richmond", "state": "VA", "zip_code": "23219"},
        "destination": {"city": "Milwaukee", "state": "WI", "zip_code": "53201"},
        "air_distance_km": 1180,
        "ground_distance_km": 1420,
        "base_cost_per_kg": 5.10,
        "route_complexity": "simple",
        "estimated_ground_days": 2,
        "major_hubs": ["Washington DC", "Chicago"],
        "description": "Mid-Atlantic to Great Lakes manufacturing region"
    },
    "TUCSON_COLUMBUS": {
        "origin": {"city": "Tucson", "state": "AZ", "zip_code": "85701"},
        "destination": {"city": "Columbus", "state": "OH", "zip_code": "43215"},
        "air_distance_km": 2340,
        "ground_distance_km": 2780,
        "base_cost_per_kg": 6.70,
        "route_complexity": "moderate",
        "estimated_ground_days": 3,
        "major_hubs": ["Phoenix", "Denver", "Chicago"],
        "description": "Desert Southwest to Ohio Valley business center"
    }
}


# SRP: Single responsibility for weight category definitions
WEIGHT_CATEGORIES = {
    WeightCategory.ENVELOPE: {
        "max_weight_kg": 0.5,
        "typical_weight_kg": 0.1,
        "dimensions_cm": {"length": 30, "width": 23, "height": 2},
        "cost_adjustment": 0.8,  # 20% discount for lightweight items
        "description": "Documents, letters, small flat items"
    },
    WeightCategory.SMALL: {
        "max_weight_kg": 2.0,
        "typical_weight_kg": 0.8,
        "dimensions_cm": {"length": 25, "width": 20, "height": 15},
        "cost_adjustment": 0.9,  # 10% discount
        "description": "Small electronics, books, accessories"
    },
    WeightCategory.MEDIUM: {
        "max_weight_kg": 10.0,
        "typical_weight_kg": 4.5,
        "dimensions_cm": {"length": 40, "width": 30, "height": 25},
        "cost_adjustment": 1.0,  # Standard pricing
        "description": "Clothing, shoes, medium electronics"
    },
    WeightCategory.LARGE: {
        "max_weight_kg": 70.0,
        "typical_weight_kg": 25.0,
        "dimensions_cm": {"length": 80, "width": 60, "height": 50},
        "cost_adjustment": 1.2,  # 20% surcharge for large items
        "description": "Large appliances, furniture, bulk items"
    }
}


class UPSDataLookup:
    """
    SRP: Single responsibility for UPS data lookup operations.
    Does not handle business logic or calculations.
    """
    
    @staticmethod
    def get_service_by_code(service_code: str) -> Optional[Dict]:
        """
        SRP: Lookup UPS service by service code.
        """
        for service_key, service_data in UPS_SERVICES.items():
            if service_data["code"] == service_code:
                return service_data
        return None
    
    @staticmethod
    def get_service_by_name(service_name: str) -> Optional[Dict]:
        """
        SRP: Lookup UPS service by service name.
        """
        for service_key, service_data in UPS_SERVICES.items():
            if service_data["name"] == service_name:
                return service_data
        return None
    
    @staticmethod
    def get_services_by_priority() -> List[Dict]:
        """
        SRP: Get all services sorted by priority level.
        """
        services = list(UPS_SERVICES.values())
        return sorted(services, key=lambda s: s["priority_level"])
    
    @staticmethod
    def get_eco_friendly_services() -> List[Dict]:
        """
        SRP: Get services with eco-friendly or carbon-neutral badges.
        """
        eco_services = []
        for service_data in UPS_SERVICES.values():
            if service_data["eco_badge"] in [EcoBadge.ECO_FRIENDLY, EcoBadge.CARBON_NEUTRAL]:
                eco_services.append(service_data)
        return eco_services
    
    @staticmethod
    def find_route_by_cities(origin_city: str, destination_city: str) -> Optional[Tuple[str, Dict]]:
        """
        SRP: Find route data by origin and destination cities.
        Returns tuple of (route_key, route_data) or None if not found.
        """
        for route_key, route_data in DEMO_ROUTES.items():
            if (route_data["origin"]["city"].lower() == origin_city.lower() and
                route_data["destination"]["city"].lower() == destination_city.lower()):
                return route_key, route_data
        return None
    
    @staticmethod
    def get_weight_category_for_weight(weight_kg: float) -> WeightCategory:
        """
        SRP: Determine weight category based on package weight.
        """
        for category, category_data in WEIGHT_CATEGORIES.items():
            if weight_kg <= category_data["max_weight_kg"]:
                return category
        return WeightCategory.LARGE  # Default to large if exceeds all categories
    
    @staticmethod
    def get_all_route_keys() -> List[str]:
        """
        SRP: Get list of all available route keys.
        """
        return list(DEMO_ROUTES.keys())
    
    @staticmethod
    def get_route_by_key(route_key: str) -> Optional[Dict]:
        """
        SRP: Get route data by route key.
        """
        return DEMO_ROUTES.get(route_key)


class UPSCalculationHelpers:
    """
    SRP: Single responsibility for UPS calculation helper functions.
    Provides utility functions for shipping calculations without business logic.
    """

    @staticmethod
    def calculate_base_shipping_cost(
        weight_kg: float,
        base_cost_per_kg: float,
        service_multiplier: float,
        weight_category: WeightCategory
    ) -> float:
        """
        SRP: Calculate base shipping cost before additional fees.
        """
        category_data = WEIGHT_CATEGORIES[weight_category]
        cost_adjustment = category_data["cost_adjustment"]

        base_cost = weight_kg * base_cost_per_kg * service_multiplier * cost_adjustment

        # Minimum cost threshold
        minimum_cost = 5.00
        return max(base_cost, minimum_cost)

    @staticmethod
    def calculate_carbon_emissions(
        distance_km: float,
        air_percentage: float,
        ground_percentage: float,
        weight_kg: float,
        carbon_factor: float
    ) -> Dict[str, float]:
        """
        SRP: Calculate carbon emissions breakdown by transport mode.
        """
        # Carbon emission factors (kg CO2 per km per kg of cargo)
        AIR_CARBON_FACTOR = 0.85  # kg CO2/km/kg
        GROUND_CARBON_FACTOR = 0.18  # kg CO2/km/kg

        air_distance = distance_km * (air_percentage / 100)
        ground_distance = distance_km * (ground_percentage / 100)

        air_co2 = air_distance * weight_kg * AIR_CARBON_FACTOR
        ground_co2 = ground_distance * weight_kg * GROUND_CARBON_FACTOR
        total_co2 = air_co2 + ground_co2

        return {
            "total_co2_kg": round(total_co2, 3),
            "air_transport_co2_kg": round(air_co2, 3),
            "ground_transport_co2_kg": round(ground_co2, 3),
            "co2_per_km": round(total_co2 / distance_km, 4) if distance_km > 0 else 0.0
        }

    @staticmethod
    def determine_eco_badge(carbon_per_kg: float, air_percentage: float) -> EcoBadge:
        """
        SRP: Determine eco-friendly badge based on carbon efficiency and transport mix.
        """
        if air_percentage <= 10 and carbon_per_kg <= 0.25:
            return EcoBadge.CARBON_NEUTRAL
        elif air_percentage <= 50 and carbon_per_kg <= 0.60:
            return EcoBadge.ECO_FRIENDLY
        else:
            return EcoBadge.STANDARD

    @staticmethod
    def calculate_delivery_eta_hours(
        base_eta_hours: int,
        route_complexity: str,
        weight_category: WeightCategory
    ) -> int:
        """
        SRP: Calculate adjusted delivery ETA based on route and package factors.
        """
        complexity_adjustments = {
            "simple": 0,
            "moderate": 4,  # Add 4 hours
            "complex": 8    # Add 8 hours
        }

        weight_adjustments = {
            WeightCategory.ENVELOPE: -2,  # 2 hours faster
            WeightCategory.SMALL: 0,
            WeightCategory.MEDIUM: 2,     # 2 hours slower
            WeightCategory.LARGE: 6       # 6 hours slower
        }

        complexity_adj = complexity_adjustments.get(route_complexity, 0)
        weight_adj = weight_adjustments.get(weight_category, 0)

        adjusted_eta = base_eta_hours + complexity_adj + weight_adj
        return max(adjusted_eta, 1)  # Minimum 1 hour

    @staticmethod
    def format_route_description(origin_city: str, destination_city: str, distance_km: float) -> str:
        """
        SRP: Format human-readable route description.
        """
        return f"{origin_city} to {destination_city} ({distance_km:,.0f} km)"

    @staticmethod
    def get_business_days_from_hours(hours: int) -> int:
        """
        SRP: Convert hours to business days for display purposes.
        Assumes 8-hour business days, Monday-Friday.
        """
        business_hours_per_day = 8
        days = hours / business_hours_per_day

        # Account for weekends (add extra days for weekend gaps)
        weeks = days / 5  # 5 business days per week
        weekend_days = int(weeks) * 2  # 2 weekend days per week

        total_calendar_days = days + weekend_days
        return max(int(total_calendar_days), 1)


class UPSValidationHelpers:
    """
    SRP: Single responsibility for UPS-specific validation helper functions.
    Does not handle general validation or business logic.
    """

    @staticmethod
    def validate_service_availability(
        service_code: str,
        origin_state: str,
        destination_state: str,
        weight_kg: float
    ) -> Tuple[bool, List[str]]:
        """
        SRP: Validate if a UPS service is available for given parameters.
        Returns (is_valid, error_messages).
        """
        errors = []

        # Check if service exists
        service = UPSDataLookup.get_service_by_code(service_code)
        if not service:
            errors.append(f"Service code '{service_code}' not found")
            return False, errors

        # Weight restrictions for certain services
        if service_code in ["14", "01"] and weight_kg > 68:  # Next Day Air services
            errors.append(f"Weight {weight_kg}kg exceeds limit for {service['name']} (68kg max)")

        # Geographic restrictions (simplified example)
        restricted_states = ["AK", "HI"]  # Alaska and Hawaii
        if origin_state in restricted_states or destination_state in restricted_states:
            if service_code in ["14", "13"]:  # Early morning services
                errors.append(f"{service['name']} not available for Alaska/Hawaii")

        return len(errors) == 0, errors

    @staticmethod
    def validate_route_feasibility(origin_zip: str, destination_zip: str) -> Tuple[bool, List[str]]:
        """
        SRP: Validate if a shipping route is feasible.
        """
        errors = []

        # Basic ZIP code validation
        import re
        zip_pattern = r'^\d{5}(-\d{4})?$'

        if not re.match(zip_pattern, origin_zip):
            errors.append(f"Invalid origin ZIP code format: {origin_zip}")

        if not re.match(zip_pattern, destination_zip):
            errors.append(f"Invalid destination ZIP code format: {destination_zip}")

        # Same ZIP code check
        if origin_zip == destination_zip:
            errors.append("Origin and destination cannot be the same")

        return len(errors) == 0, errors
