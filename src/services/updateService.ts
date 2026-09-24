import { Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
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
  apkSize?: number;
  apkName?: string;
  isDirectApk?: boolean;
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  release: ReleaseInfo | null;
  error?: string;
}

export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number;
  percent: number;
}

const DEFAULT_DISTRIBUTOR_URL =
  'https://api.github.com/repos/tranvanhung2609/expense-tracker/releases/latest';

export function getAppCurrentVersion(): string {
  try {
    const expoVersion = Constants.expoConfig?.version;
    if (expoVersion) return expoVersion;
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

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getUpdateApkFileName(version: string, apkName?: string): string {
  if (apkName && apkName.toLowerCase().endsWith('.apk')) {
    return apkName;
  }
  return `ExpenseTracker_v${version}.apk`;
}

/**
 * Compare two semver strings: v1 vs v2
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if v1 == v2
 */
export function compareSemver(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, '');
  const cleanV2 = v2.replace(/^v/i, '');
  const parts1 = cleanV1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = cleanV2.split('.').map(p => parseInt(p, 10) || 0);

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
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        Accept: 'application/vnd.github.v3+json, application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          hasUpdate: false,
          currentVersion,
          release: null,
          error: isManual
            ? 'Không tìm thấy bản phát hành trên GitHub (Mã 404). Nguyên nhân: Repository đang ở chế độ Private (Riêng tư) nên ứng dụng không thể truy cập, hoặc chưa tạo bản Release.'
            : undefined,
        };
      }
      if (response.status === 403) {
        return {
          hasUpdate: false,
          currentVersion,
          release: null,
          error: isManual
            ? 'GitHub giới hạn tần suất yêu cầu (Mã 403). Vui lòng thử lại sau ít phút.'
            : undefined,
        };
      }
      throw new Error(`Máy chủ phản hồi mã ${response.status}`);
    }

    const data: any = await response.json();

    // Support both GitHub Release API format and custom version.json
    let releaseData: ReleaseInfo;
    if (data.tag_name) {
      // GitHub Release format
      const apkAsset = data.assets?.find((a: any) =>
        typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
      );
      const changelogLines = data.body
        ? data.body
            .split('\n')
            .map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
            .filter((l: string) => l.length > 0)
        : ['Cập nhật tính năng và sửa lỗi ổn định.'];

      const isDirectApk = Boolean(apkAsset && apkAsset.browser_download_url);

      releaseData = {
        version: data.tag_name.replace(/^v/i, ''),
        versionCode: 1,
        releaseDate: data.published_at ? data.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        title: data.name || `Bản cập nhật ${data.tag_name}`,
        changelog: changelogLines,
        downloadUrl: apkAsset ? apkAsset.browser_download_url : data.html_url,
        mandatory: false,
        apkSize: apkAsset?.size,
        apkName: apkAsset?.name,
        isDirectApk,
      };
    } else {
      // Standard version.json format
      releaseData = data as ReleaseInfo;
      if (releaseData.downloadUrl && releaseData.downloadUrl.toLowerCase().endsWith('.apk')) {
        releaseData.isDirectApk = true;
      }
    }

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

/**
 * Check if the APK for the given release was already downloaded and is ready in cache
 */
export async function checkExistingDownloadedUpdate(release: ReleaseInfo): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const fileName = getUpdateApkFileName(release.version, release.apkName);
    const file = new File(Paths.cache, fileName);
    if (file.exists && file.size && file.size > 100000) {
      if (release.apkSize && Math.abs(file.size - release.apkSize) > 1024) {
        return null;
      }
      return file.uri;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Download APK file directly inside the app with real-time progress updates
 */
export async function downloadAppUpdate(
  release: ReleaseInfo,
  onProgress: (progress: DownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<{ success: boolean; fileUri?: string; error?: string }> {
  if (Platform.OS !== 'android') {
    return {
      success: false,
      error: 'Tải trực tiếp trong ứng dụng chỉ hỗ trợ trên thiết bị Android.',
    };
  }

  try {
    const fileName = getUpdateApkFileName(release.version, release.apkName);
    const targetFile = new File(Paths.cache, fileName);

    // Delete old/incomplete file if already exists
    if (targetFile.exists) {
      try {
        await targetFile.delete();
      } catch {}
    }

    const expectedTotal = release.apkSize || 0;

    await File.downloadFileAsync(release.downloadUrl, targetFile, {
      idempotent: true,
      signal: abortSignal,
      onProgress: (data: { bytesWritten: number; totalBytes: number }) => {
        const total = data.totalBytes > 0 ? data.totalBytes : expectedTotal;
        const percent = total > 0 ? Math.min(100, Math.round((data.bytesWritten / total) * 100)) : 0;
        onProgress({
          bytesWritten: data.bytesWritten,
          totalBytes: total,
          percent,
        });
      },
    });

    if (!targetFile.exists) {
      throw new Error('Tệp tải về không tồn tại.');
    }

    return {
      success: true,
      fileUri: targetFile.uri,
    };
  } catch (err: any) {
    if (abortSignal?.aborted || err?.name === 'AbortError') {
      return {
        success: false,
        error: 'Đã hủy tải bản cập nhật.',
      };
    }
    return {
      success: false,
      error: err?.message || 'Lỗi khi tải tệp cập nhật.',
    };
  }
}

/**
 * Trigger the Android system Package Installer with the downloaded APK
 */
export async function installApk(fileUri: string): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS !== 'android') {
    return {
      success: false,
      error: 'Tính năng cài đặt gói APK chỉ hỗ trợ trên thiết bị Android.',
    };
  }

  try {
    const contentUri = await getContentUriAsync(fileUri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });

    return { success: true };
  } catch (err: any) {
    console.error('Lỗi khi mở trình cài đặt APK:', err);

    // Try sharing fallback
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.android.package-archive',
          dialogTitle: 'Mở bản cài đặt ứng dụng',
        });
        return { success: true };
      }
    } catch {}

    return {
      success: false,
      error:
        err?.message ||
        'Không thể mở trình cài đặt. Vui lòng cấp quyền cho phép cài đặt ứng dụng từ nguồn không xác định trong Cài đặt hệ thống.',
    };
  }
}

/**
 * Open Android Settings to allow installing unknown apps from this source
 */
export async function openUnknownAppSourcesSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES,
        {
          data: 'package:com.expensetracker.app',
        }
      );
    } catch {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES
        );
      } catch (err) {
        console.warn('Cannot open unknown app sources setting:', err);
      }
    }
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

