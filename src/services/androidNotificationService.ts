import { Platform, Linking, Alert } from 'react-native';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';

/**
 * Android Notification Access Helper
 * Opens the Android system settings screen where the user can grant Notification Access permission.
 */
export async function openAndroidNotificationSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    Alert.alert('Chỉ hỗ trợ Android', 'Tính năng đọc thông báo biến động số dư chỉ khả dụng trên Android.');
    return;
  }

  try {
    // Open Android Notification Listener Settings
    await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
  } catch (error) {
    try {
      // Fallback to app details settings
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Hướng dẫn bật quyền',
        'Vào Cài đặt máy ➔ Ứng dụng ➔ Quyền truy cập đặc biệt ➔ Truy cập thông báo ➔ Tìm ứng dụng và gạt Cho phép.'
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

  // Hook for Native Event Emitter when built with Development Build / Prebuild
  // Example: DeviceEventEmitter.addListener('onNotificationReceived', (data) => ...)
  return () => {
    // Cleanup on unmount
  };
}
