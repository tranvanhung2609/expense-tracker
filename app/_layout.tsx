import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import { lightTheme, darkTheme } from '../src/constants/theme';
import { initDatabase } from '../src/db/schema';
import { useTransactionStore } from '../src/stores/transactionStore';
import { useWalletStore } from '../src/stores/walletStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import { useSettingsStore } from '../src/stores/settingsStore';

import DynamicIslandBanner from '../src/components/DynamicIslandBanner';

import { useNotificationStore } from '../src/stores/notificationStore';
import { usePendingTransactionStore } from '../src/stores/pendingTransactionStore';
import { isSepayConfigured, isSepayAutoSyncEnabled, syncSepayTransactions } from '../src/services/sepayService';
import { initSystemNotifications, requestSystemNotificationPermission } from '../src/services/systemNotificationService';
import { registerBackgroundSync } from '../src/services/backgroundSyncService';
import { useUpdateStore } from '../src/stores/updateStore';
import UpdateModal from '../src/components/UpdateModal';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { isDarkMode, isOnboardingDone } = useSettingsStore();
  const { isModalVisible, release, closeModal, checkAndPromptUpdate } = useUpdateStore();

  useEffect(() => {
    // Initialize DB and seed on first run
    initDatabase();
    // Load initial data into stores
    useTransactionStore.getState().loadAll();
    useWalletStore.getState().load();
    useCategoryStore.getState().load();
    useNotificationStore.getState().load();
    usePendingTransactionStore.getState().loadPending();

    // Initialize System Notifications & Channels
    initSystemNotifications().catch(() => {});
    requestSystemNotificationPermission().catch(() => {});

    // Register Background Periodic Sync (Android WorkManager)
    registerBackgroundSync().catch(() => {});

    // Smart Foreground Sync & Polling:
    // 1. Đồng bộ khi mở app
    // 2. Tự động đồng bộ ngay khi chuyển từ app ngân hàng (MB, VCB...) quay lại app này
    // 3. Định kỳ thăm dò nhẹ mỗi 25s khi đang mở app
    let syncInterval: ReturnType<typeof setInterval> | null = null;

    const runSepaySync = () => {
      if (isSepayConfigured() && isSepayAutoSyncEnabled()) {
        syncSepayTransactions().catch(() => {});
      }
    };

    setTimeout(runSepaySync, 1200);

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runSepaySync();
        if (!syncInterval) {
          syncInterval = setInterval(runSepaySync, 25000);
        }
      } else {
        if (syncInterval) {
          clearInterval(syncInterval);
          syncInterval = null;
        }
      }
    });

    if (AppState.currentState === 'active') {
      syncInterval = setInterval(runSepaySync, 25000);
    }

    // Auto-check for updates every time app opens (if enabled)
    const updateCheckTimer = setTimeout(() => {
      checkAndPromptUpdate(false).catch(() => {});
    }, 1500);

    // Navigate to onboarding if first run
    let onboardingTimer: ReturnType<typeof setTimeout> | null = null;
    if (!isOnboardingDone()) {
      onboardingTimer = setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
    }

    return () => {
      appStateSub.remove();
      if (syncInterval) clearInterval(syncInterval);
      if (onboardingTimer) clearTimeout(onboardingTimer);
      clearTimeout(updateCheckTimer);
    };
  }, []);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <PaperProvider theme={theme}>
          <DynamicIslandBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="transfer"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
          </Stack>

          {/* Global Update Modal - Prompts on app launch if new version is found */}
          <UpdateModal
            visible={isModalVisible}
            release={release}
            onClose={() => closeModal(true)}
          />
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
