import { create } from 'zustand';
import { createMMKV } from '../utils/storage';

const storage = createMMKV({ id: 'app-settings' });

function getSafeBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const val = storage.getBoolean(key);
    return typeof val === 'boolean' ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

function getSafeString(key: string, defaultValue: string): string {
  try {
    const val = storage.getString(key);
    return typeof val === 'string' && val.trim().length > 0 ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

function getSafeStringOrNull(key: string): string | null {
  try {
    const val = storage.getString(key);
    return typeof val === 'string' ? val : null;
  } catch {
    return null;
  }
}

function getSafeNumber(key: string, defaultValue: number): number {
  try {
    const val = storage.getNumber(key);
    return typeof val === 'number' && !isNaN(val) ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

interface AppSettings {
  isDarkMode: boolean;
  currency: string;
  isBalanceHidden: boolean;

  isQuickGuideDismissed: boolean;

  hasNotificationPermission: boolean;
  setNotificationPermission: (granted: boolean) => void;

  hasAcceptedPrivacyPolicy: boolean;
  acceptPrivacyPolicy: () => void;

  toggleDarkMode: () => void;
  setCurrency: (currency: string) => void;
  toggleBalanceHidden: () => void;
  isOnboardingDone: () => boolean;
  markOnboardingDone: () => void;
  resetOnboarding: () => void;
  dismissQuickGuide: () => void;
  resetQuickGuide: () => void;
}

export const useSettingsStore = create<AppSettings>((set, get) => ({
  isDarkMode: getSafeBoolean('dark_mode', false),
  currency: getSafeString('app_currency', 'VND'),
  isBalanceHidden: getSafeBoolean('balance_hidden', false),
  isQuickGuideDismissed: getSafeBoolean('quick_guide_dismissed', false),
  hasNotificationPermission: getSafeBoolean('has_notification_permission', false),
  hasAcceptedPrivacyPolicy: getSafeBoolean('privacy_policy_accepted', false),

  setNotificationPermission: (granted: boolean) => {
    storage.set('has_notification_permission', granted);
    set({ hasNotificationPermission: granted });
  },

  acceptPrivacyPolicy: () => {
    storage.set('privacy_policy_accepted', true);
    set({ hasAcceptedPrivacyPolicy: true });
  },

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    storage.set('dark_mode', next);
    set({ isDarkMode: next });
  },

  setCurrency: (currency: string) => {
    storage.set('app_currency', currency);
    set({ currency });
  },

  toggleBalanceHidden: () => {
    const next = !get().isBalanceHidden;
    storage.set('balance_hidden', next);
    set({ isBalanceHidden: next });
  },

  isOnboardingDone: () => {
    return storage.getBoolean('onboarding_done') ?? false;
  },

  markOnboardingDone: () => {
    storage.set('onboarding_done', true);
  },

  resetOnboarding: () => {
    storage.set('onboarding_done', false);
    storage.set('privacy_policy_accepted', false);
    storage.set('quick_guide_dismissed', false);
    set({ isQuickGuideDismissed: false, hasAcceptedPrivacyPolicy: false });
  },

  dismissQuickGuide: () => {
    storage.set('quick_guide_dismissed', true);
    set({ isQuickGuideDismissed: true });
  },

  resetQuickGuide: () => {
    storage.set('quick_guide_dismissed', false);
    set({ isQuickGuideDismissed: false });
  },
}));
