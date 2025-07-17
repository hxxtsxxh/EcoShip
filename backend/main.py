#!/usr/bin/env python3

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, Any, List, AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

# Import models and services
from models.shipping import ShippingRequest, LocationModel, PackageModel, WeightCategory
from services.ups_services import UPS_SERVICES, DEMO_ROUTES, UPSDataLookup
from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan event handler for FastAPI application.
    Handles both startup and shutdown events.
    """
    # Startup event
    print("UPS Shipping Carbon Calculator API")
    print("=" * 50)
    print(f"Server: http://localhost:8000")
    print(f"Docs: http://localhost:8000/docs")
    print(f"Routes: {len(DEMO_ROUTES)} available")
    print(f"Services: {len(UPS_SERVICES)} UPS services")
    print()
    print("Available Routes:")
    for route_key, route_data in list(DEMO_ROUTES.items())[:3]:
        origin = route_data["origin"]["city"]
        destination = route_data["destination"]["city"]
        distance = route_data["air_distance_km"]
        print(f"  - {origin} -> {destination} ({distance:,} km)")
    print(f"  ... and {len(DEMO_ROUTES) - 3} more routes")
    print()
    print("Test Commands:")
    print("  curl http://localhost:8000/health")
    print("  curl http://localhost:8000/demo")
    print('  curl -X POST "http://localhost:8000/calculate-shipping" \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"origin":{"city":"New York","state":"NY","zip_code":"10001"},"destination":{"city":"Los Angeles","state":"CA","zip_code":"90210"},"package":{"weight_kg":5.0,"category":"medium"}}\'')
    print("=" * 50)

    # Yield control to the application
    yield

    # Shutdown event
    print("Shutting down UPS Shipping Carbon Calculator API")


# Create FastAPI app with lifespan handler
app = FastAPI(
    title="UPS Shipping Carbon Calculator API",
    version="1.0.0",
    description="""
    A sophisticated shipping calculator API that provides UPS service quotes
    with detailed carbon footprint analysis. Built with SOLID principles
    and comprehensive environmental impact data.

    ## Features
    * Real-time shipping quotes for 6 UPS services
    * Detailed carbon footprint calculations
    * Eco-friendly service recommendations
    * Bidirectional route matching with fallback support
    * Industry-standard emission factors
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "available_routes": len(DEMO_ROUTES),
        "available_services": len(UPS_SERVICES),
        "message": "UPS Shipping Carbon Calculator API is running",
        "eco_efficiency_enabled": True  # Test flag to verify updated code
    }


@app.get("/routes")
async def get_routes():
    """Get available shipping routes."""
    try:
        routes_data = []
        
        for route_key, route_info in DEMO_ROUTES.items():
            route_data = {
                "route_key": route_key,
                "origin": route_info["origin"],
                "destination": route_info["destination"],
                "distances": {
                    "air_km": route_info["air_distance_km"],
                    "ground_km": route_info["ground_distance_km"]
                },
                "metadata": {
                    "complexity": route_info["route_complexity"],
                    "description": route_info["description"]
                }
            }
            routes_data.append(route_data)
        
        return {
            "success": True,
            "data": {"routes": routes_data, "total_routes": len(routes_data)},
            "message": "Available shipping routes retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get routes: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve routes")


@app.get("/services")
async def get_services():
    """Get UPS service information with eco-efficiency point ranges."""
    try:
        # Import eco-efficiency scorer for theoretical ranges
        from utils.eco_efficiency_scorer import EcoEfficiencyScorer

        services_data = []
        eco_scorer = EcoEfficiencyScorer()

        # Theoretical point ranges based on service characteristics (0-25 scale with tighter medium-speed scoring)
        theoretical_ranges = {
            "UPS_NEXT_DAY_AIR_EARLY": {"min": 0, "max": 4, "typical": "0-4"},
            "UPS_NEXT_DAY_AIR": {"min": 5, "max": 8, "typical": "5-8"},
            "UPS_NEXT_DAY_AIR_SAVER": {"min": 15, "max": 18, "typical": "15-18"},
            "UPS_2ND_DAY_AIR": {"min": 17, "max": 20, "typical": "17-20"},
            "UPS_3_DAY_SELECT": {"min": 19, "max": 22, "typical": "19-22"},
            "UPS_GROUND": {"min": 21, "max": 25, "typical": "21-25"}
        }

        for service_key, service_info in UPS_SERVICES.items():
            point_range = theoretical_ranges.get(service_key, {"min": 0, "max": 30, "typical": "varies"})

            service_data = {
                "service_key": service_key,
                "service_name": service_info["name"],
                "service_code": service_info["code"],
                "commitment": service_info["commitment"],
                "eta_hours": service_info["eta_hours"],
                "transport_mix": {
                    "air_percentage": service_info["air_percentage"],
                    "ground_percentage": service_info["truck_percentage"]
                },
                "eco_badge": service_info["eco_badge"],
                "description": service_info["description"],
                "eco_efficiency_range": {
                    "min_points": point_range["min"],
                    "max_points": point_range["max"],
                    "typical_range": point_range["typical"],
                    "note": "Actual points depend on route, weight, and comparison with other services. Medium-speed services have tighter scoring ranges."
                }
            }
            services_data.append(service_data)
        
        return {
            "success": True,
            "data": {
                "services": services_data,
                "total_services": len(services_data),
                "eco_efficiency_info": {
                    "scoring_methodology": {
                        "cost_weight": "70%",
                        "environmental_weight": "30%",
                        "point_scale": "0-25 points",
                        "business_focus": "Balances cost-effectiveness with environmental responsibility, with tighter scoring for medium-speed services"
                    },
                    "tier_system": {
                        "excellent": "21-25 points - Outstanding balance of cost and environmental performance",
                        "very_good": "17-20 points - Strong cost-effective option with good overall value",
                        "good": "13-16 points - Moderate eco-friendly choice with reasonable cost trade-offs",
                        "fair": "9-12 points - Balanced medium-speed service option with competitive scoring",
                        "poor": "5-8 points - Express service with higher cost and environmental impact",
                        "very_poor": "0-4 points - Premium express service with significant trade-offs"
                    }
                }
            },
            "message": "UPS service information with eco-efficiency ranges retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get services: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve services")


@app.post("/calculate-shipping")
async def calculate_shipping(shipping_request: ShippingRequest):
    """Calculate shipping quotes with carbon footprint analysis and delivery dates."""
    try:
        # Import quote generator, delivery calculator, and eco-efficiency scorer locally to avoid circular imports
        from services.quote_generator import generate_shipping_quotes
        from utils.delivery_calculator import DeliveryDateCalculator
        from utils.eco_efficiency_scorer import EcoEfficiencyScorer

        # Extract data from shipping request
        origin_city = shipping_request.origin.city
        destination_city = shipping_request.destination.city
        weight_kg = shipping_request.package.weight_kg
        ship_date = shipping_request.ship_date

        logger.info(f"Processing shipping request: {origin_city} -> {destination_city}, {weight_kg}kg")

        # Initialize calculators
        delivery_calculator = DeliveryDateCalculator()
        eco_scorer = EcoEfficiencyScorer()

        # Calculate delivery dates for all services
        delivery_dates = delivery_calculator.calculate_all_service_delivery_dates(ship_date)

        # Generate quotes
        quotes_result = generate_shipping_quotes(origin_city, destination_city, weight_kg)

        # Calculate eco-efficiency scores
        eco_scores = eco_scorer.calculate_scores(quotes_result["quotes"], weight_kg)
        eco_summary = eco_scorer.get_scoring_summary(eco_scores)

        # Format response for UI consumption
        formatted_quotes = []
        for i, quote in enumerate(quotes_result["quotes"]):
            carbon_breakdown = quote["carbon_breakdown"]
            service_key = quote["service_key"]

            # Get delivery date information for this service
            service_delivery_info = delivery_dates.get(service_key, {})

            # Get eco-efficiency score for this quote
            eco_score = eco_scores[i] if i < len(eco_scores) else None

            # Enhanced delivery commitment with specific date
            commitment_with_date = delivery_calculator.get_delivery_commitment_with_date(
                service_key,
                quote["commitment_time"],
                ship_date
            )

            # Format delivery commitment for UI (keeping original logic as fallback)
            eta_hours = quote["eta_hours"]
            if eta_hours <= 24:
                if "8:00 AM" in quote["commitment_time"]:
                    commitment_formatted = "By 8:30 AM Tomorrow"
                elif "10:30 AM" in quote["commitment_time"]:
                    commitment_formatted = "By 10:30 AM Tomorrow"
                else:
                    commitment_formatted = "Next Business Day"
            elif eta_hours <= 48:
                commitment_formatted = "Within 2 Business Days"
            else:
                business_days = max(1, eta_hours // 24)
                commitment_formatted = f"Within {business_days} Business Days"

            formatted_quote = {
                "service_name": quote["service_name"],
                "service_code": quote["service_code"],
                "commitment_time": quote["commitment_time"],
                "commitment_formatted": commitment_formatted,
                "commitment_with_date": commitment_with_date,
                "estimated_delivery_date": service_delivery_info.get("estimated_delivery_date"),
                "delivery_date_formatted": service_delivery_info.get("delivery_date_formatted"),
                "business_days_from_ship": service_delivery_info.get("business_days_from_ship"),
                "eta_hours": eta_hours,
                "cost_usd": quote["cost_usd"],
                "carbon_context": {
                    "total_co2_kg": carbon_breakdown.total_co2_kg,
                    "trees_offset_equivalent": carbon_breakdown.trees_offset_equivalent,
                    "car_miles_equivalent": carbon_breakdown.car_miles_equivalent,
                    "co2_per_kg": carbon_breakdown.co2_per_kg
                },
                "transport_mix": {
                    "air_percentage": UPS_SERVICES[quote["service_key"]]["air_percentage"],
                    "ground_percentage": UPS_SERVICES[quote["service_key"]]["truck_percentage"]
                },
                "eco_badge": quote.get("eco_badge", "standard"),
                "carbon_savings_percentage": quote.get("carbon_savings_percentage", 0),
                "priority_level": quote["priority_level"],
                "eco_efficiency": {
                    "points": eco_score.points if eco_score else 0,
                    "tier": eco_score.tier if eco_score else "unranked",
                    "cost_effectiveness_score": eco_score.cost_effectiveness_score if eco_score else 0,
                    "environmental_score": eco_score.environmental_score if eco_score else 0,
                    "explanation": eco_score.explanation if eco_score else "Score not available"
                }
            }
            formatted_quotes.append(formatted_quote)

        # Determine effective ship date for response
        effective_ship_date = ship_date if ship_date else datetime.now()

        return {
            "success": True,
            "data": {
                "quotes": formatted_quotes,
                "route_info": quotes_result["route_info"],
                "summary": quotes_result["summary"],
                "eco_efficiency_summary": eco_summary,
                "request_details": {
                    "origin": f"{shipping_request.origin.city}, {shipping_request.origin.state}",
                    "destination": f"{shipping_request.destination.city}, {shipping_request.destination.state}",
                    "weight_kg": shipping_request.package.weight_kg,
                    "package_category": shipping_request.package.category,
                    "ship_date": effective_ship_date.strftime("%Y-%m-%d"),
                    "ship_date_formatted": delivery_calculator._format_delivery_date(effective_ship_date)
                },
                "delivery_info": {
                    "calculation_note": "Delivery dates calculated based on business days (Monday-Friday)",
                    "ship_date_used": effective_ship_date.strftime("%Y-%m-%d"),
                    "weekend_handling": "Packages shipped on weekends will be processed on the next business day"
                }
            },
            "message": "Shipping quotes with delivery dates and eco-efficiency scores generated successfully",
            "timestamp": datetime.utcnow().isoformat()
        }

    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except ValueError as e:
        logger.warning(f"Invalid input: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Shipping calculation failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/demo")
async def get_demo():
    """Get demo data for frontend testing with delivery dates."""
    try:
        # Create sample shipping request with ship_date
        sample_request = {
            "origin": {"city": "New York", "state": "NY", "zip_code": "10001"},
            "destination": {"city": "Los Angeles", "state": "CA", "zip_code": "90210"},
            "package": {"weight_kg": 5.0, "category": "medium"},
            "ship_date": datetime.now().strftime("%Y-%m-%d")
        }

        # Generate sample quotes with delivery dates and eco-efficiency scores
        from services.quote_generator import generate_shipping_quotes
        from utils.delivery_calculator import DeliveryDateCalculator
        from utils.eco_efficiency_scorer import EcoEfficiencyScorer

        delivery_calculator = DeliveryDateCalculator()
        eco_scorer = EcoEfficiencyScorer()
        delivery_dates = delivery_calculator.calculate_all_service_delivery_dates()
        quotes_result = generate_shipping_quotes("New York", "Los Angeles", 5.0)

        # Calculate sample eco-efficiency scores
        sample_eco_scores = eco_scorer.calculate_scores(quotes_result["quotes"], 5.0)
        sample_eco_summary = eco_scorer.get_scoring_summary(sample_eco_scores)

        return {
            "success": True,
            "data": {
                "sample_request": sample_request,
                "sample_response": {
                    "quotes": quotes_result["quotes"][:3],  # Show top 3 quotes
                    "summary": quotes_result["summary"]
                },
                "delivery_date_examples": delivery_dates,
                "eco_efficiency_examples": {
                    "sample_scores": [
                        {
                            "service": score.explanation.split('.')[0] if '.' in score.explanation else score.explanation[:30],
                            "points": score.points,
                            "tier": score.tier,
                            "cost_score": score.cost_effectiveness_score,
                            "env_score": score.environmental_score
                        }
                        for score in sample_eco_scores[:3]
                    ],
                    "summary": sample_eco_summary
                },
                "test_scenarios": [
                    {
                        "name": "Cross-country shipping with delivery dates and eco-efficiency",
                        "origin": "New York",
                        "destination": "Los Angeles",
                        "weight_kg": 5.0,
                        "ship_date": datetime.now().strftime("%Y-%m-%d"),
                        "expected_quotes": 6,
                        "expected_fields": ["estimated_delivery_date", "delivery_date_formatted", "eco_efficiency"]
                    },
                    {
                        "name": "Regional shipping with eco-efficiency scoring",
                        "origin": "San Francisco",
                        "destination": "Chicago",
                        "weight_kg": 2.5,
                        "ship_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
                        "expected_quotes": 6,
                        "note": "Eco-efficiency points balance cost-effectiveness (70%) with environmental impact (30%)"
                    }
                ]
            },
            "message": "Demo data for frontend testing with delivery dates and eco-efficiency scoring",
            "documentation": {
                "api_endpoints": [
                    "POST /calculate-shipping - Generate shipping quotes with delivery dates and eco-efficiency scores",
                    "GET /routes - Get available routes",
                    "GET /services - Get UPS service information with eco-efficiency ranges",
                    "GET /demo - Get sample data with delivery and eco-efficiency examples",
                    "GET /health - Health check"
                ],
                "new_features": {
                    "delivery_dates": "All quotes now include specific delivery dates",
                    "ship_date_parameter": "Optional ship_date parameter in shipping requests",
                    "business_day_logic": "Automatic weekend skipping for accurate delivery dates",
                    "formatted_dates": "Human-readable date formats (e.g., 'Monday, July 17, 2025')",
                    "eco_efficiency_scoring": "0-30 point system balancing cost-effectiveness (70%) with environmental impact (30%)",
                    "business_focused_scoring": "Encourages practical choices while discouraging expensive express options"
                }
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate demo data: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate demo data")


@app.get("/info")
async def get_info():
    """Get application information."""
    return {
        "application": {
            "name": "UPS Shipping Carbon Calculator API",
            "version": "1.0.0",
            "description": "Sophisticated shipping calculator with carbon footprint analysis"
        },
        "features": {
            "total_routes": len(DEMO_ROUTES),
            "total_services": len(UPS_SERVICES),
            "carbon_calculation": True,
            "eco_badges": True,
            "comprehensive_validation": True
        },
        "available_routes": [
            f"{route['origin']['city']} -> {route['destination']['city']}"
            for route in DEMO_ROUTES.values()
        ],
        "test_commands": {
            "health_check": "curl http://localhost:8000/health",
            "get_routes": "curl http://localhost:8000/routes",
            "get_services": "curl http://localhost:8000/services",
            "demo_data": "curl http://localhost:8000/demo"
        }
    }


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )


# Both startup and shutdown events are handled by the lifespan function above


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
