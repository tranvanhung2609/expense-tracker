import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatKeypadInput, getCurrencyConfig } from '../utils/currency';

interface AmountKeypadProps {
  digits?: string;
  onDigitsChange?: (digits: string) => void;
  value?: string;
  onChange?: (val: string) => void;
  accentColor?: string;
  showPresets?: boolean;
}

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['000', '0', 'DEL'],
];

const PRESETS = [
  { label: '+50K', value: 50000 },
  { label: '+100K', value: 100000 },
  { label: '+200K', value: 200000 },
  { label: '+500K', value: 500000 },
  { label: '+1M', value: 1000000 },
];

export default function AmountKeypad({
  digits,
  onDigitsChange,
  value,
  onChange,
  accentColor,
  showPresets = true,
}: AmountKeypadProps) {
  const theme = useAppTheme();
  const currentDigits = digits ?? value ?? '';
  const handleChange = onDigitsChange ?? onChange ?? (() => {});
  const currencyConfig = getCurrencyConfig();
  const displayColor = accentColor || theme.primary;

  const handleKey = (key: string) => {
    Vibration.vibrate(15);
    if (key === 'DEL') {
      handleChange(currentDigits.slice(0, -1));
    } else {
      const newDigits = currentDigits + key;
      if (newDigits.length <= 15) {
        handleChange(newDigits);
      }
    }
  };

  const handleClear = () => {
    Vibration.vibrate(30);
    handleChange('');
  };

  const handlePreset = (addVal: number) => {
    Vibration.vibrate(20);
    const curr = parseInt(currentDigits || '0', 10);
    const nextVal = curr + addVal;
    if (String(nextVal).length <= 15) {
      handleChange(String(nextVal));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* Amount display */}
      <View style={[styles.amountDisplay, { borderBottomColor: theme.border }]}>
        <View style={styles.amountValueRow}>
          <Text
            style={[styles.amountText, { color: displayColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatKeypadInput(currentDigits)}
          </Text>
          <Text style={[styles.currencySymbol, { color: displayColor }]}>
            {currencyConfig.symbol}
          </Text>
        </View>

        {currentDigits.length > 0 && (
          <TouchableOpacity
            style={[styles.clearPill, { backgroundColor: theme.surfaceVariant }]}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={14} color={theme.textTertiary} />
            <Text style={[styles.clearText, { color: theme.textSecondary }]}>Xoá hết</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Amount Presets */}
      {showPresets && (
        <View style={[styles.presetRow, { borderBottomColor: theme.divider }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetContent}
          >
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.presetChip,
                  { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                ]}
                onPress={() => handlePreset(p.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.presetText, { color: theme.textPrimary }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Keypad grid */}
      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              const isDel = key === 'DEL';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    {
                      backgroundColor: isDel ? theme.expense + '15' : theme.surfaceVariant,
                      borderColor: isDel ? theme.expense + '30' : theme.border,
                    },
                  ]}
                  onPress={() => handleKey(key)}
                  onLongPress={isDel ? handleClear : undefined}
                  activeOpacity={0.65}
                >
                  {isDel ? (
                    <MaterialCommunityIcons name="backspace-outline" size={24} color={theme.expense} />
                  ) : (
                    <Text style={[styles.keyText, { color: theme.textPrimary }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountText: {
    ...TYPOGRAPHY.amountLarge,
    fontWeight: '800',
    letterSpacing: -1,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
  },
  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetRow: {
    borderBottomWidth: 1,
    paddingVertical: SPACING.xs + 2,
  },
  presetContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  presetText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  grid: {
    padding: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
});
