from abc import ABC, abstractmethod
from typing import Dict, Any, List
from models.interfaces import (
    DataValidatorInterface, 
    CalculatorInterface, 
    FormatterInterface,
    PersistenceInterface,
    HealthCheckInterface
)
from models.data_models import (
    InputDataModel, 
    CalculationResultModel, 
    ValidationResultModel,
    HealthStatusModel
)


class AbstractValidationService(ABC):
    """
    OCP: Abstract base class open for extension via inheritance.
    DIP: High-level modules depend on this abstraction, not concrete implementations.
    """
    
    def __init__(self, validators: List[DataValidatorInterface]):
        """
        DIP: Depends on DataValidatorInterface abstraction, not concrete validators.
        """
        self._validators = validators
    
    @abstractmethod
    def validate_input(self, data: InputDataModel) -> ValidationResultModel:
        """Validate input data using configured validators."""
        pass
    
    @abstractmethod
    def add_validator(self, validator: DataValidatorInterface) -> None:
        """
        OCP: Allow extension by adding new validators without modifying existing code.
        """
        pass


class AbstractCalculationService(ABC):
    """
    OCP: Abstract base class allowing new calculation strategies via extension.
    DIP: Depends on abstractions for calculation and formatting.
    """
    
    def __init__(self, calculator: CalculatorInterface, formatter: FormatterInterface):
        """
        DIP: Depends on abstractions, not concrete implementations.
        """
        self._calculator = calculator
        self._formatter = formatter
    
    @abstractmethod
    def process_calculation(self, data: InputDataModel) -> CalculationResultModel:
        """Process calculation using configured calculator."""
        pass
    
    @abstractmethod
    def format_result(self, result: CalculationResultModel) -> Dict[str, Any]:
        """Format calculation result using configured formatter."""
        pass


class AbstractPersistenceService(ABC):
    """
    OCP: Abstract base class allowing different persistence strategies.
    DIP: High-level modules depend on this abstraction.
    """
    
    def __init__(self, persistence_provider: PersistenceInterface):
        """
        DIP: Depends on PersistenceInterface abstraction.
        """
        self._persistence_provider = persistence_provider
    
    @abstractmethod
    def save_calculation(self, data: Dict[str, Any]) -> str:
        """Save calculation data and return identifier."""
        pass
    
    @abstractmethod
    def retrieve_calculation(self, identifier: str) -> Dict[str, Any]:
        """Retrieve saved calculation data."""
        pass


class AbstractHealthService(ABC):
    """
    OCP: Abstract base class allowing extension with new health checks.
    DIP: Depends on HealthCheckInterface abstractions.
    """
    
    def __init__(self, health_checkers: List[HealthCheckInterface]):
        """
        DIP: Depends on HealthCheckInterface abstractions.
        """
        self._health_checkers = health_checkers
    
    @abstractmethod
    def check_system_health(self) -> List[HealthStatusModel]:
        """Check health of all registered components."""
        pass
    
    @abstractmethod
    def add_health_checker(self, checker: HealthCheckInterface) -> None:
        """
        OCP: Allow extension by adding new health checkers.
        """
        pass


class AbstractOrchestrationService(ABC):
    """
    OCP: Abstract orchestration service open for extension.
    DIP: Coordinates other services through abstractions.
    """
    
    def __init__(
        self,
        validation_service: AbstractValidationService,
        calculation_service: AbstractCalculationService,
        persistence_service: AbstractPersistenceService
    ):
        """
        DIP: Depends on service abstractions, not concrete implementations.
        """
        self._validation_service = validation_service
        self._calculation_service = calculation_service
        self._persistence_service = persistence_service
    
    @abstractmethod
    def execute_workflow(self, input_data: InputDataModel) -> Dict[str, Any]:
        """Execute complete workflow: validate, calculate, persist, format."""
        pass
