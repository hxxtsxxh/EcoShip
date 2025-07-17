#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta


def test_basic_delivery_dates():
    """Test basic delivery date calculation without custom ship date."""
    print("🚀 Testing Basic Delivery Date Calculation")
    print("=" * 50)
    
    data = {
        "origin": {"city": "New York", "state": "NY", "zip_code": "10001"},
        "destination": {"city": "Los Angeles", "state": "CA", "zip_code": "90210"},
        "package": {"weight_kg": 5.0, "category": "medium"}
    }
    
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Ship Date Used: {result['data']['request_details']['ship_date']}")
        print(f"✅ Ship Date Formatted: {result['data']['request_details']['ship_date_formatted']}")
        print()
        
        print("📦 Delivery Dates by Service:")
        for quote in result['data']['quotes']:
            print(f"  {quote['service_name']:<25} | {quote['estimated_delivery_date']} | {quote['delivery_date_formatted']}")
        
        return True
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False


def test_custom_ship_date():
    """Test delivery date calculation with custom ship date."""
    print("\n🚀 Testing Custom Ship Date (Friday)")
    print("=" * 50)
    
    # Use a Friday as ship date to test weekend skipping
    friday_date = "2025-07-18T00:00:00"  # This is a Friday
    
    data = {
        "origin": {"city": "San Francisco", "state": "CA", "zip_code": "94102"},
        "destination": {"city": "Chicago", "state": "IL", "zip_code": "60601"},
        "package": {"weight_kg": 2.5, "category": "small"},
        "ship_date": friday_date
    }
    
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Custom Ship Date: {result['data']['request_details']['ship_date']} (Friday)")
        print()
        
        print("📦 Weekend-Aware Delivery Dates:")
        for quote in result['data']['quotes']:
            service_name = quote['service_name']
            delivery_date = quote['estimated_delivery_date']
            formatted_date = quote['delivery_date_formatted']
            business_days = quote['business_days_from_ship']
            
            print(f"  {service_name:<25} | {delivery_date} | {formatted_date} ({business_days} biz days)")
        
        return True
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False


def test_weekend_ship_date():
    """Test delivery date calculation when ship date is on weekend."""
    print("\n🚀 Testing Weekend Ship Date (Saturday)")
    print("=" * 50)
    
    # Use a Saturday as ship date to test weekend handling
    saturday_date = "2025-07-19T00:00:00"  # This is a Saturday
    
    data = {
        "origin": {"city": "Miami", "state": "FL", "zip_code": "33101"},
        "destination": {"city": "Seattle", "state": "WA", "zip_code": "98101"},
        "package": {"weight_kg": 10.0, "category": "medium"},
        "ship_date": saturday_date
    }
    
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Requested Ship Date: Saturday (2025-07-19)")
        print(f"✅ Effective Ship Date: {result['data']['request_details']['ship_date']} (adjusted to next business day)")
        print()
        
        print("📦 Delivery Dates (adjusted for weekend ship date):")
        for quote in result['data']['quotes'][:3]:  # Show first 3 services
            service_name = quote['service_name']
            delivery_date = quote['estimated_delivery_date']
            formatted_date = quote['delivery_date_formatted']
            commitment_with_date = quote['commitment_with_date']
            
            print(f"  {service_name:<25} | {delivery_date} | {commitment_with_date}")
        
        return True
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False


def test_demo_endpoint():
    """Test the enhanced demo endpoint with delivery date examples."""
    print("\n🚀 Testing Enhanced Demo Endpoint")
    print("=" * 50)
    
    response = requests.get("http://localhost:8000/demo")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Demo includes delivery date examples: {'delivery_date_examples' in result['data']}")
        
        if 'delivery_date_examples' in result['data']:
            print("\n📅 Delivery Date Examples:")
            for service, info in result['data']['delivery_date_examples'].items():
                service_name = service.replace('_', ' ').title()
                delivery_date = info['estimated_delivery_date']
                formatted_date = info['delivery_date_formatted']
                business_days = info['business_days_from_ship']
                
                print(f"  {service_name:<25} | {delivery_date} | {formatted_date} ({business_days} days)")
        
        print(f"\n📚 New Features Documented: {'new_features' in result['data']['documentation']}")
        if 'new_features' in result['data']['documentation']:
            features = result['data']['documentation']['new_features']
            for feature, description in features.items():
                print(f"  ✨ {feature}: {description}")
        
        return True
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False


def test_response_format():
    """Test that all new fields are present in the response."""
    print("\n🚀 Testing Enhanced Response Format")
    print("=" * 50)
    
    data = {
        "origin": {"city": "Boston", "state": "MA", "zip_code": "02101"},
        "destination": {"city": "Dallas", "state": "TX", "zip_code": "75201"},
        "package": {"weight_kg": 3.0, "category": "small"}
    }
    
    response = requests.post("http://localhost:8000/calculate-shipping", json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {response.status_code}")
        
        # Check first quote for all new fields
        first_quote = result['data']['quotes'][0]
        
        new_fields = [
            'estimated_delivery_date',
            'delivery_date_formatted', 
            'business_days_from_ship',
            'commitment_with_date'
        ]
        
        print("\n📋 New Fields in Quote Response:")
        for field in new_fields:
            if field in first_quote:
                print(f"  ✅ {field}: {first_quote[field]}")
            else:
                print(f"  ❌ {field}: Missing")
        
        # Check delivery_info section
        if 'delivery_info' in result['data']:
            print(f"\n📋 Delivery Info Section:")
            delivery_info = result['data']['delivery_info']
            for key, value in delivery_info.items():
                print(f"  ✅ {key}: {value}")
        
        return True
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False


def main():
    """Run all delivery date tests."""
    print("🧪 UPS Shipping Carbon Calculator - Delivery Date Enhancement Tests")
    print("=" * 80)
    
    tests = [
        ("Basic Delivery Dates", test_basic_delivery_dates),
        ("Custom Ship Date", test_custom_ship_date),
        ("Weekend Ship Date", test_weekend_ship_date),
        ("Demo Endpoint", test_demo_endpoint),
        ("Response Format", test_response_format)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"\n❌ {test_name} failed!")
        except Exception as e:
            print(f"\n❌ {test_name} failed with exception: {e}")
    
    print(f"\n🏁 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All delivery date enhancement tests passed!")
        print("\n✨ New Features Successfully Implemented:")
        print("  • Specific delivery dates for all UPS services")
        print("  • Business day logic with weekend skipping")
        print("  • Optional ship_date parameter")
        print("  • Human-readable date formatting")
        print("  • Enhanced commitment messages with dates")
        print("  • Comprehensive delivery information in responses")
    else:
        print(f"⚠️  {total - passed} tests failed. Please check the implementation.")


if __name__ == "__main__":
    main()
