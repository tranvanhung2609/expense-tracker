import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Category } from '../repositories/CategoryRepository';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

export default function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.grid}>
      {categories.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => onSelect(item)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSelected ? item.color : item.color + '18',
                  borderColor: isSelected ? item.color : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={isSelected ? '#FFFFFF' : item.color}
              />
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="check" size={10} color={item.color} />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? theme.textPrimary : theme.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  label: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    fontSize: 12,
  },
});
