import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetRepository, BudgetWithSpent } from '../../src/repositories/BudgetRepository';
import { CategoryRepository, Category } from '../../src/repositories/CategoryRepository';
import { formatVND } from '../../src/utils/currency';
import { getCurrentMonthYear, formatMonthYear } from '../../src/utils/date';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import BudgetProgressBar from '../../src/components/BudgetProgressBar';
import AmountKeypad from '../../src/components/AmountKeypad';

const budgetRepo = new BudgetRepository();
const categoryRepo = new CategoryRepository();

export default function BudgetScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [monthYear] = useState(getCurrentMonthYear());

  const load = useCallback(() => {
    setBudgets(budgetRepo.getByMonthWithSpent(monthYear));
    setExpenseCategories(categoryRepo.getByType('EXPENSE'));
  }, [monthYear]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (budget: BudgetWithSpent) => {
    Alert.alert(
      'Xóa hạn mức',
      `Bạn có chắc muốn xóa hạn mức của danh mục "${budget.categoryName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            budgetRepo.delete(budget.id);
            load();
          },
        },
      ]
    );
  };

  const usedCategoryIds = new Set(budgets.map(b => b.categoryId));
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.has(c.id));

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
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 16) + 12,
          },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Hạn mức chi tiêu</Text>
          <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{formatMonthYear(monthYear)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: availableCategories.length === 0 ? theme.border : theme.primary },
          ]}
          onPress={() => setShowAddModal(true)}
          disabled={availableCategories.length === 0}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Budget list */}
      <FlatList
        data={budgets}
        keyExtractor={b => b.id}
        contentContainerStyle={[styles.list, { paddingBottom: 90 + insets.bottom }]}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.9}>
            <BudgetProgressBar budget={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceVariant }]}>
              <MaterialCommunityIcons name="target" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Chưa có hạn mức nào</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Đặt hạn mức chi tiêu cho từng danh mục để kiểm soát tài chính cá nhân hiệu quả
            </Text>
            {availableCategories.length > 0 && (
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
                <Text style={styles.emptyAddBtnText}>Tạo hạn mức ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          budgets.length > 0 ? (
            <Text style={[styles.hint, { color: theme.textTertiary }]}>Giữ lâu để xóa hạn mức</Text>
          ) : null
        }
      />

      {/* Add Budget Modal */}
      {showAddModal && (
        <AddBudgetModal
          categories={availableCategories}
          monthYear={monthYear}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
    </View>
  );
}

// ─── Add Budget Modal ────────────────────────────────────────────────────────
interface AddBudgetModalProps {
  categories: Category[];
  monthYear: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddBudgetModal({ categories, monthYear, onClose, onSaved }: AddBudgetModalProps) {
  const theme = useAppTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    categories.length > 0 ? categories[0] : null
  );
  const [digits, setDigits] = useState('');
  const [step, setStep] = useState<'category' | 'amount'>('category');

  const canSave = digits.length > 0 && selectedCategory !== null;

  const handleSave = () => {
    if (!canSave || !selectedCategory) return;
    budgetRepo.upsert({
      categoryId: selectedCategory.id,
      limitAmount: parseInt(digits, 10),
      monthYear,
    });
    onSaved();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[modalStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[modalStyles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>Đặt hạn mức</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Step indicator */}
            <View style={modalStyles.steps}>
              <TouchableOpacity
                style={[
                  modalStyles.step,
                  step === 'category' && { backgroundColor: theme.primary + '20' },
                ]}
                onPress={() => setStep('category')}
              >
                <Text
                  style={[
                    modalStyles.stepText,
                    { color: step === 'category' ? theme.primary : theme.textTertiary },
                  ]}
                >
                  1. Danh mục
                </Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textTertiary} />
              <TouchableOpacity
                style={[
                  modalStyles.step,
                  step === 'amount' && { backgroundColor: theme.primary + '20' },
                ]}
                onPress={() => selectedCategory && setStep('amount')}
              >
                <Text
                  style={[
                    modalStyles.stepText,
                    { color: step === 'amount' ? theme.primary : theme.textTertiary },
                  ]}
                >
                  2. Số tiền
                </Text>
              </TouchableOpacity>
            </View>

            {step === 'category' ? (
              <View style={modalStyles.catGrid}>
                {categories.map(cat => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        modalStyles.catItem,
                        { borderColor: theme.border, backgroundColor: theme.surfaceVariant },
                        isSelected && {
                          backgroundColor: cat.color + '25',
                          borderColor: cat.color,
                        },
                      ]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setStep('amount');
                      }}
                    >
                      <View style={[modalStyles.catIcon, { backgroundColor: cat.color + '22' }]}>
                        <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                      </View>
                      <Text style={[modalStyles.catName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View>
                {selectedCategory && (
                  <View style={[modalStyles.selectedBadge, { backgroundColor: theme.surfaceVariant }]}>
                    <View style={[modalStyles.catIcon, { backgroundColor: selectedCategory.color + '22' }]}>
                      <MaterialCommunityIcons
                        name={selectedCategory.icon as any}
                        size={18}
                        color={selectedCategory.color}
                      />
                    </View>
                    <Text style={[modalStyles.selectedName, { color: theme.textPrimary }]}>
                      {selectedCategory.name}
                    </Text>
                    <TouchableOpacity onPress={() => setStep('category')}>
                      <Text style={[modalStyles.changeBtn, { color: selectedCategory.color }]}>Đổi</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <AmountKeypad digits={digits} onDigitsChange={setDigits} />
              </View>
            )}
          </ScrollView>

          {/* Save button */}
          <View style={[modalStyles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[
                modalStyles.saveBtn,
                { backgroundColor: canSave && step === 'amount' ? theme.primary : theme.border },
              ]}
              onPress={step === 'category' ? () => setStep('amount') : handleSave}
              activeOpacity={0.85}
              disabled={step === 'amount' && !canSave}
            >
              <Text style={modalStyles.saveBtnText}>
                {step === 'category'
                  ? selectedCategory
                    ? `Tiếp — ${selectedCategory.name}`
                    : 'Chọn danh mục'
                  : canSave
                  ? `Lưu hạn mức ${parseInt(digits, 10).toLocaleString('vi-VN')} ₫`
                  : 'Nhập số tiền hạn mức'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 8,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  title: { ...TYPOGRAPHY.h2, letterSpacing: -0.5 },
  subtitle: { ...TYPOGRAPHY.bodySmall, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  list: { padding: SPACING.md, paddingBottom: 110 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  emptyAddBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#FFF',
  },
  hint: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  title: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  step: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  stepText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  catItem: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: SPACING.xs,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  selectedName: { flex: 1, ...TYPOGRAPHY.body, fontWeight: '600' },
  changeBtn: { ...TYPOGRAPHY.bodySmall, fontWeight: '700' },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  saveBtnText: { ...TYPOGRAPHY.h4, color: '#FFF', fontWeight: '700' },
});
