import React, { useState, useCallback, useMemo, useDeferredValue } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useWalletStore } from '../../src/stores/walletStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { usePendingTransactionStore } from '../../src/stores/pendingTransactionStore';
import TransactionItem from '../../src/components/TransactionItem';
import QuickAddModal from '../../src/components/QuickAddModal';
import NotificationModal from '../../src/components/NotificationModal';
import PendingTransactionsCard from '../../src/components/PendingTransactionsCard';
import PrivacyModal from '../../src/components/PrivacyModal';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { formatVND, formatCompact } from '../../src/utils/currency';
import { groupTransactionsByDate, formatDateHeader } from '../../src/utils/date';
import { TransactionWithDetails } from '../../src/repositories/TransactionRepository';
import { startOfMonth, endOfMonth } from 'date-fns';
import { isSepayConfigured, syncSepayTransactions } from '../../src/services/sepayService';

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { transactions, loadAll } = useTransactionStore();
  const { totalBalance, refreshBalances } = useWalletStore();
  const { unreadCount, load: loadNotifs } = useNotificationStore();
  const { isBalanceHidden, toggleBalanceHidden, hasAcceptedPrivacyPolicy, acceptPrivacyPolicy, isOnboardingDone } = useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMandatoryPrivacy, setShowMandatoryPrivacy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      loadAll();
      refreshBalances();
      loadNotifs();
      usePendingTransactionStore.getState().loadPending();
      if (isSepayConfigured()) {
        await syncSepayTransactions().catch(() => {});
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAll, refreshBalances, loadNotifs]);

  // Check mandatory privacy consent after onboarding
  React.useEffect(() => {
    if (isOnboardingDone() && !hasAcceptedPrivacyPolicy) {
      setShowMandatoryPrivacy(true);
    }
  }, [hasAcceptedPrivacyPolicy]);

  // Focus effect to load fresh data
  useFocusEffect(
    useCallback(() => {
      loadAll();
      refreshBalances();
      loadNotifs();
      usePendingTransactionStore.getState().loadPending();
      useNotificationStore.getState().checkPendingTransactionsAlert();
    }, [loadAll, refreshBalances, loadNotifs])
  );

  // Filtered transactions based on search and type chip
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (activeFilter !== 'ALL' && t.type !== activeFilter) {
        return false;
      }
      if (deferredSearchQuery.trim()) {
        const query = deferredSearchQuery.toLowerCase().trim();
        const matchNote = t.note?.toLowerCase().includes(query) ?? false;
        const matchCategory = t.categoryName?.toLowerCase().includes(query) ?? false;
        const matchWallet = t.walletName?.toLowerCase().includes(query) ?? false;
        return matchNote || matchCategory || matchWallet;
      }
      return true;
    });
  }, [transactions, activeFilter, deferredSearchQuery]);

  // Grouped by date
  const grouped = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Current month stats
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now).toISOString();
    const end = endOfMonth(now).toISOString();

    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      if (t.date >= start && t.date <= end) {
        if (t.type === 'INCOME') inc += t.amount;
        if (t.type === 'EXPENSE') exp += t.amount;
      }
    }
    return { monthlyIncome: inc, monthlyExpense: exp };
  }, [transactions]);

  const sections = useMemo(() => {
    return grouped.map(g => ({
      title: g.dateKey,
      data: g.data,
      dayTotal: g.data.reduce((sum, t) => {
        if (t.type === 'INCOME') return sum + t.amount;
        if (t.type === 'EXPENSE') return sum - t.amount;
        return sum;
      }, 0),
    }));
  }, [grouped]);

  const handleTap = (item: TransactionWithDetails) => {
    router.push(`/transaction/${item.id}`);
  };

  const filterChips: { type: FilterType; label: string; icon: string }[] = [
    { type: 'ALL', label: 'Tất cả', icon: 'format-list-bulleted' },
    { type: 'EXPENSE', label: 'Chi tiêu', icon: 'arrow-up-circle' },
    { type: 'INCOME', label: 'Thu nhập', icon: 'arrow-down-circle' },
    { type: 'TRANSFER', label: 'Chuyển tiền', icon: 'swap-horizontal' },
  ];

  const headerTopPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 6;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.headerBackground}
      />

      {/* Fintech Banking Hero Card */}
      <View
        style={[
          styles.heroWrapper,
          {
            paddingTop: headerTopPadding,
            backgroundColor: theme.headerBackground,
            borderBottomColor: theme.isDark ? 'transparent' : '#CBD5E1',
            borderBottomWidth: theme.isDark ? 0 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.headerCardBackground,
              borderColor: theme.headerCardBorder,
              shadowOpacity: theme.isDark ? 0.3 : 0.08,
              elevation: 4,
            },
          ]}
        >
          {/* Top Row: Label + Eye Mask + Notification */}
          <View style={styles.cardHeaderRow}>
            <TouchableOpacity
              style={styles.balanceHeaderLabel}
              onPress={toggleBalanceHidden}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
              <Text
                style={[
                  styles.cardHeaderTitle,
                  { color: theme.isDark ? 'rgba(255,255,255,0.7)' : '#64748B' },
                ]}
              >
                TỔNG SỐ DƯ KHẢ DỤNG
              </Text>
              <MaterialCommunityIcons
                name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={theme.isDark ? 'rgba(255,255,255,0.7)' : '#94A3B8'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.notifBtn,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.1)'
                    : '#FFFFFF',
                  borderColor: theme.isDark ? 'transparent' : '#CBD5E1',
                  borderWidth: 1,
                },
              ]}
              onPress={() => setShowNotifModal(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={theme.isDark ? '#FFF' : '#1E293B'}
              />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance Big Figure */}
          <Text
            style={[styles.balanceAmount, { color: theme.isDark ? '#FFF' : '#0F172A' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isBalanceHidden ? '•••••••• ₫' : formatVND(totalBalance)}
          </Text>

          {/* Monthly Cashflow Pill (Income & Expense) */}
          <View
            style={[
              styles.monthCashflow,
              {
                backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#F8FAFC',
                borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.cashflowItem}>
              <View style={[styles.cashflowIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                <MaterialCommunityIcons name="arrow-down-bold" size={13} color="#10B981" />
              </View>
              <View>
                <Text
                  style={[
                    styles.cashflowLabel,
                    { color: theme.isDark ? 'rgba(255,255,255,0.6)' : theme.textSecondary },
                  ]}
                >
                  Thu tháng này
                </Text>
                <Text style={[styles.cashflowValue, { color: '#10B981' }]}>
                  {isBalanceHidden ? '••••••' : `+${formatCompact(monthlyIncome)}`}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.cashflowDivider,
                {
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : theme.divider,
                },
              ]}
            />

            <View style={styles.cashflowItem}>
              <View style={[styles.cashflowIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.18)' }]}>
                <MaterialCommunityIcons name="arrow-up-bold" size={13} color="#F43F5E" />
              </View>
              <View>
                <Text
                  style={[
                    styles.cashflowLabel,
                    { color: theme.isDark ? 'rgba(255,255,255,0.6)' : theme.textSecondary },
                  ]}
                >
                  Chi tháng này
                </Text>
                <Text style={[styles.cashflowValue, { color: '#F43F5E' }]}>
                  {isBalanceHidden ? '••••••' : `-${formatCompact(monthlyExpense)}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Banking Quick Actions Bar */}
        <View style={styles.quickActionBar}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { color: theme.isDark ? 'rgba(255,255,255,0.85)' : theme.textPrimary },
              ]}
            >
              Ghi chép
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/transfer')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.9)' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#FFF" />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { color: theme.isDark ? 'rgba(255,255,255,0.85)' : theme.textPrimary },
              ]}
            >
              Chuyển tiền
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/analytics')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.9)' }]}>
              <MaterialCommunityIcons name="chart-pie" size={20} color="#FFF" />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { color: theme.isDark ? 'rgba(255,255,255,0.85)' : theme.textPrimary },
              ]}
            >
              Thống kê
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/budget')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.9)' }]}>
              <MaterialCommunityIcons name="target" size={20} color="#FFF" />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { color: theme.isDark ? 'rgba(255,255,255,0.85)' : theme.textPrimary },
              ]}
            >
              Hạn mức
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detected Bank Transactions */}
      <PendingTransactionsCard />

      {/* Search & Filter Bar */}
      <View style={[styles.filterContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo ghi chú, danh mục, ví..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          {filterChips.map(chip => {
            const isSelected = activeFilter === chip.type;
            return (
              <TouchableOpacity
                key={chip.type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveFilter(chip.type)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={chip.icon as any}
                  size={14}
                  color={isSelected ? '#FFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '600' },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>



      {/* Transaction List */}
      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={searchQuery ? 'file-search-outline' : 'wallet-outline'}
              size={52}
              color={theme.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {searchQuery ? 'Không tìm thấy giao dịch' : 'Chưa có giao dịch nào'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Thử thay đổi từ khoá hoặc bỏ bộ lọc hiện tại'
              : 'Ghi chép các khoản chi tiêu hàng ngày để quản lý tài chính thông minh'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={[styles.addFirstBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              <Text style={styles.addFirstBtnText}>Ghi chép giao dịch đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: 90 + insets.bottom }]}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              <View style={styles.sectionDatePill}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.sectionDate, { color: theme.textSecondary }]}>
                  {formatDateHeader(section.title + 'T00:00:00')}
                </Text>
              </View>

              <Text
                style={[
                  styles.sectionTotal,
                  { color: section.dayTotal >= 0 ? theme.income : theme.expense },
                ]}
              >
                {isBalanceHidden
                  ? '••••••'
                  : `${section.dayTotal >= 0 ? '+' : ''}${formatVND(section.dayTotal)}`}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionItem item={item} onPress={handleTap} />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.divider }]} />
          )}
          renderSectionFooter={() => (
            <View style={[styles.sectionFooter, { backgroundColor: theme.background }]} />
          )}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            bottom: 24 + insets.bottom,
          },
        ]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Quick Add Modal */}
      {showAddModal && (
        <QuickAddModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadAll();
            refreshBalances();
          }}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
      />

      {/* Mandatory Privacy Policy Consent Modal on First Launch */}
      <PrivacyModal
        visible={showMandatoryPrivacy}
        onClose={() => {}}
        isMandatoryConsent={true}
        onAccept={() => {
          acceptPrivacyPolicy();
          setShowMandatoryPrivacy(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroWrapper: {
    backgroundColor: '#0B0F19',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroCard: {
    backgroundColor: '#151D30',
    borderRadius: RADIUS.xl,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  balanceHeaderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F43F5E',
    borderRadius: RADIUS.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginVertical: SPACING.xs,
  },
  monthCashflow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cashflowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashflowIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashflowLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  cashflowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cashflowDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  quickActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
    marginBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sectionDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionDate: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionFooter: {
    height: SPACING.xs,
  },
  separator: {
    height: 1,
    marginLeft: 70,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingBottom: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  addFirstBtnText: {
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
