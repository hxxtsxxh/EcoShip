# Models package - Contains data models and interfaces following SOLID principles

from .data_models import (
    InputDataModel,
    CalculationResultModel,
    ValidationResultModel,
    HealthStatusModel,
    ApiResponseModel
)

from .interfaces import (
    DataValidatorInterface,
    CalculatorInterface,
    FormatterInterface,
    PersistenceInterface,
    HealthCheckInterface
)

from .shipping import (
    WeightCategory,
    TransportMode,
    EcoBadge,
    LocationModel,
    PackageModel,
    ShippingRequest,
    TransportMixModel,
    CarbonFootprintModel,
    ShippingQuote,
    RouteInfoModel,
    CarbonComparisonModel,
    ShippingResponse
)

__all__ = [
    # Data models
    "InputDataModel",
    "CalculationResultModel",
    "ValidationResultModel",
    "HealthStatusModel",
    "ApiResponseModel",

    # Interfaces
    "DataValidatorInterface",
    "CalculatorInterface",
    "FormatterInterface",
    "PersistenceInterface",
    "HealthCheckInterface",

    # Shipping models
    "WeightCategory",
    "TransportMode",
    "EcoBadge",
    "LocationModel",
    "PackageModel",
    "ShippingRequest",
    "TransportMixModel",
    "CarbonFootprintModel",
    "ShippingQuote",
    "RouteInfoModel",
    "CarbonComparisonModel",
    "ShippingResponse"
]
