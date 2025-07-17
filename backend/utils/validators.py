"""
Validation utilities demonstrating Single Responsibility Principle (SRP).

SRP: Each validator class has a single, specific validation responsibility.
Classes are focused and cohesive, making them easy to test and maintain.
"""

from typing import Dict, Any, List
import re
from models.interfaces import DataValidatorInterface


class NumericRangeValidator(DataValidatorInterface):
    """
    SRP: Single responsibility of validating numeric values within specified ranges.
    Does not handle other types of validation.
    """
    
    def __init__(self, field_name: str, min_value: float, max_value: float):
        self.field_name = field_name
        self.min_value = min_value
        self.max_value = max_value
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """SRP: Focused solely on numeric range validation."""
        self._errors.clear()
        
        if self.field_name not in data:
            self._errors.append(f"Field '{self.field_name}' is required")
            return False
        
        value = data[self.field_name]
        
        if not isinstance(value, (int, float)):
            self._errors.append(f"Field '{self.field_name}' must be numeric")
            return False
        
        if not (self.min_value <= value <= self.max_value):
            self._errors.append(
                f"Field '{self.field_name}' must be between {self.min_value} and {self.max_value}"
            )
            return False
        
        return True
    
    def get_validation_errors(self) -> List[str]:
        """SRP: Returns validation errors for this specific validator."""
        return self._errors.copy()


class RequiredFieldValidator(DataValidatorInterface):
    """
    SRP: Single responsibility of validating required field presence.
    Does not handle field content validation.
    """
    
    def __init__(self, required_fields: List[str]):
        self.required_fields = required_fields
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """SRP: Focused solely on required field validation."""
        self._errors.clear()
        
        for field in self.required_fields:
            if field not in data or data[field] is None:
                self._errors.append(f"Required field '{field}' is missing")
        
        return len(self._errors) == 0
    
    def get_validation_errors(self) -> List[str]:
        """SRP: Returns validation errors for this specific validator."""
        return self._errors.copy()


class DataTypeValidator(DataValidatorInterface):
    """
    SRP: Single responsibility of validating data types.
    Does not handle value ranges or business logic validation.
    """
    
    def __init__(self, field_type_mapping: Dict[str, type]):
        self.field_type_mapping = field_type_mapping
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """SRP: Focused solely on data type validation."""
        self._errors.clear()
        
        for field_name, expected_type in self.field_type_mapping.items():
            if field_name in data:
                if not isinstance(data[field_name], expected_type):
                    self._errors.append(
                        f"Field '{field_name}' must be of type {expected_type.__name__}"
                    )
        
        return len(self._errors) == 0
    
    def get_validation_errors(self) -> List[str]:
        """SRP: Returns validation errors for this specific validator."""
        return self._errors.copy()


class PatternValidator(DataValidatorInterface):
    """
    SRP: Single responsibility of validating string patterns using regex.
    Does not handle other types of validation.
    """
    
    def __init__(self, field_name: str, pattern: str, error_message: str = None):
        self.field_name = field_name
        self.pattern = re.compile(pattern)
        self.error_message = error_message or f"Field '{field_name}' does not match required pattern"
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """SRP: Focused solely on pattern validation."""
        self._errors.clear()
        
        if self.field_name not in data:
            return True  # Let RequiredFieldValidator handle missing fields
        
        value = data[self.field_name]
        
        if not isinstance(value, str):
            self._errors.append(f"Field '{self.field_name}' must be a string for pattern validation")
            return False
        
        if not self.pattern.match(value):
            self._errors.append(self.error_message)
            return False
        
        return True
    
    def get_validation_errors(self) -> List[str]:
        """SRP: Returns validation errors for this specific validator."""
        return self._errors.copy()


class CompositeValidator(DataValidatorInterface):
    """
    SRP: Single responsibility of coordinating multiple validators.
    Does not perform actual validation logic itself.
    """
    
    def __init__(self, validators: List[DataValidatorInterface]):
        self.validators = validators
        self._errors = []
    
    def validate(self, data: Dict[str, Any]) -> bool:
        """SRP: Coordinates validation across multiple validators."""
        self._errors.clear()
        all_valid = True
        
        for validator in self.validators:
            if not validator.validate(data):
                self._errors.extend(validator.get_validation_errors())
                all_valid = False
        
        return all_valid
    
    def get_validation_errors(self) -> List[str]:
        """SRP: Returns aggregated validation errors."""
        return self._errors.copy()
    
    def add_validator(self, validator: DataValidatorInterface) -> None:
        """SRP: Allows extending validation without modifying existing logic."""
        self.validators.append(validator)


class ValidationUtility:
    """
    SRP: Single responsibility of providing validation utility functions.
    Static methods for common validation operations.
    """
    
    @staticmethod
    def create_coordinate_validator() -> CompositeValidator:
        """
        SRP: Factory method for creating coordinate-specific validation.
        """
        validators = [
            RequiredFieldValidator(['latitude', 'longitude']),
            DataTypeValidator({'latitude': (int, float), 'longitude': (int, float)}),
            NumericRangeValidator('latitude', -90.0, 90.0),
            NumericRangeValidator('longitude', -180.0, 180.0)
        ]
        return CompositeValidator(validators)
    
    @staticmethod
    def create_location_validator() -> CompositeValidator:
        """
        SRP: Factory method for creating location-specific validation.
        """
        validators = [
            RequiredFieldValidator(['source_location', 'destination_location']),
            DataTypeValidator({'source_location': dict, 'destination_location': dict})
        ]
        return CompositeValidator(validators)
