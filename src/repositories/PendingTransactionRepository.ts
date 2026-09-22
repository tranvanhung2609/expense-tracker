import { getDatabase } from '../db/client';
import { toISOString } from '../utils/date';

export interface PendingTransaction {
  id: string;
  bankPackage: string;
  bankName: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  note: string;
  suggestedCategoryId: string;
  isConfident?: boolean;
  rawContent: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
  createdAt: string;
}

export class PendingTransactionRepository {
  create(data: Omit<PendingTransaction, 'id' | 'status' | 'createdAt'>): PendingTransaction {
    const db = getDatabase();
    const id = `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = toISOString();
    const status = 'PENDING';

    db.runSync(
      `INSERT INTO pending_transactions (
        id, bank_package, bank_name, amount, type, note, suggested_category_id, raw_content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.bankPackage,
        data.bankName,
        data.amount,
        data.type,
        data.note || '',
        data.suggestedCategoryId || null,
        data.rawContent || '',
        status,
        now,
      ]
    );

    return {
      id,
      bankPackage: data.bankPackage,
      bankName: data.bankName,
      amount: data.amount,
      type: data.type,
      note: data.note,
      suggestedCategoryId: data.suggestedCategoryId,
      isConfident: data.isConfident,
      rawContent: data.rawContent,
      status,
      createdAt: now,
    };
  }

  getPending(): PendingTransaction[] {
    const db = getDatabase();
    const rows = db.getAllSync<{
      id: string;
      bank_package: string;
      bank_name: string;
      amount: number;
      type: 'EXPENSE' | 'INCOME';
      note: string;
      suggested_category_id: string;
      raw_content: string;
      status: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
      created_at: string;
    }>(
      `SELECT * FROM pending_transactions 
       WHERE status = 'PENDING' 
       ORDER BY created_at DESC LIMIT 50`
    );

    return rows.map(r => ({
      id: r.id,
      bankPackage: r.bank_package,
      bankName: r.bank_name,
      amount: r.amount,
      type: r.type,
      note: r.note,
      suggestedCategoryId: r.suggested_category_id,
      rawContent: r.raw_content,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  markConfirmed(id: string): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE pending_transactions SET status = 'CONFIRMED' WHERE id = ?`,
      [id]
    );
  }

  markDismissed(id: string): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE pending_transactions SET status = 'DISMISSED' WHERE id = ?`,
      [id]
    );
  }

  delete(id: string): void {
    const db = getDatabase();
    db.runSync(`DELETE FROM pending_transactions WHERE id = ?`, [id]);
  }
}
