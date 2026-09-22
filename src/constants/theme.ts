import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  // Primary palette - Electric Royal Indigo / Cobalt
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Semantic
  income: '#10B981',
  incomeLight: '#ECFDF5',
  expense: '#F43F5E',
  expenseLight: '#FFF1F2',
  transfer: '#F59E0B',
  transferLight: '#FEF3C7',

  // Neutral Light Mode
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Dark mode
  darkBackground: '#0B0F19',
  darkSurface: '#151D30',
  darkSurfaceVariant: '#1E293B',
  darkBorder: '#243048',

  // Status
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',

  // Category colors
  categoryColors: [
    '#F43F5E', '#FB923C', '#F59E0B', '#EAB308', '#84CC16',
    '#10B981', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#14B8A6',
    '#F97316', '#22C55E', '#64748B', '#60A5FA', '#F472B6',
  ],
};

/**
 * Grid spacing tokens (in pixels) for consistent margin and padding layouts
 * xs: 4px, sm: 8px, md: 16px (standard spacing), lg: 24px, xl: 32px, xxl: 48px
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Corner border radius tokens (in pixels)
 * sm: 8px (small elements/tags), md: 12px (buttons/cards), lg: 16px (modals), xl: 24px, full: circular/pill
 */
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * Standard typography presets for headers, body text, badges, and monetary amounts
 */
export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  amount: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1 },
  amountLarge: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1.5 },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceVariant,
    onPrimary: COLORS.textInverse,
    onBackground: COLORS.textPrimary,
    onSurface: COLORS.textPrimary,
    error: COLORS.error,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primaryLight,
    background: COLORS.darkBackground,
    surface: COLORS.darkSurface,
    surfaceVariant: COLORS.darkSurfaceVariant,
    onPrimary: COLORS.textInverse,
    onBackground: '#F0F0FF',
    onSurface: '#F0F0FF',
    error: COLORS.error,
  },
};
