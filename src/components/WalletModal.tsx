import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WalletWithBalance } from '../repositories/WalletRepository';
import { useWalletStore } from '../stores/walletStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatVND, parseCurrency } from '../utils/currency';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  wallet?: WalletWithBalance | null;
}

const WALLET_ICONS = [
  'wallet',
  'bank',
  'credit-card',
  'cash-multiple',
  'piggy-bank',
  'safe',
  'cellphone-text',
  'bitcoin',
  'store',
  'credit-card-check',
  'chart-line',
  'shield-star',
];

const WALLET_COLORS = [
  '#6C63FF',
  '#00C896',
  '#FF5C7C',
  '#FFA940',
  '#56CCF2',
  '#C471ED',
  '#FA8231',
  '#26C6DA',
  '#42A5F5',
  '#66BB6A',
  '#7E57C2',
  '#EC407A',
];

export default function WalletModal({ visible, onClose, wallet }: WalletModalProps) {
  const theme = useAppTheme();
  const { add, update } = useWalletStore();

  const [name, setName] = useState('');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setInitialBalanceStr(wallet.initialBalance ? String(wallet.initialBalance) : '0');
      setSelectedIcon(wallet.icon || WALLET_ICONS[0]);
      setSelectedColor(wallet.color || WALLET_COLORS[0]);
    } else {
      setName('');
      setInitialBalanceStr('');
      setSelectedIcon(WALLET_ICONS[0]);
      setSelectedColor(WALLET_COLORS[0]);
    }
  }, [wallet, visible]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví.');
      return;
    }

    const cleanBalance = parseCurrency(initialBalanceStr);

    if (wallet) {
      update(wallet.id, {
        name: trimmedName,
        icon: selectedIcon,
        color: selectedColor,
        initialBalance: cleanBalance,
      });
    } else {
      add({
        name: trimmedName,
        icon: selectedIcon,
        color: selectedColor,
        initialBalance: cleanBalance,
      });
    }

    onClose();
  };

  const formatDisplayBalance = (str: string) => {
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num === 0) return '';
    return formatVND(num);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Name Input */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>TÊN VÍ</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                },
              ]}
              placeholder="VD: Ví Tiền Mặt, Vietcombank, MoMo..."
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
            />

            {/* Initial Balance */}
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: SPACING.md }]}>
              SỐ DƯ BAN ĐẦU (VNĐ)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                },
              ]}
              placeholder="0 ₫"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numeric"
              value={initialBalanceStr}
              onChangeText={setInitialBalanceStr}
            />
            {initialBalanceStr ? (
              <Text style={[styles.previewBalance, { color: theme.income }]}>
                {formatDisplayBalance(initialBalanceStr)}
              </Text>
            ) : null}

            {/* Icon Picker */}
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: SPACING.md }]}>
              CHỌN BIỂU TƯỢNG
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconList}>
              {WALLET_ICONS.map(icon => {
                const isSelected = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.surfaceVariant },
                      isSelected && { backgroundColor: selectedColor + '30', borderColor: selectedColor, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={24}
                      color={isSelected ? selectedColor : theme.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Color Picker */}
            <Text style={[styles.label, { color: theme.textSecondary, marginTop: SPACING.md }]}>
              CHỌN MÀU SẮC
            </Text>
            <View style={styles.colorGrid}>
              {WALLET_COLORS.map(color => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      isSelected && styles.colorSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {wallet ? 'Lưu thay đổi' : 'Tạo ví mới'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  previewBalance: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 2,
  },
  iconList: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  saveButton: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
