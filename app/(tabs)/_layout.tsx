import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/hooks/useAppTheme';

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom;
  const paddingBottom = bottomInset > 0 ? bottomInset : Platform.OS === 'android' ? 6 : 8;
  const tabHeight = 54 + paddingBottom;

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: theme.tabBarBackground,
      borderTopColor: theme.tabBarBorder,
      borderTopWidth: 1,
      height: tabHeight,
      paddingBottom: paddingBottom,
      paddingTop: 6,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: theme.isDark ? 0.35 : 0.06,
      shadowRadius: 10,
    }),
    [theme.tabBarBackground, theme.tabBarBorder, theme.isDark, tabHeight, paddingBottom]
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-variant' : 'home-variant-outline'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-donut' : 'chart-donut-variant'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Ví tiền',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Hạn mức',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'target' : 'bullseye-arrow'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'cog' : 'cog-outline'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden from bottom tab bar (href: null); navigated explicitly from Settings or other screens via router.push('/(tabs)/categories') */}
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
          title: 'Quản lý danh mục',
        }}
      />
    </Tabs>
  );
}
