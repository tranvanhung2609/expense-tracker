import { Platform, Linking, Alert } from 'react-native';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import {
  isNotificationAccessGranted as checkNativePermission,
  openSystemNotificationSettings as openNativeSettings,
  addNotificationReceivedListener,
  NotificationEventPayload,
} from '../../modules/notification-listener';

/**
 * Check if the app currently has Notification Access permission granted.
 */
export function checkNotificationPermissionGranted(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }
  return checkNativePermission();
}

/**
 * Android Notification Access Helper
 * Opens the Android system settings screen where the user can grant Notification Access permission.
 */
export async function openAndroidNotificationSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    Alert.alert('Chỉ hỗ trợ Android', 'Tính năng đọc thông báo biến động số dư chỉ khả dụng trên Android.');
    return;
  }

  // First try via native module
  const opened = openNativeSettings();
  if (opened) return;

  try {
    // Fallback 1: Direct Android Notification Listener Settings Intent
    await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
  } catch (error) {
    try {
      // Fallback 2: General App Details Settings
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Hướng dẫn bật quyền',
        'Vào Cài đặt máy ➔ Ứng dụng ➔ Quyền truy cập đặc biệt ➔ Truy cập thông báo ➔ Tìm "Expense Tracker" và gạt Cho phép.'
      );
    }
  }
}

/**
 * Setup listener for incoming bank notifications.
 * Connects native notification events to the pendingTransactionStore.
 */
export function initializeBankNotificationListener(): () => void {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  console.log('[AndroidNotificationService] Initializing bank notification listener...');

  const subscription = addNotificationReceivedListener((event: NotificationEventPayload) => {
    try {
      console.log(`[AndroidNotificationService] Event received from ${event.packageName}: ${event.title}`);
      usePendingTransactionStore
        .getState()
        .processNotification(event.packageName, event.title, event.body);
    } catch (err) {
      console.error('[AndroidNotificationService] Failed to process notification:', err);
    }
  });

  return () => {
    subscription?.remove();
  };
}
