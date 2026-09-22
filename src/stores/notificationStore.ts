import { create } from 'zustand';
import {
  NotificationRepository,
  AppNotification,
  CreateNotificationInput,
} from '../repositories/NotificationRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import {
  PendingTransactionRepository,
  PendingTransaction,
} from '../repositories/PendingTransactionRepository';
import { formatVND } from '../utils/currency';
import { NOTIFICATION_TYPES } from '../constants/enums';

const notifRepo = new NotificationRepository();
const budgetRepo = new BudgetRepository();
const txRepo = new TransactionRepository();
const pendingRepo = new PendingTransactionRepository();

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
  notifyPendingTransaction: (pending: PendingTransaction) => void;
  checkPendingTransactionsAlert: () => void;
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

  notifyPendingTransaction: (pending: PendingTransaction) => {
    try {
      const isExpense = pending.type === 'EXPENSE';
      notifRepo.create({
        title: `📝 Chi tiêu ở nháp mới (${pending.bankName})`,
        message: `Phát hiện ${isExpense ? 'khoản chi' : 'khoản thu'} ${formatVND(pending.amount)}: "${pending.note || 'Biến động số dư'}". Chạm để kiểm tra và xác nhận.`,
        type: NOTIFICATION_TYPES.REMINDER,
        actionUrl: 'pending_transactions',
      });
      get().load();
    } catch (e) {
      console.warn('Notify pending transaction failed:', e);
    }
  },

  checkPendingTransactionsAlert: () => {
    try {
      const pendingList = pendingRepo.getPending();
      if (pendingList.length === 0) return;

      const existing = notifRepo.getAll(15);
      const nowMs = Date.now();
      const alreadyNotified = existing.some(
        n =>
          (n.title.includes('chi tiêu đang ở nháp') || n.title.includes('giao dịch nháp')) &&
          nowMs - new Date(n.createdAt).getTime() < 4 * 60 * 60 * 1000 // within 4h
      );

      if (!alreadyNotified) {
        const totalAmount = pendingList.reduce((sum, p) => sum + p.amount, 0);
        notifRepo.create({
          title: `📋 Có ${pendingList.length} chi tiêu đang ở nháp`,
          message: `Bạn có ${pendingList.length} giao dịch (tổng ${formatVND(totalAmount)}) đang chờ xác nhận vào sổ. Nhấn để duyệt ngay!`,
          type: NOTIFICATION_TYPES.REMINDER,
          actionUrl: 'pending_transactions',
        });
        get().load();
      }
    } catch (e) {
      console.warn('Pending alert check failed:', e);
    }
  },
}));
