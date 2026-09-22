import { create } from 'zustand';
import {
  TransactionRepository,
  Transaction,
  TransactionWithDetails,
  CreateTransactionInput,
} from '../repositories/TransactionRepository';
import { getDateRange } from '../utils/date';
import { useNotificationStore } from './notificationStore';
import { TRANSACTION_TYPES } from '../constants/enums';

interface TransactionState {
  transactions: TransactionWithDetails[];
  isLoading: boolean;

  // Actions
  loadAll: () => void;
  loadByDateRange: (from: string, to: string) => void;
  add: (input: CreateTransactionInput) => Transaction;
  update: (id: string, input: Partial<CreateTransactionInput>) => Transaction;
  remove: (id: string) => void;
}

const repo = new TransactionRepository();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,

  loadAll: () => {
    set({ isLoading: true });
    const transactions = repo.getAll();
    set({ transactions, isLoading: false });
  },

  loadByDateRange: (from: string, to: string) => {
    set({ isLoading: true });
    const transactions = repo.getByDateRange(from, to);
    set({ transactions, isLoading: false });
  },

  add: (input: CreateTransactionInput) => {
    const tx = repo.create(input);
    // Reload to get full details
    const { loadAll } = get();
    loadAll();

    // Trigger budget check if expense
    if (input.type === TRANSACTION_TYPES.EXPENSE && input.categoryId) {
      try {
        const monthYear = (input.date || new Date().toISOString()).substring(0, 7);
        useNotificationStore.getState().checkBudgetAlerts(input.categoryId, monthYear);
      } catch (e) {
        // ignore notification trigger errors
      }
    }

    return tx;
  },

  update: (id: string, input: Partial<CreateTransactionInput>) => {
    const tx = repo.update(id, input);
    const { loadAll } = get();
    loadAll();

    if (tx.type === TRANSACTION_TYPES.EXPENSE && tx.categoryId) {
      try {
        const monthYear = (tx.date || new Date().toISOString()).substring(0, 7);
        useNotificationStore.getState().checkBudgetAlerts(tx.categoryId, monthYear);
      } catch (e) {
        // ignore notification trigger errors
      }
    }

    return tx;
  },

  remove: (id: string) => {
    repo.delete(id);
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id),
    }));
  },
}));
