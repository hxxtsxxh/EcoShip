// UPS API Service for real shipping data
// Note: This requires UPS Developer Kit access and proper authentication
// For demo purposes, we'll create a service that can be easily connected to UPS APIs
// Now integrated with FastAPI backend for enhanced carbon footprint analysis

import { backendAPIService, BackendShippingRequest as BackendRequest } from './backendAPI';

export interface UPSTrackingResponse {
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  service: string;
  weight?: string;
  dimensions?: string;
  activities: UPSActivity[];
  package: {
    weight: string;
    dimensions: string;
  };
  origin: {
    city: string;
    state: string;
    country: string;
  };
  destination: {
    city: string;
    state: string;
    country: string;
  };
}

export interface UPSActivity {
  location: {
    city: string;
    state: string;
    country: string;
  };
  status: string;
  description: string;
  date: string;
  time: string;
}

export interface UPSRateResponse {
  service: string;
  serviceCode: string;
  cost: string;
  currency: string;
  transitTime: string;
  carbonNeutral: boolean;
  estimatedDelivery: string;
}

export interface UPSAddressValidationResponse {
  valid: boolean;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  suggested?: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Backend-specific interfaces for integration
export interface BackendShippingRequest {
  origin: {
    city: string;
    state: string;
    zip_code: string;
    country?: string;
  };
  destination: {
    city: string;
    state: string;
    zip_code: string;
    country?: string;
  };
  package: {
    weight_kg: number;
    category: 'envelope' | 'small' | 'medium' | 'large';
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  };
  ship_date?: string;
}

export interface BackendQuoteResponse {
  service_name: string;
  service_code: string;
  commitment_time: string;
  commitment_formatted: string;
  commitment_with_date: string;
  estimated_delivery_date: string;
  delivery_date_formatted: string;
  eta_hours: number;
  cost_usd: number;
  carbon_context: {
    total_co2_kg: number;
    trees_offset_equivalent: number;
    car_miles_equivalent: number;
    co2_per_kg: number;
  };
  transport_mix: {
    air_percentage: number;
    ground_percentage: number;
  };
  eco_badge: string;
  carbon_savings_percentage: number;
  priority_level: number;
  eco_efficiency: {
    points: number;
    tier: string;
    cost_effectiveness_score: number;
    environmental_score: number;
    explanation: string;
  };
}

export interface BackendShippingResponse {
  success: boolean;
  data: {
    quotes: BackendQuoteResponse[];
    route_info: {
      origin_city: string;
      destination_city: string;
      total_distance_km: number;
      route_complexity: string;
    };
    summary: {
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
    };
    eco_efficiency_summary: any;
    request_details: {
      origin: string;
      destination: string;
      weight_kg: number;
      package_category: string;
      ship_date: string;
    };
  };
  message: string;
  timestamp: string;
}

class UPSAPIService {
  private accessToken: string;
  private baseUrl: string;
  private backendUrl: string;
  private demoMode: boolean;
  private useBackend: boolean;

  constructor() {
    // Check if we have real credentials
    this.accessToken = process.env.UPS_ACCESS_TOKEN || 'demo-token';
    this.demoMode = this.accessToken === 'demo-token';
    
    // Backend integration configuration
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    this.useBackend = process.env.USE_BACKEND !== 'false'; // Default to using backend
    
    this.baseUrl = this.demoMode 
      ? 'https://demo.ups.com/api' // Demo endpoint (won't be called)
      : 'https://wwwcie.ups.com/api'; // Real UPS test environment
  }

  private getAuthHeaders(transactionId?: string) {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'transId': transactionId || this.generateTransactionId(),
      'transactionSrc': 'ups-ecoship-app'
    };
  }

  private generateTransactionId(): string {
    return `ups-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if we're in demo mode
  isDemoMode(): boolean {
    return this.demoMode;
  }

  // Check if we're using the backend
  isUsingBackend(): boolean {
    return this.useBackend;
  }

  // Health check for backend connectivity
  async checkBackendHealth(): Promise<boolean> {
    const health = await backendAPIService.checkHealth();
    return health !== null && health.status === 'healthy';
  }

  // Track a package using UPS Tracking API or Backend
  async trackPackage(trackingNumber: string, options?: {
    locale?: string;
    returnSignature?: boolean;
    returnMilestones?: boolean;
    returnPOD?: boolean;
  }): Promise<UPSTrackingResponse> {
    try {
      // For demo mode, always return mock data with enhanced realism
      if (this.demoMode) {
        console.log('🚀 Running in demo mode - using enhanced mock data');
        return this.getMockTrackingData(trackingNumber);
      }

      // If using backend and not in demo mode, we could potentially enhance 
      // tracking data with carbon information from the backend
      if (this.useBackend && !this.demoMode) {
        try {
          // Try to enhance tracking data with backend information
          const trackingData = await this.getEnhancedTrackingData(trackingNumber);
          if (trackingData) {
            return trackingData;
          }
        } catch (backendError) {
          console.log('Backend enhancement failed, proceeding with UPS API');
        }
      }

      const {
        locale = 'en_US',
        returnSignature = false,
        returnMilestones = true,
        returnPOD = false
      } = options || {};

      const queryParams = new URLSearchParams({
        locale,
        returnSignature: returnSignature.toString(),
        returnMilestones: returnMilestones.toString(),
        returnPOD: returnPOD.toString()
      });

      const url = `${this.baseUrl}/track/v1/details/${trackingNumber}?${queryParams}`;
      
      console.log('📦 Calling UPS Tracking API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`UPS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformUPSResponse(data);
      
    } catch (error) {
      console.error('UPS Tracking API Error:', error);
      // Always fallback to mock data for better user experience
      console.log('📦 Falling back to demo data');
      return this.getMockTrackingData(trackingNumber);
    }
  }

  // Enhanced tracking with backend carbon information
  private async getEnhancedTrackingData(trackingNumber: string): Promise<UPSTrackingResponse | null> {
    try {
      // This is a future enhancement - for now, return null to use standard tracking
      // In the future, this could call the backend to get carbon footprint data
      // for a tracked shipment based on its service type and route
      return null;
    } catch (error) {
      console.error('Enhanced tracking failed:', error);
      return null;
    }
  }

  // Track by reference number using UPS Reference Tracking API
  async trackByReference(referenceNumber: string, options?: {
    locale?: string;
    fromPickUpDate?: string;
    toPickUpDate?: string;
    destCountry?: string;
    destZip?: string;
    shipperNum?: string;
    refNumType?: 'SmallPackage' | 'fgv';
  }): Promise<UPSTrackingResponse[]> {
    try {
      // For demo mode, always return mock data
      if (this.demoMode) {
        console.log('🚀 Running in demo mode - using enhanced mock data');
        return [this.getMockTrackingData(referenceNumber)];
      }

      const {
        locale = 'en_US',
        fromPickUpDate,
        toPickUpDate,
        destCountry,
        destZip,
        shipperNum,
        refNumType = 'SmallPackage'
      } = options || {};

      const queryParams = new URLSearchParams({
        locale,
        refNumType
      });

      if (fromPickUpDate) queryParams.append('fromPickUpDate', fromPickUpDate);
      if (toPickUpDate) queryParams.append('toPickUpDate', toPickUpDate);
      if (destCountry) queryParams.append('destCountry', destCountry);
      if (destZip) queryParams.append('destZip', destZip);
      if (shipperNum) queryParams.append('shipperNum', shipperNum);

      const url = `${this.baseUrl}/track/v1/reference/details/${referenceNumber}?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`UPS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformUPSReferenceResponse(data);
      
    } catch (error) {
      console.error('UPS Reference Tracking API Error:', error);
      // Fallback to mock data if API fails
      return [this.getMockTrackingData(referenceNumber)];
    }
  }

  // Transform UPS API response to our internal format
  private transformUPSResponse(upsResponse: any): UPSTrackingResponse {
    const shipment = upsResponse.trackResponse?.shipment?.[0];
    if (!shipment) {
      throw new Error('Invalid tracking response from UPS API');
    }

    const activities: UPSActivity[] = shipment.package?.[0]?.activity?.map((activity: any) => ({
      location: {
        city: activity.location?.address?.city || '',
        state: activity.location?.address?.stateProvinceCode || '',
        country: activity.location?.address?.countryCode || ''
      },
      status: activity.status?.description || '',
      description: activity.status?.description || '',
      date: activity.date || '',
      time: activity.time || ''
    })) || [];

    return {
      trackingNumber: shipment.inquiryNumber || '',
      status: shipment.package?.[0]?.currentStatus?.description || 'Unknown',
      estimatedDelivery: shipment.deliveryDate?.[0]?.date || undefined,
      service: shipment.service?.description || 'UPS Service',
      activities,
      package: {
        weight: shipment.package?.[0]?.packageWeight?.weight || 'N/A',
        dimensions: shipment.package?.[0]?.dimensions ? 
          `${shipment.package[0].dimensions.length}x${shipment.package[0].dimensions.width}x${shipment.package[0].dimensions.height}` : 
          'N/A'
      },
      origin: {
        city: shipment.shipper?.address?.city || '',
        state: shipment.shipper?.address?.stateProvinceCode || '',
        country: shipment.shipper?.address?.countryCode || ''
      },
      destination: {
        city: shipment.consignee?.address?.city || '',
        state: shipment.consignee?.address?.stateProvinceCode || '',
        country: shipment.consignee?.address?.countryCode || ''
      }
    };
  }

  // Transform UPS reference tracking response
  private transformUPSReferenceResponse(upsResponse: any): UPSTrackingResponse[] {
    const shipments = upsResponse.trackResponse?.shipment || [];
    return shipments.map((shipment: any) => this.transformSingleShipment(shipment));
  }

  private transformSingleShipment(shipment: any): UPSTrackingResponse {
    // Similar transformation logic as transformUPSResponse but for individual shipment
    const activities: UPSActivity[] = shipment.package?.[0]?.activity?.map((activity: any) => ({
      location: {
        city: activity.location?.address?.city || '',
        state: activity.location?.address?.stateProvinceCode || '',
        country: activity.location?.address?.countryCode || ''
      },
      status: activity.status?.description || '',
      description: activity.status?.description || '',
      date: activity.date || '',
      time: activity.time || ''
    })) || [];

    return {
      trackingNumber: shipment.inquiryNumber || '',
      status: shipment.package?.[0]?.currentStatus?.description || 'Unknown',
      estimatedDelivery: shipment.deliveryDate?.[0]?.date || undefined,
      service: shipment.service?.description || 'UPS Service',
      activities,
      package: {
        weight: shipment.package?.[0]?.packageWeight?.weight || 'N/A',
        dimensions: shipment.package?.[0]?.dimensions ? 
          `${shipment.package[0].dimensions.length}x${shipment.package[0].dimensions.width}x${shipment.package[0].dimensions.height}` : 
          'N/A'
      },
      origin: {
        city: shipment.shipper?.address?.city || '',
        state: shipment.shipper?.address?.stateProvinceCode || '',
        country: shipment.shipper?.address?.countryCode || ''
      },
      destination: {
        city: shipment.consignee?.address?.city || '',
        state: shipment.consignee?.address?.stateProvinceCode || '',
        country: shipment.consignee?.address?.countryCode || ''
      }
    };
  }

  // Get shipping rates using UPS Rating API or Backend
  async getRates(
    origin: { city: string; state: string; postalCode: string; country: string },
    destination: { city: string; state: string; postalCode: string; country: string },
    packageDetails: { weight: number; length: number; width: number; height: number }
  ): Promise<UPSRateResponse[]> {
    try {
      // If using backend, call the backend API
      if (this.useBackend) {
        return await this.getBackendRates(origin, destination, packageDetails);
      }

      // Fallback to mock data if not using backend
      return this.getMockRateData(origin, destination, packageDetails);
    } catch (error) {
      console.error('UPS Rating API Error:', error);
      // Always fallback to mock data for better user experience
      console.log('📦 Falling back to demo data');
      return this.getMockRateData(origin, destination, packageDetails);
    }
  }

  // Backend integration method for getting rates
  private async getBackendRates(
    origin: { city: string; state: string; postalCode: string; country: string },
    destination: { city: string; state: string; postalCode: string; country: string },
    packageDetails: { weight: number; length: number; width: number; height: number }
  ): Promise<UPSRateResponse[]> {
    try {
      // Check backend health first
      const health = await backendAPIService.checkHealth();
      if (!health) {
        throw new Error('Backend is not available');
      }

      console.log('✅ Backend is healthy, proceeding with rate calculation');

      // Convert app data to backend format
      const backendRequest = backendAPIService.convertToBackendRequest(
        origin,
        destination,
        packageDetails
      );

      console.log('🚀 Calling backend shipping calculator');
      
      const backendResponse = await backendAPIService.calculateShipping(backendRequest);
      
      if (!backendResponse) {
        throw new Error('Backend returned no response');
      }

      if (!backendResponse.success) {
        throw new Error('Backend returned unsuccessful response');
      }

      console.log(`✅ Backend returned ${backendResponse.data.quotes.length} quotes`);

      // Transform backend response to UPS Rate Response format
      return backendAPIService.convertToAppRates(backendResponse);
      
    } catch (error) {
      console.error('Backend rates API error:', error);
      throw error;
    }
  }

  // Get available shipping routes from backend
  async getAvailableRoutes(): Promise<any[]> {
    try {
      if (!this.useBackend) {
        return [];
      }

      return await backendAPIService.getRoutes();
    } catch (error) {
      console.error('Failed to get routes from backend:', error);
      return [];
    }
  }

  // Get UPS services information from backend
  async getServicesInfo(): Promise<any[]> {
    try {
      if (!this.useBackend) {
        return [];
      }

      return await backendAPIService.getServices();
    } catch (error) {
      console.error('Failed to get services from backend:', error);
      return [];
    }
  }

  // Get demo data from backend
  async getBackendDemo(): Promise<any> {
    try {
      if (!this.useBackend) {
        return null;
      }

      return await backendAPIService.getDemo();
    } catch (error) {
      console.error('Failed to get demo data from backend:', error);
      return null;
    }
  }

  // Validate address using UPS Address Validation API
  async validateAddress(address: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Promise<UPSAddressValidationResponse> {
    try {
      // In a real implementation, this would call the actual UPS API
      return this.getMockAddressValidation(address);
    } catch (error) {
      console.error('UPS Address Validation API Error:', error);
      throw new Error('Unable to validate address. Please try again later.');
    }
  }

  // Mock data methods - replace with actual API calls in production

  // Enhanced mock data with realistic variations based on tracking number
  private getMockTrackingData(trackingNumber: string): UPSTrackingResponse {
    // Create different scenarios based on tracking number patterns
    const scenarios = this.getTrackingScenario(trackingNumber);
    
    return {
      trackingNumber,
      status: scenarios.status,
      estimatedDelivery: scenarios.estimatedDelivery,
      service: scenarios.service,
      activities: scenarios.activities,
      package: {
        weight: scenarios.weight,
        dimensions: scenarios.dimensions
      },
      origin: scenarios.origin,
      destination: scenarios.destination
    };
  }

  private getTrackingScenario(trackingNumber: string) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    // Different scenarios based on tracking number characteristics
    const lastChar = trackingNumber.slice(-1);
    const isEven = parseInt(lastChar) % 2 === 0;
    const trackingHash = trackingNumber.length + trackingNumber.charCodeAt(0);
    
    if (trackingNumber.toLowerCase().includes('delivered') || lastChar === '0') {
      // Delivered scenario
      return {
        status: 'Delivered',
        estimatedDelivery: `${yesterday.toLocaleDateString()} by 3:00 PM`,
        service: 'UPS Ground',
        weight: '3.2 lbs',
        dimensions: '12x10x8 in',
        origin: { city: 'Atlanta', state: 'GA', country: 'US' },
        destination: { city: 'New York', state: 'NY', country: 'US' },
        activities: [
          {
            location: { city: 'New York', state: 'NY', country: 'US' },
            status: 'Delivered',
            description: 'Package delivered to front door',
            date: yesterday.toISOString().split('T')[0],
            time: '15:30:00'
          },
          {
            location: { city: 'New York', state: 'NY', country: 'US' },
            status: 'Out for Delivery',
            description: 'Package is out for delivery',
            date: yesterday.toISOString().split('T')[0],
            time: '08:15:00'
          },
          {
            location: { city: 'Philadelphia', state: 'PA', country: 'US' },
            status: 'In Transit',
            description: 'Package departed facility',
            date: twoDaysAgo.toISOString().split('T')[0],
            time: '23:45:00'
          }
        ]
      };
    } else if (trackingNumber.toLowerCase().includes('transit') || isEven) {
      // In Transit scenario
      return {
        status: 'In Transit',
        estimatedDelivery: `${new Date(today.getTime() + 86400000).toLocaleDateString()} by End of Day`,
        service: 'UPS Ground',
        weight: '2.8 lbs',
        dimensions: '14x8x6 in',
        origin: { city: 'Los Angeles', state: 'CA', country: 'US' },
        destination: { city: 'Chicago', state: 'IL', country: 'US' },
        activities: [
          {
            location: { city: 'Denver', state: 'CO', country: 'US' },
            status: 'In Transit',
            description: 'Package in transit to next facility',
            date: today.toISOString().split('T')[0],
            time: '06:30:00'
          },
          {
            location: { city: 'Las Vegas', state: 'NV', country: 'US' },
            status: 'Departed from Facility',
            description: 'Package departed UPS facility',
            date: yesterday.toISOString().split('T')[0],
            time: '22:15:00'
          },
          {
            location: { city: 'Los Angeles', state: 'CA', country: 'US' },
            status: 'Origin Scan',
            description: 'Package received at UPS facility',
            date: yesterday.toISOString().split('T')[0],
            time: '14:20:00'
          }
        ]
      };
    } else {
      // Out for Delivery scenario
      return {
        status: 'Out for Delivery',
        estimatedDelivery: `${today.toLocaleDateString()} by 7:00 PM`,
        service: 'UPS 2nd Day Air',
        weight: '1.5 lbs',
        dimensions: '10x8x4 in',
        origin: { city: 'Dallas', state: 'TX', country: 'US' },
        destination: { city: 'Miami', state: 'FL', country: 'US' },
        activities: [
          {
            location: { city: 'Miami', state: 'FL', country: 'US' },
            status: 'Out for Delivery',
            description: 'Package is out for delivery',
            date: today.toISOString().split('T')[0],
            time: '09:30:00'
          },
          {
            location: { city: 'Miami', state: 'FL', country: 'US' },
            status: 'Arrived at Facility',
            description: 'Package arrived at delivery facility',
            date: today.toISOString().split('T')[0],
            time: '05:45:00'
          },
          {
            location: { city: 'Jacksonville', state: 'FL', country: 'US' },
            status: 'Departed from Facility',
            description: 'Package departed UPS facility',
            date: yesterday.toISOString().split('T')[0],
            time: '21:30:00'
          },
          {
            location: { city: 'Dallas', state: 'TX', country: 'US' },
            status: 'Origin Scan',
            description: 'Package picked up',
            date: yesterday.toISOString().split('T')[0],
            time: '16:15:00'
          }
        ]
      };
    }
  }

  private getMockRateData(
    origin: any,
    destination: any,
    packageDetails: any
  ): UPSRateResponse[] {
    const baseRate = 15.99;
    const weightMultiplier = packageDetails.weight * 0.5;
    
    return [
      {
        service: 'UPS Ground',
        serviceCode: '03',
        cost: (baseRate + weightMultiplier).toFixed(2),
        currency: 'USD',
        transitTime: '3-5 business days',
        carbonNeutral: false,
        estimatedDelivery: '2025-01-21'
      },
      {
        service: 'UPS 3 Day Select',
        serviceCode: '12',
        cost: (baseRate + weightMultiplier + 10).toFixed(2),
        currency: 'USD',
        transitTime: '3 business days',
        carbonNeutral: false,
        estimatedDelivery: '2025-01-19'
      },
      {
        service: 'UPS 2nd Day Air',
        serviceCode: '02',
        cost: (baseRate + weightMultiplier + 25).toFixed(2),
        currency: 'USD',
        transitTime: '2 business days',
        carbonNeutral: true,
        estimatedDelivery: '2025-01-18'
      },
      {
        service: 'UPS Next Day Air',
        serviceCode: '01',
        cost: (baseRate + weightMultiplier + 45).toFixed(2),
        currency: 'USD',
        transitTime: '1 business day',
        carbonNeutral: true,
        estimatedDelivery: '2025-01-17'
      }
    ];
  }

  private getMockAddressValidation(address: any): UPSAddressValidationResponse {
    // Mock validation - in reality this would verify against UPS database
    return {
      valid: true,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    };
  }

  // Calculate carbon footprint based on UPS sustainability data
  calculateCarbonFootprint(
    service: string,
    weight: number,
    distance: number
  ): number {
    // These are approximate values based on UPS sustainability reports
    const carbonFactors: { [key: string]: number } = {
      'UPS Ground': 0.8, // kg CO2e per lb per 100 miles
      'UPS 3 Day Select': 1.2,
      'UPS 2nd Day Air': 2.5,
      'UPS Next Day Air': 4.2,
    };

    const factor = carbonFactors[service] || 1.0;
    return (weight * distance * factor) / 100; // kg CO2e
  }

  // Get UPS service recommendations based on sustainability
  getEcoFriendlyRecommendations(rates: UPSRateResponse[]): UPSRateResponse[] {
    return rates
      .filter(rate => rate.carbonNeutral || rate.service === 'UPS Ground')
      .sort((a, b) => {
        // Prioritize carbon neutral options
        if (a.carbonNeutral && !b.carbonNeutral) return -1;
        if (!a.carbonNeutral && b.carbonNeutral) return 1;
        // Then sort by cost
        return parseFloat(a.cost) - parseFloat(b.cost);
      });
  }
}

export const upsAPIService = new UPSAPIService();
