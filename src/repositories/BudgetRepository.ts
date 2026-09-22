import { getDatabase, generateId } from '../db/client';
import { getCurrentMonthYear } from '../utils/date';

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  monthYear: string;
}

export interface BudgetWithSpent extends Budget {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number;
  ratio: number; // 0.0 to 1.0+
}

function mapRow(row: any): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    limitAmount: row.limit_amount,
    monthYear: row.month_year,
  };
}

export class BudgetRepository {
  private db = getDatabase();

  upsert(input: { categoryId: string; limitAmount: number; monthYear: string }): Budget {
    const existing = this.db.getFirstSync<any>(
      'SELECT * FROM budgets WHERE category_id = ? AND month_year = ?',
      [input.categoryId, input.monthYear]
    );

    if (existing) {
      this.db.runSync(
        'UPDATE budgets SET limit_amount = ? WHERE id = ?',
        [input.limitAmount, existing.id]
      );
      return this.getById(existing.id)!;
    } else {
      const id = generateId();
      this.db.runSync(
        `INSERT INTO budgets (id, category_id, limit_amount, month_year)
         VALUES (?, ?, ?, ?)`,
        [id, input.categoryId, input.limitAmount, input.monthYear]
      );
      return this.getById(id)!;
    }
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM budgets WHERE id = ?', [id]);
  }

  getById(id: string): Budget | null {
    const row = this.db.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  getByMonth(monthYear: string): Budget[] {
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM budgets WHERE month_year = ?',
      [monthYear]
    );
    return rows.map(mapRow);
  }

  getByMonthWithSpent(monthYear: string): BudgetWithSpent[] {
    const rows = this.db.getAllSync<any>(
      `SELECT
         b.*,
         c.name  AS category_name,
         c.icon  AS category_icon,
         c.color AS category_color,
         COALESCE(
           (SELECT SUM(t.amount) FROM transactions t
            WHERE t.category_id = b.category_id
              AND t.type = 'EXPENSE'
              AND strftime('%Y-%m', t.date) = b.month_year),
           0
         ) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.month_year = ?
       ORDER BY spent DESC`,
      [monthYear]
    );
    return rows.map(r => ({
      id: r.id,
      categoryId: r.category_id,
      limitAmount: r.limit_amount,
      monthYear: r.month_year,
      categoryName: r.category_name,
      categoryIcon: r.category_icon,
      categoryColor: r.category_color,
      spent: r.spent,
      ratio: r.spent / r.limit_amount,
    }));
  }

  getBudgetForCategory(categoryId: string, monthYear: string = getCurrentMonthYear()): Budget | null {
    const row = this.db.getFirstSync<any>(
      'SELECT * FROM budgets WHERE category_id = ? AND month_year = ?',
      [categoryId, monthYear]
    );
    return row ? mapRow(row) : null;
  }

  getByCategoryAndMonth(categoryId: string, monthYear: string): BudgetWithSpent | null {
    const list = this.getByMonthWithSpent(monthYear);
    return list.find(b => b.categoryId === categoryId) ?? null;
  }
}
