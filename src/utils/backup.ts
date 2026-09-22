import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../db/client';
import { toISOString } from './date';
import { useTransactionStore } from '../stores/transactionStore';
import { useWalletStore } from '../stores/walletStore';
import { useCategoryStore } from '../stores/categoryStore';

export interface BackupData {
  version: number;
  exportedAt: string;
  app: string;
  data: {
    wallets: any[];
    categories: any[];
    transactions: any[];
    budgets: any[];
  };
}

export async function exportDatabaseToJSON(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = getDatabase();

    const wallets = db.getAllSync('SELECT * FROM wallets');
    const categories = db.getAllSync('SELECT * FROM categories');
    const transactions = db.getAllSync('SELECT * FROM transactions');
    const budgets = db.getAllSync('SELECT * FROM budgets');

    const backup: BackupData = {
      version: 2,
      exportedAt: toISOString(),
      app: 'ExpenseTracker',
      data: {
        wallets,
        categories,
        transactions,
        budgets,
      },
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `ExpenseTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File(Paths.cache, fileName);
    await file.write(jsonString);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Lưu hoặc chia sẻ bản sao lưu chi tiêu',
        UTI: 'public.json',
      });
    }

    return { success: true, filePath: file.uri };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi sao lưu dữ liệu' };
  }
}

export function restoreDatabaseFromJSONString(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed: BackupData = JSON.parse(jsonString);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.data ||
      !Array.isArray(parsed.data.wallets) ||
      !Array.isArray(parsed.data.categories) ||
      !Array.isArray(parsed.data.transactions)
    ) {
      return { success: false, error: 'Tệp sao lưu không hợp lệ hoặc bị hỏng định dạng.' };
    }

    const db = getDatabase();

    // Execute atomic restore using withTransactionSync to guarantee automatic rollback on any failure
    db.withTransactionSync(() => {
      db.execSync('DELETE FROM transactions;');
      db.execSync('DELETE FROM budgets;');
      db.execSync('DELETE FROM wallets;');
      db.execSync('DELETE FROM categories;');

      // Restore wallets
      for (const w of parsed.data.wallets) {
        if (!w || typeof w !== 'object' || !w.id || !w.name) continue;
        db.runSync(
          `INSERT INTO wallets (id, name, icon, color, initial_balance, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [w.id, w.name, w.icon || 'wallet', w.color || '#6C63FF', w.initial_balance ?? 0, w.created_at ?? toISOString()]
        );
      }

      // Restore categories
      for (const c of parsed.data.categories) {
        if (!c || typeof c !== 'object' || !c.id || !c.name) continue;
        db.runSync(
          `INSERT INTO categories (id, name, icon, color, type, is_default)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [c.id, c.name, c.icon || 'tag', c.color || '#6C63FF', c.type || 'EXPENSE', c.is_default ?? 0]
        );
      }

      // Restore transactions
      for (const t of parsed.data.transactions) {
        if (!t || typeof t !== 'object' || !t.id || typeof t.amount !== 'number') continue;
        db.runSync(
          `INSERT INTO transactions
             (id, amount, type, category_id, wallet_id, to_wallet_id, date, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.amount,
            t.type,
            t.category_id,
            t.wallet_id,
            t.to_wallet_id ?? null,
            t.date,
            t.note ?? null,
            t.created_at ?? toISOString(),
            t.updated_at ?? toISOString(),
          ]
        );
      }

      // Restore budgets
      if (Array.isArray(parsed.data.budgets)) {
        for (const b of parsed.data.budgets) {
          if (!b || typeof b !== 'object' || !b.id || !b.category_id) continue;
          db.runSync(
            `INSERT INTO budgets (id, category_id, limit_amount, month_year)
             VALUES (?, ?, ?, ?)`,
            [b.id, b.category_id, b.limit_amount, b.month_year]
          );
        }
      }
    });

    // Refresh stores after successful commit
    useTransactionStore.getState().loadAll();
    useWalletStore.getState().load();
    useCategoryStore.getState().load();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Không thể khôi phục dữ liệu sao lưu.';
    return { success: false, error: message };
  }
}
