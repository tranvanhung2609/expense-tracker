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
  isPinEnabled: boolean;
  pinHash: string | null;
  currency: string;
  isBalanceHidden: boolean;
  autoLockTimeout: number; // in milliseconds: 0 = immediate, 30000 = 30s, 60000 = 1m, 300000 = 5m

  isQuickGuideDismissed: boolean;

  toggleDarkMode: () => void;
  togglePin: (enabled: boolean) => void;
  setCurrency: (currency: string) => void;
  toggleBalanceHidden: () => void;
  setAutoLockTimeout: (timeoutMs: number) => void;
  isOnboardingDone: () => boolean;
  markOnboardingDone: () => void;
  resetOnboarding: () => void;
  dismissQuickGuide: () => void;
  resetQuickGuide: () => void;
}

export const useSettingsStore = create<AppSettings>((set, get) => ({
  isDarkMode: getSafeBoolean('dark_mode', false),
  isPinEnabled: getSafeBoolean('pin_enabled', false),
  pinHash: getSafeStringOrNull('pin_hash'),
  currency: getSafeString('app_currency', 'VND'),
  isBalanceHidden: getSafeBoolean('balance_hidden', false),
  autoLockTimeout: getSafeNumber('auto_lock_timeout', 0),
  isQuickGuideDismissed: getSafeBoolean('quick_guide_dismissed', false),

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    storage.set('dark_mode', next);
    set({ isDarkMode: next });
  },

  togglePin: (enabled: boolean) => {
    storage.set('pin_enabled', enabled);
    set({ isPinEnabled: enabled });
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

  setAutoLockTimeout: (timeoutMs: number) => {
    storage.set('auto_lock_timeout', timeoutMs);
    set({ autoLockTimeout: timeoutMs });
  },

  isOnboardingDone: () => {
    return storage.getBoolean('onboarding_done') ?? false;
  },

  markOnboardingDone: () => {
    storage.set('onboarding_done', true);
  },

  resetOnboarding: () => {
    storage.set('onboarding_done', false);
    storage.set('quick_guide_dismissed', false);
    set({ isQuickGuideDismissed: false });
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
