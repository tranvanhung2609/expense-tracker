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
        console.log('[BackgroundSync] Android WorkManager/AlarmManager triggered SePay sync task.');

        // 1. Ensure SQLite schema & tables exist in headless environment
        try {
          const { initDatabase } = require('../db/schema');
          initDatabase();
        } catch (dbErr) {
          console.warn('[BackgroundSync] Headless DB initialization warning:', dbErr);
        }

        // 2. Ensure system notification channels & categories exist in headless environment
        try {
          const { initSystemNotifications } = require('./systemNotificationService');
          await initSystemNotifications();
        } catch (notifErr) {
          console.warn('[BackgroundSync] Headless notification channels initialization warning:', notifErr);
        }

        // 3. Check configuration & auto-sync toggle
        if (!isSepayConfigured() || !isSepayAutoSyncEnabled()) {
          console.log('[BackgroundSync] SePay is not configured or auto-sync is disabled.');
          return BackgroundFetch?.BackgroundFetchResult?.NoData ?? 1;
        }

        // 4. Fetch transactions from SePay API
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
 * Register background periodic sync with Android WorkManager / AlarmManager / iOS Background Fetch
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!TaskManager || !BackgroundFetch) {
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SEPAY_SYNC_TASK);
    if (isRegistered) {
      console.log('[BackgroundSync] Task already registered in TaskManager.');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SEPAY_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (Standard Android & iOS interval)
      stopOnTerminate: false, // Continue running even after app is closed / killed
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
      console.log('[BackgroundSync] Successfully unregistered background sync task.');
    }
  } catch (error) {
    console.warn('[BackgroundSync] Failed to unregister background sync:', error);
  }
}
