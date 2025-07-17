#!/usr/bin/env python3

from utils.carbon_calculator import (
    CarbonCalculator, CarbonComparison, EmissionFactors,
    calculate_carbon_footprint, carbon_comparison
)
from services.quote_generator import (
    QuoteGenerator, ShippingCostCalculator, RouteManager,
    generate_shipping_quotes
)
from services.ups_services import UPS_SERVICES, DEMO_ROUTES


def test_emission_factors():
    """Test emission factors and constants."""
    print("🌱 Testing Emission Factors...")
    
    factors = EmissionFactors()
    print(f"✅ Truck emission factor: {factors.TRUCK_FACTOR} kg CO2e/tonne-km")
    print(f"✅ Air emission factor: {factors.AIR_FACTOR} kg CO2e/tonne-km")
    print(f"✅ Tree offset equivalent: {factors.TREE_OFFSET_KG_PER_YEAR} kg CO2/year")
    print(f"✅ Car emission factor: {factors.CAR_EMISSION_KG_PER_MILE} kg CO2/mile")


def test_carbon_calculator():
    """Test carbon footprint calculation for individual services."""
    print("\n🧮 Testing Carbon Calculator...")
    
    calculator = CarbonCalculator()
    
    # Test with UPS Ground (most eco-friendly)
    ground_service = UPS_SERVICES["UPS_GROUND"]
    carbon_breakdown = calculator.calculate_carbon_footprint(
        route_key="NYC_LA",
        weight_kg=5.0,
        service_data=ground_service
    )
    
    print(f"✅ UPS Ground carbon footprint:")
    print(f"   Total CO2: {carbon_breakdown.total_co2_kg} kg")
    print(f"   Air transport: {carbon_breakdown.air_transport_co2_kg} kg")
    print(f"   Truck transport: {carbon_breakdown.truck_transport_co2_kg} kg")
    print(f"   Trees equivalent: {carbon_breakdown.trees_offset_equivalent} trees/year")
    print(f"   Car miles equivalent: {carbon_breakdown.car_miles_equivalent} miles")
    print(f"   CO2 per kg: {carbon_breakdown.co2_per_kg} kg/kg")
    
    # Test with Next Day Air Early (highest emissions)
    express_service = UPS_SERVICES["UPS_NEXT_DAY_AIR_EARLY"]
    express_carbon = calculator.calculate_carbon_footprint(
        route_key="NYC_LA",
        weight_kg=5.0,
        service_data=express_service
    )
    
    print(f"✅ UPS Next Day Air Early carbon footprint:")
    print(f"   Total CO2: {express_carbon.total_co2_kg} kg")
    print(f"   Difference vs Ground: +{express_carbon.total_co2_kg - carbon_breakdown.total_co2_kg:.3f} kg")


def test_carbon_comparison():
    """Test carbon comparison across all services."""
    print("\n📊 Testing Carbon Comparison...")
    
    comparison = CarbonComparison()
    result = comparison.carbon_comparison(
        route_key="SF_CHICAGO",
        weight_kg=3.0
    )
    
    print(f"✅ Carbon comparison for SF → Chicago, 3kg:")
    print(f"   Lowest carbon: {result['statistics']['lowest_carbon_service']}")
    print(f"   Highest carbon: {result['statistics']['highest_carbon_service']}")
    print(f"   Carbon range: {result['statistics']['min_carbon_kg']} - {result['statistics']['max_carbon_kg']} kg")
    print(f"   Average carbon: {result['statistics']['avg_carbon_kg']} kg")
    print(f"   Eco-friendly services: {len(result['eco_friendly_services'])}")
    
    # Show eco-badges
    print("   Eco-badge assignments:")
    for carbon_result in result['carbon_results'][:3]:  # Show top 3
        service_name = carbon_result['service_name']
        eco_badge = carbon_result['eco_badge']
        savings = carbon_result['carbon_savings_percentage']
        print(f"     {service_name}: {eco_badge} ({savings}% savings)")


def test_shipping_cost_calculator():
    """Test shipping cost calculation."""
    print("\n💰 Testing Shipping Cost Calculator...")
    
    calculator = ShippingCostCalculator()
    route_data = DEMO_ROUTES["NYC_LA"]
    
    # Test different services
    services_to_test = ["UPS_GROUND", "UPS_2ND_DAY_AIR", "UPS_NEXT_DAY_AIR_EARLY"]
    
    for service_key in services_to_test:
        service_data = UPS_SERVICES[service_key]
        cost = calculator.calculate_shipping_cost(
            route_data=route_data,
            weight_kg=2.5,
            service_data=service_data,
            service_key=service_key
        )
        print(f"✅ {service_data['name']}: ${cost:.2f}")


def test_route_manager():
    """Test route lookup and bidirectional matching."""
    print("\n🗺️ Testing Route Manager...")
    
    manager = RouteManager()
    
    # Test direct route lookup
    route_key, route_data = manager.route_lookup("New York", "Los Angeles")
    if route_data:
        print(f"✅ Direct route found: {route_key}")
        print(f"   Distance: {route_data['air_distance_km']} km air")
    
    # Test reverse route lookup (bidirectional)
    route_key, route_data = manager.route_lookup("Los Angeles", "New York")
    if route_data:
        print(f"✅ Reverse route found: {route_key}")
        print(f"   Distance: {route_data['air_distance_km']} km air")
    
    # Test fallback for unsupported route
    fallback_data = manager.get_fallback_route_data("Portland", "Nashville")
    print(f"✅ Fallback route generated:")
    print(f"   Estimated air distance: {fallback_data['air_distance_km']} km")
    print(f"   Estimated base cost: ${fallback_data['base_cost_per_kg']}/kg")


def test_quote_generator():
    """Test comprehensive quote generation."""
    print("\n📋 Testing Quote Generator...")
    
    generator = QuoteGenerator()
    
    # Generate quotes for a popular route
    quotes_result = generator.generate_shipping_quotes(
        origin_city="New York",
        destination_city="Los Angeles", 
        weight_kg=4.0
    )
    
    print(f"✅ Generated {quotes_result['summary']['total_quotes']} quotes")
    print(f"   Route: {quotes_result['route_info']['origin_city']} → {quotes_result['route_info']['destination_city']}")
    print(f"   Distance: {quotes_result['route_info']['total_distance_km']} km")
    print(f"   Price range: ${quotes_result['summary']['price_range_usd']['min']:.2f} - ${quotes_result['summary']['price_range_usd']['max']:.2f}")
    print(f"   Carbon range: {quotes_result['summary']['carbon_range_kg']['min']:.3f} - {quotes_result['summary']['carbon_range_kg']['max']:.3f} kg")
    
    # Show top 3 quotes (sorted by ETA, carbon, cost)
    print("   Top 3 quotes (by speed, eco-friendliness, cost):")
    for i, quote in enumerate(quotes_result['quotes'][:3]):
        service_name = quote['service_name']
        eta_hours = quote['eta_hours']
        cost = quote['cost_usd']
        carbon = quote['carbon_breakdown'].total_co2_kg
        eco_badge = quote.get('eco_badge', 'standard')
        savings = quote.get('carbon_savings_percentage', 0)
        
        print(f"     {i+1}. {service_name}")
        print(f"        ETA: {eta_hours}h, Cost: ${cost:.2f}, Carbon: {carbon:.3f}kg")
        print(f"        Eco-badge: {eco_badge}, Savings: {savings}%")


def test_convenience_functions():
    """Test convenience functions for easy access."""
    print("\n🚀 Testing Convenience Functions...")
    
    # Test carbon calculation convenience function
    service_data = UPS_SERVICES["UPS_2ND_DAY_AIR"]
    carbon_result = calculate_carbon_footprint(
        route_key="BOSTON_DALLAS",
        weight_kg=1.5,
        service_data=service_data
    )
    print(f"✅ Convenience carbon calculation: {carbon_result.total_co2_kg} kg CO2")
    
    # Test carbon comparison convenience function
    comparison_result = carbon_comparison(
        route_key="DENVER_ATLANTA",
        weight_kg=2.0
    )
    print(f"✅ Convenience carbon comparison: {len(comparison_result['carbon_results'])} services compared")
    
    # Test quote generation convenience function
    quotes_result = generate_shipping_quotes(
        origin_city="Miami",
        destination_city="Seattle",
        weight_kg=3.5
    )
    print(f"✅ Convenience quote generation: {quotes_result['summary']['total_quotes']} quotes")


def test_edge_cases_and_validation():
    """Test edge cases and input validation."""
    print("\n⚠️ Testing Edge Cases and Validation...")
    
    calculator = CarbonCalculator()
    generator = QuoteGenerator()
    
    # Test invalid weight
    try:
        generator.generate_shipping_quotes("New York", "Los Angeles", 75.0)  # Over 70kg limit
    except ValueError as e:
        print(f"✅ Weight validation caught: {e}")
    
    # Test same origin/destination
    try:
        generator.generate_shipping_quotes("New York", "New York", 5.0)
    except ValueError as e:
        print(f"✅ Same city validation caught: {e}")
    
    # Test invalid route for carbon calculation
    try:
        service_data = UPS_SERVICES["UPS_GROUND"]
        calculator.calculate_carbon_footprint("INVALID_ROUTE", 5.0, service_data)
    except ValueError as e:
        print(f"✅ Invalid route validation caught: {e}")
    
    # Test unsupported route (should use fallback)
    try:
        quotes_result = generator.generate_shipping_quotes("Portland", "Nashville", 2.0)
        is_fallback = quotes_result['route_info']['is_fallback']
        print(f"✅ Unsupported route handled with fallback: {is_fallback}")
    except Exception as e:
        print(f"❌ Fallback route failed: {e}")


def main():
    """Run all tests for carbon calculator and quote generator."""
    print("🚀 Testing Carbon Calculator and Quote Generator")
    print("=" * 60)
    
    try:
        test_emission_factors()
        test_carbon_calculator()
        test_carbon_comparison()
        test_shipping_cost_calculator()
        test_route_manager()
        test_quote_generator()
        test_convenience_functions()
        test_edge_cases_and_validation()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("🎯 Key features demonstrated:")
        print("   • Sophisticated carbon footprint calculations")
        print("   • UPS-style pricing with zone-based multipliers")
        print("   • Bidirectional route matching with fallbacks")
        print("   • Comprehensive quote generation and sorting")
        print("   • Eco-badge assignments and carbon savings")
        print("   • Robust input validation and error handling")
        print("   • SOLID principles maintained throughout")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
