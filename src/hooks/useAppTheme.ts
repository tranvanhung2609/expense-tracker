import { useSettingsStore } from '../stores/settingsStore';
import { COLORS } from '../constants/theme';

export interface AppThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  cardHighlight: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  inputBackground: string;
  statusBarStyle: 'dark-content' | 'light-content';
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  transfer: string;
  transferLight: string;
  warning: string;
  warningLight: string;
  error: string;
}

const DARK_THEME: AppThemeColors = {
  isDark: true,
  background: '#0B0F19',
  surface: '#151D30',
  surfaceVariant: '#1E293B',
  card: '#151D30',
  cardHighlight: '#1E293B',
  border: '#243048',
  divider: '#1A2438',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0B0F19',
  inputBackground: '#1A2438',
  statusBarStyle: 'light-content',
  tabBarBackground: '#0E1424',
  tabBarBorder: '#1A2438',
  tabBarActive: '#818CF8',
  tabBarInactive: '#64748B',
  primary: COLORS.primary,
  primaryLight: COLORS.primaryLight,
  primaryDark: COLORS.primaryDark,
  income: COLORS.income,
  incomeLight: '#10B98125',
  expense: COLORS.expense,
  expenseLight: '#F43F5E25',
  transfer: COLORS.transfer,
  transferLight: '#F59E0B25',
  warning: COLORS.warning,
  warningLight: '#F59E0B25',
  error: COLORS.error,
};

const LIGHT_THEME: AppThemeColors = {
  isDark: false,
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  card: '#FFFFFF',
  cardHighlight: '#F8FAFC',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  inputBackground: '#F1F5F9',
  statusBarStyle: 'dark-content',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: COLORS.primary,
  tabBarInactive: '#94A3B8',
  primary: COLORS.primary,
  primaryLight: COLORS.primaryLight,
  primaryDark: COLORS.primaryDark,
  income: COLORS.income,
  incomeLight: COLORS.incomeLight,
  expense: COLORS.expense,
  expenseLight: COLORS.expenseLight,
  transfer: COLORS.transfer,
  transferLight: COLORS.transferLight,
  warning: COLORS.warning,
  warningLight: COLORS.warningLight,
  error: COLORS.error,
};

export function useAppTheme(): AppThemeColors {
  const isDark = useSettingsStore(s => s.isDarkMode);
  return isDark ? DARK_THEME : LIGHT_THEME;
}
