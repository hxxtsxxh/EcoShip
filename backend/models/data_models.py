from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional
from datetime import datetime


class InputDataModel(BaseModel):
    """
    SRP: Responsible only for input data structure and validation.
    Does not handle business logic or formatting.
    """
    
    source_location: Dict[str, float] = Field(
        ..., 
        description="Source coordinates",
        example={"latitude": 40.7128, "longitude": -74.0060}
    )
    destination_location: Dict[str, float] = Field(
        ..., 
        description="Destination coordinates",
        example={"latitude": 34.0522, "longitude": -118.2437}
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional calculation parameters"
    )
    
    @validator('source_location', 'destination_location')
    def validate_coordinates(cls, v):
        """Validate coordinate structure."""
        if not isinstance(v, dict):
            raise ValueError("Location must be a dictionary")
        if 'latitude' not in v or 'longitude' not in v:
            raise ValueError("Location must contain latitude and longitude")
        if not (-90 <= v['latitude'] <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= v['longitude'] <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class CalculationResultModel(BaseModel):
    """
    SRP: Responsible only for calculation result structure.
    Does not handle calculation logic or presentation formatting.
    """
    
    result_value: float = Field(..., description="Primary calculation result")
    unit: str = Field(..., description="Unit of measurement")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional result metadata"
    )
    calculation_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the calculation was performed"
    )


class ValidationResultModel(BaseModel):
    """
    SRP: Responsible only for validation result structure.
    Does not perform validation logic.
    """
    
    is_valid: bool = Field(..., description="Whether validation passed")
    errors: List[str] = Field(
        default_factory=list,
        description="List of validation error messages"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="List of validation warnings"
    )


class HealthStatusModel(BaseModel):
    """
    SRP: Responsible only for health status data structure.
    Does not perform health checks.
    """
    
    component_name: str = Field(..., description="Name of the component")
    status: str = Field(..., description="Health status (healthy/unhealthy/degraded)")
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional health details"
    )
    check_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the health check was performed"
    )


class ApiResponseModel(BaseModel):
    """
    SRP: Responsible only for API response structure.
    Does not handle response generation logic.
    """
    
    success: bool = Field(..., description="Whether the operation succeeded")
    data: Optional[Dict[str, Any]] = Field(
        None,
        description="Response data payload"
    )
    message: str = Field(
        default="",
        description="Human-readable message"
    )
    errors: List[str] = Field(
        default_factory=list,
        description="List of error messages"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )
