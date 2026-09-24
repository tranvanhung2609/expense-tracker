import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS } from '../constants/theme';
import {
  getSepayToken,
  setSepayToken,
  isSepayConfigured,
  isSepayAutoSyncEnabled,
  setSepayAutoSync,
  getSepayLastSyncedAt,
  testSepayConnection,
  syncSepayTransactions,
  processSepayWebhookPayload,
  SAMPLE_SEPAY_WEBHOOK,
} from '../services/sepayService';
import { getExpoPushToken } from '../services/systemNotificationService';

interface SepayConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SepayConnectModal({
  visible,
  onClose,
  onSuccess,
}: SepayConnectModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'api' | 'webhook'>('api');
  const [tokenInput, setTokenInput] = useState('');
  const [isTokenHidden, setIsTokenHidden] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Webhook JSON test input
  const [webhookJsonInput, setWebhookJsonInput] = useState(
    JSON.stringify(SAMPLE_SEPAY_WEBHOOK, null, 2)
  );

  useEffect(() => {
    if (visible) {
      const currentToken = getSepayToken() || '';
      setTokenInput(currentToken);
      setConfigured(isSepayConfigured());
      setAutoSync(isSepayAutoSyncEnabled());
      setLastSynced(getSepayLastSyncedAt());

      getExpoPushToken().then((tok) => {
        if (tok) setPushToken(tok);
      });
    }
  }, [visible]);

  const handleCopyPushToken = async () => {
    if (!pushToken) {
      Alert.alert('Chưa có mã', 'Đang tạo Push Token cho thiết bị, vui lòng thử lại sau vài giây.');
      return;
    }
    await Clipboard.setStringAsync(pushToken);
    Alert.alert('Đã sao chép', 'Mã Push Token của máy đã được sao chép vào bộ nhớ tạm.');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().length > 0) {
        setTokenInput(text.trim());
      } else {
        Alert.alert('Bộ nhớ tạm trống', 'Vui lòng sao chép API Token từ SePay trước.');
      }
    } catch {
      // fallback
    }
  };

  const handleOpenSepayWebsite = () => {
    Linking.openURL('https://my.sepay.vn/userapi').catch(() => {
      Linking.openURL('https://sepay.vn');
    });
  };

  const handleSaveAndTest = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập SePay API Token.');
      return;
    }

    setIsTesting(true);
    const result = await testSepayConnection(trimmed);
    setIsTesting(false);

    if (result.success) {
      setSepayToken(trimmed);
      setConfigured(true);
      Alert.alert('✅ Kết nối thành công', result.message, [
        {
          text: 'Đồng bộ ngay',
          onPress: () => handleSyncNow(),
        },
        { text: 'Đóng', style: 'cancel' },
      ]);
      onSuccess?.();
    } else {
      Alert.alert('❌ Kết nối thất bại', result.message);
    }
  };

  const handleSyncNow = async () => {
    if (!isSepayConfigured() && !tokenInput.trim()) {
      Alert.alert('Chưa có Token', 'Vui lòng nhập và lưu API Token trước khi đồng bộ.');
      return;
    }

    setIsSyncing(true);
    const result = await syncSepayTransactions();
    setIsSyncing(false);

    setLastSynced(getSepayLastSyncedAt());

    if (result.success) {
      Alert.alert('Kết quả đồng bộ SePay', result.message);
      if (result.syncedCount > 0) {
        onClose(); // Close modal so user can immediately see Dynamic Island Banner!
      }
    } else {
      Alert.alert('Đồng bộ thất bại', result.message);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Xác nhận ngắt kết nối',
      'Bạn có chắc chắn muốn xóa API Token SePay khỏi thiết bị?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: () => {
            setSepayToken(null);
            setTokenInput('');
            setConfigured(false);
            Alert.alert('Đã ngắt kết nối', 'Đã xóa API Token SePay thành công.');
            onSuccess?.();
          },
        },
      ]
    );
  };

  const handleToggleAutoSync = (val: boolean) => {
    setAutoSync(val);
    setSepayAutoSync(val);
  };

  const handleTestWebhookSample = () => {
    // Generate fresh ID so it passes deduplication
    const freshSample = {
      ...SAMPLE_SEPAY_WEBHOOK,
      id: 'SEPAY_TEST_' + Date.now().toString().slice(-6),
      referenceCode: 'VCB.' + Date.now().toString().slice(-8),
      transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    const result = processSepayWebhookPayload(freshSample);
    if (result.success && result.item) {
      onClose(); // Đóng modal để thanh Dynamic Island Banner lập tức trượt xuống và tương tác trực tiếp!
    } else {
      Alert.alert('Lỗi Webhook', result.reason || 'Không thể xử lý payload.');
    }
  };

  const handleTestCustomWebhookJson = () => {
    try {
      const parsed = JSON.parse(webhookJsonInput);
      const result = processSepayWebhookPayload(parsed);
      if (result.success && result.item) {
        onClose();
        Alert.alert(
          '⚡ Webhook Thành Công!',
          `Giao dịch ${result.item.bankName}: ${result.item.amount.toLocaleString()} đ đã được ghi nhận vào hàng đợi!`
        );
      } else {
        Alert.alert('Khử trùng lặp hoặc lỗi', result.reason || 'Dữ liệu không tạo được giao dịch mới.');
      }
    } catch {
      Alert.alert('Lỗi định dạng JSON', 'Chuỗi bạn nhập không phải là JSON hợp lệ.');
    }
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
              <MaterialCommunityIcons name="bank-transfer" size={24} color="#3B82F6" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Kết Nối Ngân Hàng SePay
              </Text>
              <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                Tự động đồng bộ số dư Vietcombank, MB, Techcombank...
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: theme.surfaceVariant }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'api' && [styles.tabItemActive, { backgroundColor: theme.card }],
              ]}
              onPress={() => setActiveTab('api')}
            >
              <MaterialCommunityIcons
                name="key-variant"
                size={16}
                color={activeTab === 'api' ? theme.primary : theme.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'api' ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                API Token (Tự động)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'webhook' && [styles.tabItemActive, { backgroundColor: theme.card }],
              ]}
              onPress={() => setActiveTab('webhook')}
            >
              <MaterialCommunityIcons
                name="webhook"
                size={16}
                color={activeTab === 'webhook' ? '#10B981' : theme.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'webhook' ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                SePay Webhook
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'api' ? (
              <>
                {/* Status Card */}
                <View
                  style={[
                    styles.statusCard,
                    {
                      backgroundColor: configured ? '#10B98115' : theme.surfaceVariant,
                      borderColor: configured ? '#10B98150' : theme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={configured ? 'check-decagram' : 'information-outline'}
                    size={22}
                    color={configured ? '#10B981' : theme.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.statusTitle,
                        { color: configured ? '#10B981' : theme.textPrimary },
                      ]}
                    >
                      {configured ? 'Đã kết nối tài khoản SePay' : 'Chưa cấu hình SePay API Token'}
                    </Text>
                    <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
                      {configured
                        ? lastSynced
                          ? `Lần đồng bộ gần nhất: ${new Date(lastSynced).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                          : 'Sẵn sàng tự động nhận diện giao dịch ngân hàng'
                        : 'Nhập API Token bên dưới để đồng bộ biến động số dư tự động'}
                    </Text>
                  </View>
                </View>

                {/* Token Input Section */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  SEPAY API TOKEN
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="Dán mã API Token từ my.sepay.vn"
                    placeholderTextColor={theme.textTertiary}
                    value={tokenInput}
                    onChangeText={setTokenInput}
                    secureTextEntry={isTokenHidden}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setIsTokenHidden(!isTokenHidden)}
                    style={styles.inputActionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name={isTokenHidden ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePasteFromClipboard}
                    style={[styles.pasteBtn, { backgroundColor: theme.primary + '20' }]}
                  >
                    <MaterialCommunityIcons name="content-paste" size={14} color={theme.primary} />
                    <Text style={[styles.pasteBtnText, { color: theme.primary }]}>Dán</Text>
                  </TouchableOpacity>
                </View>

                {/* Auto sync switch */}
                <View style={[styles.switchRow, { backgroundColor: theme.surfaceVariant }]}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>
                      Tự động đồng bộ định kỳ (SePay API)
                    </Text>
                    <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                      Tự động kéo dữ liệu khi mở app và chạy ngầm (15-30 phút/lần). Muốn nhận thông báo Realtime tức thì 1 giây khi đóng app, xem tab Webhook.
                    </Text>
                  </View>
                  <Switch
                    value={autoSync}
                    onValueChange={handleToggleAutoSync}
                    trackColor={{ false: theme.border, true: '#10B98180' }}
                    thumbColor={autoSync ? '#10B981' : '#FFF'}
                  />
                </View>

                {/* Primary Action Buttons */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveAndTest}
                    disabled={isTesting}
                    activeOpacity={0.8}
                  >
                    {isTesting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Kiểm tra & Lưu kết nối</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {configured && (
                    <TouchableOpacity
                      style={[styles.syncBtn, { backgroundColor: '#10B981' }]}
                      onPress={handleSyncNow}
                      disabled={isSyncing}
                      activeOpacity={0.8}
                    >
                      {isSyncing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="sync" size={18} color="#FFFFFF" />
                          <Text style={styles.syncBtnText}>Đồng bộ giao dịch ngay</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* 3 Bước lấy Token */}
                <View style={[styles.guideCard, { backgroundColor: theme.surfaceVariant }]}>
                  <View style={styles.guideHeader}>
                    <MaterialCommunityIcons name="book-open-outline" size={18} color="#3B82F6" />
                    <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>
                      3 BƯỚC LẤY SEPAY TOKEN MIỄN PHÍ:
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={[styles.stepNum, { backgroundColor: '#3B82F6' }]}>1</Text>
                    <Text style={[styles.stepText, { color: theme.textPrimary }]}>
                      Đăng ký tài khoản miễn phí tại <Text style={{ fontWeight: '700', color: theme.primary }}>my.sepay.vn</Text>.
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={[styles.stepNum, { backgroundColor: '#8B5CF6' }]}>2</Text>
                    <Text style={[styles.stepText, { color: theme.textPrimary }]}>
                      Vào mục <Text style={{ fontWeight: '700' }}>Tài khoản ngân hàng</Text> ➔ Thêm tài khoản ngân hàng của bạn (VCB, MB, Techcombank, TPBank, ACB...).
                    </Text>
                  </View>

                  <View style={styles.stepItem}>
                    <Text style={[styles.stepNum, { backgroundColor: '#10B981' }]}>3</Text>
                    <Text style={[styles.stepText, { color: theme.textPrimary }]}>
                      Vào mục <Text style={{ fontWeight: '700' }}>Tích hợp web / API</Text> ➔ Bấm <Text style={{ fontWeight: '700' }}>Tạo API Key</Text> và dán vào ô trên.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.openWebBtn, { borderColor: theme.border }]}
                    onPress={handleOpenSepayWebsite}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={15} color={theme.primary} />
                    <Text style={[styles.openWebText, { color: theme.primary }]}>
                      Mở trang web my.sepay.vn
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Realtime Webhook Info */}
                <View
                  style={[
                    styles.guideCard,
                    { backgroundColor: theme.surfaceVariant, borderColor: '#10B98150', borderWidth: 1 },
                  ]}
                >
                  <View style={styles.guideHeader}>
                    <MaterialCommunityIcons name="lightning-bolt" size={20} color="#10B981" />
                    <Text style={[styles.guideTitle, { color: '#10B981', fontSize: 13 }]}>
                      NHẬN THÔNG BÁO TỨC THÌ KHI ĐÓNG APP (REALTIME 1-2S)
                    </Text>
                  </View>
                  <Text style={[styles.stepText, { color: theme.textSecondary, marginBottom: 8 }]}>
                    Khi bạn đóng ứng dụng hoàn toàn hoặc khóa màn hình, SePay Webhook kết hợp với Push Notification sẽ gửi cảnh báo "Ting ting" đến điện thoại ngay trong 1-2 giây sau khi tài khoản ngân hàng có biến động!
                  </Text>
                  <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                    • Chạm vào thông báo trên màn hình khóa ➔ App mở ra và tự động ghi chép.{'\n'}
                    • Thanh <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Dynamic Island</Text> xuất hiện tức thì với danh mục đề xuất thông minh!
                  </Text>
                </View>

                {/* Device Push Token Section */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 8 }]}>
                  MÃ PUSH TOKEN CỦA THIẾT BỊ NÀY (ĐỂ NHẬN TIN REALTIME)
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, fontSize: 12 }]}
                    value={pushToken || 'Đang tạo mã định danh thiết bị...'}
                    editable={false}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    onPress={handleCopyPushToken}
                    style={[styles.pasteBtn, { backgroundColor: '#10B98125' }]}
                  >
                    <MaterialCommunityIcons name="content-copy" size={14} color="#10B981" />
                    <Text style={[styles.pasteBtnText, { color: '#10B981' }]}>Sao chép</Text>
                  </TouchableOpacity>
                </View>

                {/* 1-Touch Webhook Sample Test */}
                <TouchableOpacity
                  style={[styles.testCard, { backgroundColor: '#10B98115', borderColor: '#10B98150', marginTop: 12 }]}
                  onPress={handleTestWebhookSample}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="play-circle" size={24} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.testCardTitle, { color: '#10B981' }]}>
                      Bắn Thử Nghiệm Giao Dịch SePay Mẫu
                    </Text>
                    <Text style={[styles.testCardDesc, { color: theme.textSecondary }]}>
                      Tạo ngay 1 giao dịch mẫu (VCB -65,000 đ) kiểm tra hiệu ứng Dynamic Island
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Custom Webhook JSON Payload */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 4 }]}>
                  JSON PAYLOAD SEPAY WEBHOOK
                </Text>
                <View
                  style={[
                    styles.jsonInputContainer,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.jsonInput, { color: theme.textPrimary }]}
                    value={webhookJsonInput}
                    onChangeText={setWebhookJsonInput}
                    multiline
                    numberOfLines={8}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#10B981', marginTop: 8 }]}
                  onPress={handleTestCustomWebhookJson}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="send-check" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Phân Tích & Nạp Webhook Payload</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Nút ngắt kết nối */}
            {configured && (
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={handleDisconnect}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="link-off" size={16} color="#EF4444" />
                <Text style={styles.disconnectText}>Ngắt kết nối SePay</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeBottomBtn, { borderColor: theme.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBottomBtnText, { color: theme.textSecondary }]}>Đóng</Text>
          </TouchableOpacity>
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
    maxHeight: '94%',
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    maxHeight: 520,
    marginVertical: SPACING.xs,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 13,
  },
  inputActionBtn: {
    padding: 6,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginLeft: 4,
  },
  pasteBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  switchDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: SPACING.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  guideCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  openWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  openWebText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  testCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  testCardDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  jsonInputContainer: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 8,
    marginBottom: SPACING.xs,
  },
  jsonInput: {
    fontFamily: 'monospace',
    fontSize: 11,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  disconnectText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '600',
  },
  closeBottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
  },
  closeBottomBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
