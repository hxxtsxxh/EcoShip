import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserService } from '../services/userService';
import { useAuth } from './AuthContext';

interface UserData {
  totalEmissions: number;
  averageEmissionsPerPackage: number;
  numberOfShipments: number;
  rewardPoints: number;
  shipments: Record<string, any>;
  nextRewardID: string | null;
  currentRewardID: string | null;
  createdAt: string;
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  addShipment: (shipmentData: any) => Promise<any>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getCurrentUserId = () => {
    return user?.uid || 'demo-user';
  };

  const refreshUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      const data = await UserService.getUserData(userId);
      setUserData(data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const addShipment = useCallback(async (shipmentData: any) => {
    try {
      const userId = getCurrentUserId();
      const result = await UserService.addShipment(userId, shipmentData);
      
      // Update local state with new data for immediate UI refresh
      if (result.userData) {
        setUserData(result.userData);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding shipment:', error);
      throw error;
    }
  }, [user?.uid]);

  useEffect(() => {
    refreshUserData();
  }, []);

  // Refresh user data when the authenticated user changes
  useEffect(() => {
    refreshUserData();
  }, [user?.uid]);

  const value: UserContextType = {
    userData,
    loading,
    refreshUserData,
    addShipment,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
