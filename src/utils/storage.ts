import { getDatabase } from '../db/client';

export class AppStorage {
  private cache: Map<string, string> = new Map();
  private initialized = false;

  private init(): void {
    if (this.initialized) return;
    try {
      const db = getDatabase();
      db.execSync('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
      const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM meta;');
      for (const row of rows) {
        this.cache.set(row.key, row.value);
      }
      this.initialized = true;
    } catch {
      // If database is not ready yet, keep in-memory values
    }
  }

  getString(key: string): string | undefined {
    this.init();
    return this.cache.get(key);
  }

  getBoolean(key: string): boolean | undefined {
    this.init();
    const val = this.cache.get(key);
    if (val === undefined) return undefined;
    return val === 'true' || val === '1';
  }

  getNumber(key: string): number | undefined {
    this.init();
    const val = this.cache.get(key);
    if (val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }

  set(key: string, value: string | boolean | number): void {
    this.init();
    const strVal = String(value);
    this.cache.set(key, strVal);
    try {
      const db = getDatabase();
      db.runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, strVal]);
    } catch {
      // Fallback
    }
  }

  delete(key: string): void {
    this.init();
    this.cache.delete(key);
    try {
      const db = getDatabase();
      db.runSync('DELETE FROM meta WHERE key = ?', [key]);
    } catch {
      // Fallback
    }
  }
}

export const appStorage = new AppStorage();

export function createMMKV(_config?: { id?: string }): AppStorage {
  return appStorage;
}
