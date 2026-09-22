import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../stores/notificationStore';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import { AppNotification, NotificationType } from '../repositories/NotificationRepository';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { formatDateShort, formatTime } from '../utils/date';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

function getNotifConfig(item: AppNotification, theme: any) {
  if (item.actionUrl === 'pending_transactions' || item.title.includes('nháp')) {
    return { icon: 'clipboard-text-clock-outline', color: '#8B5CF6', bg: '#8B5CF625' };
  }

  switch (item.type) {
    case 'BUDGET_EXCEEDED':
      return { icon: 'alert-octagon', color: theme.expense, bg: theme.expense + '20' };
    case 'BUDGET_WARNING':
      return { icon: 'alert', color: theme.warning, bg: theme.warning + '20' };
    case 'LOW_BALANCE':
      return { icon: 'wallet-alert', color: theme.warning, bg: theme.warning + '20' };
    case 'APP_UPDATE':
      return { icon: 'rocket-launch', color: theme.primary, bg: theme.primary + '20' };
    case 'REMINDER':
      return { icon: 'bell-ring', color: theme.income, bg: theme.income + '20' };
    case 'SYSTEM':
    default:
      return { icon: 'information', color: theme.primaryLight, bg: theme.primaryLight + '20' };
  }
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  const handleTapItem = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.actionUrl === 'pending_transactions') {
      onClose();
      const pendingList = usePendingTransactionStore.getState().pendingList;
      if (pendingList.length > 0) {
        usePendingTransactionStore.getState().setActiveBannerItem(pendingList[0]);
      }
      setTimeout(() => {
        router.push('/(tabs)');
      }, 150);
      return;
    }

    if (item.actionUrl) {
      onClose();
      // Allow modal dismiss animation before navigating
      setTimeout(() => {
        router.push(item.actionUrl as any);
      }, 150);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = getNotifConfig(item, theme);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: item.isRead ? theme.card : theme.surfaceVariant,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleTapItem(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
          </View>

          <Text style={[styles.itemMessage, { color: theme.textSecondary }]}>
            {item.message}
          </Text>

          <View style={styles.itemFooterRow}>
            <Text style={[styles.itemTime, { color: theme.textTertiary }]}>
              {formatDateShort(item.createdAt)} • {formatTime(item.createdAt)}
            </Text>

            <TouchableOpacity
              onPress={() => removeNotification(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleBox}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Thông báo</Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Đã đọc hết</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: theme.expense }]}>Xóa hết</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceVariant }]}>
                  <MaterialCommunityIcons name="bell-check-outline" size={44} color={theme.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  Không có thông báo mới
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Cảnh báo hạn mức và cập nhật phiên bản sẽ xuất hiện tại đây
                </Text>
              </View>
            }
          />
        </View>
      </View>
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
    maxHeight: '82%',
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  itemCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  itemMessage: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemTime: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
  },
  emptySub: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    maxWidth: 260,
  },
});
