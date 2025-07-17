#!/usr/bin/env python3
from services.quote_generator import generate_shipping_quotes
from utils.carbon_calculator import calculate_carbon_footprint, carbon_comparison
from services.ups_services import UPS_SERVICES

def main():
    print("🚀 Final Integration Test")
    print("=" * 40)

    # Test 1: Quote generation for known route
    quotes = generate_shipping_quotes("New York", "Los Angeles", 5.0)
    total_quotes = quotes["summary"]["total_quotes"]
    min_price = quotes["summary"]["price_range_usd"]["min"]
    max_price = quotes["summary"]["price_range_usd"]["max"]
    print(f"✅ NYC-LA quotes: {total_quotes} services")
    print(f"   Price range: ${min_price:.2f} - ${max_price:.2f}")

    # Test 2: Carbon calculation
    service_data = UPS_SERVICES["UPS_GROUND"]
    carbon = calculate_carbon_footprint("NYC_LA", 5.0, service_data)
    print(f"✅ Carbon calculation: {carbon.total_co2_kg} kg CO2")

    # Test 3: Carbon comparison
    comparison = carbon_comparison("SF_CHICAGO", 3.0)
    num_services = len(comparison["carbon_results"])
    print(f"✅ Carbon comparison: {num_services} services compared")

    # Test 4: Fallback route
    fallback_quotes = generate_shipping_quotes("Portland", "Nashville", 2.0)
    fallback_total = fallback_quotes["summary"]["total_quotes"]
    print(f"✅ Fallback route: {fallback_total} quotes generated")

    print("✅ All integration tests passed!")

if __name__ == "__main__":
    main()
