import { create } from 'zustand';
import {
  ReleaseInfo,
  checkAppUpdate,
  isAutoCheckEnabled,
  setAutoCheckEnabled,
} from '../services/updateService';
import { sendSystemUpdateNotification } from '../services/systemNotificationService';

interface UpdateStoreState {
  isChecking: boolean;
  hasUpdate: boolean;
  release: ReleaseInfo | null;
  isModalVisible: boolean;
  dismissedVersions: string[];
  lastCheckedTime: number | null;

  checkAndPromptUpdate: (isManual?: boolean) => Promise<{
    hasUpdate: boolean;
    release: ReleaseInfo | null;
    error?: string;
  }>;
  openModal: (release?: ReleaseInfo) => void;
  closeModal: (dontRemindThisSession?: boolean) => void;
  dismissCurrentUpdate: () => void;
  setAutoCheck: (enabled: boolean) => void;
  isAutoCheck: () => boolean;
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  isChecking: false,
  hasUpdate: false,
  release: null,
  isModalVisible: false,
  dismissedVersions: [],
  lastCheckedTime: null,

  isAutoCheck: () => isAutoCheckEnabled(),

  setAutoCheck: (enabled: boolean) => {
    setAutoCheckEnabled(enabled);
    if (enabled) {
      // Khi user bật tự động kiểm tra, kích hoạt kiểm tra ngay lập tức
      get().checkAndPromptUpdate(false);
    }
  },

  checkAndPromptUpdate: async (isManual = false) => {
    // If not manual check, respect user's auto check toggle
    if (!isManual && !isAutoCheckEnabled()) {
      return { hasUpdate: false, release: null };
    }

    set({ isChecking: true });
    try {
      const result = await checkAppUpdate(isManual);
      const now = Date.now();

      if (result.hasUpdate && result.release) {
        const isDismissed = get().dismissedVersions.includes(result.release.version);
        set({
          isChecking: false,
          hasUpdate: true,
          release: result.release,
          lastCheckedTime: now,
          // Open modal if manual check OR if this version hasn't been dismissed in this session
          isModalVisible: isManual || !isDismissed,
        });

        // Trigger system notification if background/auto check
        if (!isManual) {
          sendSystemUpdateNotification(result.release).catch(() => {});
        }
      } else {
        set({
          isChecking: false,
          hasUpdate: false,
          release: null,
          lastCheckedTime: now,
        });
      }

      return result;
    } catch (err: any) {
      set({ isChecking: false });
      return {
        hasUpdate: false,
        release: null,
        error: err?.message || 'Không thể kiểm tra bản cập nhật.',
      };
    }
  },

  openModal: (release?: ReleaseInfo) => {
    if (release) {
      set({ release, hasUpdate: true, isModalVisible: true });
    } else if (get().release) {
      set({ isModalVisible: true });
    } else {
      get().checkAndPromptUpdate(true);
    }
  },

  closeModal: (dontRemindThisSession = true) => {
    const currentRelease = get().release;
    if (dontRemindThisSession && currentRelease?.version) {
      const dismissed = get().dismissedVersions;
      if (!dismissed.includes(currentRelease.version)) {
        set({
          isModalVisible: false,
          dismissedVersions: [...dismissed, currentRelease.version],
        });
        return;
      }
    }
    set({ isModalVisible: false });
  },

  dismissCurrentUpdate: () => {
    get().closeModal(true);
  },
}));
