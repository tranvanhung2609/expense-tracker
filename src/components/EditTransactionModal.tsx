import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoryStore } from '../stores/categoryStore';
import { useWalletStore } from '../stores/walletStore';
import { useTransactionStore } from '../stores/transactionStore';
import { TransactionWithDetails } from '../repositories/TransactionRepository';
import AmountKeypad from './AmountKeypad';
import CategoryPicker from './CategoryPicker';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatVND } from '../utils/currency';
import { formatDateShort, formatTime } from '../utils/date';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: TransactionWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSaved,
}: EditTransactionModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { expenseCategories, incomeCategories } = useCategoryStore();
  const { wallets, refreshBalances } = useWalletStore();
  const { update } = useTransactionStore();

  const [digits, setDigits] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDigits(String(transaction.amount));
      setSelectedCategoryId(transaction.categoryId);
      setSelectedWalletId(transaction.walletId);
      setDate(new Date(transaction.date));
      setNote(transaction.note ?? '');
      setShowKeypad(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const categories = transaction.type === 'EXPENSE' ? expenseCategories : incomeCategories;
  const canSave = digits.length > 0 && selectedCategoryId !== null && selectedWalletId !== '';

  const handleSave = () => {
    if (!canSave) return;

    const cleanAmount = parseInt(digits.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    update(transaction.id, {
      amount: cleanAmount,
      categoryId: selectedCategoryId!,
      walletId: selectedWalletId,
      date: date.toISOString(),
      note: note.trim() || undefined,
    });

    refreshBalances();
    onSaved();
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && event.type === 'set') {
      setDate(selectedDate);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.textPrimary }]}>Chỉnh sửa giao dịch</Text>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              style={[
                styles.saveHeaderBtn,
                { backgroundColor: canSave ? theme.primary : theme.border },
              ]}
            >
              <Text style={styles.saveHeaderBtnText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Amount Display */}
            <TouchableOpacity
              style={[styles.amountDisplay, { backgroundColor: theme.surfaceVariant }]}
              onPress={() => setShowKeypad(!showKeypad)}
              activeOpacity={0.8}
            >
              <Text style={[styles.amountLabel, { color: theme.textTertiary }]}>Số tiền</Text>
              <Text style={[styles.amountValue, { color: theme.primary }]}>
                {formatVND(parseInt(digits || '0', 10))}
              </Text>
              <Text style={[styles.keypadHint, { color: theme.textTertiary }]}>
                {showKeypad ? 'Ẩn bàn phím ▲' : 'Chạm để đổi số tiền ▼'}
              </Text>
            </TouchableOpacity>

            {/* Collapsible Keypad */}
            {showKeypad && (
              <View style={styles.keypadWrapper}>
                <AmountKeypad value={digits} onChange={setDigits} />
              </View>
            )}

            {/* Category Picker */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Danh mục</Text>
            <CategoryPicker
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={cat => setSelectedCategoryId(cat.id)}
            />

            {/* Wallet Selection */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Tài khoản / Ví</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletRow}
            >
              {wallets.map(w => {
                const isSelected = w.id === selectedWalletId;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletChip,
                      {
                        backgroundColor: isSelected ? w.color + '25' : theme.surfaceVariant,
                        borderColor: isSelected ? w.color : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedWalletId(w.id)}
                  >
                    <MaterialCommunityIcons
                      name={w.icon as any}
                      size={16}
                      color={isSelected ? w.color : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.walletChipText,
                        { color: isSelected ? w.color : theme.textPrimary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Date Picker Button */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Thời gian</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.primary} />
              <Text style={[styles.dateButtonText, { color: theme.textPrimary }]}>
                {formatDateShort(date.toISOString())} - {formatTime(date.toISOString())}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textTertiary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Note Input */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Ghi chú</Text>
            <View style={[styles.noteBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.noteInput, { color: theme.textPrimary }]}
                placeholder="Nhập ghi chú chi tiết..."
                placeholderTextColor={theme.textTertiary}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  saveHeaderBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    padding: SPACING.md,
  },
  amountDisplay: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
  },
  amountValue: {
    ...TYPOGRAPHY.amount,
    marginVertical: 4,
  },
  keypadHint: {
    fontSize: 12,
  },
  keypadWrapper: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  walletRow: {
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  walletChipText: {
    fontSize: 13,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
});
