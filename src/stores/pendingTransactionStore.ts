import { create } from 'zustand';
import {
  PendingTransaction,
  PendingTransactionRepository,
} from '../repositories/PendingTransactionRepository';
import { parseBankNotification, SUPPORTED_BANKS } from '../services/bankParser';
import { learnKeywordCategory } from '../services/autoCategorizer';
import { useTransactionStore } from './transactionStore';
import { useWalletStore } from './walletStore';
import { useNotificationStore } from './notificationStore';
import { toISOString } from '../utils/date';

interface PendingTransactionState {
  pendingList: PendingTransaction[];
  activeBannerItem: PendingTransaction | null;
  isAutoDetectEnabled: boolean;

  // Actions
  loadPending: () => void;
  processNotification: (
    packageName: string,
    title: string,
    body: string
  ) => PendingTransaction | null;
  confirmPending: (
    id: string,
    overrides?: {
      categoryId?: string;
      walletId?: string;
      note?: string;
      amount?: number;
    }
  ) => void;
  dismissPending: (id: string) => void;
  dismissBanner: () => void;
  setActiveBannerItem: (item: PendingTransaction | null) => void;
  toggleAutoDetect: (enabled: boolean) => void;

  // Simulation test tool
  simulateBankNotification: (bankId?: string) => PendingTransaction;
}

const repo = new PendingTransactionRepository();

export const usePendingTransactionStore = create<PendingTransactionState>((set, get) => ({
  pendingList: [],
  activeBannerItem: null,
  isAutoDetectEnabled: true,

  loadPending: () => {
    try {
      const pendingList = repo.getPending();
      set({ pendingList });
      // If there's pending and no active banner, show the newest one
      if (pendingList.length > 0 && !get().activeBannerItem) {
        set({ activeBannerItem: pendingList[0] });
      }
    } catch {
      // fallback
    }
  },

  processNotification: (packageName: string, title: string, body: string) => {
    if (!get().isAutoDetectEnabled) return null;

    const parsed = parseBankNotification(packageName, title, body);
    if (!parsed) return null;

    const created = repo.create({
      bankPackage: parsed.bankPackage,
      bankName: parsed.bankName,
      amount: parsed.amount,
      type: parsed.type,
      note: parsed.note,
      suggestedCategoryId: parsed.suggestedCategoryId,
      isConfident: parsed.isConfident,
      rawContent: parsed.rawContent,
    });

    const currentList = get().pendingList;
    set({
      pendingList: [created, ...currentList],
      activeBannerItem: created, // Instantly trigger Dynamic Island banner!
    });

    // Notify user in Notification center
    useNotificationStore.getState().notifyPendingTransaction(created);

    return created;
  },

  confirmPending: (id: string, overrides) => {
    const item = get().pendingList.find(p => p.id === id) || get().activeBannerItem;
    if (!item) return;

    const finalCategoryId = overrides?.categoryId || item.suggestedCategoryId || 'cat_food';
    const finalNote = overrides?.note !== undefined ? overrides.note : item.note;
    const finalAmount = overrides?.amount !== undefined ? overrides.amount : item.amount;

    // Get default wallet
    const defaultWalletId = useWalletStore.getState().wallets[0]?.id || 'wallet_cash';
    const finalWalletId = overrides?.walletId || defaultWalletId;

    // 1. Add to main transactions
    useTransactionStore.getState().add({
      amount: finalAmount,
      type: item.type,
      categoryId: finalCategoryId,
      walletId: finalWalletId,
      date: toISOString(),
      note: finalNote ? `${finalNote} (${item.bankName})` : `Thanh toán qua ${item.bankName}`,
    });

    // 2. Train auto-categorizer with this choice
    if (finalNote) {
      learnKeywordCategory(finalNote, finalCategoryId);
    }

    // 3. Mark confirmed in SQLite
    repo.markConfirmed(id);

    // 4. Update store state
    const remaining = get().pendingList.filter(p => p.id !== id);
    set({
      pendingList: remaining,
      activeBannerItem: get().activeBannerItem?.id === id ? null : get().activeBannerItem,
    });
  },

  dismissPending: (id: string) => {
    repo.markDismissed(id);
    const remaining = get().pendingList.filter(p => p.id !== id);
    set({
      pendingList: remaining,
      activeBannerItem: get().activeBannerItem?.id === id ? null : get().activeBannerItem,
    });
  },

  dismissBanner: () => {
    set({ activeBannerItem: null });
  },

  setActiveBannerItem: (item) => {
    set({ activeBannerItem: item });
  },

  toggleAutoDetect: (enabled: boolean) => {
    set({ isAutoDetectEnabled: enabled });
  },

  simulateBankNotification: (bankId?: string) => {
    const banks = SUPPORTED_BANKS;
    const selectedBank = banks.find(b => b.id === bankId) || banks[0];

    const mockSamples = [
      {
        title: 'VietinBank iPay',
        body: 'Giao dich: -15,000 VND. ND: 127C609212LF4YNE 6264ICBVC2FYBVJE QR - TRAN VAN HUNG Chuyen tien; tai iPay',
        amount: 15000,
        note: 'Quét QR - Tran Van Hung',
        type: 'EXPENSE' as const,
        cat: 'cat_food',
        isConfident: false,
      },
      {
        title: 'VietinBank iPay',
        body: 'Giao dich: -10,000 VND. ND: CT DI:626508379365 QR - Thanh toan hoa don; tai iPay',
        amount: 10000,
        note: 'Quét mã QR thanh toán',
        type: 'EXPENSE' as const,
        cat: 'cat_food',
        isConfident: false,
      },
      {
        title: 'Vietcombank: Biến động số dư',
        body: 'TK 0123456789 -65,000VND vao 14:35. ND: Highlands Coffee Tran Duy Hung',
        amount: 65000,
        note: 'Highlands Coffee Tran Duy Hung',
        type: 'EXPENSE' as const,
        cat: 'cat_coffee',
        isConfident: true,
      },
      {
        title: 'Techcombank Mobile',
        body: 'Quy khach da thanh toan 42,000 VND cho GrabBike. So du cuoi...',
        amount: 42000,
        note: 'GrabBike',
        type: 'EXPENSE' as const,
        cat: 'cat_transport',
        isConfident: true,
      },
      {
        title: 'Vietcombank: Nhận tiền',
        body: 'TK 0123456789 +18,500,000VND vao 09:00. ND: Cong ty ABC thanh toan luong thang 9',
        amount: 18500000,
        note: 'Cong ty ABC thanh toan luong thang 9',
        type: 'INCOME' as const,
        cat: 'cat_salary',
        isConfident: true,
      },
    ];

    const randomSample = mockSamples[Math.floor(Math.random() * mockSamples.length)];

    const created = repo.create({
      bankPackage: selectedBank.packageNames[0],
      bankName: selectedBank.name,
      amount: randomSample.amount,
      type: randomSample.type,
      note: randomSample.note,
      suggestedCategoryId: randomSample.cat,
      isConfident: randomSample.isConfident,
      rawContent: `${randomSample.title} - ${randomSample.body}`,
    });

    const currentList = get().pendingList;
    set({
      pendingList: [created, ...currentList],
      activeBannerItem: created,
    });

    // Notify user in Notification center
    useNotificationStore.getState().notifyPendingTransaction(created);

    return created;
  },
}));
