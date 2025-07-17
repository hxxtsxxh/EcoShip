// Backend API Service for UPS Shipping Carbon Calculator
// Integrates React Native app with FastAPI backend

export interface BackendHealth {
  status: string;
  timestamp: string;
  available_routes: number;
  available_services: number;
  message: string;
  eco_efficiency_enabled: boolean;
}

export interface BackendLocation {
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface BackendPackage {
  weight_kg: number;
  category: 'envelope' | 'small' | 'medium' | 'large';
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  declared_value_usd?: number;
}

export interface BackendShippingRequest {
  origin: BackendLocation;
  destination: BackendLocation;
  package: BackendPackage;
  ship_date?: string;
  service_preferences?: string[];
  delivery_date_required?: string;
  insurance_required?: boolean;
  signature_required?: boolean;
}

export interface BackendCarbonContext {
  total_co2_kg: number;
  trees_offset_equivalent: number;
  car_miles_equivalent: number;
  co2_per_kg: number;
}

export interface BackendTransportMix {
  air_percentage: number;
  ground_percentage: number;
}

export interface BackendEcoEfficiency {
  points: number;
  tier: string;
  cost_effectiveness_score: number;
  environmental_score: number;
  explanation: string;
}

export interface BackendQuote {
  service_name: string;
  service_code: string;
  commitment_time: string;
  commitment_formatted: string;
  commitment_with_date: string;
  estimated_delivery_date: string;
  delivery_date_formatted: string;
  business_days_from_ship: number;
  eta_hours: number;
  cost_usd: number;
  carbon_context: BackendCarbonContext;
  transport_mix: BackendTransportMix;
  eco_badge: string;
  carbon_savings_percentage: number;
  priority_level: number;
  eco_efficiency: BackendEcoEfficiency;
}

export interface BackendRouteInfo {
  origin_city: string;
  destination_city: string;
  total_distance_km: number;
  route_complexity: string;
}

export interface BackendSummary {
  total_quotes: number;
  price_range_usd: {
    min: number;
    max: number;
  };
  carbon_range_kg: {
    min: number;
    max: number;
  };
  fastest_service: string;
  cheapest_service: string;
}

export interface BackendRequestDetails {
  origin: string;
  destination: string;
  weight_kg: number;
  package_category: string;
  ship_date: string;
  ship_date_formatted: string;
}

export interface BackendShippingResponse {
  success: boolean;
  data: {
    quotes: BackendQuote[];
    route_info: BackendRouteInfo;
    summary: BackendSummary;
    eco_efficiency_summary: any;
    request_details: BackendRequestDetails;
    delivery_info: {
      calculation_note: string;
      ship_date_used: string;
      weekend_handling: string;
    };
  };
  message: string;
  timestamp: string;
}

export interface BackendRoute {
  route_key: string;
  origin: BackendLocation;
  destination: BackendLocation;
  distances: {
    air_km: number;
    ground_km: number;
  };
  metadata: {
    complexity: string;
    description: string;
  };
}

export interface BackendService {
  service_key: string;
  service_name: string;
  service_code: string;
  commitment: string;
  eta_hours: number;
  transport_mix: BackendTransportMix;
  eco_badge: string;
  description: string;
  eco_efficiency_range: {
    min_points: number;
    max_points: number;
    typical_range: string;
    note: string;
  };
}

class BackendAPIService {
  private backendUrl: string;
  private timeout: number;

  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    this.timeout = 10000; // 10 seconds
  }

  // Set custom backend URL
  setBackendUrl(url: string): void {
    this.backendUrl = url;
  }

  // Get backend URL
  getBackendUrl(): string {
    return this.backendUrl;
  }

  // Health check
  async checkHealth(): Promise<BackendHealth | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend health check failed:', error);
      return null;
    }
  }

  // Calculate shipping quotes
  async calculateShipping(request: BackendShippingRequest): Promise<BackendShippingResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      console.log('🚀 Sending shipping request to backend:', JSON.stringify(request, null, 2));

      const response = await fetch(`${this.backendUrl}/calculate-shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response received successfully');
      return result;
    } catch (error) {
      console.error('Backend shipping calculation failed:', error);
      return null;
    }
  }

  // Get available routes
  async getRoutes(): Promise<BackendRoute[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.backendUrl}/routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data.routes : [];
    } catch (error) {
      console.error('Failed to get routes from backend:', error);
      return [];
    }
  }

  // Get services information
  async getServices(): Promise<BackendService[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.backendUrl}/services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data.services : [];
    } catch (error) {
      console.error('Failed to get services from backend:', error);
      return [];
    }
  }

  // Get demo data
  async getDemo(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.backendUrl}/demo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get demo data from backend:', error);
      return null;
    }
  }

  // Convert app data to backend format
  convertToBackendRequest(
    origin: { city: string; state: string; postalCode: string; country?: string },
    destination: { city: string; state: string; postalCode: string; country?: string },
    packageDetails: { weight: number; length?: number; width?: number; height?: number }
  ): BackendShippingRequest {
    // Weight is now already in kg, no conversion needed
    const weightKg = packageDetails.weight;
    
    // Determine package category based on weight in kg
    let category: 'envelope' | 'small' | 'medium' | 'large' = 'medium';
    if (weightKg <= 0.5) category = 'envelope';
    else if (weightKg <= 5) category = 'small';
    else if (weightKg <= 20) category = 'medium';
    else category = 'large';

    const request: BackendShippingRequest = {
      origin: {
        city: origin.city,
        state: origin.state,
        zip_code: origin.postalCode,
        country: origin.country || 'US'
      },
      destination: {
        city: destination.city,
        state: destination.state,
        zip_code: destination.postalCode,
        country: destination.country || 'US'
      },
      package: {
        weight_kg: weightKg,
        category
      }
    };

    // Add dimensions if provided (convert from inches to cm)
    if (packageDetails.length && packageDetails.width && packageDetails.height) {
      request.package.length_cm = packageDetails.length * 2.54;
      request.package.width_cm = packageDetails.width * 2.54;
      request.package.height_cm = packageDetails.height * 2.54;
    }

    return request;
  }

  // Convert backend response to app format
  convertToAppRates(backendResponse: BackendShippingResponse): any[] {
    return backendResponse.data.quotes.map(quote => ({
      service: quote.service_name,
      serviceCode: quote.service_code,
      cost: quote.cost_usd.toFixed(2),
      currency: 'USD',
      transitTime: quote.commitment_formatted,
      carbonNeutral: quote.eco_badge === 'carbon_neutral' || quote.eco_badge === 'eco_friendly',
      estimatedDelivery: quote.estimated_delivery_date || quote.delivery_date_formatted,
      // Enhanced fields from backend with proper structure mapping
      carbonFootprint: quote.carbon_context.total_co2_kg,
      treesEquivalent: quote.carbon_context.trees_offset_equivalent,
      carMilesEquivalent: quote.carbon_context.car_miles_equivalent,
      ecoEfficiency: quote.eco_efficiency,
      // Fix transport mix structure to match frontend expectations
      transportMix: {
        air_percentage: quote.transport_mix.air_percentage,
        ground_percentage: quote.transport_mix.ground_percentage
      },
      carbonSavings: quote.carbon_savings_percentage
    }));
  }
}

export const backendAPIService = new BackendAPIService();
