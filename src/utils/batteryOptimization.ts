import { Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Open Android system settings to request disabling battery optimization (Unrestricted background)
 */
export async function requestIgnoreBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Try launching direct ignore battery optimizations dialog
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: 'package:com.expensetracker.app' }
    );
  } catch {
    try {
      // 2. Try launching ignore battery optimization settings list
      await IntentLauncher.startActivityAsync(
        'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
      );
    } catch {
      try {
        // 3. Fallback to app details settings
        await IntentLauncher.startActivityAsync(
          'android.settings.APPLICATION_DETAILS_SETTINGS',
          { data: 'package:com.expensetracker.app' }
        );
      } catch (err) {
        console.warn('[BatteryOptimization] Failed to open system settings:', err);
        Alert.alert(
          'Cài đặt hệ thống',
          'Vui lòng vào Cài đặt máy ➔ Ứng dụng ➔ Expense Tracker ➔ Pin ➔ Chọn "Không hạn chế" (Unrestricted) để nhận diện biến động tự động trong nền.'
        );
      }
    }
  }
}
