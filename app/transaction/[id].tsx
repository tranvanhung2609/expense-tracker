import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionRepository, TransactionWithDetails } from '../../src/repositories/TransactionRepository';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useWalletStore } from '../../src/stores/walletStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { formatVND } from '../../src/utils/currency';
import { formatDateShort, formatTime } from '../../src/utils/date';
import EditTransactionModal from '../../src/components/EditTransactionModal';

const txRepo = new TransactionRepository();

export default function TransactionDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { remove } = useTransactionStore();
  const { refreshBalances } = useWalletStore();

  const [currentTx, setCurrentTx] = useState<TransactionWithDetails | null>(
    () => (id ? (txRepo.getById(id) as TransactionWithDetails | null) : null)
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      setCurrentTx(txRepo.getById(id) as TransactionWithDetails | null);
    }
  }, [id]);

  const tx = currentTx;

  const headerTopPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 8;

  if (!tx) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: headerTopPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: SPACING.md }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ padding: SPACING.md, color: theme.textSecondary }}>
          Không tìm thấy giao dịch hoặc đã bị xóa.
        </Text>
      </View>
    );
  }

  const isExpense = tx.type === 'EXPENSE';
  const isTransfer = tx.type === 'TRANSFER';
  const accentColor = isTransfer ? theme.transfer : isExpense ? theme.expense : theme.income;
  const typeLabel = isTransfer ? 'Chuyển khoản' : isExpense ? 'Chi tiêu' : 'Thu nhập';
  const amountPrefix = isExpense ? '-' : isTransfer ? '↕' : '+';

  const handleDelete = () => {
    Alert.alert(
      'Xóa giao dịch',
      'Bạn có chắc muốn xóa giao dịch này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            remove(id);
            refreshBalances();
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={accentColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: accentColor, paddingTop: headerTopPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + SPACING.lg },
        ]}
      >
        {/* Amount card */}
        <View style={[styles.amountCard, { backgroundColor: accentColor }]}>
          <View style={[styles.categoryIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <MaterialCommunityIcons name={(tx.categoryIcon ?? 'cash') as any} size={36} color="#FFF" />
          </View>
          <Text style={styles.categoryName}>{tx.categoryName}</Text>
          <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
            {amountPrefix}{formatVND(tx.amount)}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <DetailRow icon="calendar" label="Ngày" value={formatDateShort(tx.date)} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <DetailRow icon="clock-outline" label="Giờ" value={formatTime(tx.date)} theme={theme} />
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <DetailRow icon="wallet-outline" label="Ví" value={tx.walletName} theme={theme} />
          {tx.note ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
              <DetailRow icon="note-text-outline" label="Ghi chú" value={tx.note} theme={theme} />
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditTransactionModal
        visible={isEditing}
        transaction={currentTx}
        onClose={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false);
          const updated = txRepo.getById(id);
          setCurrentTx(updated as TransactionWithDetails);
        }}
      />
    </View>
  );
}

function DetailRow({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.textSecondary} />
      </View>
      <Text style={[rowStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm,
  },
  iconWrap: { width: 28 },
  label: { flex: 1, ...TYPOGRAPHY.body },
  value: { ...TYPOGRAPHY.body, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 8,
    paddingBottom: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: '#FFF', fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  amountCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryName: { ...TYPOGRAPHY.h3, color: 'rgba(255,255,255,0.9)' },
  amountText: { ...TYPOGRAPHY.amountLarge, color: '#FFF', marginTop: 4 },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  typeBadgeText: { ...TYPOGRAPHY.bodySmall, color: '#FFF', fontWeight: '700' },
  detailCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  divider: {
    height: 1,
    marginLeft: 36,
  },
});
