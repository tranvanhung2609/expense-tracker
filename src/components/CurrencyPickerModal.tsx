import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CurrencyPickerModal({ visible, onClose }: CurrencyPickerModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useSettingsStore();

  const handleSelect = (code: string) => {
    setCurrency(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, SPACING.lg),
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons name="currency-usd" size={24} color={theme.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Đơn vị tiền tệ
              </Text>
              <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                Chọn đồng tiền hiển thị trong ứng dụng
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {SUPPORTED_CURRENCIES.map(item => {
              const isSelected = item.code === (currency || 'VND');
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.itemRow,
                    {
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: isSelected ? theme.primary + '12' : theme.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.symbolBox,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.symbolText, { color: isSelected ? '#FFF' : theme.textPrimary }]}>
                      {item.symbol}
                    </Text>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.itemName,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCode, { color: theme.textTertiary }]}>
                      Mã: {item.code}
                    </Text>
                  </View>

                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginTop: SPACING.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  symbolBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
  },
  itemCode: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
});
