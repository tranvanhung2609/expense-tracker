import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ReleaseInfo,
  DownloadProgress,
  formatBytes,
  checkExistingDownloadedUpdate,
  downloadAppUpdate,
  installApk,
  openUnknownAppSourcesSettings,
  openDownloadUrl,
  getAppCurrentVersion,
} from '../services/updateService';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from '../constants/theme';

interface UpdateModalProps {
  visible: boolean;
  release: ReleaseInfo | null;
  onClose: () => void;
}

type ModalState = 'IDLE' | 'DOWNLOADING' | 'READY_TO_INSTALL' | 'INSTALLING' | 'ERROR';

export default function UpdateModal({ visible, release, onClose }: UpdateModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentVersion = getAppCurrentVersion();

  const [status, setStatus] = useState<ModalState>('IDLE');
  const [progress, setProgress] = useState<DownloadProgress>({
    bytesWritten: 0,
    totalBytes: 0,
    percent: 0,
  });
  const [downloadedFileUri, setDownloadedFileUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible && release) {
      // Check if this release APK is already downloaded in device cache
      checkExistingDownloadedUpdate(release).then(uri => {
        if (uri) {
          setDownloadedFileUri(uri);
          setStatus('READY_TO_INSTALL');
        } else {
          setDownloadedFileUri(null);
          setStatus('IDLE');
        }
      });
      setProgress({
        bytesWritten: 0,
        totalBytes: release.apkSize || 0,
        percent: 0,
      });
      setErrorMessage(null);
    } else {
      // Reset when modal is hidden
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setStatus('IDLE');
    }
  }, [visible, release]);

  if (!release) return null;

  const isAndroid = Platform.OS === 'android';
  const hasApkAsset = Boolean(release.isDirectApk || release.downloadUrl.toLowerCase().endsWith('.apk'));

  const handleStartDownload = async () => {
    if (!isAndroid || !hasApkAsset) {
      // Fallback for iOS or releases without APK asset (open browser/GitHub)
      const opened = await openDownloadUrl(release.downloadUrl);
      if (opened && !release.mandatory) {
        onClose();
      }
      return;
    }

    setStatus('DOWNLOADING');
    setErrorMessage(null);
    setProgress({
      bytesWritten: 0,
      totalBytes: release.apkSize || 0,
      percent: 0,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await downloadAppUpdate(
        release,
        newProgress => setProgress(newProgress),
        controller.signal
      );

      if (result.success && result.fileUri) {
        setDownloadedFileUri(result.fileUri);
        setStatus('READY_TO_INSTALL');
      } else {
        if (controller.signal.aborted) {
          setStatus('IDLE');
        } else {
          setErrorMessage(result.error || 'Có lỗi xảy ra khi tải gói cập nhật.');
          setStatus('ERROR');
        }
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setErrorMessage(err?.message || 'Không thể kết nối đến máy chủ tải về.');
        setStatus('ERROR');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('IDLE');
  };

  const handleInstall = async () => {
    if (!downloadedFileUri) {
      handleStartDownload();
      return;
    }

    setStatus('INSTALLING');
    const result = await installApk(downloadedFileUri);

    if (!result.success) {
      setStatus('READY_TO_INSTALL');
      Alert.alert(
        'Lỗi khởi chạy cài đặt',
        result.error || 'Không thể mở trình cài đặt.',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Mở Cài đặt quyền',
            onPress: () => openUnknownAppSourcesSettings(),
          },
        ]
      );
    }
  };

  const handleBackdropPress = () => {
    if (release.mandatory) return;

    if (status === 'DOWNLOADING') {
      Alert.alert(
        'Hủy tải cập nhật?',
        'Quá trình tải bản cập nhật đang diễn ra. Bạn có muốn hủy không?',
        [
          { text: 'Tiếp tục tải', style: 'cancel' },
          {
            text: 'Hủy tải',
            style: 'destructive',
            onPress: () => {
              handleCancelDownload();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, SPACING.lg),
            },
          ]}
        >
          {/* STATE: IDLE - Initial Overview */}
          {status === 'IDLE' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                <MaterialCommunityIcons name="rocket-launch" size={38} color={theme.primary} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Có bản cập nhật mới!
              </Text>

              {/* Version badge */}
              <View style={styles.versionRow}>
                <View style={[styles.badgeOld, { backgroundColor: theme.surfaceVariant }]}>
                  <Text style={[styles.badgeTextOld, { color: theme.textTertiary }]}>
                    v{currentVersion}
                  </Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textTertiary} />
                <View style={[styles.badgeNew, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeTextNew}>v{release.version}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                {release.releaseDate ? (
                  <Text style={[styles.metaText, { color: theme.textTertiary }]}>
                    📅 {release.releaseDate}
                  </Text>
                ) : null}
                {release.apkSize ? (
                  <Text style={[styles.metaText, { color: theme.textTertiary }]}>
                    📦 {formatBytes(release.apkSize)}
                  </Text>
                ) : null}
              </View>

              {/* Changelog */}
              <View style={[styles.changelogBox, { backgroundColor: theme.surfaceVariant }]}>
                <Text style={[styles.changelogTitle, { color: theme.textPrimary }]}>
                  {release.title || 'Điểm mới trong phiên bản này:'}
                </Text>
                <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
                  {release.changelog.map((item, idx) => (
                    <View key={idx} style={styles.changelogItem}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
                      <Text style={[styles.changelogText, { color: theme.textSecondary }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                  onPress={handleStartDownload}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="download" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>
                    {isAndroid && hasApkAsset ? 'Tải & Cập nhật ngay' : 'Tải về bản mới'}
                  </Text>
                </TouchableOpacity>

                {!release.mandatory && (
                  <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={[styles.laterBtnText, { color: theme.textTertiary }]}>
                      Để sau
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* STATE: DOWNLOADING - In-app Progress */}
          {status === 'DOWNLOADING' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                <MaterialCommunityIcons name="cloud-download" size={38} color={theme.primary} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Đang tải bản cập nhật...
              </Text>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Phiên bản v{release.version}
              </Text>

              {/* Progress percentage & bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.percentNumber, { color: theme.primary }]}>
                    {progress.percent}%
                  </Text>
                  <Text style={[styles.bytesText, { color: theme.textSecondary }]}>
                    {formatBytes(progress.bytesWritten)}
                    {progress.totalBytes > 0 ? ` / ${formatBytes(progress.totalBytes)}` : ''}
                  </Text>
                </View>

                {/* Progress Bar Track */}
                <View style={[styles.progressBarTrack, { backgroundColor: theme.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${Math.max(4, Math.min(100, progress.percent))}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.infoBanner, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={theme.primary}
                  style={styles.infoIcon}
                />
                <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
                  Quá trình tải đang diễn ra trực tiếp trong ứng dụng. Vui lòng giữ ứng dụng mở cho đến khi hoàn tất.
                </Text>
              </View>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={handleCancelDownload}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                    Hủy tải xuống
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* STATE: READY_TO_INSTALL - Downloaded and Ready */}
          {status === 'READY_TO_INSTALL' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
                <MaterialCommunityIcons name="check-decagram" size={38} color={COLORS.success} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Tải về hoàn tất!
              </Text>

              <View style={styles.versionRow}>
                <View style={[styles.badgeNew, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.badgeTextNew}>v{release.version} Sẵn sàng cài đặt</Text>
                </View>
              </View>

              <View style={[styles.installGuideBox, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name="cellphone-arrow-down"
                  size={24}
                  color={theme.primary}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.installGuideTitle, { color: theme.textPrimary }]}>
                    Quy trình nâng cấp
                  </Text>
                  <Text style={[styles.installGuideText, { color: theme.textSecondary }]}>
                    1. Bấm nút bên dưới để mở giao diện cài đặt của thiết bị.{'\n'}
                    2. Chọn <Text style={{ fontWeight: '700' }}>Cập nhật</Text>. Ứng dụng sẽ tự động đóng và áp dụng phiên bản mới.{'\n'}
                    3. Mở lại ứng dụng sau khi hoàn tất. Toàn bộ dữ liệu của bạn được bảo toàn 100%.
                  </Text>
                </View>
              </View>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: COLORS.success }]}
                  onPress={handleInstall}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Cài đặt & Khởi động lại ngay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: theme.border }]}
                  onPress={() => openUnknownAppSourcesSettings()}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="cog-outline" size={16} color={theme.textTertiary} />
                  <Text style={[styles.secondaryActionText, { color: theme.textTertiary }]}>
                    Cài đặt quyền ứng dụng không xác định
                  </Text>
                </TouchableOpacity>

                {!release.mandatory && (
                  <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={[styles.laterBtnText, { color: theme.textTertiary }]}>
                      Để sau
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* STATE: INSTALLING - Intent Launched */}
          {status === 'INSTALLING' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Đang chuyển sang trình cài đặt...
              </Text>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Vui lòng xác nhận trên hộp thoại của hệ thống Android
              </Text>

              <View style={[styles.infoBanner, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={theme.primary}
                  style={styles.infoIcon}
                />
                <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
                  Ứng dụng sẽ tự động thoát khi trình cài đặt Android tiến hành cập nhật. Nếu hộp thoại cài đặt chưa hiện, hãy bấm nút bên dưới để thử lại.
                </Text>
              </View>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                  onPress={handleInstall}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Mở lại trình cài đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={[styles.laterBtnText, { color: theme.textTertiary }]}>
                    Đóng
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* STATE: ERROR - Failed */}
          {status === 'ERROR' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.error + '20' }]}>
                <MaterialCommunityIcons name="alert-circle" size={38} color={COLORS.error} />
              </View>

              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Không thể tải bản cập nhật
              </Text>

              <Text style={[styles.errorMessageText, { color: COLORS.error }]}>
                {errorMessage || 'Đã xảy ra lỗi không xác định trong quá trình tải về.'}
              </Text>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                  onPress={handleStartDownload}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Thử tải lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={async () => {
                    await openDownloadUrl(release.downloadUrl);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="open-in-new" size={18} color={theme.textPrimary} />
                  <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>
                    Tải qua trình duyệt (GitHub)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={[styles.laterBtnText, { color: theme.textTertiary }]}>
                    Đóng
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  badgeOld: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeTextOld: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeNew: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeTextNew: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  changelogBox: {
    width: '100%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  changelogTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  changelogScroll: {
    maxHeight: 130,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  changelogText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  progressContainer: {
    width: '100%',
    marginVertical: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  percentNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  bytesText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoBannerText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    lineHeight: 18,
  },
  installGuideBox: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  installGuideTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  installGuideText: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
  errorMessageText: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  buttonCol: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
