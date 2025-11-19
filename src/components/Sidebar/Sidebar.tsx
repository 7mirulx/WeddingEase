/**
 * Sidebar.tsx
 * Main sidebar navigation component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../store/auth';
import { useSidebar } from './SidebarProvider';
import { COLORS } from '../../theme/colors';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  screen?: string;
  onPress?: () => void;
  divider?: boolean;
}

interface SidebarProps {
  items?: SidebarItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const DEFAULT_ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Home', screen: 'Home' },
  { id: 'bookings', label: 'My Bookings', screen: 'Bookings' },
  { id: 'vendors', label: 'Vendors', screen: 'Vendors' },
  { id: 'divider1', divider: true, label: '' },
  { id: 'profile', label: 'Profile', screen: 'Profile' },
  { id: 'settings', label: 'Settings', screen: 'Settings' },
];

export default function Sidebar({ items = DEFAULT_ITEMS, header, footer }: SidebarProps) {
  const { isOpen, close } = useSidebar();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [slideAnim] = React.useState(new Animated.Value(-300));
  const [overlayOpacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, overlayOpacity]);

  const handleItemPress = (item: SidebarItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
    close();
  };

  const handleLogout = () => {
    logout();
    close();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          {header || (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Menu</Text>
              <TouchableOpacity onPress={close} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* User Info */}
          {user && (
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || 'User'}
              </Text>
              {user.email && (
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              )}
            </View>
          )}

          {/* Navigation Items */}
          <View style={styles.itemsContainer}>
            {items.map((item) => {
              if (item.divider) {
                return <View key={item.id} style={styles.divider} />;
              }

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                  <Text style={styles.itemArrow}>→</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Footer */}
          {footer || (
            <View style={styles.footer}>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                ]}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: COLORS.white,
    zIndex: 1000,
    shadowColor: COLORS.purple.dark,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.purple.light,
    backgroundColor: COLORS.gray.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.purple.medium,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.purple.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.purple.medium,
    fontWeight: '600',
  },
  userSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.purple.light,
    alignItems: 'center',
    backgroundColor: COLORS.gray.light,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.purple.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray.darker,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray.dark,
  },
  itemsContainer: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  itemPressed: {
    backgroundColor: COLORS.purple.light,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.gray.darker,
    fontWeight: '500',
  },
  itemArrow: {
    fontSize: 16,
    color: COLORS.purple.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.purple.light,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.purple.light,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.purple.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.purple.dark,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

