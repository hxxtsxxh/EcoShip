import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export class UserService {
  static async getUserData(userId) {
    try {
      // Handle demo user with local storage fallback
      if (userId === 'demo-user') {
        return this.getDemoUserData();
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        // Create new user document
        const newUser = {
          totalEmissions: 0,
          averageEmissionsPerPackage: 0,
          numberOfShipments: 0,
          rewardPoints: 0,
          shipments: [],
          nextRewardID: null,
          currentRewardID: null,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userId), newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      // Fallback to demo user data if Firebase fails
      return this.getDemoUserData();
    }
  }

  static getDemoUserData() {
    try {
      const stored = localStorage.getItem('demoUserData');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.log('No localStorage available, using default demo data');
    }
    
    // Default demo user data
    return {
      totalEmissions: 0,
      averageEmissionsPerPackage: 0,
      numberOfShipments: 0,
      rewardPoints: 0,
      shipments: {},
      nextRewardID: null,
      currentRewardID: null,
      createdAt: new Date().toISOString()
    };
  }

  static saveDemoUserData(userData) {
    try {
      localStorage.setItem('demoUserData', JSON.stringify(userData));
    } catch (error) {
      console.log('localStorage not available');
    }
  }

  static async addShipment(userId, shipmentData) {
    try {
      const userData = await this.getUserData(userId);
      
      const newTotalEmissions = userData.totalEmissions + parseFloat(shipmentData.carbonFootprint);
      const newShipmentCount = userData.numberOfShipments + 1;
      const newAverageEmissions = newTotalEmissions / newShipmentCount;
      
      // Enhanced reward points calculation based on eco-efficiency
      let pointsEarned = 0;
      const ecoPoints = shipmentData.ecoEfficiencyPoints || 0;
      const ecoTier = shipmentData.ecoTier || 'unranked';
      
      // Base points from eco-efficiency score (0-25 scale)
      pointsEarned += Math.floor(ecoPoints * 2); // Max 50 points for perfect eco score
      
      // Tier bonus points
      const tierBonuses = {
        'excellent': 25,
        'very_good': 15,
        'good': 10,
        'fair': 5,
        'poor': 0,
        'very_poor': 0,
        'unranked': 0
      };
      pointsEarned += tierBonuses[ecoTier] || 0;
      
      // Carbon savings bonus (additional points for low carbon choices)
      const carbonSavingsPercent = shipmentData.carbonSavings || 0;
      if (carbonSavingsPercent > 50) pointsEarned += 20; // High carbon savings
      else if (carbonSavingsPercent > 25) pointsEarned += 10; // Medium carbon savings
      
      // Weight-based multiplier (heavier packages earn more points for eco choices)
      const weight = parseFloat(shipmentData.packageWeight) || 1;
      if (weight > 10) pointsEarned = Math.floor(pointsEarned * 1.5); // 50% bonus for heavy packages
      else if (weight > 5) pointsEarned = Math.floor(pointsEarned * 1.2); // 20% bonus for medium packages

      const shipmentId = Date.now().toString();
      const shipmentWithId = {
        ...shipmentData,
        id: shipmentId,
        pointsEarned: pointsEarned,
        timestamp: new Date().toISOString()
      };

      const updatedUserData = {
        ...userData,
        totalEmissions: newTotalEmissions,
        averageEmissionsPerPackage: newAverageEmissions,
        numberOfShipments: newShipmentCount,
        rewardPoints: userData.rewardPoints + pointsEarned,
        shipments: {
          ...userData.shipments,
          [shipmentId]: shipmentWithId
        }
      };

      // Handle demo user vs real user differently
      if (userId === 'demo-user') {
        // Save to localStorage for demo user
        this.saveDemoUserData(updatedUserData);
      } else {
        // Save to Firebase for real users
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          totalEmissions: newTotalEmissions,
          averageEmissionsPerPackage: newAverageEmissions,
          numberOfShipments: newShipmentCount,
          rewardPoints: increment(pointsEarned),
          [`shipments.${shipmentId}`]: shipmentWithId
        });
      }

      return { 
        pointsEarned, 
        newTotalEmissions, 
        newShipmentCount, 
        newRewardPoints: userData.rewardPoints + pointsEarned,
        userData: updatedUserData
      };
    } catch (error) {
      console.error('Error adding shipment:', error);
      throw error;
    }
  }

  static async getRewards() {
    // Mock rewards data - in a real app this would come from Firebase
    return [
      {
        rewardID: 'eco-bronze',
        minimumPoints: 100,
        prize: 'Eco-Friendly Packaging Credit',
        description: 'Get 10% off on sustainable packaging options'
      },
      {
        rewardID: 'eco-silver',
        minimumPoints: 250,
        prize: 'Carbon Offset Certificate',
        description: 'Offset 50kg of CO2 emissions'
      },
      {
        rewardID: 'eco-gold',
        minimumPoints: 500,
        prize: 'Green Shipping Credits',
        description: '$25 credit for ground shipping only'
      },
      {
        rewardID: 'eco-platinum',
        minimumPoints: 1000,
        prize: 'UPS My Choice Premium',
        description: '1 year free UPS My Choice Premium subscription'
      }
    ];
  }
}
