import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { Package, ArrowRight, Leaf, Server } from 'lucide-react-native';
import CitySearchInput from '../../components/CitySearchInput';
import ShippingOptionCard from '../../components/ShippingOptionCard';
import BackendStatus from '../../components/BackendStatus';
import { CitySearchService } from '../../services/citySearch';
import { backendAPIService } from '../../services/backendAPI';
import { UserService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

export default function CalculatorScreen() {
  const [originCity, setOriginCity] = useState<any>(null);
  const [destCity, setDestCity] = useState<any>(null);
  const [packageWeight, setPackageWeight] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBackendStatus, setShowBackendStatus] = useState(false);

  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { addShipment } = useUser();

  const calculateShipping = async () => {
    if (!originCity || !destCity || !packageWeight) {
      Alert.alert('Missing Information', 'Please fill in all fields before calculating shipping options.');
      return;
    }

    const weight = parseFloat(packageWeight);
    if (weight <= 0 || weight > 68) {
      Alert.alert('Invalid Weight', 'Package weight must be between 0.1 and 68 kg.');
      return;
    }

    setIsCalculating(true);
    try {
      // Create backend request format with more robust city data handling
      const backendRequest = backendAPIService.convertToBackendRequest(
        {
          city: originCity.name || originCity.display_name || originCity.city || 'New York',
          state: originCity.state || originCity.administrative?.[0]?.short_name || 'NY',
          postalCode: originCity.postalCode || originCity.postcode || '10001',
          country: 'US'
        },
        {
          city: destCity.name || destCity.display_name || destCity.city || 'Los Angeles',
          state: destCity.state || destCity.administrative?.[0]?.short_name || 'CA',
          postalCode: destCity.postalCode || destCity.postcode || '90210',
          country: 'US'
        },
        {
          weight: weight // Weight already in kg, no conversion needed
        }
      );

      console.log('🚀 Sending request to backend:', backendRequest);

      const backendResponse = await backendAPIService.calculateShipping(backendRequest);
      
      if (backendResponse && backendResponse.success) {
        // Convert backend response to app format
        const options = backendAPIService.convertToAppRates(backendResponse);
        
        // Add the required fields for the ShippingOptionCard component
        const enhancedOptions = options.map((option, index) => ({
          id: `option-${index}`,
          name: option.service,
          cost: option.cost,
          carbonFootprint: option.carbonFootprint,
          deliveryDate: option.estimatedDelivery || option.transitTime,
          ecoScore: option.ecoEfficiency?.points || 0, // Use 0 as fallback for 0-25 scale
          airTransportPercent: option.transportMix?.air_percentage || 0,
          transportMix: {
            air: option.transportMix?.air_percentage || 0,
            truck: option.transportMix?.ground_percentage || 100
          },
          // Additional backend data
          treesEquivalent: option.treesEquivalent,
          carMilesEquivalent: option.carMilesEquivalent,
          carbonNeutral: option.carbonNeutral,
          carbonSavings: option.carbonSavings,
          ecoEfficiency: option.ecoEfficiency
        }));

        console.log('✅ Enhanced options:', enhancedOptions);
        setShippingOptions(enhancedOptions);
      } else {
        throw new Error('Failed to get shipping quotes from backend');
      }
    } catch (error) {
      console.error('❌ Backend calculation error:', error);
      Alert.alert('Error', 'Failed to calculate shipping options. Please check your internet connection and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const selectShippingOption = async (option: any) => {
    setSelectedOption(option);
    
    try {
      // Save shipment to user's profile using UserContext for real-time updates
      const shipmentData = {
        originCity: originCity?.name,
        destCity: destCity?.name,
        packageWeight: parseFloat(packageWeight), // Weight in kg
        service: option.name,
        cost: parseFloat(option.cost),
        carbonFootprint: parseFloat(option.carbonFootprint),
        deliveryDate: option.deliveryDate,
        ecoScore: option.ecoScore,
        // Enhanced backend data for better reward calculation
        ecoEfficiencyPoints: option.ecoEfficiency?.points || 0,
        ecoTier: option.ecoEfficiency?.tier || 'unranked',
        treesEquivalent: option.treesEquivalent,
        carMilesEquivalent: option.carMilesEquivalent,
        carbonSavings: option.carbonSavings,
        ecoEfficiency: option.ecoEfficiency
      };

      // Use context's addShipment for automatic real-time updates across the app
      const result = await addShipment(shipmentData);
      
      Alert.alert(
        'Shipment Added!',
        `You earned ${result.pointsEarned} eco-points for this ${option.ecoEfficiency?.tier || 'standard'} choice. Total emissions: ${result.newTotalEmissions.toFixed(2)} kg CO₂e`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving shipment:', error);
    }
  };

  const getBestOption = () => {
    if (shippingOptions.length === 0) return null;
    return shippingOptions.reduce((best, current) => {
      // Use eco-efficiency points (cost-effectiveness + environmental balance)
      const bestEcoScore = best.ecoEfficiency?.points || 0;
      const currentEcoScore = current.ecoEfficiency?.points || 0;
      
      // If eco scores are tied, prefer higher cost (maximize profit)
      if (bestEcoScore === currentEcoScore) {
        const bestCost = parseFloat(best.cost) || 0;
        const currentCost = parseFloat(current.cost) || 0;
        return currentCost > bestCost ? current : best;
      }
      
      // Higher eco-efficiency score is better
      return currentEcoScore > bestEcoScore ? current : best;
    });
  };

  const bestOption = getBestOption();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>UPS Carbon Calculator</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Calculate shipping costs and environmental impact</Text>
            </View>
            <TouchableOpacity
              style={styles.backendStatusButton}
              onPress={() => setShowBackendStatus(true)}
            >
              <Server size={20} color="#351C15" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>From</Text>
            <CitySearchInput
              placeholder="Select origin city"
              onCitySelect={setOriginCity}
              selectedCity={originCity}
              style={styles.cityInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>To</Text>
            <CitySearchInput
              placeholder="Select destination city"
              onCitySelect={setDestCity}
              selectedCity={destCity}
              style={styles.cityInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Package Weight (kg)</Text>
            <TextInput
              style={styles.weightInput}
              value={packageWeight}
              onChangeText={setPackageWeight}
              placeholder="Enter weight in kg"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.calculateButton, isCalculating && styles.disabledButton]}
            onPress={calculateShipping}
            disabled={isCalculating}
          >
            <Package size={20} color="#fff" />
            <Text style={styles.calculateButtonText}>
              {isCalculating ? 'Calculating...' : 'Calculate Shipping'}
            </Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {shippingOptions.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Shipping Options</Text>
              {bestOption && (
                <View style={styles.bestOptionTag}>
                  <Leaf size={14} color="#10B981" />
                  <Text style={styles.bestOptionText}>
                    Best Value: {bestOption.name} ({bestOption.ecoEfficiency?.points || 0}/25 pts, {parseFloat(bestOption.carbonFootprint).toFixed(2)} kg CO₂e)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.optionsList}>
              {shippingOptions.map((option, index) => (
                <ShippingOptionCard
                  key={option.id}
                  option={option}
                  onSelect={selectShippingOption}
                  isSelected={selectedOption?.id === option.id}
                />
              ))}
            </View>

            {selectedOption && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Selected Service</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service:</Text>
                    <Text style={styles.summaryValue}>{selectedOption.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cost:</Text>
                    <Text style={styles.summaryValue}>${selectedOption.cost}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Carbon Footprint:</Text>
                    <Text style={styles.summaryValue}>{parseFloat(selectedOption.carbonFootprint).toFixed(2)} kg CO₂e</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Value Score:</Text>
                    <Text style={styles.summaryValue}>{selectedOption.ecoEfficiency?.points || 0}/25 ({selectedOption.ecoEfficiency?.tier || 'unranked'})</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Carbon Savings:</Text>
                    <Text style={styles.summaryValue}>{selectedOption.carbonSavings?.toFixed(1) || 0}% vs fastest</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery:</Text>
                    <Text style={styles.summaryValue}>{selectedOption.deliveryDate}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Bottom padding to account for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <BackendStatus
        visible={showBackendStatus}
        onClose={() => setShowBackendStatus(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backendStatusButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#351C15',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 8,
  },
  cityInput: {
    marginBottom: 8,
  },
  weightInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#351C15',
    minHeight: 56,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  calculateButton: {
    backgroundColor: '#351C15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#351C15',
    marginBottom: 8,
  },
  bestOptionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bestOptionText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  optionsList: {
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#351C15',
    fontWeight: '600',
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
