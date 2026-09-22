import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoryStore } from '../../src/stores/categoryStore';
import { Category } from '../../src/repositories/CategoryRepository';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import ConfirmModal from '../../src/components/ConfirmModal';

// Icon options for category creation
const ICON_OPTIONS = [
  'food', 'car', 'shopping', 'home', 'heart-pulse', 'school', 'gamepad-variant',
  'tshirt-crew', 'airplane', 'cash-plus', 'briefcase', 'gift', 'coffee',
  'movie', 'book', 'basketball', 'gas-station', 'medical-bag', 'paw',
  'chart-line', 'credit-card', 'bank', 'dots-horizontal',
];

const COLOR_OPTIONS = [
  '#F43F5E', '#FB923C', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B',
];

export default function CategoriesScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { categories, load, remove } = useCategoryStore();
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'destructive' | 'warning' | 'primary' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = categories.filter(c => {
    if (filterType === 'ALL') return true;
    return c.type === filterType || c.type === 'BOTH';
  });

  const handleDelete = (cat: Category) => {
    if (cat.isDefault) {
      setConfirmConfig({
        visible: true,
        title: 'Danh mục mặc định',
        message: `"${cat.name}" là danh mục mặc định của hệ thống, không thể xóa để đảm bảo thống kê dữ liệu chuẩn xác.`,
        type: 'info',
        confirmText: 'Đã hiểu',
        cancelText: undefined,
        onConfirm: () => setConfirmConfig(null),
      });
      return;
    }
    setConfirmConfig({
      visible: true,
      title: 'Xóa danh mục',
      message: `Bạn có chắc muốn xóa danh mục "${cat.name}"? Toàn bộ các giao dịch liên quan trước đó vẫn sẽ được lưu giữ.`,
      type: 'destructive',
      confirmText: 'Xóa danh mục',
      cancelText: 'Hủy',
      onConfirm: () => {
        remove(cat.id);
        setConfirmConfig(null);
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.card} />

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
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Danh mục</Text>
            <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{categories.length} danh mục</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={[styles.filterRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {(['ALL', 'EXPENSE', 'INCOME'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              { backgroundColor: theme.surfaceVariant },
              filterType === f && { backgroundColor: theme.primary },
            ]}
            onPress={() => setFilterType(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filterType === f ? '#FFF' : theme.textSecondary },
              ]}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'EXPENSE' ? '💸 Chi tiêu' : '💰 Thu nhập'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: 90 + insets.bottom }]}
        columnWrapperStyle={{ gap: SPACING.sm }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.catCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleDelete(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconBg, { backgroundColor: item.color + '22' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={[styles.catName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.catMeta}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      item.type === 'EXPENSE'
                        ? theme.expense + '20'
                        : item.type === 'INCOME'
                        ? theme.income + '20'
                        : theme.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    {
                      color:
                        item.type === 'EXPENSE'
                          ? theme.expense
                          : item.type === 'INCOME'
                          ? theme.income
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {item.type === 'EXPENSE' ? 'Chi' : item.type === 'INCOME' ? 'Thu' : 'Cả hai'}
                </Text>
              </View>
              {item.isDefault ? (
                <MaterialCommunityIcons name="lock-outline" size={12} color={theme.textTertiary} />
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}

      {/* Themed Confirmation Modal */}
      {confirmConfig && (
        <ConfirmModal
          visible={confirmConfig.visible}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </View>
  );
}

// ─── Add Category Modal ───────────────────────────────────────────────────────
function AddCategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const theme = useAppTheme();
  const { add } = useCategoryStore();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('coffee');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Chưa nhập tên', 'Vui lòng nhập tên danh mục.');
      return;
    }
    add({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type,
    });
    onSaved();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <TouchableOpacity style={mStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[mStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[mStyles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[mStyles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[mStyles.title, { color: theme.textPrimary }]}>Thêm danh mục mới</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[mStyles.saveText, { color: theme.primary }]}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={mStyles.content} showsVerticalScrollIndicator={false}>
            {/* Preview */}
            <View style={[mStyles.preview, { backgroundColor: theme.surfaceVariant }]}>
              <View style={[mStyles.previewIcon, { backgroundColor: selectedColor }]}>
                <MaterialCommunityIcons name={selectedIcon as any} size={36} color="#FFF" />
              </View>
              <Text style={[mStyles.previewName, { color: theme.textPrimary }]}>
                {name || 'Tên danh mục'}
              </Text>
            </View>

            {/* Name */}
            <Text style={[mStyles.label, { color: theme.textSecondary }]}>Tên danh mục</Text>
            <TextInput
              style={[
                mStyles.input,
                { backgroundColor: theme.inputBackground, color: theme.textPrimary, borderColor: theme.border },
              ]}
              placeholder="VD: Cà phê, Xem phim, Xăng xe..."
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
            />

            {/* Type */}
            <Text style={[mStyles.label, { color: theme.textSecondary }]}>Loại danh mục</Text>
            <View style={[mStyles.typeToggle, { backgroundColor: theme.surfaceVariant }]}>
              <TouchableOpacity
                style={[mStyles.typeBtn, type === 'EXPENSE' && { backgroundColor: theme.expense }]}
                onPress={() => setType('EXPENSE')}
              >
                <Text style={[mStyles.typeBtnText, { color: type === 'EXPENSE' ? '#FFF' : theme.textSecondary }]}>
                  💸 Chi tiêu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.typeBtn, type === 'INCOME' && { backgroundColor: theme.income }]}
                onPress={() => setType('INCOME')}
              >
                <Text style={[mStyles.typeBtnText, { color: type === 'INCOME' ? '#FFF' : theme.textSecondary }]}>
                  💰 Thu nhập
                </Text>
              </TouchableOpacity>
            </View>

            {/* Color selection */}
            <Text style={[mStyles.label, { color: theme.textSecondary }]}>Màu sắc</Text>
            <View style={mStyles.colorGrid}>
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    mStyles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && mStyles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                >
                  {selectedColor === c && (
                    <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon selection */}
            <Text style={[mStyles.label, { color: theme.textSecondary }]}>Biểu tượng</Text>
            <View style={mStyles.iconGrid}>
              {ICON_OPTIONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    mStyles.iconBtn,
                    { backgroundColor: theme.surfaceVariant },
                    selectedIcon === ic && {
                      backgroundColor: selectedColor + '25',
                      borderColor: selectedColor,
                    },
                  ]}
                  onPress={() => setSelectedIcon(ic)}
                >
                  <MaterialCommunityIcons
                    name={ic as any}
                    size={22}
                    color={selectedIcon === ic ? selectedColor : theme.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
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
  filterRow: {
    flexDirection: 'row',
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  filterText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600' },
  grid: { padding: SPACING.md, paddingBottom: 110 },
  catCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  catIconBg: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  catName: { ...TYPOGRAPHY.body, fontWeight: '600', textAlign: 'center' },
  catMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  typeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
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
  saveText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  preview: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  label: {
    ...TYPOGRAPHY.label,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    ...TYPOGRAPHY.body,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
  },
  typeBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, alignItems: 'center' },
  typeBtnText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
