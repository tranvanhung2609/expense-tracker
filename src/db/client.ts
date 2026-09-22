import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('expense_tracker.db');
  }
  return db;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
