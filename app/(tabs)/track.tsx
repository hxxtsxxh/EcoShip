import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  Leaf, 
  HelpCircle, 
  Server,
  Truck,
  CheckCircle,
  Navigation,
  Zap,
  Shield,
  Star,
  Award,
  TrendingUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { upsAPIService } from '../../services/upsAPI';
import { useTheme } from '../../contexts/ThemeContext';
import DemoHelp from '../../components/DemoHelp';
import BackendStatus from '../../components/BackendStatus';

export default function TrackScreen() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [showBackendStatus, setShowBackendStatus] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const { colors, isDark } = useTheme();
  const { width } = Dimensions.get('window');

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (trackingData) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: trackingData.progress / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [trackingData]);

  const trackPackage = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    if (trackingNumber.length < 7 || trackingNumber.length > 34) {
      Alert.alert('Error', 'Tracking number must be between 7 and 34 characters');
      return;
    }

    setIsTracking(true);
    setError(null);
    
    try {
      const result = await upsAPIService.trackPackage(trackingNumber, {
        returnMilestones: true,
        returnSignature: false,
        returnPOD: false
      });
      
      // Transform UPS API response to match our UI expectations
      const transformedData = {
        ...result,
        progress: calculateProgress(result.status),
        carbonFootprint: upsAPIService.calculateCarbonFootprint(
          result.service,
          parseFloat(result.package.weight) || 2.5,
          500 // Default distance, could be calculated from origin/destination
        ).toFixed(2) + ' kg CO₂e',
        events: result.activities.map(activity => ({
          time: activity.time,
          date: activity.date,
          location: `${activity.location.city}, ${activity.location.state}`,
          status: activity.status,
          description: activity.description
        }))
      };
      
      setTrackingData(transformedData);
    } catch (error: any) {
      console.error('Tracking error:', error);
      setError(error.message || 'Failed to track package');
      Alert.alert('Tracking Error', error.message || 'Failed to track package. Please try again.');
    } finally {
      setIsTracking(false);
    }
  };

  const calculateProgress = (status: string): number => {
    const statusProgressMap: { [key: string]: number } = {
      'Origin Scan': 20,
      'In Transit': 60,
      'Out for Delivery': 90,
      'Delivered': 100,
      'Exception': 50
    };
    
    return statusProgressMap[status] || 30;
  };

  const renderTrackingEvent = (event: any, index: number, isLast: boolean) => {
    const getEventIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case 'delivered':
          return <CheckCircle size={18} color="#10B981" />;
        case 'out for delivery':
          return <Truck size={18} color="#F59E0B" />;
        case 'in transit':
          return <Navigation size={18} color="#3B82F6" />;
        default:
          return <Package size={18} color="#6B7280" />;
      }
    };

    return (
      <View 
        key={index} 
        style={styles.eventContainer}
      >
        <View style={styles.eventTimeline}>
          <View style={[
            styles.eventDot, 
            index === 0 && styles.currentEventDot,
            { borderWidth: 2, borderColor: index === 0 ? '#FFB500' : '#E5E5E5' }
          ]}>
            {index === 0 && getEventIcon(event.status)}
          </View>
          {!isLast && <View style={styles.eventLine} />}
        </View>
        <View style={[styles.eventContent, styles.modernEventCard]}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventStatus}>{event.status}</Text>
            <Text style={styles.eventTime}>{event.time}</Text>
          </View>
          <Text style={styles.eventDate}>{event.date}</Text>
          <View style={styles.eventLocation}>
            <MapPin size={14} color="#666" />
            <Text style={styles.eventLocationText}>{event.location}</Text>
          </View>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
        style={styles.heroHeader}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.headerIconContainer}>
            <LinearGradient
              colors={['#FFB500', '#FF8C00']}
              style={styles.headerIcon}
            >
              <Package size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Smart Tracking</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Monitor your shipment with real-time insights and environmental impact analysis
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Search Section */}
        <Animated.View 
          style={[
            styles.searchSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.modernSearchContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.searchIconContainer}>
              <Search size={20} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.modernSearchInput, { color: colors.text }]}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Enter tracking number..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.modernSearchButton]}
              onPress={trackPackage}
              disabled={isTracking}
            >
              <LinearGradient
                colors={['#FFB500', '#FF8C00']}
                style={styles.searchButtonGradient}
              >
                {isTracking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Zap size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Demo Mode Banner */}
        {upsAPIService.isDemoMode() && (
          <Animated.View 
            style={[
              styles.modernBanner,
              { 
                backgroundColor: colors.warning + '15',
                borderColor: colors.warning + '40',
                opacity: fadeAnim 
              }
            ]}
          >
            <LinearGradient
              colors={[colors.warning + '20', colors.warning + '10']}
              style={styles.bannerGradient}
            >
              <View style={[styles.bannerIcon, { backgroundColor: colors.warning + '20' }]}>
                <Package size={18} color={colors.warning} />
              </View>
              <View style={styles.bannerContent}>
                <Text style={[styles.bannerTitle, { color: colors.warning }]}>Demo Mode Active</Text>
                <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                  Enhanced mock data available. Try: "delivered", "transit", or any number
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowDemoHelp(true)}
                style={styles.bannerButton}
              >
                <HelpCircle size={20} color={colors.warning} />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Backend Integration Status */}
        {upsAPIService.isUsingBackend() && (
          <Animated.View 
            style={[
              styles.modernBanner,
              { 
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '40',
                opacity: fadeAnim 
              }
            ]}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.bannerGradient}
            >
              <View style={[styles.bannerIcon, { backgroundColor: colors.primary + '20' }]}>
                <Server size={18} color={colors.primary} />
              </View>
              <View style={styles.bannerContent}>
                <Text style={[styles.bannerTitle, { color: colors.primary }]}>Backend Integration</Text>
                <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                  Enhanced calculations with carbon footprint analysis
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowBackendStatus(true)}
                style={styles.bannerButton}
              >
                <Server size={20} color={colors.primary} />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {trackingData && (
          <Animated.View 
            style={[
              styles.trackingContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Modern Status Card */}
            <View style={[styles.modernStatusCard, { backgroundColor: colors.surface }]}>
              <LinearGradient
                colors={['#FFB500', '#FF8C00']}
                style={styles.statusCardGradient}
              >
                <View style={styles.statusCardHeader}>
                  <View style={styles.statusIconContainer}>
                    <CheckCircle size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.modernStatusTitle}>{trackingData.status}</Text>
                    <Text style={styles.modernTrackingNumber}>
                      #{trackingData.trackingNumber}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>LIVE</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Progress Section */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>Delivery Progress</Text>
                  <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                    {trackingData.progress}%
                  </Text>
                </View>
                
                <View style={styles.modernProgressBar}>
                  <Animated.View 
                    style={[
                      styles.modernProgressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }
                    ]} 
                  />
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Clock size={16} color="#666" />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      Est. {trackingData.estimatedDelivery}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Leaf size={16} color="#10B981" />
                    <Text style={styles.ecoStatText}>
                      {trackingData.carbonFootprint}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Star size={16} color="#FFB500" />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      Eco Choice
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Service Details Card */}
            <View style={[styles.modernServiceCard, { backgroundColor: colors.surface }]}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <Truck size={20} color="#FFB500" />
                </View>
                <Text style={[styles.modernServiceTitle, { color: colors.text }]}>Service Details</Text>
              </View>
              
              <View style={styles.serviceDetails}>
                <View style={styles.serviceRow}>
                  <Text style={[styles.serviceLabel, { color: colors.textSecondary }]}>Service Type</Text>
                  <Text style={[styles.serviceValue, { color: colors.text }]}>{trackingData.service}</Text>
                </View>
                
                <View style={styles.ecoImpactCard}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.ecoGradient}
                  >
                    <Award size={20} color="#FFFFFF" />
                    <View style={styles.ecoTextContainer}>
                      <Text style={styles.ecoTitle}>Eco-Friendly Choice</Text>
                      <Text style={styles.ecoDescription}>
                        60% less CO₂ than air shipping
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Timeline Card */}
            <View style={[styles.modernTimelineCard, { backgroundColor: colors.surface }]}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineIconContainer}>
                  <Navigation size={20} color="#FFB500" />
                </View>
                <Text style={[styles.modernTimelineTitle, { color: colors.text }]}>Journey Timeline</Text>
              </View>
              
              <View style={styles.modernTimeline}>
                {trackingData.events.map((event: any, index: number) => 
                  renderTrackingEvent(event, index, index === trackingData.events.length - 1)
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {!trackingData && (
          <Animated.View 
            style={[
              styles.modernEmptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#374151', '#4B5563'] : ['#F9FAFB', '#FFFFFF']}
              style={styles.emptyStateGradient}
            >
              <View style={styles.emptyIconContainer}>
                <Package size={80} color={colors.textSecondary} />
              </View>
              <Text style={[styles.modernEmptyTitle, { color: colors.text }]}>
                Ready to Track?
              </Text>
              <Text style={[styles.modernEmptyText, { color: colors.textSecondary }]}>
                Enter your tracking number above to monitor your shipment in real-time and 
                discover its environmental impact.
              </Text>
              
              <View style={styles.emptyFeatures}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <TrendingUp size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Real-time tracking
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Leaf size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Carbon footprint analysis
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Shield size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    Secure & reliable
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Bottom padding to account for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Demo Help Modal */}
      <DemoHelp visible={showDemoHelp} onClose={() => setShowDemoHelp(false)} />
      
      {/* Backend Status Modal */}
      <BackendStatus visible={showBackendStatus} onClose={() => setShowBackendStatus(false)} />
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
  
  // Hero Header Styles
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FFB500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // Modern Search Styles
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#1F2937',
  },
  modernSearchButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modern Banner Styles
  modernBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 18,
  },
  bannerButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Tracking Container
  trackingContainer: {
    paddingHorizontal: 20,
  },

  // Modern Status Card
  modernStatusCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  statusCardGradient: {
    padding: 20,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  modernStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modernTrackingNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress Section
  progressSection: {
    backgroundColor: '#FFFFFF',
    margin: -20,
    marginTop: 16,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  modernProgressBar: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modernProgressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#FFB500',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    textAlign: 'center',
  },
  ecoStatText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Modern Service Card
  modernServiceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernServiceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  serviceDetails: {
    gap: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: 14,
  },
  serviceValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Eco Impact Card
  ecoImpactCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ecoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ecoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  ecoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ecoDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },

  // Modern Timeline Card
  modernTimelineCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernTimelineTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modernTimeline: {
    paddingLeft: 8,
  },

  // Event Styles
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTimeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  eventDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentEventDot: {
    backgroundColor: '#FFB500',
  },
  eventLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  eventContent: {
    flex: 1,
    paddingBottom: 24,
  },
  modernEventCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB500',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventLocationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Modern Empty State
  modernEmptyState: {
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  modernEmptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modernEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyFeatures: {
    gap: 16,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Legacy styles for compatibility
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#351C15',
    marginRight: 12,
    minHeight: 56,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchButton: {
    backgroundColor: '#351C15',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  demoContent: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 14,
    color: '#666',
  },
  demoHelpButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
  },
  trackingNumberText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB500',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  carbonText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ecoTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
  },
  ecoTipText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#351C15',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  backendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
