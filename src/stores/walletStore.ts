import { create } from 'zustand';
import { WalletRepository, Wallet, WalletWithBalance } from '../repositories/WalletRepository';

interface WalletState {
  wallets: WalletWithBalance[];
  selectedWalletId: string | null;
  totalBalance: number;

  load: () => void;
  add: (input: { name: string; icon: string; color: string; initialBalance: number }) => Wallet;
  update: (id: string, input: Partial<{ name: string; icon: string; color: string; initialBalance: number }>) => Wallet;
  remove: (id: string) => void;
  selectWallet: (id: string | null) => void;
  refreshBalances: () => void;
}

const repo = new WalletRepository();

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  selectedWalletId: null,
  totalBalance: 0,

  load: () => {
    try {
      const wallets = repo.getAllWithBalance();
      const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
      set({ wallets, totalBalance });
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  },

  add: (input) => {
    try {
      const wallet = repo.create(input);
      get().load();
      return wallet;
    } catch (err) {
      console.error('Failed to create wallet:', err);
      throw err;
    }
  },

  update: (id, input) => {
    try {
      const wallet = repo.update(id, input);
      get().load();
      return wallet;
    } catch (err) {
      console.error('Failed to update wallet:', err);
      throw err;
    }
  },

  remove: (id) => {
    try {
      repo.delete(id);
      set(state => {
        const nextWallets = state.wallets.filter(w => w.id !== id);
        return {
          wallets: nextWallets,
          totalBalance: nextWallets.reduce((sum, w) => sum + w.balance, 0),
          selectedWalletId: state.selectedWalletId === id ? null : state.selectedWalletId,
        };
      });
    } catch (err) {
      console.error('Failed to delete wallet:', err);
      throw err;
    }
  },

  selectWallet: (id) => set({ selectedWalletId: id }),

  refreshBalances: () => {
    try {
      const wallets = repo.getAllWithBalance();
      const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
      set({ wallets, totalBalance });
    } catch (err) {
      console.error('Failed to refresh wallet balances:', err);
    }
  },
}));
