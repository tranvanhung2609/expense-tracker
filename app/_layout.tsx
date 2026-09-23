import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
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
import { checkAppUpdate, isAutoCheckEnabled } from '../src/services/updateService';
import { initSystemNotifications, requestSystemNotificationPermission } from '../src/services/systemNotificationService';
import { registerBackgroundSync } from '../src/services/backgroundSyncService';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { isDarkMode, isOnboardingDone } = useSettingsStore();

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

    // Auto-sync SePay transactions in background if enabled
    if (isSepayConfigured() && isSepayAutoSyncEnabled()) {
      setTimeout(() => {
        syncSepayTransactions().catch(() => {});
      }, 1500);
    }

    // Background update check if enabled
    if (isAutoCheckEnabled()) {
      setTimeout(() => {
        checkAppUpdate(false).catch(() => {});
      }, 2500);
    }

    // Navigate to onboarding if first run
    if (!isOnboardingDone()) {
      // Small delay to let layout mount
      const timer = setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
      return () => clearTimeout(timer);
    }
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
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
