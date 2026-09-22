import { getDatabase, generateId } from '../db/client';
import { toISOString } from '../utils/date';

export interface Transaction {
  id: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId: string;
  walletId: string;
  toWalletId?: string | null;
  date: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithDetails extends Transaction {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  walletName: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId: string;
  walletId: string;
  toWalletId?: string;
  date: string;
  note?: string;
}

function mapRow(row: any): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    categoryId: row.category_id,
    walletId: row.wallet_id,
    toWalletId: row.to_wallet_id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDetailRow(row: any): TransactionWithDetails {
  return {
    ...mapRow(row),
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    walletName: row.wallet_name,
  };
}

const DETAIL_SELECT = `
  SELECT
    t.*,
    c.name  AS category_name,
    c.icon  AS category_icon,
    c.color AS category_color,
    w.name  AS wallet_name
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN wallets    w ON t.wallet_id   = w.id
`;

export class TransactionRepository {
  private db = getDatabase();

  create(input: CreateTransactionInput): Transaction {
    const id = generateId();
    const now = toISOString();
    this.db.runSync(
      `INSERT INTO transactions
         (id, amount, type, category_id, wallet_id, to_wallet_id, date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.amount,
        input.type,
        input.categoryId,
        input.walletId,
        input.toWalletId ?? null,
        input.date,
        input.note ?? null,
        now,
        now,
      ]
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<CreateTransactionInput>): Transaction {
    const now = toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (input.amount !== undefined) { fields.push('amount = ?'); values.push(input.amount); }
    if (input.type !== undefined) { fields.push('type = ?'); values.push(input.type); }
    if (input.categoryId !== undefined) { fields.push('category_id = ?'); values.push(input.categoryId); }
    if (input.walletId !== undefined) { fields.push('wallet_id = ?'); values.push(input.walletId); }
    if (input.toWalletId !== undefined) { fields.push('to_wallet_id = ?'); values.push(input.toWalletId); }
    if (input.date !== undefined) { fields.push('date = ?'); values.push(input.date); }
    if (input.note !== undefined) { fields.push('note = ?'); values.push(input.note); }

    fields.push('updated_at = ?');
    values.push(now, id);

    this.db.runSync(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  }

  getById(id: string): Transaction | null {
    const row = this.db.getFirstSync<any>(
      `${DETAIL_SELECT} WHERE t.id = ?`,
      [id]
    );
    return row ? mapDetailRow(row) : null;
  }

  getAll(limit = 200, offset = 0): TransactionWithDetails[] {
    const rows = this.db.getAllSync<any>(
      `${DETAIL_SELECT} ORDER BY t.date DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map(mapDetailRow);
  }

  getByDateRange(from: string, to: string): TransactionWithDetails[] {
    const rows = this.db.getAllSync<any>(
      `${DETAIL_SELECT} WHERE t.date >= ? AND t.date <= ? ORDER BY t.date DESC`,
      [from, to]
    );
    return rows.map(mapDetailRow);
  }

  getByWallet(walletId: string): TransactionWithDetails[] {
    const rows = this.db.getAllSync<any>(
      `${DETAIL_SELECT} WHERE t.wallet_id = ? ORDER BY t.date DESC`,
      [walletId]
    );
    return rows.map(mapDetailRow);
  }

  // Aggregation: total income/expense for a wallet
  getWalletTotals(walletId: string): { totalIncome: number; totalExpense: number } {
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
    const transferIn = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE to_wallet_id = ? AND type = 'TRANSFER'`,
      [walletId]
    );
    const transferOut = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE wallet_id = ? AND type = 'TRANSFER'`,
      [walletId]
    );
    return {
      totalIncome: (income?.total ?? 0) + (transferIn?.total ?? 0),
      totalExpense: (expense?.total ?? 0) + (transferOut?.total ?? 0),
    };
  }

  // Monthly totals by category for analytics
  getMonthlyCategoryTotals(
    monthYear: string,
    type: 'EXPENSE' | 'INCOME'
  ): { categoryId: string; categoryName: string; categoryColor: string; categoryIcon: string; total: number }[] {
    const rows = this.db.getAllSync<any>(
      `SELECT
         t.category_id,
         c.name  AS category_name,
         c.color AS category_color,
         c.icon  AS category_icon,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = ? AND strftime('%Y-%m', t.date) = ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [type, monthYear]
    );
    return rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryColor: r.category_color,
      categoryIcon: r.category_icon,
      total: r.total,
    }));
  }

  // Spending by category for a date range
  getCategoryTotalsInRange(
    from: string,
    to: string,
    type: 'EXPENSE' | 'INCOME' = 'EXPENSE'
  ): { categoryId: string; categoryName: string; categoryColor: string; total: number }[] {
    const rows = this.db.getAllSync<any>(
      `SELECT
         t.category_id,
         c.name  AS category_name,
         c.color AS category_color,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = ? AND t.date >= ? AND t.date <= ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [type, from, to]
    );
    return rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryColor: r.category_color,
      total: r.total,
    }));
  }

  getTotalsByCategory(
    from: string,
    to: string,
    type: 'EXPENSE' | 'INCOME' = 'EXPENSE'
  ): { categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; total: number }[] {
    const rows = this.db.getAllSync<any>(
      `SELECT
         t.category_id,
         c.name  AS category_name,
         c.color AS category_color,
         c.icon  AS category_icon,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = ? AND t.date >= ? AND t.date <= ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [type, from, to]
    );
    return rows.map(r => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryColor: r.category_color,
      categoryIcon: r.category_icon,
      total: r.total,
    }));
  }

  getTotalByType(type: 'EXPENSE' | 'INCOME', from: string, to: string): number {
    const row = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = ? AND date >= ? AND date <= ?`,
      [type, from, to]
    );
    return row?.total ?? 0;
  }

  // Spent in a category for a month (for budget alert)
  getCategorySpentInMonth(categoryId: string, monthYear: string): number {
    const row = this.db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE category_id = ? AND type = 'EXPENSE'
         AND strftime('%Y-%m', date) = ?`,
      [categoryId, monthYear]
    );
    return row?.total ?? 0;
  }

  // Daily totals for bar chart
  getDailyTotalsInRange(
    from: string,
    to: string
  ): { date: string; income: number; expense: number }[] {
    const rows = this.db.getAllSync<any>(
      `SELECT
         strftime('%Y-%m-%d', date) AS day,
         SUM(CASE WHEN type='INCOME'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE date >= ? AND date <= ?
       GROUP BY day
       ORDER BY day ASC`,
      [from, to]
    );
    return rows.map(r => ({ date: r.day, income: r.income, expense: r.expense }));
  }
}
