import {
  isSepayConfigured,
  isSepayAutoSyncEnabled,
  syncSepayTransactions,
} from './sepayService';

export const BACKGROUND_SEPAY_SYNC_TASK = 'BACKGROUND_SEPAY_SYNC';

// Safely require TaskManager and BackgroundFetch
let TaskManager: typeof import('expo-task-manager') | null = null;
let BackgroundFetch: typeof import('expo-background-fetch') | null = null;

try {
  TaskManager = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');

  if (TaskManager && typeof TaskManager.defineTask === 'function') {
    TaskManager.defineTask(BACKGROUND_SEPAY_SYNC_TASK, async () => {
      try {
        console.log('[BackgroundSync] Android WorkManager triggered SePay sync task.');

        if (!isSepayConfigured() || !isSepayAutoSyncEnabled()) {
          return BackgroundFetch?.BackgroundFetchResult?.NoData ?? 1;
        }

        const result = await syncSepayTransactions();

        if (result.success && result.syncedCount > 0) {
          console.log(`[BackgroundSync] Processed ${result.syncedCount} new transactions.`);
          return BackgroundFetch?.BackgroundFetchResult?.NewData ?? 2;
        }

        return BackgroundFetch?.BackgroundFetchResult?.NoData ?? 1;
      } catch (error) {
        console.error('[BackgroundSync] Background sync execution failed:', error);
        return BackgroundFetch?.BackgroundFetchResult?.Failed ?? 3;
      }
    });
  }
} catch (err) {
  console.warn('[BackgroundSync] TaskManager or BackgroundFetch not available:', err);
  TaskManager = null;
  BackgroundFetch = null;
}

/**
 * Register background periodic sync with Android WorkManager / iOS Background Fetch
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!TaskManager || !BackgroundFetch) {
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SEPAY_SYNC_TASK);
    if (isRegistered) {
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SEPAY_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // Continue running after app is closed / killed
      startOnBoot: true, // Auto-start on device reboot
    });

    console.log('[BackgroundSync] Successfully registered background sync task.');
    return true;
  } catch (error) {
    console.warn('[BackgroundSync] Failed to register background sync task:', error);
    return false;
  }
}

/**
 * Unregister background sync
 */
export async function unregisterBackgroundSync(): Promise<void> {
  if (!TaskManager || !BackgroundFetch) {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SEPAY_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SEPAY_SYNC_TASK);
    }
  } catch (error) {
    console.warn('[BackgroundSync] Failed to unregister background sync:', error);
  }
}
