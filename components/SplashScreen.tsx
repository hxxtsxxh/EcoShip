import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors, isDark } = useTheme();
  const [logoScale] = useState(new Animated.Value(0));
  const [logoOpacity] = useState(new Animated.Value(0));
  const [textOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    const animationSequence = Animated.sequence([
      // Logo scale in
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Logo fade in
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      // Wait a bit then finish
      setTimeout(onFinish, 1000);
    });
  }, []);

  const gradientColors = isDark
    ? ['#1a1a1a', '#2d1810', '#1a1a1a'] as const
    : ['#663300', '#8B4513', '#A0522D'] as const;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <View style={[styles.logoBackground, { backgroundColor: colors.warning }]}>
              <Package size={60} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={styles.title}>UPS EcoShip</Text>
            <Text style={styles.subtitle}>Smart Shipping, Greener Future</Text>
          </Animated.View>

          <Animated.View style={[styles.loadingContainer, { opacity: textOpacity }]}>
            <View style={styles.loadingBar}>
              <Animated.View
                style={[
                  styles.loadingProgress,
                  { backgroundColor: colors.warning },
                ]}
              />
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
});
