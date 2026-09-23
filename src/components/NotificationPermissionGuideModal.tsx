import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  AppState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import {
  openAndroidNotificationSettings,
  checkNotificationPermissionGranted,
} from '../services/androidNotificationService';

interface NotificationPermissionGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export default function NotificationPermissionGuideModal({
  visible,
  onClose,
  onPermissionGranted,
}: NotificationPermissionGuideModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);

  useEffect(() => {
    if (!visible) {
      setHasOpenedSettings(false);
    }
  }, [visible]);

  // Auto-detect when user returns from Android Settings
  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const granted = checkNotificationPermissionGranted();
        if (granted) {
          onPermissionGranted?.();
          onClose();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible, onPermissionGranted, onClose]);

  const handleOpenSettings = async () => {
    setHasOpenedSettings(true);
    await openAndroidNotificationSettings();
  };

  const handleConfirmGranted = () => {
    onPermissionGranted?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: '#3B82F620' }]}>
              <MaterialCommunityIcons name="cellphone-nfc" size={24} color="#3B82F6" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Cấp quyền đọc thông báo
              </Text>
              <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                Để tự động ghi chép chi tiêu từ biến động số dư
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Callout box: Lưu ý cấp quyền */}
            <View style={[styles.calloutCard, { backgroundColor: '#3B82F615', borderColor: '#3B82F640' }]}>
              <View style={styles.calloutHeader}>
                <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
                <Text style={[styles.calloutTitle, { color: '#3B82F6' }]}>LƯU Ý KHI CẤP QUYỀN:</Text>
              </View>
              <View style={styles.calloutItem}>
                <Text style={styles.bullet}>📱</Text>
                <Text style={[styles.calloutText, { color: theme.textPrimary }]}>
                  Trong danh sách <Text style={styles.boldHighlight}>Truy cập thông báo</Text> của hệ thống, hãy tìm tên <Text style={styles.boldHighlight}>ứng dụng</Text> và gạt công tắc sang <Text style={{ fontWeight: '700', color: '#10B981' }}>Cho phép</Text>.
                </Text>
              </View>
            </View>

            {/* Các bước hướng dẫn */}
            <Text style={[styles.stepsHeading, { color: theme.textSecondary }]}>
              HƯỚNG DẪN 4 BƯỚC BẬT QUYỀN
            </Text>

            <View style={styles.stepsContainer}>
              {/* Bước 1 */}
              <View style={[styles.stepRow, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Bấm nút "Mở Cài đặt hệ thống" ở bên dưới
                  </Text>
                  <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                    Hệ thống sẽ chuyển bạn thẳng đến màn hình "Quyền truy cập thông báo" của Android.
                  </Text>
                </View>
              </View>

              {/* Bước 2 */}
              <View style={[styles.stepRow, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Tìm "Expense Tracker" trong danh sách
                  </Text>
                  <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                    Cuộn danh sách và bấm chọn đúng <Text style={{ fontWeight: '700', color: theme.primary }}>Expense Tracker</Text>.
                  </Text>
                </View>
              </View>

              {/* Bước 3 */}
              <View style={[styles.stepRow, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Bật công tắc sang "Cho phép"
                  </Text>
                  <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                    Bấm vào Expense Tracker, gạt công tắc Cho phép truy cập thông báo và nhấn Cho phép.
                  </Text>
                </View>
              </View>

              {/* Bước 4 */}
              <View style={[styles.stepRow, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                    Quay lại ứng dụng này
                  </Text>
                  <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                    Ứng dụng sẽ tự động kích hoạt nhận diện biến động từ Vietcombank, MB Bank, Techcombank, MoMo,...
                  </Text>
                </View>
              </View>
            </View>

            {/* Android 13/14+ Cảnh báo Cài đặt bị hạn chế */}
            <View style={[styles.calloutCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40', marginTop: SPACING.md }]}>
              <View style={styles.calloutHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F59E0B" />
                <Text style={[styles.calloutTitle, { color: '#F59E0B' }]}>LƯU Ý CHO ANDROID 13 & 14+:</Text>
              </View>
              <Text style={[styles.calloutText, { color: theme.textPrimary, fontSize: 12, lineHeight: 18 }]}>
                Nếu công tắc gạt bị làm mờ và máy báo <Text style={styles.boldHighlight}>"Cài đặt bị hạn chế"</Text>:{'\n'}
                Vào <Text style={styles.boldHighlight}>Cài đặt máy ➔ Ứng dụng ➔ Expense Tracker</Text> ➔ chạm vào dấu <Text style={styles.boldHighlight}>3 chấm (⋮)</Text> góc trên bên phải ➔ chọn <Text style={{ fontWeight: '700', color: '#10B981' }}>Cho phép cài đặt bị hạn chế</Text>. Sau đó quay lại bật quyền bình thường!
              </Text>
            </View>

            {/* Hộp xác nhận sau khi mở cài đặt */}
            {hasOpenedSettings && (
              <View style={[styles.verificationBox, { backgroundColor: '#10B98115', borderColor: '#10B98140' }]}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verificationTitle, { color: '#10B981' }]}>
                    Bạn đã gạt Cho phép trong Cài đặt chưa?
                  </Text>
                  <Text style={[styles.verificationText, { color: theme.textSecondary }]}>
                    Nếu đã bật xong, hãy bấm nút "Tôi đã bật quyền" bên dưới để kích hoạt tự động nhận diện.
                  </Text>
                </View>
              </View>
            )}

            {/* Cam kết bảo mật */}
            <View style={[styles.securityBanner, { backgroundColor: theme.surfaceVariant }]}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
              <Text style={[styles.securityText, { color: theme.textSecondary }]}>
                100% Offline: Ứng dụng chỉ đọc tin nhắn biến động số dư và phân tích trực tiếp trên máy của bạn, tuyệt đối không gửi dữ liệu ra ngoài.
              </Text>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {hasOpenedSettings ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleConfirmGranted}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Tôi đã bật quyền</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}
                  onPress={handleOpenSettings}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cog-outline" size={18} color={theme.textPrimary} />
                  <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>Mở lại Cài đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Chưa bật, để sau</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                  onPress={handleOpenSettings}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cog-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Mở Cài đặt hệ thống ngay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '90%',
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 460,
    marginVertical: SPACING.sm,
  },
  calloutCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calloutItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    marginTop: 1,
  },
  calloutText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  boldHighlight: {
    fontWeight: '700',
  },
  stepsHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  stepsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  verificationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  verificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  verificationText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: RADIUS.md,
    gap: 6,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
