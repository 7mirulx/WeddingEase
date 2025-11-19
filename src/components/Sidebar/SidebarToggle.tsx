/**
 * SidebarToggle.tsx
 * Button component to toggle sidebar open/close
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useSidebar } from './SidebarProvider';

interface SidebarToggleProps {
  style?: any;
  icon?: React.ReactNode;
  showLabel?: boolean;
}

export default function SidebarToggle({ style, icon, showLabel = false }: SidebarToggleProps) {
  const { toggle } = useSidebar();

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      {icon || (
        <View style={styles.iconContainer}>
          <View style={styles.iconLine} />
          <View style={styles.iconLine} />
          <View style={styles.iconLine} />
        </View>
      )}
      {showLabel && <Text style={styles.label}>Menu</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  iconLine: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

