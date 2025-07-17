import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import ChatInterface from '../../components/ChatInterface';
import { UserService } from '../../services/userService';

interface UserContext {
  totalEmissions: number;
  shipmentCount: number;
  rewardPoints: number;
  averageEmissions: number;
}

export default function ChatScreen() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const userData = await UserService.getUserData('demo-user');
      setUserContext({
        totalEmissions: userData.totalEmissions,
        shipmentCount: userData.numberOfShipments,
        rewardPoints: userData.rewardPoints,
        averageEmissions: userData.averageEmissionsPerPackage
      });
    } catch (error) {
      // Silently handle error, use default context
      setUserContext({
        totalEmissions: 0,
        shipmentCount: 0,
        rewardPoints: 0,
        averageEmissions: 0
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      <ChatInterface userContext={userContext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
});
