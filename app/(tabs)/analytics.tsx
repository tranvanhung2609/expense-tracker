import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { formatVND, formatCompact } from '../../src/utils/currency';
import { getDateRange, getCurrentMonthYear } from '../../src/utils/date';
import { TransactionRepository } from '../../src/repositories/TransactionRepository';
import { BudgetRepository } from '../../src/repositories/BudgetRepository';
import BudgetProgressBar from '../../src/components/BudgetProgressBar';

const txRepo = new TransactionRepository();
const budgetRepo = new BudgetRepository();

type Period = 'week' | 'month' | 'year';

function DonutChart({
  data,
  total,
  size = 180,
}: {
  data: { value: number; color: string }[];
  total: number;
  size?: number;
}) {
  const radius = size / 2 - 14;
  const innerRadius = radius * 0.62;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = radius - innerRadius;

  if (total === 0) return null;

  let cumulativePct = 0;
  const CIRCUMFERENCE = 2 * Math.PI * (innerRadius + strokeWidth / 2);
  const GAP = 0.015;

  const segments = data.map(item => {
    const pct = item.value / total;
    const start = cumulativePct;
    cumulativePct += pct;
    return { ...item, pct, start };
  });

  const r = innerRadius + strokeWidth / 2;

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const arcPct = Math.max(seg.pct - GAP, 0.001);
        const dashArray = `${arcPct * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
        const dashOffset = -seg.start * CIRCUMFERENCE;

        return (
          <G key={i} rotation="-90" origin={`${cx}, ${cy}`}>
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </G>
        );
      })}
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<Period>('month');
  const [categoryTotals, setCategoryTotals] = useState<
    { categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; total: number }[]
  >([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [budgets, setBudgets] = useState<any[]>([]);

  const loadData = useCallback(() => {
    const { from, to } = getDateRange(period);
    const catTotals = txRepo.getTotalsByCategory(from, to, 'EXPENSE');
    setCategoryTotals(catTotals);

    const inc = txRepo.getTotalByType('INCOME', from, to);
    const exp = txRepo.getTotalByType('EXPENSE', from, to);
    setTotalIncome(inc);
    setTotalExpense(exp);

    const currentMonth = getCurrentMonthYear();
    const budgetList = budgetRepo.getByMonthWithSpent(currentMonth);
    setBudgets(budgetList);
  }, [period]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const pieData = categoryTotals.slice(0, 7).map((cat: any) => ({
    value: cat.total,
    color: cat.categoryColor,
    categoryId: cat.categoryId,
  }));

  const PERIOD_OPTIONS: { label: string; value: Period }[] = [
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Năm nay', value: 'year' },
  ];

  const netSavings = totalIncome - totalExpense;
  const isHealthy = netSavings >= 0;

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 10;
  const donutSize = Math.min(Math.max(width * 0.42, 130), 180);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: 90 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Báo cáo & Phân tích</Text>

          {/* Segmented Period Filter */}
          <View style={[styles.periodFilter, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
            {PERIOD_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.periodBtn,
                  period === opt.value && { backgroundColor: theme.primary },
                ]}
                onPress={() => setPeriod(opt.value)}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    { color: period === opt.value ? '#FFF' : theme.textSecondary, fontWeight: period === opt.value ? '700' : '500' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryCardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: theme.income + '18' }]}>
                <MaterialCommunityIcons name="arrow-down-bold" size={14} color={theme.income} />
              </View>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Tổng thu</Text>
            </View>
            <Text style={[styles.summaryCardAmount, { color: theme.income }]}>
              {formatCompact(totalIncome)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryCardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: theme.expense + '18' }]}>
                <MaterialCommunityIcons name="arrow-up-bold" size={14} color={theme.expense} />
              </View>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Tổng chi</Text>
            </View>
            <Text style={[styles.summaryCardAmount, { color: theme.expense }]}>
              {formatCompact(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Net Savings & Health Indicator Card */}
        <View style={[styles.netCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.netCardHeader}>
            <View style={{ gap: 2 }}>
              <Text style={[styles.netLabel, { color: theme.textSecondary }]}>THẶNG DƯ / TIẾT KIỆM RÒNG</Text>
              <Text
                style={[
                  styles.netAmount,
                  { color: isHealthy ? theme.income : theme.expense },
                ]}
              >
                {isHealthy ? '+' : ''}{formatVND(netSavings)}
              </Text>
            </View>
            <View
              style={[
                styles.healthBadge,
                { backgroundColor: isHealthy ? theme.income + '18' : theme.expense + '18' },
              ]}
            >
              <MaterialCommunityIcons
                name={isHealthy ? 'check-decagram' : 'alert-circle-outline'}
                size={14}
                color={isHealthy ? theme.income : theme.expense}
              />
              <Text style={[styles.healthText, { color: isHealthy ? theme.income : theme.expense }]}>
                {isHealthy ? 'Cân bằng tài chính' : 'Chi tiêu vượt thu'}
              </Text>
            </View>
          </View>
        </View>

        {/* Donut Chart + Legend */}
        {categoryTotals.length > 0 ? (
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Cơ cấu chi tiêu theo danh mục</Text>

            <View style={styles.chartRow}>
              {/* Donut */}
              <View style={styles.donutWrapper}>
                <DonutChart data={pieData} total={totalExpense} size={donutSize} />
                <View style={styles.donutCenter}>
                  <Text style={[styles.donutAmount, { color: theme.expense }]}>
                    {formatCompact(totalExpense)}
                  </Text>
                  <Text style={[styles.donutLabel, { color: theme.textTertiary }]}>Tổng chi</Text>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {pieData.map((item: any) => {
                  const cat = categoryTotals.find((c: any) => c.categoryId === item.categoryId);
                  const pct = Math.round((item.value / totalExpense) * 100);
                  return (
                    <View key={item.categoryId} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View style={styles.legendText}>
                        <Text style={[styles.legendName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {cat?.categoryName}
                        </Text>
                        <Text style={[styles.legendPct, { color: theme.textTertiary }]}>{pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top Categories Ranking List */}
            <View style={[styles.topList, { borderTopColor: theme.divider }]}>
              <Text style={[styles.topListTitle, { color: theme.textSecondary }]}>
                BẢNG XẾP HẠNG CHI TIÊU NHIỀU NHẤT
              </Text>
              {categoryTotals.slice(0, 5).map((cat: any, idx: number) => {
                const maxVal = categoryTotals[0]?.total || 1;
                const barWidth = Math.round((cat.total / maxVal) * 100);
                const pctOfTotal = Math.round((cat.total / totalExpense) * 100);
                return (
                  <View key={cat.categoryId} style={styles.topItem}>
                    <Text style={[styles.topRank, { color: idx === 0 ? theme.primary : theme.textTertiary }]}>
                      #{idx + 1}
                    </Text>
                    <View style={[styles.topIcon, { backgroundColor: cat.categoryColor + '18' }]}>
                      <MaterialCommunityIcons name={cat.categoryIcon as any} size={16} color={cat.categoryColor} />
                    </View>
                    <View style={{ width: 85 }}>
                      <Text style={[styles.topName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {cat.categoryName}
                      </Text>
                      <Text style={[styles.topPct, { color: theme.textTertiary }]}>{pctOfTotal}%</Text>
                    </View>
                    <View style={[styles.topBarWrapper, { backgroundColor: theme.surfaceVariant }]}>
                      <View
                        style={[
                          styles.topBar,
                          { width: `${barWidth}%`, backgroundColor: cat.categoryColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.topAmount, { color: theme.textPrimary }]}>
                      {formatCompact(cat.total)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyChart, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="chart-donut" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Không có dữ liệu chi tiêu</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
              Trong khoảng thời gian này bạn chưa ghi nhận khoản chi nào
            </Text>
          </View>
        )}

        {/* Budget Overview */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hạn mức tháng này</Text>
            {budgets.map((b: any) => (
              <BudgetProgressBar key={b.id} budget={b} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: 110 },
  headerSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodFilter: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  periodBtnText: { fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm + 2 },
  summaryCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    gap: 6,
  },
  summaryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardLabel: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  summaryCardAmount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  netCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  netCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.6,
  },
  netAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  donutWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutAmount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  donutLabel: { fontSize: 11 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  legendName: { fontSize: 12, fontWeight: '600' },
  legendPct: { fontSize: 11, fontWeight: '700' },
  topList: { borderTopWidth: 1, paddingTop: SPACING.md, gap: 10 },
  topListTitle: { ...TYPOGRAPHY.label, letterSpacing: 0.6, marginBottom: 4 },
  topItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topRank: { fontSize: 12, fontWeight: '800', width: 22 },
  topIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topName: { fontSize: 12, fontWeight: '600' },
  topPct: { fontSize: 10 },
  topBarWrapper: {
    flex: 1,
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  topBar: { height: '100%', borderRadius: RADIUS.full, minWidth: 4 },
  topAmount: { fontSize: 13, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  emptyChart: {
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  emptyTitle: { ...TYPOGRAPHY.h4, fontWeight: '700' },
  emptySubtitle: { ...TYPOGRAPHY.bodySmall, textAlign: 'center' },
  section: { marginTop: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: SPACING.md },
});
