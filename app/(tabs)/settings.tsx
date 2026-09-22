import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useWalletStore } from '../../src/stores/walletStore';
import { useCategoryStore } from '../../src/stores/categoryStore';
import { exportTransactionsToCSV } from '../../src/utils/csv';
import { exportDatabaseToJSON, restoreDatabaseFromJSONString } from '../../src/utils/backup';
import { resetDatabase } from '../../src/db/schema';
import {
  checkAppUpdate,
  getAppCurrentVersion,
  ReleaseInfo,
  isAutoCheckEnabled,
  setAutoCheckEnabled,
} from '../../src/services/updateService';
import UpdateModal from '../../src/components/UpdateModal';
import CurrencyPickerModal from '../../src/components/CurrencyPickerModal';
import RestoreModal from '../../src/components/RestoreModal';
import PrivacyModal from '../../src/components/PrivacyModal';
import UserGuideModal from '../../src/components/UserGuideModal';
import { getCurrencyConfig } from '../../src/utils/currency';
import { MaterialIconName } from '../../src/constants/enums';

interface SettingRowProps {
  icon: MaterialIconName;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, iconColor, label, subtitle, onPress, rightElement, danger }: SettingRowProps) {
  const theme = useAppTheme();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? theme.expense : theme.textPrimary }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: theme.textTertiary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement !== undefined ? (
        rightElement
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isDarkMode, isPinEnabled, autoLockTimeout, toggleDarkMode, togglePin, setAutoLockTimeout, resetOnboarding } = useSettingsStore();
  const { transactions, loadAll } = useTransactionStore();
  const { load: loadWallets } = useWalletStore();
  const { load: loadCategories } = useCategoryStore();

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateRelease, setUpdateRelease] = useState<ReleaseInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [autoCheck, setAutoCheck] = useState(() => isAutoCheckEnabled());

  const currentVersion = getAppCurrentVersion();
  const currencyConfig = getCurrencyConfig();

  const getAutoLockLabel = (ms: number) => {
    if (ms === 0) return 'Ngay lập tức';
    if (ms === 30000) return 'Sau 30 giây';
    if (ms === 60000) return 'Sau 1 phút';
    if (ms === 300000) return 'Sau 5 phút';
    return 'Ngay lập tức';
  };

  const handleSelectAutoLock = () => {
    Alert.alert(
      'Thời gian tự động khóa',
      'Chọn khoảng thời gian ứng dụng sẽ tự khóa sau khi bạn chuyển sang ứng dụng khác:',
      [
        { text: 'Ngay lập tức', onPress: () => setAutoLockTimeout(0) },
        { text: 'Sau 30 giây', onPress: () => setAutoLockTimeout(30000) },
        { text: 'Sau 1 phút', onPress: () => setAutoLockTimeout(60000) },
        { text: 'Sau 5 phút', onPress: () => setAutoLockTimeout(300000) },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      Alert.alert('Không có dữ liệu', 'Chưa có giao dịch nào để xuất.');
      return;
    }
    try {
      await exportTransactionsToCSV(transactions);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xuất file. Vui lòng thử lại.');
    }
  };

  const handleExportJSON = async () => {
    const res = await exportDatabaseToJSON();
    if (res.success) {
      Alert.alert('✅ Sao lưu thành công', 'Tệp sao lưu JSON đã được tạo và sẵn sàng lưu trữ hoặc chia sẻ.');
    } else {
      Alert.alert('Lỗi sao lưu', res.error || 'Không thể tạo bản sao lưu.');
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await checkAppUpdate(true);
      setIsCheckingUpdate(false);

      if (result.hasUpdate && result.release) {
        setUpdateRelease(result.release);
        setShowUpdateModal(true);
      } else if (result.error) {
        Alert.alert('Thông báo', result.error);
      } else {
        Alert.alert(
          'Phiên bản mới nhất',
          `Bạn đang sử dụng phiên bản ${currentVersion}, không có bản cập nhật mới nào từ nhà phân phối.`
        );
      }
    } catch (err: any) {
      setIsCheckingUpdate(false);
      Alert.alert('Lỗi', 'Không thể kết nối đến nhà phân phối.');
    }
  };

  const handleToggleAutoCheck = (value: boolean) => {
    setAutoCheck(value);
    setAutoCheckEnabled(value);
  };

  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Không hỗ trợ',
          'Thiết bị không có cảm biến vân tay/khuôn mặt hoặc chưa đăng ký xác thực sinh trắc học.'
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để bật bảo mật',
        fallbackLabel: 'Dùng mã PIN',
      });

      if (result.success) {
        togglePin(true);
        Alert.alert('✅ Đã bật', 'Bảo mật sinh trắc học đã được kích hoạt.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực sinh trắc học không thành công.';
      Alert.alert('Lỗi xác thực', msg);
    }
  };

  const handlePinToggle = async (value: boolean) => {
    if (value) {
      await handleBiometric();
    } else {
      Alert.alert(
        'Tắt bảo mật',
        'Bạn có chắc muốn tắt bảo mật sinh trắc học?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Tắt', style: 'destructive', onPress: () => togglePin(false) },
        ]
      );
    }
  };

  const handleResetData = () => {
    Alert.alert(
      '⚠️ Xóa toàn bộ dữ liệu',
      'Toàn bộ giao dịch, hạn mức và ví tuỳ chỉnh sẽ bị xoá vĩnh viễn và khôi phục về mặc định. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => {
            resetDatabase();
            loadAll();
            loadWallets();
            loadCategories();
            Alert.alert('Thành công', 'Dữ liệu đã được đặt lại về trạng thái ban đầu.');
          },
        },
      ]
    );
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 12;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding, paddingBottom: 90 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Cài đặt</Text>

        {/* Security */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Bảo mật</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="fingerprint"
            iconColor={theme.primary}
            label="Xác thực sinh trắc học"
            subtitle={isPinEnabled ? 'Đang bật — Khóa app khi thoát' : 'Dùng vân tay / Face ID khi mở app'}
            rightElement={
              <Switch
                value={isPinEnabled}
                onValueChange={handlePinToggle}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={isPinEnabled ? theme.primary : '#FFF'}
              />
            }
          />
          {isPinEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
              <SettingRow
                icon="timer-lock-outline"
                iconColor="#56CCF2"
                label="Thời gian tự động khóa"
                subtitle={`Đang chọn: ${getAutoLockLabel(autoLockTimeout)}`}
                onPress={handleSelectAutoLock}
              />
            </>
          )}
        </View>

        {/* Quản lý */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Quản lý dữ liệu</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="shape"
            iconColor="#C471ED"
            label="Danh mục chi tiêu"
            subtitle="Thêm, chỉnh sửa danh mục phân loại"
            onPress={() => router.push('/(tabs)/categories')}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="target"
            iconColor={theme.warning}
            label="Hạn mức chi tiêu"
            subtitle="Đặt ngân sách theo danh mục"
            onPress={() => router.push('/(tabs)/budget')}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="swap-horizontal"
            iconColor={theme.transfer}
            label="Chuyển tiền giữa ví"
            subtitle="Ghi nhận chuyển khoản giữa các ví"
            onPress={() => router.push('/transfer')}
          />
        </View>

        {/* Giao diện */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Giao diện</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
            iconColor={isDarkMode ? '#9D97FF' : '#FFA940'}
            label="Chế độ tối (Dark Mode)"
            subtitle={isDarkMode ? 'Đang bật giao diện nền tối' : 'Đang bật giao diện nền sáng'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={isDarkMode ? theme.primary : '#FFF'}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="currency-usd"
            iconColor="#27AE60"
            label="Đơn vị tiền tệ"
            subtitle={`${currencyConfig.name} (${currencyConfig.symbol})`}
            onPress={() => setShowCurrencyModal(true)}
          />
        </View>

        {/* Dữ liệu & Sao lưu */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Sao lưu & Lưu trữ</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="cloud-upload-outline"
            iconColor={theme.primary}
            label="Sao lưu toàn bộ (JSON)"
            subtitle="Lưu trữ toàn bộ ví, danh mục, giao dịch & hạn mức"
            onPress={handleExportJSON}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="cloud-download-outline"
            iconColor="#2D9CDB"
            label="Khôi phục dữ liệu (JSON)"
            subtitle="Nạp lại dữ liệu từ tệp sao lưu hoặc dán JSON"
            onPress={() => setShowRestoreModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="file-excel-outline"
            iconColor={theme.income}
            label="Xuất dữ liệu bảng tính CSV"
            subtitle={`${transactions.length} giao dịch sẵn sàng xuất`}
            onPress={handleExportCSV}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="delete-sweep-outline"
            iconColor={theme.expense}
            label="Xoá toàn bộ dữ liệu"
            subtitle="Xóa giao dịch & khôi phục mặc định"
            danger
            onPress={handleResetData}
          />
        </View>

        {/* Cập nhật phiên bản từ nhà phân phối */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Cập nhật phiên bản</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="cloud-sync-outline"
            iconColor={theme.primary}
            label="Kiểm tra bản cập nhật"
            subtitle={`Phiên bản hiện tại: v${currentVersion}`}
            onPress={handleCheckUpdate}
            rightElement={
              isCheckingUpdate ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : undefined
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="update"
            iconColor="#56CCF2"
            label="Tự động kiểm tra bản cập nhật"
            subtitle="Thông báo khi nhà phân phối có bản mới"
            rightElement={
              <Switch
                value={autoCheck}
                onValueChange={handleToggleAutoCheck}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={autoCheck ? theme.primary : '#FFF'}
              />
            }
          />
        </View>

        {/* Hướng dẫn & Trợ giúp */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Hướng dẫn & Trợ giúp</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="book-open-page-variant-outline"
            iconColor={theme.primary}
            label="Cẩm nang hướng dẫn & Mẹo tài chính"
            subtitle="Xem lại mẹo ghi chép, quản lý ví, hạn mức & báo cáo"
            onPress={() => setShowGuideModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="presentation-play"
            iconColor="#F59E0B"
            label="Xem lại màn hình chào mừng (Onboarding)"
            subtitle="Chạy lại tour 5 bước giới thiệu tính năng khi mở app"
            onPress={() => {
              resetOnboarding();
              router.push('/onboarding');
            }}
          />
        </View>

        {/* Về ứng dụng */}
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Thông tin</Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="shield-check-outline"
            iconColor={theme.income}
            label="Chế độ hoạt động"
            subtitle="100% Ngoại tuyến (Offline-First, bảo mật tuyệt đối)"
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="cellphone-check"
            iconColor={theme.primary}
            label="Tương thích thiết bị"
            subtitle="Dynamic Island, Tai thỏ, Giọt nước & Chấm ruồi"
          />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="shield-account-outline"
            iconColor="#27AE60"
            label="Chính sách quyền riêng tư"
            subtitle="Xem cam kết bảo mật & tiêu chuẩn Offline-First"
            onPress={() => setShowPrivacyModal(true)}
          />
        </View>

        <Text style={[styles.footer, { color: theme.textTertiary }]}>
          💜 Expense Tracker Mobile • v{currentVersion}{'\n'}Quản lý chi tiêu thông minh & an toàn
        </Text>
      </ScrollView>

      {/* User Guide Modal */}
      <UserGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        release={updateRelease}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* Currency Modal */}
      <CurrencyPickerModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />

      {/* Restore Modal */}
      <RestoreModal
        visible={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onSuccess={() => {
          loadAll();
          loadWallets();
          loadCategories();
        }}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: 120 },
  screenTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.md, letterSpacing: -0.5 },
  groupLabel: {
    ...TYPOGRAPHY.label,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs + 2,
    marginTop: SPACING.md,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { ...TYPOGRAPHY.body, fontWeight: '600' },
  rowSubtitle: { ...TYPOGRAPHY.caption, marginTop: 2 },
  divider: { height: 1, marginLeft: 62 },
  footer: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 20,
  },
});
