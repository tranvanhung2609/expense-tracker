import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  isMandatoryConsent?: boolean;
  onAccept?: () => void;
}

export default function PrivacyModal({
  visible,
  onClose,
  isMandatoryConsent = false,
  onAccept,
}: PrivacyModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAgreed(false);
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (!isMandatoryConsent) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (isMandatoryConsent) {
      if (!isAgreed) return;
      onAccept?.();
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isMandatoryConsent ? () => {} : onClose}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.income + '20' }]}>
              <MaterialCommunityIcons name="shield-check" size={24} color={theme.income} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Chính sách quyền riêng tư
              </Text>
              <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                Cam kết bảo mật dữ liệu tài chính của bạn
              </Text>
            </View>
            {!isMandatoryConsent && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Section 1 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="database-off-outline" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  1. Lưu trữ 100% Cục bộ (Offline-First)
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                Ứng dụng Expense Tracker được thiết kế theo triết lý bảo vệ quyền riêng tư tuyệt đối. Mọi thông tin về ví tiền, danh mục, các khoản thu/chi và hạn mức ngân sách đều được lưu trữ trực tiếp trong cơ sở dữ liệu SQLite trên thiết bị của bạn. Không có bất kỳ dữ liệu nào được tải lên máy chủ trung gian.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="fingerprint" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  2. Dữ liệu Sinh trắc học & Bảo mật
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                Tính năng khóa vân tay và Face ID sử dụng trực tiếp hàm API phần cứng bảo mật của hệ điều hành Android / iOS. Ứng dụng hoàn toàn không lưu trữ, không xử lý và không thể đọc được dữ liệu vân tay hay khuôn mặt của bạn.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="eye-off-outline" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  3. Không Thu thập Dữ liệu & Quảng cáo
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                Ứng dụng không chứa mã theo dõi hành vi người dùng, không sử dụng Google Analytics/Firebase để thu thập giao dịch tài chính, và không chia sẻ bất kỳ thông tin nào cho bên thứ ba hoặc mạng lưới quảng cáo.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="backup-restore" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  4. Sao lưu & Trách nhiệm Dữ liệu
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                Vì toàn bộ dữ liệu nằm trên điện thoại, bạn hoàn toàn làm chủ bản sao lưu của mình qua tính năng Xuất/Khôi phục file JSON. Hãy thường xuyên xuất file sao lưu và cất giữ ở nơi an toàn để tránh mất dữ liệu khi đổi hoặc reset máy.
              </Text>
            </View>
          </ScrollView>

          {/* Consent Checkbox for First-Time Entry */}
          {isMandatoryConsent && (
            <TouchableOpacity
              style={[
                styles.checkboxRow,
                {
                  borderColor: isAgreed ? theme.primary : theme.border,
                  backgroundColor: isAgreed ? theme.primary + '12' : theme.surfaceVariant,
                },
              ]}
              onPress={() => setIsAgreed(prev => !prev)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isAgreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={isAgreed ? theme.primary : theme.textTertiary}
              />
              <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
                Tôi đã đọc và đồng ý với{' '}
                <Text style={{ fontWeight: '700', color: theme.primary }}>
                  Chính sách bảo mật & Quyền riêng tư
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Action button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor: isMandatoryConsent
                  ? isAgreed
                    ? theme.primary
                    : theme.border
                  : theme.primary,
                opacity: isMandatoryConsent && !isAgreed ? 0.6 : 1,
              },
            ]}
            onPress={handleConfirm}
            disabled={isMandatoryConsent && !isAgreed}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.confirmBtnText,
                {
                  color:
                    isMandatoryConsent && !isAgreed
                      ? theme.textTertiary
                      : '#FFFFFF',
                },
              ]}
            >
              {isMandatoryConsent ? 'Đồng ý & Tiếp tục vào ứng dụng' : 'Tôi đã hiểu & Đóng'}
            </Text>
          </TouchableOpacity>
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
    maxWidth: 420,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 340,
    marginVertical: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  sectionBody: {
    ...TYPOGRAPHY.bodySmall,
    lineHeight: 20,
    paddingLeft: 28,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginTop: SPACING.sm,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  confirmBtn: {
    marginTop: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
