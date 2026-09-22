import { getDatabase, generateId } from '../db/client';
import { toISOString } from '../utils/date';

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  initialBalance: number;
  createdAt: string;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
}

function mapRow(row: any): Wallet {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    initialBalance: row.initial_balance,
    createdAt: row.created_at,
  };
}

export class WalletRepository {
  private db = getDatabase();

  create(input: { name: string; icon: string; color: string; initialBalance: number }): Wallet {
    const id = generateId();
    const now = toISOString();
    this.db.runSync(
      `INSERT INTO wallets (id, name, icon, color, initial_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.icon, input.color, input.initialBalance, now]
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<{ name: string; icon: string; color: string; initialBalance: number }>): Wallet {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.icon !== undefined) { fields.push('icon = ?'); values.push(input.icon); }
    if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }
    if (input.initialBalance !== undefined) { fields.push('initial_balance = ?'); values.push(input.initialBalance); }

    values.push(id);
    this.db.runSync(`UPDATE wallets SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM wallets WHERE id = ?', [id]);
  }

  getById(id: string): Wallet | null {
    const row = this.db.getFirstSync<any>('SELECT * FROM wallets WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  getAll(): Wallet[] {
    const rows = this.db.getAllSync<any>('SELECT * FROM wallets ORDER BY created_at ASC');
    return rows.map(mapRow);
  }

  getBalance(walletId: string, initialBalance: number): number {
    const income = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE wallet_id = ? AND type = 'INCOME'`,
      [walletId]
    );
    const expense = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE wallet_id = ? AND type = 'EXPENSE'`,
      [walletId]
    );
    const transferOut = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE wallet_id = ? AND type = 'TRANSFER'`,
      [walletId]
    );
    const transferIn = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE to_wallet_id = ? AND type = 'TRANSFER'`,
      [walletId]
    );
    return (
      initialBalance +
      (income?.total ?? 0) -
      (expense?.total ?? 0) -
      (transferOut?.total ?? 0) +
      (transferIn?.total ?? 0)
    );
  }

  getAllWithBalance(): WalletWithBalance[] {
    const wallets = this.getAll();
    return wallets.map(w => ({
      ...w,
      balance: this.getBalance(w.id, w.initialBalance),
    }));
  }

  getTotalBalance(): number {
    const walletsWithBalance = this.getAllWithBalance();
    return walletsWithBalance.reduce((sum, w) => sum + w.balance, 0);
  }
}
