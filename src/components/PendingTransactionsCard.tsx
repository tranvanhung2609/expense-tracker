import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatCurrency } from '../utils/currency';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { SUPPORTED_BANKS } from '../services/bankParser';

export default function PendingTransactionsCard() {
  const { isDarkMode, currency } = useSettingsStore();
  const { categories } = useCategoryStore();
  const {
    pendingList,
    confirmPending,
    dismissPending,
    setActiveBannerItem,
  } = usePendingTransactionStore();

  if (!pendingList || pendingList.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? COLORS.darkSurface : COLORS.surface,
          borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.bellIconCircle}>
            <MaterialCommunityIcons name="bell-ring" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.title, { color: isDarkMode ? COLORS.textInverse : COLORS.textPrimary }]}>
              Chi tiêu đang ở nháp ({pendingList.length})
            </Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              Chạm ✓ để xác nhận lưu hoặc chạm vào để chỉnh sửa
            </Text>
          </View>
        </View>
      </View>

      {/* List of pending items */}
      <View style={styles.list}>
        {pendingList.slice(0, 3).map(item => {
          const bank = SUPPORTED_BANKS.find(b => b.name === item.bankName) || {
            color: COLORS.primary,
            icon: 'bank',
          };
          const category = categories.find(c => c.id === item.suggestedCategoryId) || {
            name: 'Chi tiêu',
            icon: 'tag',
            color: COLORS.primary,
          };
          const isExpense = item.type === 'EXPENSE';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                {
                  backgroundColor: isDarkMode ? COLORS.darkSurfaceVariant : COLORS.surfaceVariant,
                },
              ]}
              onPress={() => setActiveBannerItem(item)}
              activeOpacity={0.7}
            >
              {/* Bank Icon */}
              <View style={[styles.bankAvatar, { backgroundColor: bank.color }]}>
                <MaterialCommunityIcons
                  name={(bank.icon as any) || 'bank'}
                  size={16}
                  color="#FFFFFF"
                />
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <View style={styles.itemTopLine}>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: isExpense ? COLORS.expense : COLORS.income },
                    ]}
                  >
                    {isExpense ? '-' : '+'}{formatCurrency(item.amount, currency)}
                  </Text>
                  <View style={[styles.catTag, { backgroundColor: `${category.color}20` }]}>
                    <Text style={[styles.catTagText, { color: category.color }]}>
                      {category.name}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.itemNote, { color: COLORS.textSecondary }]} numberOfLines={1}>
                  {item.note || item.bankName}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => confirmPending(item.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => dismissPending(item.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  list: {
    gap: 8,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  bankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  catTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  catTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemNote: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  confirmBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
