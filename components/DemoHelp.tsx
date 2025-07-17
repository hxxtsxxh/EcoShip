import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { HelpCircle, X, Package, CheckCircle, Clock, Truck } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface DemoHelpProps {
  visible: boolean;
  onClose: () => void;
}

export default function DemoHelp({ visible, onClose }: DemoHelpProps) {
  const { colors, isDark } = useTheme();

  const demoExamples = [
    {
      icon: <CheckCircle size={20} color={colors.success} />,
      trackingNumber: "delivered123",
      description: "Shows a delivered package with full tracking history",
      status: "Delivered"
    },
    {
      icon: <Clock size={20} color={colors.warning} />,
      trackingNumber: "transit456",
      description: "Shows package in transit between facilities", 
      status: "In Transit"
    },
    {
      icon: <Truck size={20} color={colors.primary} />,
      trackingNumber: "outfordelivery789",
      description: "Shows package out for delivery today",
      status: "Out for Delivery"
    },
    {
      icon: <Package size={20} color={colors.textSecondary} />,
      trackingNumber: "any_number",
      description: "Try any tracking number - each gives different realistic data",
      status: "Various"
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Demo Mode Guide</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>About Demo Mode</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Since you don't have UPS API credentials yet, the app uses intelligent mock data 
              that simulates real UPS tracking responses. This gives you a full experience of 
              how the app would work with live data.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Try These Examples</Text>
          
          {demoExamples.map((example, index) => (
            <View key={index} style={[styles.exampleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exampleHeader}>
                {example.icon}
                <View style={styles.exampleInfo}>
                  <Text style={[styles.exampleNumber, { color: colors.primary }]}>
                    {example.trackingNumber}
                  </Text>
                  <Text style={[styles.exampleStatus, { color: colors.textSecondary }]}>
                    Status: {example.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.exampleDescription, { color: colors.textSecondary }]}>
                {example.description}
              </Text>
            </View>
          ))}

          <View style={[styles.tipCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.tipTitle, { color: colors.warning }]}>💡 Pro Tip</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              The app generates different tracking scenarios based on what you type. 
              Even random numbers will give you realistic tracking data!
            </Text>
          </View>

          <View style={[styles.realApiCard, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <Text style={[styles.realApiTitle, { color: colors.primary }]}>Want Real UPS Data?</Text>
            <Text style={[styles.realApiText, { color: colors.textSecondary }]}>
              Register at developer.ups.com, get your API credentials, and update the app's 
              environment variables to use live UPS tracking data.
            </Text>
          </View>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  exampleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exampleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  exampleNumber: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  exampleStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  exampleDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  realApiCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  realApiTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  realApiText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
