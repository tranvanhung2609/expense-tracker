import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useWalletStore } from '../src/stores/walletStore';
import { SUPPORTED_CURRENCIES, parseCurrency, formatKeypadInput } from '../src/utils/currency';
import { getDatabase } from '../src/db/client';
import PrivacyModal from '../src/components/PrivacyModal';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    tag: 'BƯỚC 1 • GHI CHÉP SIÊU TỐC',
    icon: 'lightning-bolt' as const,
    iconColor: '#F59E0B',
    bgColor: '#0B0F19',
    title: 'Ghi chép\nsiêu tốc 3s',
    subtitle: 'Bàn phím số tích hợp sẵn phím tắt +50K, +100K, +500K.\nChọn danh mục 1 chạm, ghi chú & lưu nhanh\nchỉ trong vòng 3 giây.',
  },
  {
    id: '2',
    tag: 'BƯỚC 2 • ĐA VÍ & CHUYỂN KHOẢN',
    icon: 'wallet-outline' as const,
    iconColor: '#4F46E5',
    bgColor: '#0B0F19',
    title: 'Quản lý đa ví\n& Chuyển tiền',
    subtitle: 'Theo dõi tách bạch Tiền mặt, Ngân hàng, Ví điện tử.\nTính năng Chuyển tiền giúp điều chuyển số dư\nmà không bị tính nhầm là chi tiêu.',
  },
  {
    id: '3',
    tag: 'BƯỚC 3 • HẠN MỨC CHI TIÊU',
    icon: 'target' as const,
    iconColor: '#10B981',
    bgColor: '#0B0F19',
    title: 'Hạn mức\nngân sách tháng',
    subtitle: 'Đặt trần chi tiêu cho Ăn uống, Mua sắm...\nCảnh báo thông minh đổi màu Vàng (80%) và Đỏ (100%)\ngiúp bạn không bao giờ "cháy túi".',
  },
  {
    id: '4',
    tag: 'BƯỚC 4 • BÁO CÁO TÀI CHÍNH',
    icon: 'chart-donut' as const,
    iconColor: '#06B6D4',
    bgColor: '#0B0F19',
    title: 'Báo cáo &\nTiết kiệm ròng',
    subtitle: 'Biểu đồ Donut phân tích cơ cấu chi tiêu.\nTheo dõi chỉ số Thặng dư Tiết kiệm ròng (Thu - Chi)\nđể đánh giá sức khỏe tài chính mỗi kỳ.',
  },
  {
    id: '5',
    tag: 'BƯỚC 5 • BẢO MẬT & SAO LƯU',
    icon: 'shield-check-outline' as const,
    iconColor: '#8B5CF6',
    bgColor: '#0B0F19',
    title: 'Bảo mật tuyệt đối\n& Ngoại tuyến',
    subtitle: '100% dữ liệu lưu an toàn trên máy (Offline-First).\nDễ dàng xuất file Excel CSV và sao lưu JSON\nbất cứ lúc nào.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSetupStep, setIsSetupStep] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Setup Step States
  const { setCurrency, markOnboardingDone, acceptPrivacyPolicy } = useSettingsStore();
  const [selectedCurrency, setSelectedCurrency] = useState('VND');
  const [initialBalance, setInitialBalance] = useState('0');
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSetupStep(true);
    }
  };

  const handleCompleteSetup = async () => {
    // 1. Save Currency
    setCurrency(selectedCurrency);

    // 2. Set Initial Balance for default wallet
    const balanceNum = parseCurrency(initialBalance);
    if (balanceNum > 0) {
      try {
        const db = getDatabase();
        db.runSync('UPDATE wallets SET initial_balance = ? WHERE id = ?', [balanceNum, 'wallet_cash']);
        useWalletStore.getState().load();
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 3. Prompt mandatory Privacy Policy consent before entering the app
    setShowPrivacyConsent(true);
  };

  const handleAcceptPrivacyAndEnter = () => {
    acceptPrivacyPolicy();
    markOnboardingDone();
    setShowPrivacyConsent(false);
    router.replace('/(tabs)');
  };

  const currentSlide = SLIDES[currentIndex];
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 8;

  if (isSetupStep) {
    return (
      <View style={[styles.container, { backgroundColor: '#0B0F19' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <ScrollView
          contentContainerStyle={[
            styles.setupScroll,
            { paddingTop: topInset, paddingBottom: Math.max(insets.bottom, 16) + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.setupHeader}>
            <View style={[styles.setupIconCircle, { backgroundColor: '#4F46E530' }]}>
              <MaterialCommunityIcons name="wallet-outline" size={40} color="#818CF8" />
            </View>
            <Text style={styles.setupTitle}>Thiết lập ví ban đầu</Text>
            <Text style={styles.setupSubtitle}>
              Cá nhân hóa trải nghiệm theo thói quen của bạn
            </Text>
          </View>

          {/* Currency Selection */}
          <View style={styles.setupCard}>
            <Text style={styles.cardLabel}>1. Đơn vị tiền tệ chính</Text>
            <View style={styles.currencyGrid}>
              {SUPPORTED_CURRENCIES.slice(0, 4).map(c => {
                const isSel = selectedCurrency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: isSel ? '#4F46E5' : '#151D30',
                        borderColor: isSel ? '#818CF8' : 'rgba(255,255,255,0.1)',
                      },
                    ]}
                    onPress={() => setSelectedCurrency(c.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.currencySymbol, { color: isSel ? '#FFF' : '#A0A5B5' }]}>
                      {c.symbol}
                    </Text>
                    <Text style={[styles.currencyCode, { color: isSel ? '#FFF' : '#A0A5B5' }]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Initial Balance */}
          <View style={styles.setupCard}>
            <Text style={styles.cardLabel}>2. Số dư ví tiền mặt hiện có</Text>
            <Text style={styles.cardHint}>
              Ước tính số tiền bạn đang có trong ví để bắt đầu theo dõi
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.balanceInput}
                keyboardType="numeric"
                value={formatKeypadInput(initialBalance)}
                onChangeText={txt => {
                  const cleaned = txt.replace(/[^\d]/g, '');
                  setInitialBalance(cleaned || '0');
                }}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Text style={styles.currencySuffix}>
                {SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '₫'}
              </Text>
            </View>
          </View>



          {/* CTA */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: '#4F46E5', width: '100%', marginTop: SPACING.lg }]}
            onPress={handleCompleteSetup}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>🚀  Hoàn tất & Bắt đầu</Text>
          </TouchableOpacity>
        </ScrollView>

        <PrivacyModal
          visible={showPrivacyConsent}
          onClose={() => {}}
          isMandatoryConsent={true}
          onAccept={handleAcceptPrivacyAndEnter}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentSlide.bgColor} />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { marginTop: topInset }]}
        onPress={() => setIsSetupStep(true)}
      >
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Feature Tag */}
            <View style={[styles.slideTagPill, { backgroundColor: item.iconColor + '18', borderColor: item.iconColor + '40' }]}>
              <Text style={[styles.slideTagText, { color: item.iconColor }]}>{item.tag}</Text>
            </View>

            {/* Large icon */}
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '18', borderColor: item.iconColor + '35' }]}>
              <View style={[styles.iconInner, { backgroundColor: item.iconColor + '28' }]}>
                <MaterialCommunityIcons name={item.icon} size={84} color={item.iconColor} />
              </View>
            </View>

            {/* Texts */}
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((slide, idx) => (
          <View
            key={slide.id}
            style={[
              styles.dot,
              currentIndex === idx && [styles.dotActive, { backgroundColor: currentSlide.iconColor }],
            ]}
          />
        ))}
      </View>

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: currentSlide.iconColor }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextBtnText}>
          {currentIndex < SLIDES.length - 1 ? 'Tiếp theo' : 'Tiếp tục thiết lập'}
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
      </TouchableOpacity>

      <View style={{ height: Math.max(insets.bottom, 16) + SPACING.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: SPACING.md,
    marginTop: SPACING.xl,
    marginRight: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  slideTagPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  slideTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  iconInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    marginHorizontal: SPACING.xl,
    minWidth: 240,
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  nextBtnText: {
    ...TYPOGRAPHY.h4,
    color: '#FFFFFF',
  },
  setupScroll: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  setupIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  setupTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  setupSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  setupCard: {
    width: '100%',
    backgroundColor: '#16192E',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardHint: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: SPACING.md,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1120',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  currencySuffix: {
    color: '#9D97FF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
