import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import { PendingTransaction } from '../repositories/PendingTransactionRepository';

export const SEPAY_NOTIFICATION_CHANNEL_ID = 'sepay_transactions';
export const APP_UPDATE_CHANNEL_ID = 'app_updates';

// Notification Category & Action Identifiers for Status Bar Quick Actions
export const SEPAY_CATEGORY_ID = 'sepay_transaction_category';
export const ACTION_CONFIRM = 'CONFIRM_TRANSACTION';
export const ACTION_VIEW = 'VIEW_TRANSACTION';
export const ACTION_DISMISS = 'DISMISS_TRANSACTION';

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
 * Handle user interactions with notifications (clicking the notification body or quick action buttons)
 */
export async function handleNotificationResponse(response: ExpoNotifications.NotificationResponse): Promise<void> {
  if (!response) return;

  try {
    const actionId = response.actionIdentifier;
    const data = response.notification?.request?.content?.data as Record<string, any> | undefined;

    if (!data) return;

    if (data.type === 'APP_UPDATE') {
      const { useUpdateStore } = require('../stores/updateStore');
      useUpdateStore.getState().openModal();
      return;
    }

    const pendingId = data.pendingId as string | undefined;
    let item: PendingTransaction | null = null;

    if (pendingId) {
      // 1. Try finding in in-memory store
      item = usePendingTransactionStore
        .getState()
        .pendingList.find((p) => p.id === pendingId) || null;

      // 2. Fallback to direct SQLite lookup (crucial for cold boot from killed app!)
      if (!item) {
        const { PendingTransactionRepository } = require('../repositories/PendingTransactionRepository');
        const repo = new PendingTransactionRepository();
        item = repo.getById(pendingId);
      }
    } else if (
      data.transferAmount ||
      data.amount_out ||
      data.amount_in ||
      data.content ||
      data.referenceCode
    ) {
      // Webhook payload directly attached
      const { processSepayWebhookPayload } = require('./sepayService');
      const res = processSepayWebhookPayload(data);
      if (res?.item) {
        item = res.item;
      }
    }

    if (!item) {
      // Refresh pending list if item was not found
      usePendingTransactionStore.getState().loadPending();
      return;
    }

    // Process user action from status bar
    if (actionId === ACTION_CONFIRM) {
      // ⚡ Tác vụ nhanh: Ghi nhận ngay vào sổ chi tiêu
      console.log(`[SystemNotification] User clicked Quick Confirm for transaction ${item.id}`);
      usePendingTransactionStore.getState().confirmPending(item.id);
    } else if (actionId === ACTION_DISMISS) {
      // ❌ Tác vụ nhanh: Bỏ qua giao dịch này
      console.log(`[SystemNotification] User clicked Dismiss for transaction ${item.id}`);
      usePendingTransactionStore.getState().dismissPending(item.id);
    } else {
      // Chạm trực tiếp vào thân thông báo hoặc chọn "Xem chi tiết"
      console.log(`[SystemNotification] User opened transaction ${item.id}`);
      usePendingTransactionStore.setState({ activeBannerItem: item });
    }
  } catch (err) {
    console.warn('[SystemNotification] Failed to handle notification response:', err);
  }
}

/**
 * Check if the app was launched by tapping a notification while closed/killed (Cold Start)
 */
export async function checkLastNotificationResponse(): Promise<void> {
  if (!Notifications) return;

  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      console.log('[SystemNotification] Found cold start notification response.');
      await handleNotificationResponse(lastResponse);
    }
  } catch (err) {
    console.warn('[SystemNotification] Failed to check last notification response:', err);
  }
}

/**
 * Initialize Android notification channels, interactive categories, and setup listeners
 */
export async function initSystemNotifications(): Promise<void> {
  if (!Notifications) return;

  try {
    if (Platform.OS === 'android') {
      // 1. Transaction Notification Channel (High priority, heads-up banner)
      await Notifications.setNotificationChannelAsync(SEPAY_NOTIFICATION_CHANNEL_ID, {
        name: 'Biến động số dư SePay',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // 2. App Update Channel
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

    // 3. Register Interactive Notification Actions on the Notification Bar (Thanh thông báo)
    await Notifications.setNotificationCategoryAsync(SEPAY_CATEGORY_ID, [
      {
        identifier: ACTION_CONFIRM,
        buttonTitle: '⚡ Ghi nhận ngay',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: ACTION_VIEW,
        buttonTitle: '✏️ Xem chi tiết',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: ACTION_DISMISS,
        buttonTitle: '❌ Bỏ qua',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    // 4. Setup listener for notification responses when app is in memory
    Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // 5. Handle when push notification arrives while app is open
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
    console.warn('[SystemNotification] Failed to initialize notification channels & categories:', err);
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
 * Send an immediate Android system notification to lock screen & status bar with Interactive Action Buttons
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
        data: {
          pendingId: item.id,
          bankName: item.bankName,
          amount: item.amount,
          type: item.type,
          note: item.note,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: SEPAY_CATEGORY_ID,
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
 * - Nếu App đang tắt hoặc chạy nền (Background): Bắn thông báo ra màn hình khóa & status bar kèm các nút tác vụ nhanh.
 * - Nếu có nhiều giao dịch (> 3): Gom nhóm (batch) thành 1 thông báo tóm tắt thay vì spam nhiều lần.
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
    if (items.length <= 3) {
      // Gửi riêng từng giao dịch để người dùng có đầy đủ các nút bấm [⚡ Ghi nhận] [✏️ Sửa] [❌ Bỏ qua]
      for (const item of items) {
        await sendSystemTransactionNotification(item);
      }
    } else {
      // Gom nhóm nhiều giao dịch (> 3 giao dịch)
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
          categoryIdentifier: SEPAY_CATEGORY_ID,
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
