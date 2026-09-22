import React, { useState } from 'react';
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
import AmountKeypad from './AmountKeypad';
import CategoryPicker from './CategoryPicker';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { formatVND } from '../utils/currency';

interface QuickAddModalProps {
  onClose: () => void;
  onSaved: () => void;
}

type TxType = 'EXPENSE' | 'INCOME';

export default function QuickAddModal({ onClose, onSaved }: QuickAddModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { expenseCategories, incomeCategories } = useCategoryStore();
  const { wallets } = useWalletStore();
  const { add } = useTransactionStore();

  const [txType, setTxType] = useState<TxType>('EXPENSE');
  const [digits, setDigits] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id ?? '');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');

  const categories = txType === 'EXPENSE' ? expenseCategories : incomeCategories;
  const canSave = digits.length > 0 && selectedCategoryId !== null && selectedWalletId !== '';
  const accentColor = txType === 'EXPENSE' ? theme.expense : theme.income;

  const handleSave = () => {
    if (!canSave) return;
    add({
      amount: parseInt(digits, 10),
      type: txType,
      categoryId: selectedCategoryId!,
      walletId: selectedWalletId,
      date: date.toISOString(),
      note: note.trim() || undefined,
    });
    onSaved();
  };

  const handleSetToday = () => setDate(new Date());
  const handleSetYesterday = () => setDate(subDays(new Date(), 1));

  const getDateLabel = () => {
    if (isToday(date)) return `Hôm nay, ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Hôm qua, ${format(date, 'HH:mm')}`;
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Ghi chép mới</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Type toggle segmented */}
            <View style={[styles.typeToggle, { backgroundColor: theme.surfaceVariant }]}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  txType === 'EXPENSE' && { backgroundColor: theme.expense },
                ]}
                onPress={() => {
                  setTxType('EXPENSE');
                  setSelectedCategoryId(null);
                }}
              >
                <MaterialCommunityIcons
                  name="arrow-up-circle"
                  size={16}
                  color={txType === 'EXPENSE' ? '#FFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: txType === 'EXPENSE' ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  Khoản Chi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  txType === 'INCOME' && { backgroundColor: theme.income },
                ]}
                onPress={() => {
                  setTxType('INCOME');
                  setSelectedCategoryId(null);
                }}
              >
                <MaterialCommunityIcons
                  name="arrow-down-circle"
                  size={16}
                  color={txType === 'INCOME' ? '#FFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: txType === 'INCOME' ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  Khoản Thu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Keypad with quick preset amounts */}
            <AmountKeypad
              value={digits}
              onChange={setDigits}
              accentColor={accentColor}
              showPresets={true}
            />

            {/* Categories */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CHỌN DANH MỤC</Text>
              {selectedCategoryId === null && (
                <Text style={[styles.requiredHint, { color: theme.warning }]}>* Bắt buộc</Text>
              )}
            </View>
            <CategoryPicker
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={cat => setSelectedCategoryId(cat.id)}
            />

            {/* Wallet Selection */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: SPACING.xs }]}>
              VÍ NGUỒN
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletScroll}>
              {wallets.map(w => {
                const isSelected = w.id === selectedWalletId;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletChip,
                      {
                        backgroundColor: isSelected ? w.color + '20' : theme.surfaceVariant,
                        borderColor: isSelected ? w.color : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedWalletId(w.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={w.icon as any}
                      size={18}
                      color={isSelected ? w.color : theme.textSecondary}
                    />
                    <View>
                      <Text
                        style={[
                          styles.walletChipText,
                          { color: isSelected ? w.color : theme.textPrimary, fontWeight: isSelected ? '700' : '600' },
                        ]}
                      >
                        {w.name}
                      </Text>
                      <Text style={[styles.walletChipBalance, { color: theme.textTertiary }]}>
                        {formatVND(w.balance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Date Chips & Selector */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: SPACING.md }]}>
              THỜI GIAN
            </Text>
            <View style={styles.dateChipsRow}>
              <TouchableOpacity
                style={[
                  styles.dateChip,
                  { backgroundColor: isToday(date) ? theme.primary + '20' : theme.surfaceVariant, borderColor: isToday(date) ? theme.primary : theme.border },
                ]}
                onPress={handleSetToday}
              >
                <Text style={[styles.dateChipText, { color: isToday(date) ? theme.primary : theme.textSecondary, fontWeight: isToday(date) ? '700' : '500' }]}>
                  Hôm nay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateChip,
                  { backgroundColor: isYesterday(date) ? theme.primary + '20' : theme.surfaceVariant, borderColor: isYesterday(date) ? theme.primary : theme.border },
                ]}
                onPress={handleSetYesterday}
              >
                <Text style={[styles.dateChipText, { color: isYesterday(date) ? theme.primary : theme.textSecondary, fontWeight: isYesterday(date) ? '700' : '500' }]}>
                  Hôm qua
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateChip,
                  styles.dateCustomChip,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar-month-outline" size={16} color={theme.primary} />
                <Text style={[styles.dateChipText, { color: theme.textPrimary }]}>
                  {getDateLabel()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={[styles.noteContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="square-edit-outline" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.noteInput, { color: theme.textPrimary }]}
                placeholder="Ghi chú (ví dụ: ăn trưa với đồng nghiệp...)"
                placeholderTextColor={theme.textTertiary}
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (selectedDate && event.type === 'set') {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
          </ScrollView>

          {/* Save button */}
          <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: canSave ? accentColor : theme.border },
              ]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={txType === 'EXPENSE' ? 'check-bold' : 'arrow-down-bold'}
                size={20}
                color="#FFF"
              />
              <Text style={styles.saveBtnText}>
                {canSave
                  ? `Lưu ${txType === 'EXPENSE' ? 'chi' : 'thu'} ${parseInt(digits || '0', 10).toLocaleString('vi-VN')} ₫`
                  : 'Nhập số tiền và chọn danh mục'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '92%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flexGrow: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 4,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.6,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: 4,
  },
  requiredHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  walletScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingVertical: 4,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  walletChipText: {
    fontSize: 13,
  },
  walletChipBalance: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCustomChip: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dateChipText: {
    fontSize: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  noteInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    padding: 0,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: {
    ...TYPOGRAPHY.h4,
    color: '#FFF',
    fontWeight: '700',
  },
});
