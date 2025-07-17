from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


# ISP: Separate interface for data validation concerns
class DataValidatorInterface(ABC):
    """
    ISP: Focused interface for data validation.
    Clients only depend on validation methods they need.
    """
    
    @abstractmethod
    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate input data structure and content."""
        pass
    
    @abstractmethod
    def get_validation_errors(self) -> List[str]:
        """Retrieve validation error messages."""
        pass


# ISP: Separate interface for calculation concerns
class CalculatorInterface(ABC):
    """
    ISP: Focused interface for calculation operations.
    Separated from validation and formatting concerns.
    """
    
    @abstractmethod
    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform calculation based on input data."""
        pass
    
    @abstractmethod
    def get_calculation_metadata(self) -> Dict[str, Any]:
        """Retrieve metadata about the calculation process."""
        pass


# ISP: Separate interface for formatting concerns
class FormatterInterface(ABC):
    """
    ISP: Focused interface for output formatting.
    Clients only depend on formatting methods they need.
    """
    
    @abstractmethod
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format calculation results for presentation."""
        pass
    
    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        """Get list of supported output formats."""
        pass


# ISP: Separate interface for persistence concerns
class PersistenceInterface(ABC):
    """
    ISP: Focused interface for data persistence.
    Separated from business logic concerns.
    """
    
    @abstractmethod
    def save(self, data: Dict[str, Any]) -> str:
        """Save data and return identifier."""
        pass
    
    @abstractmethod
    def retrieve(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Retrieve data by identifier."""
        pass


# ISP: Separate interface for health monitoring
class HealthCheckInterface(ABC):
    """
    ISP: Focused interface for system health monitoring.
    Clients only depend on health check methods they need.
    """
    
    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        """Check system component health status."""
        pass
    
    @abstractmethod
    def get_component_name(self) -> str:
        """Get the name of the component being monitored."""
        pass
