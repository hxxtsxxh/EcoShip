export class ShippingCalculatorService {
  static UPS_SERVICES = {
    'next-day-air': {
      id: 'next-day-air',
      name: 'UPS Next Day Air',
      deliveryDays: 1,
      airTransportPercent: 100,
      truckTransportPercent: 0,
      baseCostPerPound: 25.00,
      serviceMultiplier: 1.8
    },
    '2nd-day-air': {
      id: '2nd-day-air',
      name: 'UPS 2nd Day Air',
      deliveryDays: 2,
      airTransportPercent: 85,
      truckTransportPercent: 15,
      baseCostPerPound: 18.00,
      serviceMultiplier: 1.4
    },
    '3-day-select': {
      id: '3-day-select',
      name: 'UPS 3 Day Select',
      deliveryDays: 3,
      airTransportPercent: 30,
      truckTransportPercent: 70,
      baseCostPerPound: 12.00,
      serviceMultiplier: 1.1
    },
    'ground': {
      id: 'ground',
      name: 'UPS Ground',
      deliveryDays: 5,
      airTransportPercent: 0,
      truckTransportPercent: 100,
      baseCostPerPound: 8.00,
      serviceMultiplier: 1.0
    },
    'surepost': {
      id: 'surepost',
      name: 'UPS SurePost',
      deliveryDays: 7,
      airTransportPercent: 0,
      truckTransportPercent: 100,
      baseCostPerPound: 6.00,
      serviceMultiplier: 0.8
    }
  };

  static EMISSION_FACTORS = {
    truck: 0.150, // kg CO2e per tonne-km
    air: 0.570    // kg CO2e per tonne-km
  };

  static calculateShippingOptions(originCity, destCity, packageWeightKg, distance) {
    const options = [];
    
    Object.values(this.UPS_SERVICES).forEach(service => {
      const cost = this.calculateCost(service, packageWeightKg, distance);
      const carbonFootprint = this.calculateCarbonFootprint(service, packageWeightKg, distance);
      const deliveryDate = this.calculateDeliveryDate(service.deliveryDays);
      
      options.push({
        ...service,
        cost: cost.toFixed(2),
        carbonFootprint: carbonFootprint.toFixed(2),
        deliveryDate,
        ecoScore: this.calculateEcoScore(carbonFootprint, service.deliveryDays),
        transportMix: {
          air: service.airTransportPercent,
          truck: service.truckTransportPercent
        }
      });
    });

    // Sort by delivery time first, then by carbon footprint
    return options.sort((a, b) => {
      if (a.deliveryDays !== b.deliveryDays) {
        return a.deliveryDays - b.deliveryDays;
      }
      return parseFloat(a.carbonFootprint) - parseFloat(b.carbonFootprint);
    });
  }

  static calculateCost(service, weightKg, distanceKm) {
    // Convert kg to lbs for the cost calculation (legacy pricing is per lb)
    const weightLbs = weightKg * 2.20462;
    const distanceMiles = distanceKm * 0.621371;
    const baseRate = service.baseCostPerPound * weightLbs;
    const distanceMultiplier = Math.min(1 + (distanceMiles / 3000) * 0.5, 2.0);
    const zonePricing = this.getZonePricing(distanceMiles);
    
    return (baseRate * service.serviceMultiplier * distanceMultiplier * zonePricing);
  }

  static getZonePricing(distanceMiles) {
    if (distanceMiles <= 150) return 1.0; // Local zone
    if (distanceMiles <= 300) return 1.2; // Zone 2
    if (distanceMiles <= 600) return 1.4; // Zone 3
    if (distanceMiles <= 1000) return 1.6; // Zone 4
    if (distanceMiles <= 1400) return 1.8; // Zone 5
    if (distanceMiles <= 1800) return 2.0; // Zone 6
    return 2.2; // Zone 7+
  }

  static calculateCarbonFootprint(service, weightKg, distanceKm) {
    const weightTonnes = weightKg / 1000; // Convert kg to tonnes
    const tonneKm = weightTonnes * distanceKm;
    
    const airEmissions = (service.airTransportPercent / 100) * tonneKm * this.EMISSION_FACTORS.air;
    const truckEmissions = (service.truckTransportPercent / 100) * tonneKm * this.EMISSION_FACTORS.truck;
    
    return airEmissions + truckEmissions;
  }

  static calculateDeliveryDate(deliveryDays) {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    // Skip weekends for business days calculation
    let businessDays = 0;
    const currentDate = new Date(today);
    
    while (businessDays < deliveryDays) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        businessDays++;
      }
    }
    
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  static calculateEcoScore(carbonFootprint, deliveryDays) {
    // Higher score for lower carbon footprint, with bonus for slower delivery
    const carbonScore = Math.max(0, 100 - (carbonFootprint * 20));
    const speedBonus = deliveryDays * 5; // Bonus for choosing slower delivery
    return Math.min(100, carbonScore + speedBonus);
  }
}
