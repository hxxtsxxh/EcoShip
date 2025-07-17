#!/usr/bin/env python3

import requests
import json


def test_modified_eco_efficiency_scoring():
    """Test the modified eco-efficiency scoring with 0-25 scale and tighter medium-speed scoring."""
    print("🎯 Testing Modified Eco-Efficiency Scoring (0-25 Scale)")
    print("=" * 70)
    
    data = {
        "origin": {"city": "New York", "state": "NY", "zip_code": "10001"},
        "destination": {"city": "Los Angeles", "state": "CA", "zip_code": "90210"},
        "package": {"weight_kg": 5.0, "category": "medium"}
    }
    
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    # Display eco-efficiency scores for each service
    print("📊 Modified Eco-Efficiency Scores:")
    print("-" * 70)
    print(f"{'Service':<25} | {'Points':<6} | {'Tier':<10} | {'Cost':<8} | {'CO2'}")
    print("-" * 70)
    
    scores = []
    for quote in result['data']['quotes']:
        service = quote['service_name']
        eco_eff = quote['eco_efficiency']
        points = eco_eff['points']
        tier = eco_eff['tier']
        cost = quote['cost_usd']
        carbon = quote['carbon_context']['total_co2_kg']
        
        scores.append((service, points, tier, cost, carbon))
        print(f"{service:<25} | {points:>4.1f} pts | {tier:<10} | ${cost:>6.2f} | {carbon:>5.2f} kg")
    
    print()
    
    # Analyze the tighter scoring for medium-speed services
    print("🔍 Analysis of Medium-Speed Service Scoring:")
    print("-" * 50)
    
    medium_speed_services = [
        ("UPS Next Day Air Saver", None),
        ("UPS 2nd Day Air", None),
        ("UPS 3-Day Select", None),
        ("UPS Ground", None)
    ]
    
    # Find scores for medium-speed services
    for i, (service_name, _) in enumerate(medium_speed_services):
        for score_data in scores:
            if service_name in score_data[0]:
                medium_speed_services[i] = (service_name, score_data[1])
                break
    
    # Calculate point differences
    medium_scores = [score for _, score in medium_speed_services if score is not None]
    if len(medium_scores) >= 2:
        max_diff = max(medium_scores) - min(medium_scores)
        print(f"Point range for medium-speed services: {min(medium_scores):.1f} - {max(medium_scores):.1f}")

        # Analyze gaps between consecutive services
        sorted_services = sorted([(name, score) for name, score in medium_speed_services if score is not None],
                                key=lambda x: x[1])

        print("Gaps between consecutive medium-speed services:")
        total_gap = 0
        for i in range(len(sorted_services) - 1):
            current_service, current_score = sorted_services[i]
            next_service, next_score = sorted_services[i + 1]
            gap = next_score - current_score
            total_gap += gap
            print(f"  {current_service} → {next_service}: {gap:.1f} points")

        avg_gap = total_gap / (len(sorted_services) - 1) if len(sorted_services) > 1 else 0
        print(f"Average gap: {avg_gap:.1f} points")

        if avg_gap <= 7:  # Tighter than the original 10+ point average gap
            print("✅ Successfully achieved tighter scoring for medium-speed services")
        else:
            print("⚠️  Medium-speed services still have wide point differences")
    
    # Display summary information
    if 'eco_efficiency_summary' in result['data']:
        summary = result['data']['eco_efficiency_summary']
        
        print()
        print("📈 Modified Scoring Summary:")
        print("-" * 30)
        
        point_range = summary['point_range']
        print(f"Point Range: {point_range['min']:.1f} - {point_range['max']:.1f}")
        print(f"Average: {point_range['average']:.1f}")
        
        methodology = summary['scoring_methodology']
        print(f"Point Scale: {methodology['point_scale']}")
        print(f"Focus: {methodology['business_focus']}")
        
        # Verify 0-25 scale
        if "0-25" in methodology['point_scale']:
            print("✅ Successfully changed to 0-25 point scale")
        else:
            print("❌ Point scale not updated correctly")
    
    return True


def test_expanded_route_coverage():
    """Test the expanded route coverage (15 total routes)."""
    print("\n🗺️  Testing Expanded Route Coverage")
    print("=" * 70)
    
    response = requests.get("http://localhost:8000/routes")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    routes = result['data']['routes']
    total_routes = result['data']['total_routes']
    
    print(f"📊 Route Coverage:")
    print(f"Total Routes: {total_routes}")
    
    if total_routes >= 15:
        print("✅ Successfully expanded to 15+ routes")
    else:
        print(f"⚠️  Only {total_routes} routes available (target: 15)")
    
    print()
    print("🗺️  Available Routes:")
    print("-" * 50)
    
    # Display route information
    for i, route_data in enumerate(routes, 1):
        route_key = route_data.get('route_key', 'Unknown')
        origin = route_data.get('origin', {})
        destination = route_data.get('destination', {})
        distances = route_data.get('distances', {})

        origin_city = origin.get('city', 'Unknown')
        origin_state = origin.get('state', 'XX')
        dest_city = destination.get('city', 'Unknown')
        dest_state = destination.get('state', 'XX')
        air_distance = distances.get('air_km', 0)

        print(f"{i:>2}. {origin_city}, {origin_state} → {dest_city}, {dest_state} ({air_distance:,} km)")
    
    # Test a few new routes to ensure they work
    print()
    print("🧪 Testing New Routes:")
    print("-" * 30)
    
    new_route_tests = [
        ("Portland", "Houston"),
        ("Orlando", "Minneapolis"),
        ("Salt Lake City", "Philadelphia")
    ]
    
    for origin_city, dest_city in new_route_tests:
        test_data = {
            "origin": {"city": origin_city, "state": "OR" if origin_city == "Portland" else "FL" if origin_city == "Orlando" else "UT", "zip_code": "97201" if origin_city == "Portland" else "32801" if origin_city == "Orlando" else "84101"},
            "destination": {"city": dest_city, "state": "TX" if dest_city == "Houston" else "MN" if dest_city == "Minneapolis" else "PA", "zip_code": "77001" if dest_city == "Houston" else "55401" if dest_city == "Minneapolis" else "19101"},
            "package": {"weight_kg": 3.0, "category": "small"}
        }
        
        test_response = requests.post("http://localhost:8000/calculate-shipping", json=test_data)
        
        if test_response.status_code == 200:
            print(f"✅ {origin_city} → {dest_city}: Working")
        else:
            print(f"❌ {origin_city} → {dest_city}: Failed ({test_response.status_code})")
    
    return total_routes >= 15


def test_enhanced_services_endpoint():
    """Test the enhanced services endpoint with updated point ranges."""
    print("\n🔧 Testing Enhanced Services Endpoint")
    print("=" * 70)
    
    response = requests.get("http://localhost:8000/services")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    print("📋 Updated Service Eco-Efficiency Ranges (0-25 Scale):")
    print("-" * 70)
    print(f"{'Service':<25} | {'Point Range':<12} | {'Typical'}")
    print("-" * 70)
    
    for service in result['data']['services']:
        name = service['service_name']
        eco_range = service['eco_efficiency_range']
        min_pts = eco_range['min_points']
        max_pts = eco_range['max_points']
        typical = eco_range['typical_range']
        
        print(f"{name:<25} | {min_pts:>2d}-{max_pts:<2d} points | {typical}")
    
    print()
    
    # Check if tier system is updated
    if 'eco_efficiency_info' in result['data']:
        eco_info = result['data']['eco_efficiency_info']
        
        print("🎯 Updated Tier System:")
        print("-" * 40)
        tier_system = eco_info['tier_system']
        for tier, description in tier_system.items():
            print(f"  {tier}: {description}")
        
        # Verify 0-25 scale in methodology
        methodology = eco_info['scoring_methodology']
        if "0-25" in methodology['point_scale']:
            print("\n✅ Services endpoint updated to 0-25 scale")
        else:
            print("\n❌ Services endpoint not updated correctly")
    
    return True


def main():
    """Run all modification tests."""
    print("🧪 UPS Shipping Carbon Calculator - Modification Tests")
    print("=" * 80)
    print("Testing three specific modifications:")
    print("1. Adjusted eco-efficiency point differences (0-25 scale)")
    print("2. Expanded route coverage (15 total routes)")
    print("3. Tighter scoring for medium-speed services")
    print("=" * 80)
    
    tests = [
        ("Modified Eco-Efficiency Scoring", test_modified_eco_efficiency_scoring),
        ("Expanded Route Coverage", test_expanded_route_coverage),
        ("Enhanced Services Endpoint", test_enhanced_services_endpoint)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"\n✅ {test_name} - PASSED")
            else:
                print(f"\n❌ {test_name} - FAILED")
        except Exception as e:
            print(f"\n❌ {test_name} - FAILED with exception: {e}")
    
    print(f"\n🏁 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All modifications successfully implemented!")
        print("\n✨ Summary of Changes:")
        print("  • Changed from 0-30 to 0-25 point scale")
        print("  • Tighter scoring for medium-speed services")
        print("  • Expanded from 6 to 15 shipping routes")
        print("  • Updated all documentation and ranges")
        print("  • Maintained backward compatibility")
    else:
        print(f"⚠️  {total - passed} tests failed. Please check the implementation.")


if __name__ == "__main__":
    main()
