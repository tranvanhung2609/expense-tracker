import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionWithDetails } from '../repositories/TransactionRepository';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatVND } from '../utils/currency';
import { formatTime } from '../utils/date';
import { MaterialIconName, TRANSACTION_TYPES } from '../constants/enums';

interface TransactionItemProps {
  item: TransactionWithDetails;
  onPress?: (item: TransactionWithDetails) => void;
}

export default function TransactionItem({ item, onPress }: TransactionItemProps) {
  const theme = useAppTheme();

  const getAmountColor = () => {
    switch (item.type) {
      case TRANSACTION_TYPES.EXPENSE:
        return theme.expense;
      case TRANSACTION_TYPES.TRANSFER:
        return theme.transfer;
      case TRANSACTION_TYPES.INCOME:
      default:
        return theme.income;
    }
  };

  const getAmountPrefix = () => {
    switch (item.type) {
      case TRANSACTION_TYPES.EXPENSE:
        return '-';
      case TRANSACTION_TYPES.TRANSFER:
        return '⇄ ';
      case TRANSACTION_TYPES.INCOME:
      default:
        return '+';
    }
  };

  const amountColor = getAmountColor();
  const amountPrefix = getAmountPrefix();
  const iconName = (item.categoryIcon || 'cash') as MaterialIconName;
  const categoryColor = item.categoryColor || theme.primary;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      {/* Category icon badge */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: categoryColor + '18', borderColor: categoryColor + '30' },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={categoryColor}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={[styles.categoryName, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.categoryName}
        </Text>
        <View style={styles.metaRow}>
          {item.note ? (
            <Text style={[styles.note, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <View style={[styles.walletTag, { backgroundColor: theme.surfaceVariant }]}>
            <MaterialCommunityIcons name="wallet-outline" size={11} color={theme.textTertiary} />
            <Text style={[styles.walletName, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.walletName}
            </Text>
          </View>
        </View>
      </View>

      {/* Amount & time */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatVND(item.amount)}
        </Text>
        <Text style={[styles.time, { color: theme.textTertiary }]}>{formatTime(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
  },
  details: {
    flex: 1,
    gap: 4,
    marginRight: SPACING.sm,
  },
  categoryName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  note: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    maxWidth: 140,
  },
  walletTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  walletName: {
    fontSize: 11,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  time: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
});
