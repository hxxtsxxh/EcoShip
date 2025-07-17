import axios from 'axios';

export class CitySearchService {
  // Using a comprehensive list of major US and Canadian cities
  static MAJOR_CITIES = [
    // Major US Cities
    { id: 'nyc', name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060 },
    { id: 'la', name: 'Los Angeles', state: 'CA', country: 'US', lat: 34.0522, lon: -118.2437 },
    { id: 'chicago', name: 'Chicago', state: 'IL', country: 'US', lat: 41.8781, lon: -87.6298 },
    { id: 'houston', name: 'Houston', state: 'TX', country: 'US', lat: 29.7604, lon: -95.3698 },
    { id: 'phoenix', name: 'Phoenix', state: 'AZ', country: 'US', lat: 33.4484, lon: -112.0740 },
    { id: 'philadelphia', name: 'Philadelphia', state: 'PA', country: 'US', lat: 39.9526, lon: -75.1652 },
    { id: 'san_antonio', name: 'San Antonio', state: 'TX', country: 'US', lat: 29.4241, lon: -98.4936 },
    { id: 'san_diego', name: 'San Diego', state: 'CA', country: 'US', lat: 32.7157, lon: -117.1611 },
    { id: 'dallas', name: 'Dallas', state: 'TX', country: 'US', lat: 32.7767, lon: -96.7970 },
    { id: 'san_jose', name: 'San Jose', state: 'CA', country: 'US', lat: 37.3382, lon: -121.8863 },
    { id: 'austin', name: 'Austin', state: 'TX', country: 'US', lat: 30.2672, lon: -97.7431 },
    { id: 'jacksonville', name: 'Jacksonville', state: 'FL', country: 'US', lat: 30.3322, lon: -81.6557 },
    { id: 'fort_worth', name: 'Fort Worth', state: 'TX', country: 'US', lat: 32.7555, lon: -97.3308 },
    { id: 'columbus', name: 'Columbus', state: 'OH', country: 'US', lat: 39.9612, lon: -82.9988 },
    { id: 'charlotte', name: 'Charlotte', state: 'NC', country: 'US', lat: 35.2271, lon: -80.8431 },
    { id: 'san_francisco', name: 'San Francisco', state: 'CA', country: 'US', lat: 37.7749, lon: -122.4194 },
    { id: 'indianapolis', name: 'Indianapolis', state: 'IN', country: 'US', lat: 39.7684, lon: -86.1581 },
    { id: 'seattle', name: 'Seattle', state: 'WA', country: 'US', lat: 47.6062, lon: -122.3321 },
    { id: 'denver', name: 'Denver', state: 'CO', country: 'US', lat: 39.7392, lon: -104.9903 },
    { id: 'washington', name: 'Washington', state: 'DC', country: 'US', lat: 38.9072, lon: -77.0369 },
    { id: 'boston', name: 'Boston', state: 'MA', country: 'US', lat: 42.3601, lon: -71.0589 },
    { id: 'el_paso', name: 'El Paso', state: 'TX', country: 'US', lat: 31.7619, lon: -106.4850 },
    { id: 'detroit', name: 'Detroit', state: 'MI', country: 'US', lat: 42.3314, lon: -83.0458 },
    { id: 'nashville', name: 'Nashville', state: 'TN', country: 'US', lat: 36.1627, lon: -86.7816 },
    { id: 'portland', name: 'Portland', state: 'OR', country: 'US', lat: 45.5152, lon: -122.6784 },
    { id: 'memphis', name: 'Memphis', state: 'TN', country: 'US', lat: 35.1495, lon: -90.0490 },
    { id: 'oklahoma_city', name: 'Oklahoma City', state: 'OK', country: 'US', lat: 35.4676, lon: -97.5164 },
    { id: 'las_vegas', name: 'Las Vegas', state: 'NV', country: 'US', lat: 36.1699, lon: -115.1398 },
    { id: 'louisville', name: 'Louisville', state: 'KY', country: 'US', lat: 38.2527, lon: -85.7585 },
    { id: 'baltimore', name: 'Baltimore', state: 'MD', country: 'US', lat: 39.2904, lon: -76.6122 },
    { id: 'milwaukee', name: 'Milwaukee', state: 'WI', country: 'US', lat: 43.0389, lon: -87.9065 },
    { id: 'albuquerque', name: 'Albuquerque', state: 'NM', country: 'US', lat: 35.0844, lon: -106.6504 },
    { id: 'tucson', name: 'Tucson', state: 'AZ', country: 'US', lat: 32.2226, lon: -110.9747 },
    { id: 'fresno', name: 'Fresno', state: 'CA', country: 'US', lat: 36.7378, lon: -119.7871 },
    { id: 'sacramento', name: 'Sacramento', state: 'CA', country: 'US', lat: 38.5816, lon: -121.4944 },
    { id: 'kansas_city', name: 'Kansas City', state: 'MO', country: 'US', lat: 39.0997, lon: -94.5786 },
    { id: 'mesa', name: 'Mesa', state: 'AZ', country: 'US', lat: 33.4152, lon: -111.8315 },
    { id: 'atlanta', name: 'Atlanta', state: 'GA', country: 'US', lat: 33.7490, lon: -84.3880 },
    { id: 'colorado_springs', name: 'Colorado Springs', state: 'CO', country: 'US', lat: 38.8339, lon: -104.8214 },
    { id: 'raleigh', name: 'Raleigh', state: 'NC', country: 'US', lat: 35.7796, lon: -78.6382 },
    { id: 'omaha', name: 'Omaha', state: 'NE', country: 'US', lat: 41.2565, lon: -95.9345 },
    { id: 'miami', name: 'Miami', state: 'FL', country: 'US', lat: 25.7617, lon: -80.1918 },
    { id: 'long_beach', name: 'Long Beach', state: 'CA', country: 'US', lat: 33.7701, lon: -118.1937 },
    { id: 'virginia_beach', name: 'Virginia Beach', state: 'VA', country: 'US', lat: 36.8529, lon: -75.9780 },
    { id: 'oakland', name: 'Oakland', state: 'CA', country: 'US', lat: 37.8044, lon: -122.2711 },
    { id: 'minneapolis', name: 'Minneapolis', state: 'MN', country: 'US', lat: 44.9778, lon: -93.2650 },
    { id: 'tulsa', name: 'Tulsa', state: 'OK', country: 'US', lat: 36.1540, lon: -95.9928 },
    { id: 'tampa', name: 'Tampa', state: 'FL', country: 'US', lat: 27.9506, lon: -82.4572 },
    { id: 'arlington', name: 'Arlington', state: 'TX', country: 'US', lat: 32.7357, lon: -97.1081 },
    { id: 'new_orleans', name: 'New Orleans', state: 'LA', country: 'US', lat: 29.9511, lon: -90.0715 },
    { id: 'wichita', name: 'Wichita', state: 'KS', country: 'US', lat: 37.6872, lon: -97.3301 },
    { id: 'cleveland', name: 'Cleveland', state: 'OH', country: 'US', lat: 41.4993, lon: -81.6944 },
    
    // Major Canadian Cities
    { id: 'toronto', name: 'Toronto', state: 'ON', country: 'CA', lat: 43.6532, lon: -79.3832 },
    { id: 'montreal', name: 'Montreal', state: 'QC', country: 'CA', lat: 45.5017, lon: -73.5673 },
    { id: 'vancouver', name: 'Vancouver', state: 'BC', country: 'CA', lat: 49.2827, lon: -123.1207 },
    { id: 'calgary', name: 'Calgary', state: 'AB', country: 'CA', lat: 51.0447, lon: -114.0719 },
    { id: 'edmonton', name: 'Edmonton', state: 'AB', country: 'CA', lat: 53.5461, lon: -113.4938 },
    { id: 'ottawa', name: 'Ottawa', state: 'ON', country: 'CA', lat: 45.4215, lon: -75.6972 },
    { id: 'winnipeg', name: 'Winnipeg', state: 'MB', country: 'CA', lat: 49.8951, lon: -97.1384 },
    { id: 'quebec_city', name: 'Quebec City', state: 'QC', country: 'CA', lat: 46.8139, lon: -71.2080 },
    { id: 'hamilton', name: 'Hamilton', state: 'ON', country: 'CA', lat: 43.2557, lon: -79.8711 },
    { id: 'kitchener', name: 'Kitchener', state: 'ON', country: 'CA', lat: 43.4516, lon: -80.4925 },
    { id: 'london', name: 'London', state: 'ON', country: 'CA', lat: 42.9849, lon: -81.2453 },
    { id: 'victoria', name: 'Victoria', state: 'BC', country: 'CA', lat: 48.4284, lon: -123.3656 },
    { id: 'halifax', name: 'Halifax', state: 'NS', country: 'CA', lat: 44.6488, lon: -63.5752 },
    { id: 'oshawa', name: 'Oshawa', state: 'ON', country: 'CA', lat: 43.8971, lon: -78.8658 },
    { id: 'windsor', name: 'Windsor', state: 'ON', country: 'CA', lat: 42.3149, lon: -83.0364 },
    { id: 'saskatoon', name: 'Saskatoon', state: 'SK', country: 'CA', lat: 52.1332, lon: -106.6700 },
    { id: 'regina', name: 'Regina', state: 'SK', country: 'CA', lat: 50.4452, lon: -104.6189 },
    { id: 'sherbrooke', name: 'Sherbrooke', state: 'QC', country: 'CA', lat: 45.4042, lon: -71.8929 },
    { id: 'kelowna', name: 'Kelowna', state: 'BC', country: 'CA', lat: 49.8880, lon: -119.4960 },
    { id: 'barrie', name: 'Barrie', state: 'ON', country: 'CA', lat: 44.3894, lon: -79.6903 }
  ];

  static searchCities(query) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    return this.MAJOR_CITIES
      .filter(city => 
        city.name.toLowerCase().includes(searchTerm) ||
        city.state.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10)
      .map(city => ({
        id: city.id,
        name: city.name,
        fullName: `${city.name}, ${city.state}`,
        lat: city.lat,
        lon: city.lon,
        state: city.state,
        country: city.country
      }));
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
}