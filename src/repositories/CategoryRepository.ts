import { getDatabase, generateId } from '../db/client';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  isDefault: number;
}

function mapRow(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    isDefault: row.is_default,
  };
}

export class CategoryRepository {
  private db = getDatabase();

  create(input: { name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME' | 'BOTH' }): Category {
    const id = generateId();
    this.db.runSync(
      `INSERT INTO categories (id, name, icon, color, type, is_default)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, input.name, input.icon, input.color, input.type]
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<{ name: string; icon: string; color: string; type: string }>): Category {
    const fields: string[] = [];
    const values: any[] = [];
    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.icon !== undefined) { fields.push('icon = ?'); values.push(input.icon); }
    if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }
    if (input.type !== undefined) { fields.push('type = ?'); values.push(input.type); }
    values.push(id);
    this.db.runSync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  }

  getById(id: string): Category | null {
    const row = this.db.getFirstSync<any>('SELECT * FROM categories WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  getAll(): Category[] {
    const rows = this.db.getAllSync<any>('SELECT * FROM categories ORDER BY is_default DESC, name ASC');
    return rows.map(mapRow);
  }

  getByType(type: 'EXPENSE' | 'INCOME'): Category[] {
    const rows = this.db.getAllSync<any>(
      `SELECT * FROM categories WHERE type = ? OR type = 'BOTH' ORDER BY is_default DESC, name ASC`,
      [type]
    );
    return rows.map(mapRow);
  }
}
