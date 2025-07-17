from typing import Dict, Any, List, Optional
import math
from datetime import datetime

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
from services.abstractions import (
    AbstractValidationService,
    AbstractCalculationService,
    AbstractPersistenceService,
    AbstractHealthService,
    AbstractOrchestrationService
)


# LSP: Concrete implementations that are fully substitutable for their abstractions

class CoordinateValidator(DataValidatorInterface):
    """
    LSP: Fully substitutable for DataValidatorInterface.
    Maintains the contract and behavior expected by clients.
    """
    
    def __init__(self):
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """LSP: Maintains the contract of the parent interface."""
        self._errors.clear()
        
        required_fields = ['source_location', 'destination_location']
        for field in required_fields:
            if field not in data:
                self._errors.append(f"Missing required field: {field}")
                continue
            
            location = data[field]
            if not self._validate_location(location):
                self._errors.append(f"Invalid {field} format")
        
        return len(self._errors) == 0
    
    def get_validation_errors(self) -> List[str]:
        """LSP: Maintains the contract of the parent interface."""
        return self._errors.copy()
    
    def _validate_location(self, location: Dict[str, Any]) -> bool:
        """Helper method for location validation."""
        if not isinstance(location, dict):
            return False
        return 'latitude' in location and 'longitude' in location


class DistanceCalculator(CalculatorInterface):
    """
    LSP: Fully substitutable for CalculatorInterface.
    Can be used anywhere CalculatorInterface is expected.
    """
    
    def __init__(self):
        self._metadata = {}
    
    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """LSP: Maintains the contract and behavior of parent interface."""
        source = input_data['source_location']
        destination = input_data['destination_location']
        
        # Calculate distance using Haversine formula
        distance = self._haversine_distance(
            source['latitude'], source['longitude'],
            destination['latitude'], destination['longitude']
        )
        
        self._metadata = {
            'calculation_method': 'haversine',
            'source_coordinates': source,
            'destination_coordinates': destination,
            'calculated_at': datetime.utcnow().isoformat()
        }
        
        return {
            'distance': distance,
            'unit': 'kilometers'
        }
    
    def get_calculation_metadata(self) -> Dict[str, Any]:
        """LSP: Maintains the contract of parent interface."""
        return self._metadata.copy()
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula."""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c


class StandardFormatter(FormatterInterface):
    """
    LSP: Fully substitutable for FormatterInterface.
    Maintains expected behavior and contracts.
    """
    
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """LSP: Maintains the contract of parent interface."""
        return {
            'formatted_result': data,
            'format_type': 'standard',
            'formatted_at': datetime.utcnow().isoformat()
        }
    
    def get_supported_formats(self) -> List[str]:
        """LSP: Maintains the contract of parent interface."""
        return ['standard', 'json']


class InMemoryPersistence(PersistenceInterface):
    """
    LSP: Fully substitutable for PersistenceInterface.
    Can be replaced with database persistence without affecting clients.
    """
    
    def __init__(self):
        self._storage = {}
    
    def save(self, data: Dict[str, Any]) -> str:
        """LSP: Maintains the contract of parent interface."""
        identifier = f"calc_{len(self._storage) + 1}_{datetime.utcnow().timestamp()}"
        self._storage[identifier] = {
            'data': data,
            'saved_at': datetime.utcnow().isoformat()
        }
        return identifier
    
    def retrieve(self, identifier: str) -> Optional[Dict[str, Any]]:
        """LSP: Maintains the contract of parent interface."""
        return self._storage.get(identifier)


class SystemHealthChecker(HealthCheckInterface):
    """
    LSP: Fully substitutable for HealthCheckInterface.
    """

    def check_health(self) -> Dict[str, Any]:
        """LSP: Maintains the contract of parent interface."""
        return {
            'status': 'healthy',
            'uptime': 'system_running',
            'memory_usage': 'within_limits'
        }

    def get_component_name(self) -> str:
        """LSP: Maintains the contract of parent interface."""
        return 'system_core'


# LSP: Service implementations that are fully substitutable for their abstractions

class ValidationService(AbstractValidationService):
    """
    LSP: Fully substitutable for AbstractValidationService.
    Maintains all contracts and expected behaviors.
    """

    def validate_input(self, data: InputDataModel) -> ValidationResultModel:
        """LSP: Maintains the contract of the abstract parent."""
        all_errors = []

        # Convert Pydantic model to dict for validators
        data_dict = data.dict()

        for validator in self._validators:
            if not validator.validate(data_dict):
                all_errors.extend(validator.get_validation_errors())

        return ValidationResultModel(
            is_valid=len(all_errors) == 0,
            errors=all_errors
        )

    def add_validator(self, validator: DataValidatorInterface) -> None:
        """LSP: Maintains the contract of the abstract parent."""
        self._validators.append(validator)


class CalculationService(AbstractCalculationService):
    """
    LSP: Fully substitutable for AbstractCalculationService.
    """

    def process_calculation(self, data: InputDataModel) -> CalculationResultModel:
        """LSP: Maintains the contract of the abstract parent."""
        data_dict = data.dict()
        result = self._calculator.calculate(data_dict)

        return CalculationResultModel(
            result_value=result.get('distance', 0.0),
            unit=result.get('unit', 'unknown'),
            metadata=self._calculator.get_calculation_metadata()
        )

    def format_result(self, result: CalculationResultModel) -> Dict[str, Any]:
        """LSP: Maintains the contract of the abstract parent."""
        result_dict = result.dict()
        return self._formatter.format_output(result_dict)


class PersistenceService(AbstractPersistenceService):
    """
    LSP: Fully substitutable for AbstractPersistenceService.
    """

    def save_calculation(self, data: Dict[str, Any]) -> str:
        """LSP: Maintains the contract of the abstract parent."""
        return self._persistence_provider.save(data)

    def retrieve_calculation(self, identifier: str) -> Dict[str, Any]:
        """LSP: Maintains the contract of the abstract parent."""
        result = self._persistence_provider.retrieve(identifier)
        return result if result is not None else {}


class HealthService(AbstractHealthService):
    """
    LSP: Fully substitutable for AbstractHealthService.
    """

    def check_system_health(self) -> List[HealthStatusModel]:
        """LSP: Maintains the contract of the abstract parent."""
        health_results = []

        for checker in self._health_checkers:
            health_data = checker.check_health()
            health_results.append(HealthStatusModel(
                component_name=checker.get_component_name(),
                status=health_data.get('status', 'unknown'),
                details=health_data
            ))

        return health_results

    def add_health_checker(self, checker: HealthCheckInterface) -> None:
        """LSP: Maintains the contract of the abstract parent."""
        self._health_checkers.append(checker)


class OrchestrationService(AbstractOrchestrationService):
    """
    LSP: Fully substitutable for AbstractOrchestrationService.
    Coordinates the entire workflow while maintaining substitutability.
    """

    def execute_workflow(self, input_data: InputDataModel) -> Dict[str, Any]:
        """LSP: Maintains the contract of the abstract parent."""
        # Step 1: Validate input
        validation_result = self._validation_service.validate_input(input_data)

        if not validation_result.is_valid:
            return {
                'success': False,
                'errors': validation_result.errors,
                'data': None
            }

        # Step 2: Perform calculation
        calculation_result = self._calculation_service.process_calculation(input_data)

        # Step 3: Format result
        formatted_result = self._calculation_service.format_result(calculation_result)

        # Step 4: Persist result
        persistence_id = self._persistence_service.save_calculation(formatted_result)

        return {
            'success': True,
            'data': {
                'calculation_result': formatted_result,
                'persistence_id': persistence_id
            },
            'errors': []
        }
