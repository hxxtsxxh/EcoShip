import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Truck, Plane, Leaf, Clock } from 'lucide-react-native';

const ShippingOptionCard = ({ option, onSelect, isSelected }) => {
  const getTransportIcon = () => {
    const airPercent = option.transportMix?.air || option.airTransportPercent || 0;
    if (airPercent > 50) {
      return <Plane size={24} color="#351C15" />;
    } else {
      return <Truck size={24} color="#351C15" />;
    }
  };

  const getEcoRating = (ecoScore) => {
    // Use eco efficiency points if available, otherwise fall back to ecoScore
    const score = option.ecoEfficiency?.points || ecoScore || 0;
    
    if (score >= 20) return { rating: 'Excellent', color: '#10B981' };
    if (score >= 15) return { rating: 'Very Good', color: '#059669' };
    if (score >= 10) return { rating: 'Good', color: '#F59E0B' };
    if (score >= 5) return { rating: 'Fair', color: '#F97316' };
    return { rating: 'Poor', color: '#EF4444' };
  };

  const ecoRating = getEcoRating(option.ecoScore);
  const airPercent = option.transportMix?.air || option.airTransportPercent || 0;
  const truckPercent = option.transportMix?.truck || option.transportMix?.ground || (100 - airPercent);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(option)}
    >
      <View style={styles.header}>
        <View style={styles.serviceInfo}>
          {getTransportIcon()}
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{option.name}</Text>
            <View style={styles.deliveryInfo}>
              <Clock size={14} color="#666" />
              <Text style={styles.deliveryText}>{option.deliveryDate}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.price}>${option.cost}</Text>
      </View>

      <View style={styles.emissionsContainer}>
        <View style={styles.emissionsInfo}>
          <Leaf size={16} color={ecoRating.color} />
          <Text style={styles.emissionsText}>
            {parseFloat(option.carbonFootprint).toFixed(2)} kg CO₂e
          </Text>
          <View style={[styles.ecoTag, { backgroundColor: ecoRating.color }]}>
            <Text style={styles.ecoTagText}>{ecoRating.rating}</Text>
          </View>
        </View>
        
        <View style={styles.transportMix}>
          {airPercent > 0 && (
            <View style={styles.transportDetail}>
              <Plane size={12} color="#666" />
              <Text style={styles.transportText}>{Math.round(airPercent)}%</Text>
            </View>
          )}
          {truckPercent > 0 && (
            <View style={styles.transportDetail}>
              <Truck size={12} color="#666" />
              <Text style={styles.transportText}>{Math.round(truckPercent)}%</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(100, Math.max(0, (option.ecoEfficiency?.points || option.ecoScore || 0) * 4))}%`,
              backgroundColor: ecoRating.color 
            }
          ]} 
        />
      </View>

      {/* Show eco efficiency details if available */}
      {option.ecoEfficiency && (
        <View style={styles.ecoDetails}>
          <Text style={styles.ecoDetailsText}>
            Value Score: {option.ecoEfficiency.points}/25 ({option.ecoEfficiency.tier})
          </Text>
          <Text style={styles.ecoSubText}>
            Cost-effectiveness: {(option.ecoEfficiency.cost_effectiveness_score * 100).toFixed(0)}% • Environmental: {(option.ecoEfficiency.environmental_score * 100).toFixed(0)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCard: {
    borderColor: '#FFB500',
    backgroundColor: '#FFFBF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#351C15',
    marginBottom: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#351C15',
  },
  emissionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emissionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emissionsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  ecoTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ecoTagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  transportMix: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  transportText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  ecoDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  ecoDetailsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ecoSubText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default ShippingOptionCard;
