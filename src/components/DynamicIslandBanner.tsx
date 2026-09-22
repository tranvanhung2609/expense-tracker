import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useWalletStore } from '../stores/walletStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatCurrency } from '../utils/currency';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { SUPPORTED_BANKS } from '../services/bankParser';

export default function DynamicIslandBanner() {
  const insets = useSafeAreaInsets();
  const { isDarkMode, currency } = useSettingsStore();
  const { categories } = useCategoryStore();
  const { wallets } = useWalletStore();
  const {
    activeBannerItem,
    confirmPending,
    dismissPending,
    dismissBanner,
  } = usePendingTransactionStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');

  const translateY = useSharedValue(-150);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  // Sync state when active item changes
  useEffect(() => {
    if (activeBannerItem) {
      setSelectedCategoryId(activeBannerItem.suggestedCategoryId || categories[0]?.id || '');
      setSelectedWalletId(wallets[0]?.id || 'wallet_cash');
      setCustomNote(activeBannerItem.note || '');

      // Animate in with smooth spring
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      scale.value = withSpring(1, { damping: 12, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });

      // Auto-hide compact pill after 14 seconds if untouched
      const timer = setTimeout(() => {
        if (!isExpanded) {
          handleDismiss();
        }
      }, 14000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-150, { duration: 200 });
      opacity.value = withTiming(0, { duration: 180 });
      setIsExpanded(false);
    }
  }, [activeBannerItem]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const handleDismiss = () => {
    translateY.value = withTiming(-150, { duration: 220 }, () => {
      runOnJS(dismissBanner)();
    });
    opacity.value = withTiming(0, { duration: 180 });
  };

  const handleQuickConfirm = () => {
    if (!activeBannerItem) return;
    // Tiny bounce feedback
    scale.value = withSpring(1.08, { damping: 8, stiffness: 200 }, () => {
      scale.value = withSpring(0.8, { damping: 12 }, () => {
        runOnJS(confirmPending)(activeBannerItem.id);
      });
    });
    opacity.value = withTiming(0, { duration: 250 });
  };

  const handleFullConfirm = () => {
    if (!activeBannerItem) return;
    confirmPending(activeBannerItem.id, {
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      note: customNote,
    });
    setIsExpanded(false);
  };

  if (!activeBannerItem) return null;

  const bankInfo = SUPPORTED_BANKS.find(b => b.name === activeBannerItem.bankName) || {
    color: COLORS.primary,
    icon: 'bank',
  };

  const currentCategory = categories.find(c => c.id === (isExpanded ? selectedCategoryId : activeBannerItem.suggestedCategoryId)) || {
    name: 'Chi tiêu',
    icon: 'tag',
    color: COLORS.primary,
  };

  const isExpense = activeBannerItem.type === 'EXPENSE';
  const amountColor = isExpense ? '#FF453A' : '#30D158';
  const amountPrefix = isExpense ? '-' : '+';
  const isConfident = activeBannerItem.isConfident ?? true;

  const pillBg = isDarkMode ? '#1E232E' : '#111827';
  const textColor = '#FFFFFF';
  const secondaryTextColor = '#94A3B8';

  const handleQuickPickCategory = (categoryId: string) => {
    if (!activeBannerItem) return;
    scale.value = withSpring(1.08, { damping: 8, stiffness: 200 }, () => {
      scale.value = withSpring(0.8, { damping: 12 }, () => {
        runOnJS(confirmPending)(activeBannerItem.id, { categoryId });
      });
    });
    opacity.value = withTiming(0, { duration: 250 });
  };

  return (
    <>
      {/* Floating Dynamic Island Pill */}
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          { top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20) + 4 },
        ]}
      >
        <Animated.View style={[styles.pill, { backgroundColor: pillBg }, animatedStyle]}>
          <Pressable
            style={styles.pillContent}
            onPress={() => setIsExpanded(true)}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            {/* Bank icon avatar */}
            <View style={[styles.bankAvatar, { backgroundColor: bankInfo.color }]}>
              <MaterialCommunityIcons
                name={(bankInfo.icon as any) || 'bank'}
                size={18}
                color="#FFFFFF"
              />
            </View>

            {/* Info column */}
            <View style={styles.infoCol}>
              <View style={styles.topRow}>
                <Text style={[styles.amountText, { color: amountColor }]} numberOfLines={1}>
                  {amountPrefix}{formatCurrency(activeBannerItem.amount, currency)}
                </Text>
                {isConfident ? (
                  <View style={[styles.categoryTag, { backgroundColor: `${currentCategory.color}25` }]}>
                    <MaterialCommunityIcons
                      name={(currentCategory.icon as any) || 'tag'}
                      size={11}
                      color={currentCategory.color}
                    />
                    <Text style={[styles.categoryTagName, { color: currentCategory.color }]} numberOfLines={1}>
                      {currentCategory.name}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.categoryTag, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <MaterialCommunityIcons name="help-circle-outline" size={11} color="#F59E0B" />
                    <Text style={[styles.categoryTagName, { color: '#F59E0B' }]}>
                      Cần chọn khoản
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.notePreview, { color: secondaryTextColor }]} numberOfLines={1}>
                {activeBannerItem.note || activeBannerItem.bankName}
              </Text>
            </View>

            {/* Action buttons for confident transactions */}
            {isConfident ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.quickConfirmBtn}
                  onPress={handleQuickConfirm}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={handleDismiss}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={handleDismiss}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </Pressable>

          {/* If NOT confident (e.g. VietQR default transfers), show 1-tap quick pick buttons */}
          {!isConfident && (
            <View style={styles.quickPickRow}>
              <TouchableOpacity
                style={[styles.quickPickBtn, { backgroundColor: '#FF6B6B22' }]}
                onPress={() => handleQuickPickCategory('cat_food')}
              >
                <Text style={styles.quickPickEmoji}>🍜</Text>
                <Text style={[styles.quickPickText, { color: '#FF6B6B' }]}>Ăn uống</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickPickBtn, { backgroundColor: '#79554822' }]}
                onPress={() => handleQuickPickCategory('cat_coffee')}
              >
                <Text style={styles.quickPickEmoji}>☕</Text>
                <Text style={[styles.quickPickText, { color: '#BCAAA4' }]}>Cà phê</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickPickBtn, { backgroundColor: '#C471ED22' }]}
                onPress={() => handleQuickPickCategory('cat_shopping')}
              >
                <Text style={styles.quickPickEmoji}>🛒</Text>
                <Text style={[styles.quickPickText, { color: '#C471ED' }]}>Mua sắm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickPickBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setIsExpanded(true)}
              >
                <Text style={[styles.quickPickText, { color: '#94A3B8' }]}>Khác ▾</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Expanded Modal for detailed review / category change */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissOverlay} onPress={() => setIsExpanded(false)} />
          <View style={[styles.modalSheet, { backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface }]}>
            {/* Handle bar */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalBankBadge, { backgroundColor: bankInfo.color }]}>
                  <MaterialCommunityIcons name={(bankInfo.icon as any) || 'bank'} size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary }]}>
                    Phát hiện biến động {activeBannerItem.bankName}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: COLORS.textSecondary }]}>
                    Xác nhận để ghi chép vào sổ chi tiêu
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Amount Banner */}
            <View style={[styles.amountBanner, { backgroundColor: isDarkMode ? COLORS.darkSurfaceVariant : COLORS.surfaceVariant }]}>
              <Text style={[styles.amountLabel, { color: COLORS.textSecondary }]}>
                {isExpense ? 'Số tiền chi' : 'Số tiền nhận'}
              </Text>
              <Text style={[styles.amountBig, { color: amountColor }]}>
                {amountPrefix}{formatCurrency(activeBannerItem.amount, currency)}
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Note / Memo input */}
              <Text style={[styles.fieldLabel, { color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary }]}>
                Nội dung chuyển khoản
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDarkMode ? COLORS.darkSurfaceVariant : COLORS.surfaceVariant,
                    color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary,
                    borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
                  },
                ]}
                value={customNote}
                onChangeText={setCustomNote}
                placeholder="Nhập ghi chú cho khoản chi..."
                placeholderTextColor={COLORS.textTertiary}
              />

              {/* Wallet Selector */}
              <Text style={[styles.fieldLabel, { color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary, marginTop: SPACING.md }]}>
                Ví thanh toán
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
                {wallets.map(w => {
                  const isSelected = w.id === selectedWalletId;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[
                        styles.walletChip,
                        {
                          backgroundColor: isSelected
                            ? COLORS.primary
                            : isDarkMode
                            ? COLORS.darkSurfaceVariant
                            : COLORS.surfaceVariant,
                        },
                      ]}
                      onPress={() => setSelectedWalletId(w.id)}
                    >
                      <MaterialCommunityIcons
                        name={(w.icon as any) || 'wallet'}
                        size={16}
                        color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.walletChipText,
                          { color: isSelected ? '#FFFFFF' : isDarkMode ? COLORS.textInverse : COLORS.textPrimary },
                        ]}
                      >
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Picker */}
              <Text style={[styles.fieldLabel, { color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary, marginTop: SPACING.md }]}>
                Phân loại danh mục
              </Text>
              <View style={styles.categoryGrid}>
                {categories
                  .filter(c => c.type === activeBannerItem.type || c.type === 'BOTH')
                  .map(cat => {
                    const isSelected = cat.id === selectedCategoryId;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryItem,
                          isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}18` },
                          {
                            backgroundColor: isSelected
                              ? `${cat.color}20`
                              : isDarkMode
                              ? COLORS.darkSurfaceVariant
                              : COLORS.surfaceVariant,
                          },
                        ]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                      >
                        <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                          <MaterialCommunityIcons name={(cat.icon as any) || 'tag'} size={16} color="#FFFFFF" />
                        </View>
                        <Text
                          style={[
                            styles.catItemName,
                            { color: isSelected ? cat.color : isDarkMode ? COLORS.textInverse : COLORS.textPrimary },
                            isSelected && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </ScrollView>

            {/* Confirm & Dismiss action bar */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={[styles.modalDismissBtn, { backgroundColor: isDarkMode ? COLORS.darkSurfaceVariant : COLORS.surfaceVariant }]}
                onPress={() => {
                  dismissPending(activeBannerItem.id);
                  setIsExpanded(false);
                }}
              >
                <Text style={[styles.modalDismissText, { color: COLORS.textSecondary }]}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleFullConfirm}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSaveText}>Lưu vào sổ ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  categoryTagName: {
    fontSize: 10,
    fontWeight: '700',
  },
  notePreview: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  quickConfirmBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  quickPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  quickPickEmoji: {
    fontSize: 12,
  },
  quickPickText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissOverlay: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalBankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  amountBanner: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  amountBig: {
    fontSize: 26,
    fontWeight: '800',
  },
  modalScroll: {
    maxHeight: 320,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  walletScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
    gap: 6,
  },
  walletChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    width: '48%',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catItemName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  modalBottomBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  modalDismissBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
