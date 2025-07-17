#!/usr/bin/env python3
import sys
import importlib


def check_imports():
    """Verify all required modules can be imported."""
    print("🔍 Checking imports...")
    
    required_modules = [
        'fastapi',
        'uvicorn',
        'pydantic',
        'requests'
    ]
    
    missing_modules = []
    for module in required_modules:
        try:
            importlib.import_module(module)
            print(f"  ✅ {module}")
        except ImportError:
            print(f"  ❌ {module}")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"\n❌ Missing modules: {', '.join(missing_modules)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    return True


def check_application_structure():
    """Verify application structure and imports."""
    print("\n🏗️ Checking application structure...")
    
    try:
        # Test main application import
        import main
        print("  ✅ main.py imports successfully")
        
        # Check if FastAPI app exists
        if hasattr(main, 'app'):
            print("  ✅ FastAPI app found")
            routes = main.app.routes
            print(f"  ✅ {len(routes)} routes registered")
        else:
            print("  ❌ FastAPI app not found")
            return False
        
        # Test core modules
        from models.shipping import ShippingRequest, ShippingQuote
        print("  ✅ Shipping models import successfully")
        
        from services.ups_services import UPS_SERVICES, DEMO_ROUTES
        print(f"  ✅ UPS services loaded: {len(UPS_SERVICES)} services, {len(DEMO_ROUTES)} routes")
        
        from utils.carbon_calculator import CarbonCalculator
        print("  ✅ Carbon calculator imports successfully")
        
        from services.quote_generator import generate_shipping_quotes
        print("  ✅ Quote generator imports successfully")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Application structure error: {e}")
        return False


def check_business_logic():
    """Test core business logic functionality."""
    print("\n⚙️ Checking business logic...")
    
    try:
        from services.quote_generator import generate_shipping_quotes
        
        # Test quote generation
        result = generate_shipping_quotes("New York", "Los Angeles", 5.0)
        quotes = result["quotes"]
        
        if len(quotes) > 0:
            print(f"  ✅ Quote generation: {len(quotes)} quotes generated")
            
            # Check quote structure
            quote = quotes[0]
            required_fields = ["service_name", "cost_usd", "eta_hours", "carbon_breakdown"]
            
            for field in required_fields:
                if field in quote:
                    print(f"  ✅ Quote field '{field}' present")
                else:
                    print(f"  ❌ Quote field '{field}' missing")
                    return False
            
            # Check carbon calculation
            carbon = quote["carbon_breakdown"]
            if hasattr(carbon, 'total_co2_kg') and carbon.total_co2_kg > 0:
                print(f"  ✅ Carbon calculation: {carbon.total_co2_kg} kg CO2")
            else:
                print("  ❌ Carbon calculation failed")
                return False
            
            return True
        else:
            print("  ❌ No quotes generated")
            return False
            
    except Exception as e:
        print(f"  ❌ Business logic error: {e}")
        return False


def check_data_integrity():
    """Verify data integrity and consistency."""
    print("\n📊 Checking data integrity...")
    
    try:
        from services.ups_services import UPS_SERVICES, DEMO_ROUTES, WEIGHT_CATEGORIES
        
        # Check UPS services
        if len(UPS_SERVICES) == 6:
            print("  ✅ UPS services: 6 services loaded")
        else:
            print(f"  ❌ UPS services: Expected 6, found {len(UPS_SERVICES)}")
            return False
        
        # Check demo routes
        if len(DEMO_ROUTES) >= 15:
            print(f"  ✅ Demo routes: {len(DEMO_ROUTES)} routes loaded")
        else:
            print(f"  ❌ Demo routes: Expected at least 15, found {len(DEMO_ROUTES)}")
            return False
        
        # Check weight categories
        if len(WEIGHT_CATEGORIES) == 4:
            print("  ✅ Weight categories: 4 categories loaded")
        else:
            print(f"  ❌ Weight categories: Expected 4, found {len(WEIGHT_CATEGORIES)}")
            return False
        
        # Verify service data structure
        for service_key, service_data in UPS_SERVICES.items():
            required_fields = ["name", "code", "eta_hours", "air_percentage", "truck_percentage"]
            for field in required_fields:
                if field not in service_data:
                    print(f"  ❌ Service {service_key} missing field: {field}")
                    return False
        
        print("  ✅ All service data structures valid")
        
        # Verify route data structure
        for route_key, route_data in DEMO_ROUTES.items():
            required_fields = ["origin", "destination", "air_distance_km", "ground_distance_km"]
            for field in required_fields:
                if field not in route_data:
                    print(f"  ❌ Route {route_key} missing field: {field}")
                    return False
        
        print("  ✅ All route data structures valid")
        return True
        
    except Exception as e:
        print(f"  ❌ Data integrity error: {e}")
        return False


def main():
    """Run all verification checks."""
    print(" UPS Shipping Carbon Calculator API - Verification")
    print("=" * 60)
    
    checks = [
        ("Import Check", check_imports),
        ("Application Structure", check_application_structure),
        ("Business Logic", check_business_logic),
        ("Data Integrity", check_data_integrity)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        if not check_func():
            all_passed = False
            print(f"\n {check_name} failed!")
            break
    
    print("\n" + "=" * 60)
    
    if all_passed:
        print(" All verification checks passed!")
        print("\n Ready for production:")
        print("  • Run: python main.py")
        print("  • Visit: http://localhost:8000/docs")
        print("  • Test: See POSTMAN_TESTING_GUIDE.md")
        return 0
    else:
        print(" Verification failed!")
        print("\n🔧 Please fix the issues above before proceeding.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
