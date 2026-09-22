import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BudgetWithSpent } from '../repositories/BudgetRepository';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatVND } from '../utils/currency';

interface BudgetProgressBarProps {
  budget: BudgetWithSpent;
}

export default function BudgetProgressBar({ budget }: BudgetProgressBarProps) {
  const theme = useAppTheme();
  const pct = Math.min(budget.ratio, 1);
  const percentageInt = Math.round(budget.ratio * 100);
  const isWarning = budget.ratio >= 0.8 && budget.ratio < 1;
  const isExceeded = budget.ratio >= 1;

  const remaining = budget.limitAmount - budget.spent;

  const barColor = isExceeded
    ? theme.error
    : isWarning
    ? theme.warning
    : theme.income;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.left}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: budget.categoryColor + '18', borderColor: budget.categoryColor + '30' },
            ]}
          >
            <MaterialCommunityIcons
              name={budget.categoryIcon as any}
              size={20}
              color={budget.categoryColor}
            />
          </View>
          <View>
            <Text style={[styles.name, { color: theme.textPrimary }]}>{budget.categoryName}</Text>
            <Text style={[styles.remainingText, { color: isExceeded ? theme.error : theme.textSecondary }]}>
              {isExceeded
                ? `Vượt mức ${formatVND(Math.abs(remaining))}`
                : `Còn lại ${formatVND(remaining)}`}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.pctBadge,
            {
              backgroundColor: isExceeded
                ? theme.error + '18'
                : isWarning
                ? theme.warning + '18'
                : theme.surfaceVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.pctText,
              {
                color: isExceeded
                  ? theme.error
                  : isWarning
                  ? theme.warning
                  : theme.textSecondary,
              },
            ]}
          >
            {percentageInt}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.barBg, { backgroundColor: theme.surfaceVariant }]}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.spent, { color: theme.textTertiary }]}>
          Đã chi: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{formatVND(budget.spent)}</Text>
        </Text>
        <Text style={[styles.limit, { color: theme.textTertiary }]}>
          Hạn mức: {formatVND(budget.limitAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  name: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  barBg: {
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spent: {
    ...TYPOGRAPHY.caption,
  },
  limit: {
    ...TYPOGRAPHY.caption,
  },
});
