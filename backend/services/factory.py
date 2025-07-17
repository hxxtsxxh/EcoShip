from typing import List
from services.abstractions import (
    AbstractValidationService,
    AbstractCalculationService,
    AbstractPersistenceService,
    AbstractHealthService,
    AbstractOrchestrationService
)
from services.implementations import (
    CoordinateValidator,
    DistanceCalculator,
    StandardFormatter,
    InMemoryPersistence,
    SystemHealthChecker,
    ValidationService,
    CalculationService,
    PersistenceService,
    HealthService,
    OrchestrationService
)
from models.interfaces import (
    DataValidatorInterface,
    CalculatorInterface,
    FormatterInterface,
    PersistenceInterface,
    HealthCheckInterface
)


class ServiceFactory:
    """
    SRP: Single responsibility of creating and configuring service instances.
    DIP: Creates abstractions and manages dependency injection.
    """
    
    @staticmethod
    def create_validation_service() -> AbstractValidationService:
        """
        DIP: Returns abstraction, not concrete implementation.
        Factory handles dependency injection of validators.
        """
        validators: List[DataValidatorInterface] = [
            CoordinateValidator()
        ]
        return ValidationService(validators)
    
    @staticmethod
    def create_calculation_service() -> AbstractCalculationService:
        """
        DIP: Returns abstraction with injected dependencies.
        """
        calculator: CalculatorInterface = DistanceCalculator()
        formatter: FormatterInterface = StandardFormatter()
        return CalculationService(calculator, formatter)
    
    @staticmethod
    def create_persistence_service() -> AbstractPersistenceService:
        """
        DIP: Returns abstraction with injected persistence provider.
        """
        persistence_provider: PersistenceInterface = InMemoryPersistence()
        return PersistenceService(persistence_provider)
    
    @staticmethod
    def create_health_service() -> AbstractHealthService:
        """
        DIP: Returns abstraction with injected health checkers.
        """
        health_checkers: List[HealthCheckInterface] = [
            SystemHealthChecker()
        ]
        return HealthService(health_checkers)
    
    @staticmethod
    def create_orchestration_service() -> AbstractOrchestrationService:
        """
        DIP: Creates orchestration service with all dependencies injected as abstractions.
        This is the main composition root following DIP.
        """
        validation_service = ServiceFactory.create_validation_service()
        calculation_service = ServiceFactory.create_calculation_service()
        persistence_service = ServiceFactory.create_persistence_service()
        
        return OrchestrationService(
            validation_service,
            calculation_service,
            persistence_service
        )


class ComponentFactory:
    """
    SRP: Single responsibility of creating individual components.
    Separated from service creation for better organization.
    """
    
    @staticmethod
    def create_validator() -> DataValidatorInterface:
        """DIP: Returns validator abstraction."""
        return CoordinateValidator()
    
    @staticmethod
    def create_calculator() -> CalculatorInterface:
        """DIP: Returns calculator abstraction."""
        return DistanceCalculator()
    
    @staticmethod
    def create_formatter() -> FormatterInterface:
        """DIP: Returns formatter abstraction."""
        return StandardFormatter()
    
    @staticmethod
    def create_persistence_provider() -> PersistenceInterface:
        """DIP: Returns persistence abstraction."""
        return InMemoryPersistence()
    
    @staticmethod
    def create_health_checker() -> HealthCheckInterface:
        """DIP: Returns health checker abstraction."""
        return SystemHealthChecker()


class ExtensibleServiceFactory:
    """
    SRP: Responsible for creating extensible service configurations.
    OCP: Allows extension by adding new components without modification.
    DIP: All dependencies are injected as abstractions.
    """
    
    def __init__(self):
        self._validators: List[DataValidatorInterface] = []
        self._health_checkers: List[HealthCheckInterface] = []
    
    def add_validator(self, validator: DataValidatorInterface) -> 'ExtensibleServiceFactory':
        """
        OCP: Extend functionality by adding validators without modifying existing code.
        DIP: Accepts abstraction, not concrete implementation.
        """
        self._validators.append(validator)
        return self
    
    def add_health_checker(self, checker: HealthCheckInterface) -> 'ExtensibleServiceFactory':
        """
        OCP: Extend functionality by adding health checkers.
        DIP: Accepts abstraction, not concrete implementation.
        """
        self._health_checkers.append(checker)
        return self
    
    def build_validation_service(self) -> AbstractValidationService:
        """
        DIP: Returns abstraction with custom validator configuration.
        """
        validators = self._validators if self._validators else [CoordinateValidator()]
        return ValidationService(validators)
    
    def build_health_service(self) -> AbstractHealthService:
        """
        DIP: Returns abstraction with custom health checker configuration.
        """
        checkers = self._health_checkers if self._health_checkers else [SystemHealthChecker()]
        return HealthService(checkers)
    
    def build_orchestration_service(
        self,
        custom_calculator: CalculatorInterface = None,
        custom_formatter: FormatterInterface = None,
        custom_persistence: PersistenceInterface = None
    ) -> AbstractOrchestrationService:
        """
        DIP: Build orchestration service with custom or default dependencies.
        All parameters are abstractions, not concrete implementations.
        """
        validation_service = self.build_validation_service()
        
        calculator = custom_calculator or DistanceCalculator()
        formatter = custom_formatter or StandardFormatter()
        calculation_service = CalculationService(calculator, formatter)
        
        persistence_provider = custom_persistence or InMemoryPersistence()
        persistence_service = PersistenceService(persistence_provider)
        
        return OrchestrationService(
            validation_service,
            calculation_service,
            persistence_service
        )
