import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWalletStore } from '../../src/stores/walletStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { WalletWithBalance } from '../../src/repositories/WalletRepository';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { formatVND } from '../../src/utils/currency';
import WalletModal from '../../src/components/WalletModal';

export default function WalletsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { wallets, totalBalance, load, remove } = useWalletStore();
  const { isBalanceHidden } = useSettingsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletWithBalance | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCreate = () => {
    setEditingWallet(null);
    setModalVisible(true);
  };

  const handleEdit = (wallet: WalletWithBalance) => {
    setEditingWallet(wallet);
    setModalVisible(true);
  };

  const handleWalletOptions = (wallet: WalletWithBalance) => {
    Alert.alert(
      wallet.name,
      `Số dư hiện tại: ${formatVND(wallet.balance)}`,
      [
        { text: 'Chuyển tiền từ ví này', onPress: () => router.push('/transfer') },
        { text: 'Chỉnh sửa ví', onPress: () => handleEdit(wallet) },
        {
          text: 'Xóa ví',
          style: 'destructive',
          onPress: () => {
            if (wallets.length <= 1) {
              Alert.alert('Không thể xóa', 'Bạn cần giữ ít nhất 1 ví trong hệ thống.');
              return;
            }
            Alert.alert(
              'Xác nhận xóa ví',
              `Xóa ví "${wallet.name}"? Các giao dịch liên quan vẫn được lưu giữ.`,
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => remove(wallet.id) },
              ]
            );
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 8;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.screenTitle}>Ví & Tài khoản</Text>
            <Text style={styles.walletCount}>{wallets.length} nguồn tiền khả dụng</Text>
          </View>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
            <Text style={styles.addHeaderBtnText}>Thêm ví</Text>
          </TouchableOpacity>
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardTop}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
            <Text style={styles.totalLabel}>TỔNG TÀI SẢN</Text>
          </View>
          <Text style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
            {isBalanceHidden ? '•••••••• ₫' : formatVND(totalBalance)}
          </Text>

          {/* Asset distribution micro bar */}
          {wallets.length > 0 && totalBalance > 0 && (
            <View style={styles.distBarWrapper}>
              {wallets.map(w => {
                const pct = Math.max(Math.round((Math.max(w.balance, 0) / totalBalance) * 100), 2);
                return (
                  <View
                    key={w.id}
                    style={[styles.distBarSegment, { width: `${pct}%`, backgroundColor: w.color }]}
                  />
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Wallet List */}
      <FlatList
        data={wallets}
        keyExtractor={w => w.id}
        contentContainerStyle={[styles.list, { paddingBottom: 90 + insets.bottom }]}
        renderItem={({ item }) => {
          const pctOfTotal = totalBalance > 0 ? Math.round((Math.max(item.balance, 0) / totalBalance) * 100) : 0;
          return (
            <TouchableOpacity
              style={[
                styles.walletCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleWalletOptions(item)}
              activeOpacity={0.8}
            >
              {/* Card Color Bar Indicator */}
              <View style={[styles.cardColorStrip, { backgroundColor: item.color }]} />

              <View style={styles.cardMainContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.walletIconBg, { backgroundColor: item.color + '18' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  </View>

                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.walletSub, { color: theme.textTertiary }]}>
                      Ban đầu: {isBalanceHidden ? '••••••' : formatVND(item.initialBalance)}
                    </Text>
                  </View>

                  {/* Percentage chip */}
                  {pctOfTotal > 0 && (
                    <View style={[styles.pctChip, { backgroundColor: theme.surfaceVariant }]}>
                      <Text style={[styles.pctText, { color: theme.textSecondary }]}>{pctOfTotal}%</Text>
                    </View>
                  )}
                </View>

                {/* Balance & Actions */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={[styles.balanceLabel, { color: theme.textTertiary }]}>Số dư khả dụng</Text>
                    <Text
                      style={[
                        styles.walletBalance,
                        { color: item.balance >= 0 ? theme.textPrimary : theme.expense },
                      ]}
                    >
                      {isBalanceHidden ? '••••••••' : formatVND(item.balance)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.transferQuickBtn, { backgroundColor: theme.surfaceVariant }]}
                    onPress={() => handleWalletOptions(item)}
                  >
                    <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceVariant }]}>
              <MaterialCommunityIcons name="wallet-outline" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Chưa có ví nào</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Tạo ví đầu tiên để bắt đầu ghi nhận và theo dõi số dư của bạn
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreate}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Tạo ví ngay</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Wallet Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary, bottom: 24 + insets.bottom }]}
        onPress={handleCreate}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add / Edit Wallet Modal */}
      <WalletModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingWallet(null);
        }}
        wallet={editingWallet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#0B0F19',
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  walletCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  addHeaderBtnText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: '#151D30',
    borderRadius: RADIUS.xl,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  totalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
  },
  totalAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.8,
    marginTop: 4,
    marginBottom: SPACING.xs,
  },
  distBarWrapper: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  distBarSegment: {
    height: '100%',
    borderRadius: 3,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: 110,
  },
  walletCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
  },
  cardColorStrip: {
    width: 6,
  },
  cardMainContent: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconBg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: 16, fontWeight: '700' },
  walletSub: { fontSize: 12, marginTop: 2 },
  pctChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  pctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    paddingTop: SPACING.xs + 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  transferQuickBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: SPACING.md,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
