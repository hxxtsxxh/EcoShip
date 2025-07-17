#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, Request
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Test Routes")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Health endpoint working"}

@app.get("/test")
async def test_endpoint():
    return {"status": "success", "message": "Test endpoint working"}

@app.get("/routes")
async def get_routes():
    try:
        from services.ups_services import DEMO_ROUTES
        return {
            "success": True,
            "data": {"routes": list(DEMO_ROUTES.keys())},
            "message": "Routes retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Routes endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/services")
async def get_services():
    try:
        from services.ups_services import UPS_SERVICES
        return {
            "success": True,
            "data": {"services": list(UPS_SERVICES.keys())},
            "message": "Services retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Services endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-shipping")
async def calculate_shipping(request_data: Dict[str, Any]):
    try:
        from services.quote_generator import generate_shipping_quotes
        
        origin_city = request_data["origin"]["city"]
        destination_city = request_data["destination"]["city"]
        weight_kg = request_data["package"]["weight_kg"]
        
        result = generate_shipping_quotes(origin_city, destination_city, weight_kg)
        
        return {
            "success": True,
            "data": result,
            "message": "Quotes generated successfully"
        }
    except Exception as e:
        logger.error(f"Calculate shipping error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again later.")

if __name__ == "__main__":
    import uvicorn
    print(" Starting test server...")
    uvicorn.run("test_routes:app", host="0.0.0.0", port=8001, reload=True)
