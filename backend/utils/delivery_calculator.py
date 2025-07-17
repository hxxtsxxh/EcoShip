from datetime import datetime, timedelta
from typing import Dict, Tuple
import calendar


class BusinessDayCalculator:
    """
    SRP: Single responsibility for business day calculations.
    Handles weekend skipping and business day arithmetic.
    """
    
    @staticmethod
    def is_business_day(date: datetime) -> bool:
        """
        Check if a given date is a business day (Monday-Friday).
        
        Args:
            date: Date to check
            
        Returns:
            True if the date is a business day, False otherwise
        """
        return date.weekday() < 5  # Monday=0, Friday=4
    
    @staticmethod
    def add_business_days(start_date: datetime, business_days: int) -> datetime:
        """
        Add business days to a start date, skipping weekends.
        
        Args:
            start_date: Starting date
            business_days: Number of business days to add
            
        Returns:
            Date after adding the specified business days
        """
        current_date = start_date
        days_added = 0
        
        while days_added < business_days:
            current_date += timedelta(days=1)
            if BusinessDayCalculator.is_business_day(current_date):
                days_added += 1
        
        return current_date
    
    @staticmethod
    def get_next_business_day(date: datetime) -> datetime:
        """
        Get the next business day from the given date.
        If the date is already a business day, return the next business day.
        
        Args:
            date: Starting date
            
        Returns:
            Next business day
        """
        return BusinessDayCalculator.add_business_days(date, 1)
    
    @staticmethod
    def ensure_business_day(date: datetime) -> datetime:
        """
        Ensure the given date is a business day.
        If it's a weekend, move to the next Monday.
        
        Args:
            date: Date to check
            
        Returns:
            The same date if it's a business day, or next Monday if it's a weekend
        """
        if BusinessDayCalculator.is_business_day(date):
            return date
        
        # If it's a weekend, find the next Monday
        days_until_monday = 7 - date.weekday()
        return date + timedelta(days=days_until_monday)


class DeliveryDateCalculator:
    """
    SRP: Single responsibility for calculating specific delivery dates for UPS services.
    Uses business day logic to determine accurate delivery dates.
    """
    
    # Service-specific business day mappings
    SERVICE_BUSINESS_DAYS = {
        "UPS_NEXT_DAY_AIR_EARLY": 1,
        "UPS_NEXT_DAY_AIR": 1,
        "UPS_NEXT_DAY_AIR_SAVER": 1,
        "UPS_2ND_DAY_AIR": 2,
        "UPS_3_DAY_SELECT": 3,
        "UPS_GROUND": 3  # Default to 3 days for ground (can be 3-5)
    }
    
    def __init__(self):
        self.business_day_calc = BusinessDayCalculator()
    
    def calculate_delivery_date(
        self, 
        service_key: str, 
        ship_date: datetime = None
    ) -> Tuple[datetime, str]:
        """
        Calculate the delivery date for a specific UPS service.
        
        Args:
            service_key: UPS service identifier (e.g., "UPS_NEXT_DAY_AIR")
            ship_date: Date when package will be shipped (defaults to current date)
            
        Returns:
            Tuple of (delivery_date, formatted_delivery_date)
        """
        if ship_date is None:
            ship_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Ensure ship date is a business day
        effective_ship_date = self.business_day_calc.ensure_business_day(ship_date)
        
        # Get business days for this service
        business_days = self.SERVICE_BUSINESS_DAYS.get(service_key, 3)
        
        # Calculate delivery date
        delivery_date = self.business_day_calc.add_business_days(
            effective_ship_date, 
            business_days
        )
        
        # Format the delivery date
        formatted_date = self._format_delivery_date(delivery_date)
        
        return delivery_date, formatted_date
    
    def _format_delivery_date(self, delivery_date: datetime) -> str:
        """
        Format delivery date in human-readable format.
        
        Args:
            delivery_date: Date to format
            
        Returns:
            Formatted date string (e.g., "Monday, July 17, 2025")
        """
        day_name = calendar.day_name[delivery_date.weekday()]
        month_name = calendar.month_name[delivery_date.month]
        
        return f"{day_name}, {month_name} {delivery_date.day}, {delivery_date.year}"
    
    def calculate_all_service_delivery_dates(
        self, 
        ship_date: datetime = None
    ) -> Dict[str, Dict[str, str]]:
        """
        Calculate delivery dates for all UPS services.
        
        Args:
            ship_date: Date when package will be shipped (defaults to current date)
            
        Returns:
            Dictionary mapping service keys to delivery date information
        """
        delivery_dates = {}
        
        for service_key in self.SERVICE_BUSINESS_DAYS.keys():
            delivery_date, formatted_date = self.calculate_delivery_date(
                service_key, 
                ship_date
            )
            
            delivery_dates[service_key] = {
                "estimated_delivery_date": delivery_date.strftime("%Y-%m-%d"),
                "delivery_date_formatted": formatted_date,
                "delivery_date_iso": delivery_date.isoformat(),
                "business_days_from_ship": self.SERVICE_BUSINESS_DAYS[service_key]
            }
        
        return delivery_dates
    
    def get_delivery_commitment_with_date(
        self, 
        service_key: str, 
        original_commitment: str,
        ship_date: datetime = None
    ) -> str:
        """
        Enhance the original commitment text with specific delivery date.
        
        Args:
            service_key: UPS service identifier
            original_commitment: Original commitment text (e.g., "Next Business Day by 10:30 AM")
            ship_date: Date when package will be shipped
            
        Returns:
            Enhanced commitment text with specific date
        """
        delivery_date, formatted_date = self.calculate_delivery_date(service_key, ship_date)
        
        # Extract time from original commitment if present
        time_part = ""
        if "by" in original_commitment.lower():
            parts = original_commitment.split("by")
            if len(parts) > 1:
                time_part = f" by{parts[1]}"
        
        return f"{formatted_date}{time_part}"


class DeliveryDateValidator:
    """
    SRP: Single responsibility for validating delivery date requirements.
    Checks if requested delivery dates are feasible for given services.
    """
    
    def __init__(self):
        self.delivery_calc = DeliveryDateCalculator()
        self.business_day_calc = BusinessDayCalculator()
    
    def validate_delivery_date_request(
        self, 
        requested_date: datetime, 
        service_key: str,
        ship_date: datetime = None
    ) -> Tuple[bool, str]:
        """
        Validate if a requested delivery date is achievable for a given service.
        
        Args:
            requested_date: Customer's requested delivery date
            service_key: UPS service identifier
            ship_date: Date when package will be shipped
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Calculate the earliest possible delivery date for this service
        earliest_delivery, _ = self.delivery_calc.calculate_delivery_date(
            service_key, 
            ship_date
        )
        
        # Check if requested date is achievable
        if requested_date.date() < earliest_delivery.date():
            return False, f"Requested delivery date is too early for {service_key}"
        
        # Check if requested date is a business day
        if not self.business_day_calc.is_business_day(requested_date):
            return False, "Requested delivery date must be a business day"
        
        return True, "Delivery date is valid"
    
    def get_alternative_delivery_dates(
        self, 
        service_key: str,
        ship_date: datetime = None,
        num_alternatives: int = 3
    ) -> list:
        """
        Get alternative delivery date options for a service.
        
        Args:
            service_key: UPS service identifier
            ship_date: Date when package will be shipped
            num_alternatives: Number of alternative dates to provide
            
        Returns:
            List of alternative delivery dates with formatted strings
        """
        alternatives = []
        base_delivery_date, _ = self.delivery_calc.calculate_delivery_date(
            service_key, 
            ship_date
        )
        
        current_date = base_delivery_date
        for i in range(num_alternatives):
            if i > 0:  # Skip the first one as it's the standard delivery date
                current_date = self.business_day_calc.get_next_business_day(current_date)
            
            formatted_date = self.delivery_calc._format_delivery_date(current_date)
            alternatives.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "formatted": formatted_date,
                "iso": current_date.isoformat()
            })
        
        return alternatives
