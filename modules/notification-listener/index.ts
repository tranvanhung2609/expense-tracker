import { EventEmitter, EventSubscription, requireOptionalNativeModule } from 'expo-modules-core';

export interface NotificationEventPayload {
  packageName: string;
  title: string;
  body: string;
  timestamp: number;
}

type NotificationEvents = {
  onNotificationReceived: (event: NotificationEventPayload) => void;
};

const NativeModule = requireOptionalNativeModule('NotificationListener');
const emitter = NativeModule ? new EventEmitter<NotificationEvents>(NativeModule) : null;

/**
 * Check if Android Notification Listener permission is granted to this app.
 */
export function isNotificationAccessGranted(): boolean {
  if (!NativeModule || typeof NativeModule.isPermissionGranted !== 'function') {
    return false;
  }
  try {
    return Boolean(NativeModule.isPermissionGranted());
  } catch {
    return false;
  }
}

/**
 * Open the Android Notification Access Settings screen directly.
 */
export function openSystemNotificationSettings(): boolean {
  if (!NativeModule || typeof NativeModule.openNotificationSettings !== 'function') {
    return false;
  }
  try {
    return Boolean(NativeModule.openNotificationSettings());
  } catch {
    return false;
  }
}

/**
 * Add a listener for incoming notifications from other apps (e.g. banking apps).
 */
export function addNotificationReceivedListener(
  listener: (event: NotificationEventPayload) => void
): EventSubscription | null {
  if (!emitter) return null;
  return emitter.addListener('onNotificationReceived', listener);
}
