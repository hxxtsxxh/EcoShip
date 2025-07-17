import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { theme, setTheme, colors, isDark } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getThemeIcon = (themeOption: 'light' | 'dark' | 'system') => {
    switch (themeOption) {
      case 'light':
        return <Sun size={20} color={colors.textSecondary} />;
      case 'dark':
        return <Moon size={20} color={colors.textSecondary} />;
      case 'system':
        return <Monitor size={20} color={colors.textSecondary} />;
    }
  };

  const ThemeOption = ({ 
    themeOption, 
    label, 
    isSelected 
  }: { 
    themeOption: 'light' | 'dark' | 'system'; 
    label: string; 
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={() => setTheme(themeOption)}
    >
      {getThemeIcon(themeOption)}
      <Text
        style={[
          styles.themeOptionText,
          {
            color: isSelected ? colors.primary : colors.text,
            fontWeight: isSelected ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <View
          style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}
        />
      )}
    </TouchableOpacity>
  );

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    danger = false,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          {icon}
        </View>
        <View style={styles.settingsItemText}>
          <Text
            style={[
              styles.settingsItemTitle,
              { color: danger ? colors.error : colors.text },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showChevron && (
        <ChevronRight size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Settings size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* User Info */}
        <View style={[styles.userSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.themeContainer}>
            <ThemeOption
              themeOption="light"
              label="Light"
              isSelected={theme === 'light'}
            />
            <ThemeOption
              themeOption="dark"
              label="Dark"
              isSelected={theme === 'dark'}
            />
            <ThemeOption
              themeOption="system"
              label="System"
              isSelected={theme === 'system'}
            />
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<User size={20} color={colors.textSecondary} />}
              title="Profile"
              subtitle="Edit your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update')}
            />
            <SettingsItem
              icon={<Bell size={20} color={colors.textSecondary} />}
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in a future update')}
            />
            <SettingsItem
              icon={<Shield size={20} color={colors.textSecondary} />}
              title="Privacy & Security"
              subtitle="Control your privacy settings"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available in a future update')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<HelpCircle size={20} color={colors.textSecondary} />}
              title="Help & Support"
              subtitle="Get help with using the app"
              onPress={() => Alert.alert('Help & Support', 'For support, please contact: support@upsecosship.com')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon={<LogOut size={20} color={colors.error} />}
              title="Sign Out"
              onPress={handleLogout}
              showChevron={false}
              danger
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  settingsGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 100,
  },
});
