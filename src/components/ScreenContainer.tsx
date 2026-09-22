import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarBg?: string;
  translucentStatusBar?: boolean;
}

/**
 * Calculates adaptive top inset for modern phone screens:
 * - Dynamic Island (iPhone 14 Pro/15/16): ~54-59px
 * - Standard Notch (iPhone X-14): ~44-47px
 * - Android Punch-hole / Teardrop / Status bar: 24-48px
 */
export function getAdaptiveTopInset(insets: EdgeInsets): number {
  if (Platform.OS === 'android') {
    return Math.max(insets.top, StatusBar.currentHeight ?? 24);
  }
  return insets.top > 0 ? insets.top : 20;
}

export default function ScreenContainer({
  children,
  style,
  edges = ['left', 'right'],
  statusBarStyle,
  statusBarBg,
  translucentStatusBar = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const activeStatusBarStyle = statusBarStyle ?? theme.statusBarStyle;
  const activeStatusBarBg = statusBarBg ?? (theme.isDark ? '#0F0F1A' : '#F7F8FA');

  const containerPadding: ViewStyle = {
    paddingTop: edges.includes('top') ? getAdaptiveTopInset(insets) : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }, containerPadding, style]}>
      <StatusBar
        barStyle={activeStatusBarStyle}
        backgroundColor={activeStatusBarBg}
        translucent={translucentStatusBar}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
