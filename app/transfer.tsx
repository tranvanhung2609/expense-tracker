import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWalletStore } from '../src/stores/walletStore';
import { useTransactionStore } from '../src/stores/transactionStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import AmountKeypad from '../src/components/AmountKeypad';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { formatVND } from '../src/utils/currency';
import { MaterialIconName, TRANSACTION_TYPES } from '../src/constants/enums';

export default function TransferScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { wallets, refreshBalances } = useWalletStore();
  const { add } = useTransactionStore();
  const { categories } = useCategoryStore();

  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id ?? '');
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id ?? wallets[0]?.id ?? '');
  const [digits, setDigits] = useState('');
  const [selectingFor, setSelectingFor] = useState<'from' | 'to' | null>(null);

  const fromWallet = wallets.find(w => w.id === fromWalletId);
  const toWallet = wallets.find(w => w.id === toWalletId);
  const cleanedDigits = digits.replace(/\D/g, '');
  const amount = parseInt(cleanedDigits || '0', 10);
  const canTransfer = amount > 0 && fromWalletId !== toWalletId && Boolean(fromWallet && toWallet);

  const transferCategory =
    categories.find(
      c =>
        c.name.toLowerCase().includes('chuyển') ||
        c.name.toLowerCase().includes('khác')
    ) ?? categories[0];

  const handleSwap = () => {
    setFromWalletId(toWalletId);
    setToWalletId(fromWalletId);
  };

  const handleTransfer = () => {
    if (!canTransfer || !transferCategory || !fromWallet || !toWallet) return;

    const balance = fromWallet.balance;
    if (amount > balance) {
      Alert.alert(
        'Số dư không đủ',
        `Ví "${fromWallet.name}" chỉ có ${formatVND(balance)}. Không đủ để chuyển ${formatVND(amount)}.`
      );
      return;
    }

    Alert.alert(
      'Xác nhận chuyển tiền',
      `Chuyển ${formatVND(amount)}\ntừ "${fromWallet.name}"\nđến "${toWallet.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chuyển ngay',
          onPress: () => {
            add({
              amount,
              type: TRANSACTION_TYPES.TRANSFER,
              categoryId: transferCategory.id,
              walletId: fromWalletId,
              toWalletId: toWalletId,
              date: new Date().toISOString(),
              note: `Chuyển từ ${fromWallet.name} → ${toWallet.name}`,
            });
            refreshBalances();
            Alert.alert('✅ Thành công', 'Chuyển tiền thành công!', [
              { text: 'Xong', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 8;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.card} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
            paddingTop: topPadding,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Chuyển tiền giữa các ví</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* From → To Interactive Card */}
        <View style={[styles.transferCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Source Wallet (Từ ví) */}
          <TouchableOpacity
            style={styles.walletSelector}
            onPress={() => setSelectingFor('from')}
            activeOpacity={0.7}
          >
            <Text style={[styles.walletSelectorLabel, { color: theme.textTertiary }]}>VÍ NGUỒN (TRỪ TIỀN)</Text>
            <View style={styles.walletRow}>
              <View style={[styles.walletIcon, { backgroundColor: (fromWallet?.color ?? theme.primary) + '18' }]}>
                <MaterialCommunityIcons
                  name={(fromWallet?.icon || 'wallet') as MaterialIconName}
                  size={24}
                  color={fromWallet?.color ?? theme.primary}
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={[styles.walletName, { color: theme.textPrimary }]}>
                  {fromWallet?.name ?? 'Chọn ví nguồn'}
                </Text>
                {fromWallet && (
                  <Text style={[styles.walletBalance, { color: theme.textSecondary }]}>
                    Số dư: <Text style={{ fontWeight: '700' }}>{formatVND(fromWallet.balance)}</Text>
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* Swap Button In Center */}
          <TouchableOpacity
            style={[styles.swapBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            onPress={handleSwap}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="swap-vertical" size={20} color={theme.primary} />
          </TouchableOpacity>

          {/* Destination Wallet (Đến ví) */}
          <TouchableOpacity
            style={[styles.walletSelector, { borderTopWidth: 1, borderTopColor: theme.divider }]}
            onPress={() => setSelectingFor('to')}
            activeOpacity={0.7}
          >
            <Text style={[styles.walletSelectorLabel, { color: theme.textTertiary }]}>VÍ ĐÍCH (CỘNG TIỀN)</Text>
            <View style={styles.walletRow}>
              <View style={[styles.walletIcon, { backgroundColor: (toWallet?.color ?? theme.primary) + '18' }]}>
                <MaterialCommunityIcons
                  name={(toWallet?.icon || 'wallet') as MaterialIconName}
                  size={24}
                  color={toWallet?.color ?? theme.primary}
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={[styles.walletName, { color: theme.textPrimary }]}>
                  {toWallet?.name ?? 'Chọn ví đích'}
                </Text>
                {toWallet && (
                  <Text style={[styles.walletBalance, { color: theme.textSecondary }]}>
                    Số dư: <Text style={{ fontWeight: '700' }}>{formatVND(toWallet.balance)}</Text>
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Wallet Picker Modal / Sheet overlay */}
        {selectingFor !== null && (
          <View style={[styles.walletList, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.walletListTitle, { color: theme.textSecondary }]}>
              {selectingFor === 'from' ? 'CHỌN VÍ NGUỒN' : 'CHỌN VÍ ĐÍCH'}
            </Text>
            {wallets.map(w => {
              const isDisabled =
                (selectingFor === 'from' && w.id === toWalletId) ||
                (selectingFor === 'to' && w.id === fromWalletId);
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletListItem,
                    { backgroundColor: theme.surfaceVariant },
                    isDisabled && styles.walletListItemDisabled,
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    if (selectingFor === 'from') setFromWalletId(w.id);
                    else setToWalletId(w.id);
                    setSelectingFor(null);
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.75}
                >
                  <View style={[styles.walletIcon, { backgroundColor: w.color + '18' }]}>
                    <MaterialCommunityIcons name={w.icon as any} size={20} color={w.color} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text
                      style={[
                        styles.walletName,
                        { color: isDisabled ? theme.textTertiary : theme.textPrimary },
                      ]}
                    >
                      {w.name}
                    </Text>
                    <Text style={[styles.walletBalance, { color: theme.textSecondary }]}>
                      {formatVND(w.balance)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.cancelSelect, { borderTopColor: theme.divider }]}
              onPress={() => setSelectingFor(null)}
            >
              <Text style={[styles.cancelSelectText, { color: theme.expense }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Keypad Card */}
        <View style={[styles.keypadCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AmountKeypad
            digits={digits}
            onDigitsChange={setDigits}
            accentColor={theme.transfer}
            showPresets={true}
          />
        </View>
      </ScrollView>

      {/* Transfer Action Button */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.transferBtn,
            { backgroundColor: canTransfer ? theme.transfer : theme.border },
          ]}
          onPress={handleTransfer}
          disabled={!canTransfer}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={22} color="#FFF" />
          <Text style={styles.transferBtnText}>
            {canTransfer
              ? `Chuyển ${parseInt(digits, 10).toLocaleString('vi-VN')} ₫`
              : 'Chọn ví và nhập số tiền cần chuyển'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: 110, gap: SPACING.md },
  transferCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    position: 'relative',
  },
  walletSelector: { padding: SPACING.md + 2, gap: SPACING.xs },
  walletSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: 16, fontWeight: '700' },
  walletBalance: { fontSize: 13, marginTop: 2 },
  swapBtn: {
    position: 'absolute',
    right: SPACING.lg,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
  },
  walletList: {
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 1,
  },
  walletListTitle: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.6,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  walletListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  walletListItemDisabled: { opacity: 0.35 },
  cancelSelect: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.xs,
    borderTopWidth: 1,
  },
  cancelSelectText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  keypadCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  transferBtnText: { fontSize: 15, color: '#FFF', fontWeight: '700' },
});
