import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface BiometricLockOverlayProps {
  children: React.ReactNode;
}

export default function BiometricLockOverlay({ children }: BiometricLockOverlayProps) {
  const { isPinEnabled, autoLockTimeout } = useSettingsStore();
  const theme = useAppTheme();
  const [isLocked, setIsLocked] = useState<boolean>(isPinEnabled);
  const [isPrivacyShieldVisible, setIsPrivacyShieldVisible] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimestampRef = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;

    try {
      setAuthError(null);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Device cannot authenticate, unlock gracefully
        setIsLocked(false);
        setIsPrivacyShieldVisible(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để mở khóa Expense Tracker',
        fallbackLabel: 'Dùng mật mã thiết bị',
        cancelLabel: 'Hủy',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        setIsPrivacyShieldVisible(false);
        setAuthError(null);
      } else {
        setAuthError('Xác thực không thành công. Nhấn để thử lại.');
      }
    } catch (err) {
      setAuthError('Đã xảy ra lỗi khi xác thực.');
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, []);

  // Prompt authentication on initial mount if enabled
  useEffect(() => {
    if (isPinEnabled) {
      setIsLocked(true);
      authenticate();
    } else {
      setIsLocked(false);
    }
  }, [isPinEnabled, authenticate]);

  // Listen for app coming to foreground / background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;

      if (!isPinEnabled) return;

      // Going to background or inactive (App Switcher)
      if (nextAppState.match(/inactive|background/)) {
        setIsPrivacyShieldVisible(true);
        if (!backgroundTimestampRef.current) {
          backgroundTimestampRef.current = Date.now();
        }
      }

      // Returning to active
      if (prev.match(/inactive|background/) && nextAppState === 'active') {
        const elapsed = backgroundTimestampRef.current ? Date.now() - backgroundTimestampRef.current : Infinity;
        backgroundTimestampRef.current = null;

        // Check timeout
        if (elapsed > autoLockTimeout) {
          setIsLocked(true);
          authenticate();
        } else {
          // Still within allowed time window
          setIsPrivacyShieldVisible(false);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPinEnabled, autoLockTimeout, authenticate]);

  if ((!isLocked && !isPrivacyShieldVisible) || !isPinEnabled) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.lockContainer, { backgroundColor: theme.isDark ? '#0A0A14' : '#0F0F1A' }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.isDark ? '#0A0A14' : '#0F0F1A'} />

      <View style={styles.content}>
        {/* Brand Icon Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-lock" size={48} color="#9D97FF" />
          </View>
        </View>

        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>Bảo mật ngoại tuyến 100%</Text>
        <Text style={styles.prompt}>Ứng dụng đã được khóa để bảo vệ quyền riêng tư tài chính của bạn</Text>

        {authError ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF5C7C" />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        ) : null}

        {/* Unlock Button */}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={authenticate}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="fingerprint" size={28} color="#FFFFFF" />
          <Text style={styles.unlockText}>Mở khóa bằng sinh trắc học</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: SPACING.xl,
    padding: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(108, 99, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(157, 151, 255, 0.4)',
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: '#9D97FF',
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prompt: {
    ...TYPOGRAPHY.body,
    color: '#A0A5B5',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 92, 124, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: '#FF5C7C',
    fontWeight: '600',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#6C63FF',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  unlockText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
