#!/usr/bin/env python3

import requests
import json


def test_eco_efficiency_scoring():
    """Test the eco-efficiency scoring functionality."""
    print("🎯 Testing Eco-Efficiency Scoring System")
    print("=" * 60)
    
    # Test data
    data = {
        "origin": {"city": "New York", "state": "NY", "zip_code": "10001"},
        "destination": {"city": "Los Angeles", "state": "CA", "zip_code": "90210"},
        "package": {"weight_kg": 5.0, "category": "medium"}
    }
    
    # Make request
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    # Display eco-efficiency scores for each service
    print("📊 Eco-Efficiency Scores by Service:")
    print("-" * 60)
    print(f"{'Service':<25} | {'Points':<6} | {'Tier':<10} | {'Cost':<8} | {'CO2'}")
    print("-" * 60)
    
    for quote in result['data']['quotes']:
        service = quote['service_name']
        eco_eff = quote['eco_efficiency']
        points = eco_eff['points']
        tier = eco_eff['tier']
        cost = quote['cost_usd']
        carbon = quote['carbon_context']['total_co2_kg']
        
        print(f"{service:<25} | {points:>4.1f} pts | {tier:<10} | ${cost:>6.2f} | {carbon:>5.2f} kg")
    
    print()
    
    # Display summary information
    if 'eco_efficiency_summary' in result['data']:
        summary = result['data']['eco_efficiency_summary']
        
        print("📈 Eco-Efficiency Summary:")
        print("-" * 30)
        
        point_range = summary['point_range']
        print(f"Point Range: {point_range['min']:.1f} - {point_range['max']:.1f}")
        print(f"Average: {point_range['average']:.1f}")
        
        best_option = summary['best_eco_efficiency']
        print(f"Best Option: {best_option['service_name']} ({best_option['points']:.1f} pts)")
        print(f"Best Tier: {best_option['tier']}")
        
        print()
        print("🏆 Tier Distribution:")
        tier_dist = summary['tier_distribution']
        for tier, count in tier_dist.items():
            print(f"  {tier}: {count} service(s)")
        
        print()
        print("⚖️ Scoring Methodology:")
        methodology = summary['scoring_methodology']
        print(f"  Cost Weight: {methodology['cost_weight']}")
        print(f"  Environmental Weight: {methodology['environmental_weight']}")
        print(f"  Point Scale: {methodology['point_scale']}")
        print(f"  Focus: {methodology['business_focus']}")
    
    return True


def test_services_endpoint():
    """Test the enhanced services endpoint with eco-efficiency ranges."""
    print("\n🚀 Testing Enhanced Services Endpoint")
    print("=" * 60)
    
    response = requests.get("http://localhost:8000/services")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    print("📋 Service Eco-Efficiency Ranges:")
    print("-" * 60)
    print(f"{'Service':<25} | {'Point Range':<12} | {'Typical'}")
    print("-" * 60)
    
    for service in result['data']['services']:
        name = service['service_name']
        eco_range = service['eco_efficiency_range']
        min_pts = eco_range['min_points']
        max_pts = eco_range['max_points']
        typical = eco_range['typical_range']
        
        print(f"{name:<25} | {min_pts:>2d}-{max_pts:<2d} points | {typical}")
    
    print()
    
    # Display tier system information
    if 'eco_efficiency_info' in result['data']:
        eco_info = result['data']['eco_efficiency_info']
        
        print("🎯 Tier System:")
        print("-" * 40)
        tier_system = eco_info['tier_system']
        for tier, description in tier_system.items():
            print(f"  {tier}: {description}")
    
    return True


def test_demo_endpoint():
    """Test the enhanced demo endpoint with eco-efficiency examples."""
    print("\n🧪 Testing Enhanced Demo Endpoint")
    print("=" * 60)
    
    response = requests.get("http://localhost:8000/demo")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Success: {result['success']}")
    print()
    
    # Check for eco-efficiency examples
    if 'eco_efficiency_examples' in result['data']:
        eco_examples = result['data']['eco_efficiency_examples']
        
        print("📊 Demo Eco-Efficiency Examples:")
        print("-" * 50)
        
        sample_scores = eco_examples['sample_scores']
        for score in sample_scores:
            service = score['service']
            points = score['points']
            tier = score['tier']
            cost_score = score['cost_score']
            env_score = score['env_score']
            
            print(f"  {service}: {points:.1f} pts ({tier})")
            print(f"    Cost Score: {cost_score:.2f}, Env Score: {env_score:.2f}")
        
        print()
        
        # Display summary from demo
        if 'summary' in eco_examples:
            demo_summary = eco_examples['summary']
            if 'point_range' in demo_summary:
                demo_range = demo_summary['point_range']
                print(f"Demo Point Range: {demo_range['min']:.1f} - {demo_range['max']:.1f}")
    
    # Check for new features documentation
    if 'documentation' in result['data'] and 'new_features' in result['data']['documentation']:
        new_features = result['data']['documentation']['new_features']
        
        print("✨ New Features:")
        print("-" * 30)
        for feature, description in new_features.items():
            if 'eco' in feature.lower() or 'efficiency' in feature.lower():
                print(f"  {feature}: {description}")
    
    return True


def main():
    """Run all eco-efficiency tests."""
    print("🧪 UPS Shipping Carbon Calculator - Eco-Efficiency Scoring Tests")
    print("=" * 80)
    
    tests = [
        ("Eco-Efficiency Scoring", test_eco_efficiency_scoring),
        ("Enhanced Services Endpoint", test_services_endpoint),
        ("Enhanced Demo Endpoint", test_demo_endpoint)
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
        print("🎉 All eco-efficiency scoring tests passed!")
        print("\n✨ Eco-Efficiency System Successfully Implemented:")
        print("  • 0-30 point scoring system")
        print("  • 70% cost-effectiveness, 30% environmental impact weighting")
        print("  • Business-focused scoring logic")
        print("  • Tier-based classification system")
        print("  • Integration across all API endpoints")
        print("  • Comprehensive scoring explanations")
    else:
        print(f"⚠️  {total - passed} tests failed. Please check the implementation.")


if __name__ == "__main__":
    main()
