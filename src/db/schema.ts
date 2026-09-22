import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './client';
import { DEFAULT_CATEGORIES, DEFAULT_WALLET } from '../constants/defaultCategories';
import { toISOString } from '../utils/date';

const DB_VERSION = 2;

const CREATE_WALLETS = `
CREATE TABLE IF NOT EXISTS wallets (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL,
  color           TEXT NOT NULL,
  initial_balance INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);`;

const CREATE_CATEGORIES = `
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('EXPENSE','INCOME','BOTH')),
  is_default INTEGER NOT NULL DEFAULT 0
);`;

const CREATE_TRANSACTIONS = `
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  amount         INTEGER NOT NULL,
  type           TEXT NOT NULL CHECK(type IN ('EXPENSE','INCOME','TRANSFER')),
  category_id    TEXT NOT NULL REFERENCES categories(id),
  wallet_id      TEXT NOT NULL REFERENCES wallets(id),
  to_wallet_id   TEXT REFERENCES wallets(id),
  date           TEXT NOT NULL,
  note           TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);`;

const CREATE_BUDGETS = `
CREATE TABLE IF NOT EXISTS budgets (
  id           TEXT PRIMARY KEY,
  category_id  TEXT NOT NULL REFERENCES categories(id),
  limit_amount INTEGER NOT NULL,
  month_year   TEXT NOT NULL,
  UNIQUE(category_id, month_year)
);`;

const CREATE_NOTIFICATIONS = `
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('BUDGET_WARNING','BUDGET_EXCEEDED','LOW_BALANCE','APP_UPDATE','SYSTEM','REMINDER')),
  is_read     INTEGER NOT NULL DEFAULT 0,
  action_url  TEXT,
  created_at  TEXT NOT NULL
);`;

const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_tx_date      ON transactions(date);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_category  ON transactions(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_wallet    ON transactions(wallet_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_type      ON transactions(type);`,
  `CREATE INDEX IF NOT EXISTS idx_notif_date   ON notifications(created_at);`,
];

const CREATE_META = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`;

export function initDatabase(): void {
  const db = getDatabase();

  db.execSync(CREATE_META);
  db.execSync(CREATE_WALLETS);
  db.execSync(CREATE_CATEGORIES);
  db.execSync(CREATE_TRANSACTIONS);
  db.execSync(CREATE_BUDGETS);
  db.execSync(CREATE_NOTIFICATIONS);

  for (const idx of CREATE_INDEXES) {
    db.execSync(idx);
  }

  // Check if already seeded
  const meta = db.getFirstSync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['seeded']
  );

  if (!meta) {
    seedDefaultData(db);
    db.runSync(
      'INSERT INTO meta (key, value) VALUES (?, ?)',
      ['seeded', '1']
    );
  }

  db.runSync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    ['db_version', String(DB_VERSION)]
  );
}

function seedDefaultData(db: SQLiteDatabase): void {
  const now = toISOString();

  // Insert default wallet
  db.runSync(
    `INSERT OR IGNORE INTO wallets (id, name, icon, color, initial_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      DEFAULT_WALLET.id,
      DEFAULT_WALLET.name,
      DEFAULT_WALLET.icon,
      DEFAULT_WALLET.color,
      DEFAULT_WALLET.initialBalance,
      now,
    ]
  );

  // Insert default categories
  for (const cat of DEFAULT_CATEGORIES) {
    db.runSync(
      `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault]
    );
  }
}

export function resetDatabase(): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.execSync('DELETE FROM transactions;');
    db.execSync('DELETE FROM budgets;');
    db.execSync('DELETE FROM wallets;');
    db.execSync('DELETE FROM categories;');
    db.execSync('DELETE FROM notifications;');
    seedDefaultData(db);
  });
}
