import { create } from 'zustand';
import {
  NotificationRepository,
  AppNotification,
  CreateNotificationInput,
} from '../repositories/NotificationRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { formatVND } from '../utils/currency';
import { NOTIFICATION_TYPES } from '../constants/enums';

const notifRepo = new NotificationRepository();
const budgetRepo = new BudgetRepository();
const txRepo = new TransactionRepository();

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;

  load: () => void;
  addNotification: (input: CreateNotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  checkBudgetAlerts: (categoryId: string, monthYear: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  load: () => {
    try {
      const list = notifRepo.getAll();
      const count = notifRepo.getUnreadCount();
      set({ notifications: list, unreadCount: count });
    } catch {
      // Graceful fallback on DB read error
    }
  },

  addNotification: (input: CreateNotificationInput) => {
    try {
      notifRepo.create(input);
      get().load();
    } catch {
      // Graceful fallback
    }
  },

  markAsRead: (id: string) => {
    try {
      notifRepo.markAsRead(id);
      get().load();
    } catch {
      // Graceful fallback
    }
  },

  markAllAsRead: () => {
    try {
      notifRepo.markAllAsRead();
      get().load();
    } catch {
      // Graceful fallback
    }
  },

  removeNotification: (id: string) => {
    try {
      notifRepo.delete(id);
      get().load();
    } catch {
      // Graceful fallback
    }
  },

  clearAll: () => {
    try {
      notifRepo.clearAll();
      get().load();
    } catch {
      // Graceful fallback
    }
  },

  checkBudgetAlerts: (categoryId: string, monthYear: string) => {
    try {
      const budget = budgetRepo.getByCategoryAndMonth(categoryId, monthYear);
      if (!budget) return;

      const spent = budget.spent;
      const limit = budget.limitAmount;
      const ratio = budget.ratio;

      // Check if recently notified to prevent spamming
      const existing = notifRepo.getAll(10);
      const nowMs = Date.now();

      if (ratio >= 1.0) {
        const alreadyNotified = existing.some(
          n =>
            n.type === NOTIFICATION_TYPES.BUDGET_EXCEEDED &&
            n.message.includes(budget.categoryName) &&
            nowMs - new Date(n.createdAt).getTime() < 12 * 60 * 60 * 1000 // within 12h
        );

        if (!alreadyNotified) {
          notifRepo.create({
            title: `🚨 Vượt hạn mức: ${budget.categoryName}`,
            message: `Bạn đã chi tiêu ${formatVND(spent)} / ${formatVND(limit)} (${Math.round(ratio * 100)}%) cho danh mục ${budget.categoryName}.`,
            type: NOTIFICATION_TYPES.BUDGET_EXCEEDED,
            actionUrl: '/(tabs)/budget',
          });
          get().load();
        }
      } else if (ratio >= 0.8) {
        const alreadyNotified = existing.some(
          n =>
            n.type === NOTIFICATION_TYPES.BUDGET_WARNING &&
            n.message.includes(budget.categoryName) &&
            nowMs - new Date(n.createdAt).getTime() < 12 * 60 * 60 * 1000
        );

        if (!alreadyNotified) {
          notifRepo.create({
            title: `⚠️ Cảnh báo ngân sách: ${budget.categoryName}`,
            message: `Chi tiêu danh mục ${budget.categoryName} đã chạm ${Math.round(ratio * 100)}% hạn mức (${formatVND(spent)} / ${formatVND(limit)}).`,
            type: NOTIFICATION_TYPES.BUDGET_WARNING,
            actionUrl: '/(tabs)/budget',
          });
          get().load();
        }
      }
    } catch (e) {
      // Prevent notification calculation errors from disrupting transactions
      console.warn('Budget alert check failed:', e);
    }
  },
}));
