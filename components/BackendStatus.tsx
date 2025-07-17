import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Server, Wifi, WifiOff, CheckCircle, XCircle, Info, RefreshCw, Package, MapPin, Leaf } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { backendAPIService } from '../services/backendAPI';

export interface BackendStatusProps {
  visible: boolean;
  onClose: () => void;
}

export default function BackendStatus({ visible, onClose }: BackendStatusProps) {
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (visible) {
      checkBackendStatus();
    }
  }, [visible]);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      // Check health
      const health = await backendAPIService.checkHealth();
      setBackendHealth(health);
      
      if (health) {
        // Get routes and services if backend is healthy
        const [routesData, servicesData] = await Promise.all([
          backendAPIService.getRoutes(),
          backendAPIService.getServices()
        ]);
        setRoutes(routesData);
        setServices(servicesData);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Backend status check failed:', error);
      setBackendHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  const testBackendIntegration = async () => {
    try {
      const testRequest = backendAPIService.convertToBackendRequest(
        { city: 'New York', state: 'NY', postalCode: '10001', country: 'US' },
        { city: 'Los Angeles', state: 'CA', postalCode: '90210', country: 'US' },
        { weight: 5 }
      );

      const result = await backendAPIService.calculateShipping(testRequest);
      
      if (result) {
        Alert.alert(
          'Backend Test Successful',
          `Received ${result.data.quotes.length} shipping quotes from backend`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Backend Test Failed', 'No response from backend', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Backend Test Error', `Error: ${error}`, [{ text: 'OK' }]);
    }
  };

  const getStatusColor = () => {
    if (backendHealth?.status === 'healthy') return colors.success;
    return colors.error;
  };

  const getStatusIcon = () => {
    if (isChecking) return RefreshCw;
    if (backendHealth?.status === 'healthy') return CheckCircle;
    return XCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <Server size={24} color={colors.text} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Backend Integration Status
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Backend Health Status */}
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <StatusIcon 
                  size={20} 
                  color={getStatusColor()} 
                  style={isChecking ? styles.spinning : undefined}
                />
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Backend Server
                </Text>
              </View>
              <TouchableOpacity 
                onPress={checkBackendStatus}
                style={[styles.refreshButton, { borderColor: colors.border }]}
                disabled={isChecking}
              >
                <RefreshCw 
                  size={16} 
                  color={colors.primary} 
                  style={isChecking ? styles.spinning : undefined}
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {backendHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
            </Text>
            
            <Text style={[styles.backendUrl, { color: colors.textSecondary }]}>
              {backendAPIService.getBackendUrl()}
            </Text>
            
            {lastChecked && (
              <Text style={[styles.lastChecked, { color: colors.textSecondary }]}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Backend Features */}
          {backendHealth && (
            <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Available Features</Text>
              
              <View style={styles.featureRow}>
                <Wifi size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Carbon Footprint Analysis
                </Text>
                <CheckCircle size={16} color={colors.success} />
              </View>
              
              <View style={styles.featureRow}>
                <Package size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Shipping Rate Calculation
                </Text>
                <CheckCircle size={16} color={colors.success} />
              </View>
              
              <View style={styles.featureRow}>
                <MapPin size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Route Optimization
                </Text>
                <CheckCircle size={16} color={colors.success} />
              </View>

              <View style={styles.featureRow}>
                <Leaf size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Eco-Efficiency Scoring
                </Text>
                <CheckCircle size={16} color={colors.success} />
              </View>
            </View>
          )}

          {/* Backend Data */}
          {backendHealth && (
            <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Backend Data</Text>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
                  Available Routes:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text }]}>
                  {backendHealth.available_routes || routes.length}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
                  UPS Services:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text }]}>
                  {backendHealth.available_services || services.length}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
                  Eco-Efficiency:
                </Text>
                <Text style={[styles.dataValue, { color: colors.success }]}>
                  {backendHealth.eco_efficiency_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          )}

          {/* Test Integration */}
          <TouchableOpacity
            style={[styles.testButton, { 
              backgroundColor: backendHealth ? colors.primary : colors.border,
              opacity: backendHealth ? 1 : 0.6
            }]}
            onPress={testBackendIntegration}
            disabled={!backendHealth || isChecking}
          >
            <Text style={[styles.testButtonText, { 
              color: backendHealth ? colors.background : colors.textSecondary 
            }]}>
              Test Backend Integration
            </Text>
          </TouchableOpacity>

          {/* Information */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoHeader}>
              <Info size={16} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Backend Integration</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              The backend provides enhanced shipping calculations with detailed carbon footprint analysis, 
              eco-efficiency scoring, and optimized route suggestions. When connected, your app will use 
              real-time calculations instead of demo data.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  backendUrl: {
    fontSize: 12,
    marginBottom: 4,
  },
  lastChecked: {
    fontSize: 12,
  },
  featuresCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  dataCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 14,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  spinning: {
    // Note: React Native doesn't support CSS animations directly
    // This would need to be implemented with Animated API if needed
  },
});
