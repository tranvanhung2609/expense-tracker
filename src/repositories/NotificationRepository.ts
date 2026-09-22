import { getDatabase, generateId } from '../db/client';
import { toISOString } from '../utils/date';

export type NotificationType =
  | 'BUDGET_WARNING'
  | 'BUDGET_EXCEEDED'
  | 'LOW_BALANCE'
  | 'APP_UPDATE'
  | 'SYSTEM'
  | 'REMINDER';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
}

function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: Boolean(row.is_read),
    actionUrl: row.action_url,
    createdAt: row.created_at,
  };
}

export class NotificationRepository {
  private db = getDatabase();

  create(input: CreateNotificationInput): AppNotification {
    const id = generateId();
    const now = toISOString();
    this.db.runSync(
      `INSERT INTO notifications (id, title, message, type, is_read, action_url, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, input.title, input.message, input.type, input.actionUrl ?? null, now]
    );
    return this.getById(id)!;
  }

  getById(id: string): AppNotification | null {
    const row = this.db.getFirstSync<any>('SELECT * FROM notifications WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  getAll(limit = 50): AppNotification[] {
    const rows = this.db.getAllSync<any>(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map(mapRow);
  }

  getUnreadCount(): number {
    const row = this.db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'
    );
    return row?.count ?? 0;
  }

  markAsRead(id: string): void {
    this.db.runSync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  }

  markAllAsRead(): void {
    this.db.runSync('UPDATE notifications SET is_read = 1');
  }

  delete(id: string): void {
    this.db.runSync('DELETE FROM notifications WHERE id = ?', [id]);
  }

  clearAll(): void {
    this.db.runSync('DELETE FROM notifications');
  }
}
