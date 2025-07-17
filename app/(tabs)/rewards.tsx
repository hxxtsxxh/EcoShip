import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Award, Leaf, TrendingUp, Gift, Star } from 'lucide-react-native';
import { UserService } from '../../services/userService';
import { useUser } from '../../contexts/UserContext';

interface Reward {
  rewardID: string;
  minimumPoints: number;
  prize: string;
  description: string;
}

export default function RewardsScreen() {
  const { userData, loading: userLoading, refreshUserData } = useUser();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, []);

  // Refresh user data when the tab becomes focused for real-time updates
  useFocusEffect(
    React.useCallback(() => {
      refreshUserData();
    }, [refreshUserData])
  );

  const loadRewards = async () => {
    try {
      const rewardsData = await UserService.getRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextReward = () => {
    if (!userData) return null;
    return rewards.find(reward => reward.minimumPoints > userData.rewardPoints);
  };

  const getEligibleRewards = () => {
    if (!userData) return [];
    return rewards.filter(reward => reward.minimumPoints <= userData.rewardPoints);
  };

  const getProgressToNextReward = () => {
    const nextReward = getNextReward();
    if (!nextReward || !userData) return 0;
    
    const progress = (userData.rewardPoints / nextReward.minimumPoints) * 100;
    return Math.min(progress, 100);
  };

  const renderStatCard = (icon: React.ReactNode, title: string, value: string | number, subtitle: string, color = '#351C15') => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderRewardCard = (reward: Reward, isAvailable: boolean) => (
    <View key={reward.rewardID} style={[styles.rewardCard, !isAvailable && styles.disabledRewardCard]}>
      <View style={styles.rewardHeader}>
        <View style={styles.rewardIconContainer}>
          <Gift size={20} color={isAvailable ? '#FFB500' : '#999'} />
        </View>
        <View style={styles.rewardInfo}>
          <Text style={[styles.rewardTitle, !isAvailable && styles.disabledText]}>
            {reward.prize}
          </Text>
          <Text style={[styles.rewardPoints, !isAvailable && styles.disabledText]}>
            {reward.minimumPoints} points
          </Text>
        </View>
        {isAvailable && (
          <TouchableOpacity style={styles.claimButton}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.rewardDescription, !isAvailable && styles.disabledText]}>
        {reward.description}
      </Text>
    </View>
  );

  if (loading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your eco rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextReward = getNextReward();
  const eligibleRewards = getEligibleRewards();
  const progress = getProgressToNextReward();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Eco Rewards</Text>
          <Text style={styles.subtitle}>Earn points for sustainable shipping choices</Text>
        </View>

        {/* Points Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Star size={32} color="#FFB500" />
            <View style={styles.balanceInfo}>
              <Text style={styles.balancePoints}>{userData?.rewardPoints || 0}</Text>
              <Text style={styles.balanceLabel}>Eco Points</Text>
            </View>
          </View>
          
          {nextReward && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Progress to {nextReward.prize}
                </Text>
                <Text style={styles.progressPoints}>
                  {userData?.rewardPoints || 0} / {nextReward.minimumPoints}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${progress}%` }]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard(
              <Leaf size={20} color="#10B981" />,
              'Total Emissions',
              `${userData?.totalEmissions?.toFixed(1) || '0.0'} kg`,
              'CO₂e saved',
              '#10B981'
            )}
            {renderStatCard(
              <TrendingUp size={20} color="#3B82F6" />,
              'Shipments',
              userData?.numberOfShipments || 0,
              'packages sent',
              '#3B82F6'
            )}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard(
              <Award size={20} color="#F59E0B" />,
              'Avg. Impact',
              `${userData?.averageEmissionsPerPackage?.toFixed(1) || '0.0'} kg`,
              'per package',
              '#F59E0B'
            )}
            {renderStatCard(
              <Gift size={20} color="#8B5CF6" />,
              'Rewards',
              eligibleRewards.length,
              'available',
              '#8B5CF6'
            )}
          </View>
        </View>

        {/* Available Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          {eligibleRewards.length > 0 ? (
            <View style={styles.rewardsList}>
              {eligibleRewards.map(reward => renderRewardCard(reward, true))}
            </View>
          ) : (
            <View style={styles.emptyRewards}>
              <Gift size={48} color="#CCC" />
              <Text style={styles.emptyRewardsTitle}>No Rewards Available</Text>
              <Text style={styles.emptyRewardsText}>
                Keep shipping sustainably to earn more eco points!
              </Text>
            </View>
          )}
        </View>

        {/* Upcoming Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Upcoming Rewards</Text>
          <View style={styles.rewardsList}>
            {rewards
              .filter(reward => reward.minimumPoints > (userData?.rewardPoints || 0))
              .map(reward => renderRewardCard(reward, false))}
          </View>
        </View>

        {/* Eco Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Earn More Points</Text>
          <View style={styles.tipCard}>
            <Leaf size={20} color="#10B981" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Choose Ground Shipping</Text>
              <Text style={styles.tipText}>Earn 2x points for selecting eco-friendly ground shipping over air transport</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Award size={20} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Optimize Package Size</Text>
              <Text style={styles.tipText}>Use smaller packaging to reduce weight and earn bonus eco points</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding to account for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    marginLeft: 16,
  },
  balancePoints: {
    fontSize: 32,
    fontWeight: '700',
    color: '#351C15',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressPoints: {
    fontSize: 14,
    color: '#351C15',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB500',
    borderRadius: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    borderRadius: 20,
    padding: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#351C15',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  rewardsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#351C15',
    marginBottom: 16,
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledRewardCard: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardIconContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 2,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#FFB500',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  claimButton: {
    backgroundColor: '#351C15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyRewards: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyRewardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRewardsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipContent: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
