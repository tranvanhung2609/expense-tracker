import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';

export const SEPAY_NOTIFICATION_CHANNEL_ID = 'sepay_transactions';
export const APP_UPDATE_CHANNEL_ID = 'app_updates';

// Safely require expo-notifications to prevent crashing when running in environments
// where the native module is not yet compiled or available (e.g. older dev APK or web)
let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');

  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        // Tham khảo cơ chế của Telegram, MoMo, Revolut:
        // Khi người dùng đang tương tác trong ứng dụng (Foreground/Active),
        // KHÔNG thả Heads-up alert banner của hệ điều hành xuống để tránh xung đột
        // và đè lên thanh Dynamic Island của App!
        const isAppActive = AppState.currentState === 'active';
        return {
          shouldShowAlert: !isAppActive,
          shouldPlaySound: !isAppActive,
          shouldSetBadge: true,
          shouldShowBanner: !isAppActive,
          shouldShowList: true, // Vẫn lưu lại trên ngăn kéo thông báo hệ thống
        };
      },
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

      await Notifications.setNotificationChannelAsync(APP_UPDATE_CHANNEL_ID, {
        name: 'Cập nhật ứng dụng',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Handle when user taps notification from status bar / lock screen
    Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data;
        if (data?.type === 'APP_UPDATE') {
          const { useUpdateStore } = require('../stores/updateStore');
          useUpdateStore.getState().openModal();
        } else if (data?.pendingId) {
          const item = usePendingTransactionStore
            .getState()
            .pendingList.find((p) => p.id === data.pendingId);
          if (item) {
            usePendingTransactionStore.setState({ activeBannerItem: item });
          }
        } else if (
          data &&
          (data.transferAmount || data.amount_out || data.amount_in || data.content || data.referenceCode)
        ) {
          // Xử lý gói tin Webhook đẩy trực tiếp qua Push Notification (Realtime khi đóng app!)
          const { processSepayWebhookPayload } = require('./sepayService');
          const res = processSepayWebhookPayload(data);
          if (res?.item) {
            usePendingTransactionStore.setState({ activeBannerItem: res.item });
          }
        }
      } catch (err) {
        console.warn('[SystemNotification] Failed to handle notification tap:', err);
      }
    });

    // Handle when push notification arrives while app is open
    Notifications.addNotificationReceivedListener((notification) => {
      try {
        const data = notification.request.content.data;
        if (
          data &&
          (data.transferAmount || data.amount_out || data.amount_in || data.content || data.referenceCode)
        ) {
          const { processSepayWebhookPayload } = require('./sepayService');
          processSepayWebhookPayload(data);
        }
      } catch (err) {
        console.warn('[SystemNotification] Failed to handle notification received:', err);
      }
    });
  } catch (err) {
    console.warn('[SystemNotification] Failed to initialize notification channels:', err);
  }
}

/**
 * Get device Expo Push Token for receiving realtime SePay Webhooks
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) return null;
  try {
    const hasPermission = await requestSystemNotificationPermission();
    if (!hasPermission) return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '2fd4e952-e87c-4b24-bacb-6ccbdd89e412';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (err) {
    console.warn('[SystemNotification] Failed to get Expo push token:', err);
    return null;
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

/**
 * Gửi thông báo hệ thống thông minh (Smart Notifications):
 * - Nếu App đang mở (Foreground / Active): Không gửi alert hệ thống vì Dynamic Island trong app đã xử lý xuất sắc.
 * - Nếu App đang tắt hoặc chạy nền (Background): Bắn thông báo ra màn hình khóa & status bar.
 * - Nếu có nhiều giao dịch (> 1): Gom nhóm (batch) thành 1 thông báo tóm tắt thay vì spam nhiều lần.
 */
export async function sendSystemTransactionNotifications(
  items: Array<{
    bankName: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    note: string;
    id?: string;
  }>
): Promise<void> {
  if (!Notifications || !items || items.length === 0) return;

  // Nếu người dùng đang mở app, không bắn notification hệ thống để tránh trùng lặp với Dynamic Island
  if (AppState.currentState === 'active') {
    return;
  }

  try {
    if (items.length === 1) {
      await sendSystemTransactionNotification(items[0]);
    } else {
      // Gom nhóm nhiều giao dịch
      const count = items.length;
      const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
      const title = `🔔 Phát hiện ${count} biến động số dư ngân hàng mới`;
      const body = `Tổng cộng ~${formatAmount(totalAmount)} • Chạm để mở ứng dụng và xác nhận ghi sổ`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { pendingId: items[0].id },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android'
            ? {
                channelId: SEPAY_NOTIFICATION_CHANNEL_ID,
                color: '#3B82F6',
              }
            : {}),
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn('[SystemNotification] Failed to schedule batch notifications:', err);
  }
}

/**
 * Send an immediate system notification for a newly available app update
 */
export async function sendSystemUpdateNotification(release: {
  version: string;
  title: string;
  changelog?: string[];
}): Promise<void> {
  if (!Notifications) return;

  try {
    const title = `🚀 Có bản cập nhật mới v${release.version}`;
    const body = `${release.title || 'Nâng cấp tính năng mới và sửa lỗi'}. Chạm để cập nhật ngay!`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'APP_UPDATE', version: release.version },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android'
          ? {
              channelId: APP_UPDATE_CHANNEL_ID,
              color: '#4F46E5',
            }
          : {}),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[SystemNotification] Failed to send update notification:', err);
  }
}


