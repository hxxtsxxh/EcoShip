from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum


class WeightCategory(str, Enum):
    """
    SRP: Single responsibility for defining weight categories.
    Enum provides type safety and validation.
    """
    ENVELOPE = "envelope"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class TransportMode(str, Enum):
    """
    SRP: Single responsibility for defining transport modes.
    """
    AIR = "air"
    GROUND = "ground"
    MIXED = "mixed"


class EcoBadge(str, Enum):
    """
    SRP: Single responsibility for defining eco-friendly badges.
    """
    CARBON_NEUTRAL = "carbon_neutral"
    ECO_FRIENDLY = "eco_friendly"
    STANDARD = "standard"


class LocationModel(BaseModel):
    """
    SRP: Single responsibility for location data structure and validation.
    Does not handle geocoding or distance calculations.
    """
    
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    state: str = Field(..., min_length=2, max_length=2, description="State code (e.g., 'NY')")
    zip_code: str = Field(..., min_length=5, max_length=10, description="ZIP code")
    country: str = Field(default="US", description="Country code")
    
    @validator('state')
    def validate_state_code(cls, v):
        """Validate US state code format."""
        if len(v) != 2 or not v.isupper():
            raise ValueError("State must be a 2-letter uppercase code (e.g., 'NY')")
        return v
    
    @validator('zip_code')
    def validate_zip_code(cls, v):
        """Validate ZIP code format."""
        import re
        if not re.match(r'^\d{5}(-\d{4})?$', v):
            raise ValueError("ZIP code must be in format 12345 or 12345-6789")
        return v
    
    def __str__(self) -> str:
        return f"{self.city}, {self.state} {self.zip_code}"


class PackageModel(BaseModel):
    """
    SRP: Single responsibility for package data structure and validation.
    Does not handle shipping calculations or pricing.
    """
    
    weight_kg: float = Field(..., gt=0, le=70, description="Package weight in kilograms")
    length_cm: Optional[float] = Field(None, gt=0, le=150, description="Package length in cm")
    width_cm: Optional[float] = Field(None, gt=0, le=150, description="Package width in cm")
    height_cm: Optional[float] = Field(None, gt=0, le=150, description="Package height in cm")
    declared_value_usd: Optional[float] = Field(None, ge=0, description="Declared value in USD")
    category: Optional[WeightCategory] = Field(None, description="Package category")
    
    @validator('weight_kg')
    def validate_weight(cls, v):
        """Validate weight is within reasonable shipping limits."""
        if v > 70:
            raise ValueError("Weight cannot exceed 70kg for standard shipping")
        return v
    
    def get_dimensional_weight_kg(self) -> Optional[float]:
        """
        SRP: Calculate dimensional weight if dimensions are provided.
        Uses standard UPS dimensional weight factor.
        """
        if all([self.length_cm, self.width_cm, self.height_cm]):
            # UPS dimensional weight factor: 5000 cm³/kg
            volume_cm3 = self.length_cm * self.width_cm * self.height_cm
            return volume_cm3 / 5000
        return None
    
    def get_billable_weight_kg(self) -> float:
        """
        SRP: Determine billable weight (greater of actual or dimensional weight).
        """
        dimensional_weight = self.get_dimensional_weight_kg()
        if dimensional_weight:
            return max(self.weight_kg, dimensional_weight)
        return self.weight_kg


class ShippingRequest(BaseModel):
    """
    SRP: Single responsibility for shipping request data structure.
    Does not handle request processing or validation logic.
    """

    origin: LocationModel = Field(..., description="Origin location")
    destination: LocationModel = Field(..., description="Destination location")
    package: PackageModel = Field(..., description="Package details")
    service_preferences: Optional[List[str]] = Field(
        None,
        description="Preferred service types (optional filter)"
    )
    delivery_date_required: Optional[datetime] = Field(
        None,
        description="Required delivery date (optional)"
    )
    ship_date: Optional[datetime] = Field(
        None,
        description="Date when package will be shipped (defaults to current date if not specified)"
    )
    insurance_required: bool = Field(default=False, description="Whether insurance is required")
    signature_required: bool = Field(default=False, description="Whether signature is required")
    
    @validator('delivery_date_required')
    def validate_delivery_date(cls, v):
        """Validate delivery date is in the future."""
        if v and v <= datetime.now():
            raise ValueError("Delivery date must be in the future")
        return v


class TransportMixModel(BaseModel):
    """
    SRP: Single responsibility for transport mode breakdown.
    Does not handle carbon calculations or routing logic.
    """
    
    air_percentage: float = Field(..., ge=0, le=100, description="Percentage transported by air")
    ground_percentage: float = Field(..., ge=0, le=100, description="Percentage transported by ground")
    
    @validator('ground_percentage')
    def validate_percentages_sum_to_100(cls, v, values):
        """Validate that air and ground percentages sum to 100."""
        if 'air_percentage' in values:
            if abs((values['air_percentage'] + v) - 100.0) > 0.01:
                raise ValueError("Air and ground percentages must sum to 100")
        return v


class CarbonFootprintModel(BaseModel):
    """
    SRP: Single responsibility for carbon footprint data structure.
    Does not handle carbon calculations or environmental impact logic.
    """
    
    total_co2_kg: float = Field(..., ge=0, description="Total CO2 emissions in kg")
    air_transport_co2_kg: float = Field(..., ge=0, description="CO2 from air transport in kg")
    ground_transport_co2_kg: float = Field(..., ge=0, description="CO2 from ground transport in kg")
    co2_per_km: float = Field(..., ge=0, description="CO2 emissions per kilometer")
    
    @validator('total_co2_kg')
    def validate_total_equals_sum(cls, v, values):
        """Validate that total CO2 equals sum of air and ground transport."""
        if 'air_transport_co2_kg' in values and 'ground_transport_co2_kg' in values:
            expected_total = values['air_transport_co2_kg'] + values['ground_transport_co2_kg']
            if abs(v - expected_total) > 0.001:
                raise ValueError("Total CO2 must equal sum of air and ground transport CO2")
        return v


class ShippingQuote(BaseModel):
    """
    SRP: Single responsibility for shipping quote data structure.
    Does not handle quote generation or pricing calculations.
    """
    
    service_name: str = Field(..., min_length=1, description="UPS service name")
    service_code: str = Field(..., min_length=1, description="UPS service code")
    commitment_time: str = Field(..., description="Delivery commitment (e.g., 'Next Business Day')")
    eta_hours: int = Field(..., gt=0, description="Estimated delivery time in hours")
    cost_usd: float = Field(..., ge=0, description="Shipping cost in USD")
    carbon_footprint: CarbonFootprintModel = Field(..., description="Carbon emissions data")
    transport_mix: TransportMixModel = Field(..., description="Transport mode breakdown")
    eco_badge: EcoBadge = Field(..., description="Environmental rating")
    priority_level: int = Field(..., ge=1, le=5, description="Service priority (1=highest)")
    
    # Additional service features
    tracking_included: bool = Field(default=True, description="Whether tracking is included")
    insurance_included: bool = Field(default=False, description="Whether insurance is included")
    signature_required: bool = Field(default=False, description="Whether signature is required")
    
    def get_cost_per_kg(self, package_weight_kg: float) -> float:
        """
        SRP: Calculate cost per kilogram for comparison purposes.
        """
        return self.cost_usd / package_weight_kg if package_weight_kg > 0 else 0.0
    
    def get_carbon_efficiency(self) -> float:
        """
        SRP: Calculate carbon efficiency (CO2 per dollar spent).
        """
        return self.carbon_footprint.total_co2_kg / self.cost_usd if self.cost_usd > 0 else 0.0


class RouteInfoModel(BaseModel):
    """
    SRP: Single responsibility for route information data structure.
    Does not handle route calculations or distance computations.
    """

    origin_city: str = Field(..., description="Origin city name")
    destination_city: str = Field(..., description="Destination city name")
    total_distance_km: float = Field(..., gt=0, description="Total route distance in km")
    air_distance_km: float = Field(..., ge=0, description="Air transport distance in km")
    ground_distance_km: float = Field(..., ge=0, description="Ground transport distance in km")
    estimated_transit_days: int = Field(..., gt=0, description="Estimated transit days")
    route_complexity: str = Field(..., description="Route complexity (simple/moderate/complex)")

    @validator('total_distance_km')
    def validate_total_distance(cls, v, values):
        """Validate that total distance is reasonable sum of air and ground."""
        if 'air_distance_km' in values and 'ground_distance_km' in values:
            # Allow some flexibility as routes may overlap or have different paths
            min_expected = max(values['air_distance_km'], values['ground_distance_km'])
            max_expected = values['air_distance_km'] + values['ground_distance_km']
            if not (min_expected <= v <= max_expected * 1.2):  # 20% tolerance
                raise ValueError("Total distance should be reasonable relative to air/ground distances")
        return v


class CarbonComparisonModel(BaseModel):
    """
    SRP: Single responsibility for carbon comparison data structure.
    Does not handle comparison calculations or environmental analysis.
    """

    lowest_carbon_service: str = Field(..., description="Service with lowest carbon footprint")
    highest_carbon_service: str = Field(..., description="Service with highest carbon footprint")
    carbon_range_kg: Dict[str, float] = Field(..., description="Min/max carbon emissions")
    average_carbon_kg: float = Field(..., ge=0, description="Average carbon across all services")
    eco_friendly_options: List[str] = Field(..., description="List of eco-friendly service names")

    @validator('carbon_range_kg')
    def validate_carbon_range(cls, v):
        """Validate carbon range has min and max values."""
        if 'min' not in v or 'max' not in v:
            raise ValueError("Carbon range must contain 'min' and 'max' values")
        if v['min'] > v['max']:
            raise ValueError("Minimum carbon cannot be greater than maximum carbon")
        return v


class ShippingResponse(BaseModel):
    """
    SRP: Single responsibility for complete shipping response data structure.
    Does not handle response generation or business logic processing.
    """

    request_id: str = Field(..., description="Unique request identifier")
    quotes: List[ShippingQuote] = Field(..., min_items=1, description="List of shipping quotes")
    carbon_comparison: CarbonComparisonModel = Field(..., description="Carbon footprint comparison")
    route_info: RouteInfoModel = Field(..., description="Route information")

    # Response metadata
    quote_timestamp: datetime = Field(default_factory=datetime.utcnow, description="When quotes were generated")
    quote_valid_until: datetime = Field(..., description="Quote expiration time")
    currency: str = Field(default="USD", description="Currency for all prices")

    # Summary statistics
    price_range_usd: Dict[str, float] = Field(..., description="Min/max pricing across quotes")
    fastest_service: str = Field(..., description="Service with shortest delivery time")
    cheapest_service: str = Field(..., description="Service with lowest cost")

    @validator('quote_valid_until')
    def validate_quote_expiration(cls, v, values):
        """Validate quote expiration is after timestamp."""
        if 'quote_timestamp' in values and v <= values['quote_timestamp']:
            raise ValueError("Quote expiration must be after quote timestamp")
        return v

    @validator('price_range_usd')
    def validate_price_range(cls, v):
        """Validate price range has min and max values."""
        if 'min' not in v or 'max' not in v:
            raise ValueError("Price range must contain 'min' and 'max' values")
        if v['min'] > v['max']:
            raise ValueError("Minimum price cannot be greater than maximum price")
        return v

    def get_quotes_by_priority(self) -> List[ShippingQuote]:
        """
        SRP: Sort quotes by priority level for display purposes.
        """
        return sorted(self.quotes, key=lambda q: q.priority_level)

    def get_quotes_by_price(self) -> List[ShippingQuote]:
        """
        SRP: Sort quotes by price for cost comparison.
        """
        return sorted(self.quotes, key=lambda q: q.cost_usd)

    def get_quotes_by_carbon(self) -> List[ShippingQuote]:
        """
        SRP: Sort quotes by carbon footprint for environmental comparison.
        """
        return sorted(self.quotes, key=lambda q: q.carbon_footprint.total_co2_kg)

    def get_quotes_by_speed(self) -> List[ShippingQuote]:
        """
        SRP: Sort quotes by delivery speed for time-sensitive shipments.
        """
        return sorted(self.quotes, key=lambda q: q.eta_hours)
