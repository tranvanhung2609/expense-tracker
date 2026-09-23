import { Platform } from 'react-native';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';

export const SEPAY_NOTIFICATION_CHANNEL_ID = 'sepay_transactions';

// Safely require expo-notifications to prevent crashing when running in environments
// where the native module is not yet compiled or available (e.g. older dev APK or web)
let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');

  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (err) {
  console.warn('[SystemNotification] expo-notifications native module not available:', err);
  Notifications = null;
}

/**
 * Initialize Android notification channels and setup listener
 */
export async function initSystemNotifications(): Promise<void> {
  if (!Notifications) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(SEPAY_NOTIFICATION_CHANNEL_ID, {
        name: 'Biến động số dư SePay',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Handle when user taps notification from status bar / lock screen
    Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data;
        if (data?.pendingId) {
          const item = usePendingTransactionStore
            .getState()
            .pendingList.find((p) => p.id === data.pendingId);
          if (item) {
            usePendingTransactionStore.setState({ activeBannerItem: item });
          }
        }
      } catch (err) {
        console.warn('[SystemNotification] Failed to handle notification tap:', err);
      }
    });
  } catch (err) {
    console.warn('[SystemNotification] Failed to initialize notification channels:', err);
  }
}

/**
 * Request notification permissions from Android / iOS
 */
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[SystemNotification] Permission request failed:', err);
    return false;
  }
}

/**
 * Format currency in Vietnamese Dong
 */
function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

/**
 * Send an immediate Android system notification to lock screen & status bar
 */
export async function sendSystemTransactionNotification(item: {
  bankName: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  note: string;
  id?: string;
}): Promise<void> {
  if (!Notifications) {
    console.log('[SystemNotification] Skipping notification: module not available.');
    return;
  }

  try {
    const isExpense = item.type === 'EXPENSE';
    const title = isExpense
      ? `💰 Biến động số dư: -${formatAmount(item.amount)} (${item.bankName})`
      : `💵 Nhận tiền: +${formatAmount(item.amount)} (${item.bankName})`;

    const body = `${item.note || 'Giao dịch ngân hàng'} • Chạm để mở app và ghi sổ`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { pendingId: item.id },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android'
          ? {
              channelId: SEPAY_NOTIFICATION_CHANNEL_ID,
              color: isExpense ? '#EF4444' : '#10B981',
            }
          : {}),
      },
      trigger: null, // Display immediately!
    });
  } catch (err) {
    console.warn('[SystemNotification] Failed to schedule notification:', err);
  }
}
