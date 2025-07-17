"""
Formatting utilities demonstrating Single Responsibility Principle (SRP).

SRP: Each formatter class has a single responsibility for a specific output format.
Classes are focused on formatting concerns only, not business logic.
"""

from typing import Dict, Any, List
import json
from datetime import datetime
from models.interfaces import FormatterInterface


class JsonFormatter(FormatterInterface):
    """
    SRP: Single responsibility of formatting data as JSON.
    Does not handle other output formats or business logic.
    """
    
    def __init__(self, indent: int = 2):
        self.indent = indent
    
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """SRP: Focused solely on JSON formatting."""
        try:
            formatted_json = json.dumps(data, indent=self.indent, default=self._json_serializer)
            return {
                'formatted_data': formatted_json,
                'content_type': 'application/json',
                'format_type': 'json',
                'formatted_at': datetime.utcnow().isoformat()
            }
        except (TypeError, ValueError) as e:
            return {
                'formatted_data': None,
                'content_type': 'application/json',
                'format_type': 'json',
                'error': f"JSON formatting error: {str(e)}",
                'formatted_at': datetime.utcnow().isoformat()
            }
    
    def get_supported_formats(self) -> List[str]:
        """SRP: Returns supported formats for this formatter."""
        return ['json']
    
    def _json_serializer(self, obj):
        """Helper method for JSON serialization of complex objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


class TableFormatter(FormatterInterface):
    """
    SRP: Single responsibility of formatting data as table structure.
    Does not handle other output formats.
    """
    
    def __init__(self, column_separator: str = " | "):
        self.column_separator = column_separator
    
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """SRP: Focused solely on table formatting."""
        table_rows = self._convert_to_table_rows(data)
        
        return {
            'formatted_data': table_rows,
            'content_type': 'text/plain',
            'format_type': 'table',
            'formatted_at': datetime.utcnow().isoformat()
        }
    
    def get_supported_formats(self) -> List[str]:
        """SRP: Returns supported formats for this formatter."""
        return ['table', 'text']
    
    def _convert_to_table_rows(self, data: Dict[str, Any]) -> List[str]:
        """Helper method to convert dictionary to table rows."""
        rows = []
        
        # Header row
        if data:
            headers = list(data.keys())
            rows.append(self.column_separator.join(headers))
            
            # Separator row
            separator = self.column_separator.join(["-" * len(header) for header in headers])
            rows.append(separator)
            
            # Data row
            values = [str(data[key]) for key in headers]
            rows.append(self.column_separator.join(values))
        
        return rows


class SummaryFormatter(FormatterInterface):
    """
    SRP: Single responsibility of formatting data as human-readable summary.
    Does not handle detailed formatting or other concerns.
    """
    
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """SRP: Focused solely on summary formatting."""
        summary_text = self._generate_summary(data)
        
        return {
            'formatted_data': summary_text,
            'content_type': 'text/plain',
            'format_type': 'summary',
            'formatted_at': datetime.utcnow().isoformat()
        }
    
    def get_supported_formats(self) -> List[str]:
        """SRP: Returns supported formats for this formatter."""
        return ['summary', 'text']
    
    def _generate_summary(self, data: Dict[str, Any]) -> str:
        """Helper method to generate human-readable summary."""
        summary_lines = []
        
        for key, value in data.items():
            if isinstance(value, dict):
                summary_lines.append(f"{key.replace('_', ' ').title()}:")
                for sub_key, sub_value in value.items():
                    summary_lines.append(f"  - {sub_key.replace('_', ' ').title()}: {sub_value}")
            else:
                summary_lines.append(f"{key.replace('_', ' ').title()}: {value}")
        
        return "\n".join(summary_lines)


class MultiFormatFormatter(FormatterInterface):
    """
    SRP: Single responsibility of coordinating multiple formatters.
    Does not perform actual formatting itself.
    """
    
    def __init__(self):
        self._formatters = {
            'json': JsonFormatter(),
            'table': TableFormatter(),
            'summary': SummaryFormatter()
        }
        self._default_format = 'json'
    
    def format_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """SRP: Coordinates formatting across multiple formatters."""
        format_type = data.get('format_preference', self._default_format)
        
        if format_type not in self._formatters:
            format_type = self._default_format
        
        formatter = self._formatters[format_type]
        result = formatter.format_output(data)
        
        # Add multi-format metadata
        result['available_formats'] = self.get_supported_formats()
        result['selected_format'] = format_type
        
        return result
    
    def get_supported_formats(self) -> List[str]:
        """SRP: Returns all supported formats across formatters."""
        all_formats = []
        for formatter in self._formatters.values():
            all_formats.extend(formatter.get_supported_formats())
        return list(set(all_formats))  # Remove duplicates
    
    def add_formatter(self, name: str, formatter: FormatterInterface) -> None:
        """SRP: Allows extending formatting capabilities."""
        self._formatters[name] = formatter
    
    def set_default_format(self, format_type: str) -> None:
        """SRP: Allows changing default format."""
        if format_type in self.get_supported_formats():
            self._default_format = format_type


class FormatterUtility:
    """
    SRP: Single responsibility of providing formatter utility functions.
    Static methods for common formatting operations.
    """
    
    @staticmethod
    def create_standard_formatter() -> MultiFormatFormatter:
        """
        SRP: Factory method for creating standard multi-format formatter.
        """
        return MultiFormatFormatter()
    
    @staticmethod
    def format_error_response(error_message: str, error_code: str = None) -> Dict[str, Any]:
        """
        SRP: Utility method for formatting error responses consistently.
        """
        return {
            'success': False,
            'error': {
                'message': error_message,
                'code': error_code or 'GENERAL_ERROR',
                'timestamp': datetime.utcnow().isoformat()
            },
            'data': None
        }
    
    @staticmethod
    def format_success_response(data: Any, message: str = "Operation completed successfully") -> Dict[str, Any]:
        """
        SRP: Utility method for formatting success responses consistently.
        """
        return {
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }
