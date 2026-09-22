import { Platform, Linking, Alert } from 'react-native';
import { createMMKV } from '../utils/storage';
import { useNotificationStore } from '../stores/notificationStore';
import { NOTIFICATION_TYPES } from '../constants/enums';

const storage = createMMKV({ id: 'app-settings' });

export interface ReleaseInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  changelog: string[];
  downloadUrl: string;
  mandatory: boolean;
  minSupportedVersion?: string;
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  release: ReleaseInfo | null;
  error?: string;
}

const DEFAULT_DISTRIBUTOR_URL =
  'https://raw.githubusercontent.com/expensetracker/app-releases/main/version.json';

export function getAppCurrentVersion(): string {
  try {
    const appConfig = require('../../app.json');
    return appConfig?.expo?.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export function getDistributorUrl(): string {
  return storage.getString('distributor_url') ?? DEFAULT_DISTRIBUTOR_URL;
}

export function setDistributorUrl(url: string): void {
  storage.set('distributor_url', url);
}

export function isAutoCheckEnabled(): boolean {
  return storage.getBoolean('auto_check_updates') ?? true;
}

export function setAutoCheckEnabled(enabled: boolean): void {
  storage.set('auto_check_updates', enabled);
}

/**
 * Compare two semver strings: v1 vs v2
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if v1 == v2
 */
export function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export async function checkAppUpdate(isManual = false): Promise<CheckUpdateResult> {
  const currentVersion = getAppCurrentVersion();
  const manifestUrl = getDistributorUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Máy chủ phân phối phản hồi mã ${response.status}`);
    }

    const releaseData: ReleaseInfo = await response.json();

    const hasUpdate = compareSemver(releaseData.version, currentVersion) > 0;

    if (hasUpdate) {
      // Notify inside app
      const { addNotification, notifications } = useNotificationStore.getState();
      const alreadyNotified = notifications.some(
        n => n.type === NOTIFICATION_TYPES.APP_UPDATE && n.title.includes(releaseData.version)
      );

      if (!alreadyNotified) {
        addNotification({
          title: `🚀 Có bản cập nhật mới ${releaseData.version}`,
          message: `${releaseData.title}: ${releaseData.changelog[0] ?? 'Nâng cấp hiệu năng và sửa lỗi.'}`,
          type: NOTIFICATION_TYPES.APP_UPDATE,
          actionUrl: '/(tabs)/settings',
        });
      }
    }

    return {
      hasUpdate,
      currentVersion,
      release: hasUpdate ? releaseData : null,
    };
  } catch (err: unknown) {
    // Offline or network error
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : '';
    const isNetworkError =
      errorName === 'AbortError' ||
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch');

    return {
      hasUpdate: false,
      currentVersion,
      release: null,
      error: isNetworkError
        ? 'Không có kết nối mạng. Ứng dụng vẫn hoạt động 100% ngoại tuyến.'
        : errorMessage || 'Không thể kiểm tra bản cập nhật từ nhà phân phối.',
    };
  }
}

export async function openDownloadUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert('Không thể mở liên kết', 'Thiết bị không tìm thấy ứng dụng hỗ trợ mở đường dẫn này.');
      return false;
    }
  } catch {
    Alert.alert('Lỗi', 'Không thể mở trình duyệt hoặc đường dẫn tải về.');
    return false;
  }
}
