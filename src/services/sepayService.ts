import { createMMKV } from '../utils/storage';
import { usePendingTransactionStore } from '../stores/pendingTransactionStore';
import { PendingTransactionRepository, PendingTransaction } from '../repositories/PendingTransactionRepository';
import { suggestCategory } from './autoCategorizer';
import { useNotificationStore } from '../stores/notificationStore';
import { sendSystemTransactionNotifications } from './systemNotificationService';

const storage = createMMKV({ id: 'sepay-settings' });
const pendingRepo = new PendingTransactionRepository();

const KEY_API_TOKEN = 'sepay_api_token';
const KEY_AUTO_SYNC = 'sepay_auto_sync';
const KEY_LAST_SYNCED_AT = 'sepay_last_synced_at';
const KEY_SYNCED_IDS = 'sepay_synced_ids'; // JSON array of transaction IDs/reference numbers

/**
 * Standard SePay Webhook Payload structure
 * @see https://developer.sepay.vn/
 */
export interface SepayWebhookPayload {
  id: string | number;
  gateway?: string; // Tên ngân hàng: Vietcombank, MBBank, Techcombank, TPBank, ACB...
  transactionDate?: string; // YYYY-MM-DD HH:mm:ss
  accountNumber?: string;
  transferType?: 'in' | 'out'; // in: Tiền vào (+), out: Tiền ra (-)
  transferAmount?: number; // Số tiền giao dịch (VND)
  accumulated?: number; // Số dư tài khoản sau giao dịch
  content?: string; // Nội dung chuyển khoản
  code?: string | null; // Mã thanh toán
  referenceCode?: string; // Mã tham chiếu giao dịch ngân hàng
  description?: string;

  // Hỗ trợ thêm các trường từ SePay API v1 / v2
  bank_brand_name?: string;
  transaction_content?: string;
  amount_in?: number;
  amount_out?: number;
  reference_number?: string;
}

export interface SepayApiResponse {
  status: string;
  data: SepayWebhookPayload[];
  messages?: { success?: boolean };
}

/**
 * Sample SePay Webhook Payload for testing and simulation
 */
export const SAMPLE_SEPAY_WEBHOOK: SepayWebhookPayload = {
  id: 'SEPAY_TEST_' + Date.now().toString().slice(-6),
  gateway: 'Vietcombank',
  transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
  accountNumber: '9988776655',
  transferType: 'out',
  transferAmount: 65000,
  accumulated: 18500000,
  content: 'Chi tieu ca phe Highlands Coffee',
  referenceCode: 'VCB.' + Date.now().toString().slice(-8),
  description: 'Thanh toán SePay',
};

/**
 * Get the stored SePay API Token
 */
export function getSepayToken(): string | null {
  try {
    const token = storage.getString(KEY_API_TOKEN);
    return token && token.trim().length > 0 ? token.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Save or clear the SePay API Token
 */
export function setSepayToken(token: string | null): void {
  try {
    if (token && token.trim().length > 0) {
      storage.set(KEY_API_TOKEN, token.trim());
    } else {
      storage.delete(KEY_API_TOKEN);
    }
  } catch (err) {
    console.error('[SepayService] Failed to save token:', err);
  }
}

/**
 * Check if SePay is configured
 */
export function isSepayConfigured(): boolean {
  return Boolean(getSepayToken());
}

/**
 * Check if auto-sync on app launch is enabled
 */
export function isSepayAutoSyncEnabled(): boolean {
  try {
    const val = storage.getBoolean(KEY_AUTO_SYNC);
    return typeof val === 'boolean' ? val : true; // Default true
  } catch {
    return true;
  }
}

/**
 * Toggle auto-sync on app launch
 */
export function setSepayAutoSync(enabled: boolean): void {
  try {
    storage.set(KEY_AUTO_SYNC, enabled);
  } catch (err) {
    console.error('[SepayService] Failed to set auto sync:', err);
  }
}

/**
 * Get last synced time string
 */
export function getSepayLastSyncedAt(): string | null {
  try {
    return storage.getString(KEY_LAST_SYNCED_AT) || null;
  } catch {
    return null;
  }
}

/**
 * Get cached set of synced IDs to prevent duplicate transactions
 */
function getSyncedIds(): Set<string> {
  try {
    const raw = storage.getString(KEY_SYNCED_IDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(String));
      }
    }
  } catch {
    // fallback
  }
  return new Set<string>();
}

/**
 * Save cached set of synced IDs (keep latest 500 IDs to avoid memory bloat)
 */
function saveSyncedIds(idsSet: Set<string>): void {
  try {
    const arr = Array.from(idsSet).slice(-500);
    storage.set(KEY_SYNCED_IDS, JSON.stringify(arr));
  } catch (err) {
    console.error('[SepayService] Failed to save synced IDs:', err);
  }
}

/**
 * Clean transaction note/content from bank codes and prefixes
 */
export function cleanSepayContent(raw: string): string {
  let note = (raw || '').trim();
  // Strip common transaction codes, e.g. "FT24012345678 - NGUYEN VAN A chuyen tien" -> "NGUYEN VAN A chuyen tien"
  note = note.replace(/^(?:ft|gd|ref|ct di|ct den|magd)[\s:\d\w]+\s*-\s*/i, '');
  note = note.replace(/\b[0-9a-zA-Z]{12,}\b/g, '').trim();
  return note || 'Giao dịch ngân hàng';
}

/**
 * Process a SePay Webhook Payload (HTTP POST webhook payload)
 * Can be called when receiving a webhook relay or when testing in UI.
 */
export function processSepayWebhookPayload(payload: Partial<SepayWebhookPayload>): {
  success: boolean;
  item?: PendingTransaction;
  reason?: string;
} {
  if (!payload || typeof payload !== 'object') {
    return { success: false, reason: 'Payload Webhook không hợp lệ.' };
  }

  const uniqueId = String(
    payload.id ||
      payload.referenceCode ||
      payload.reference_number ||
      `WEBHOOK_${Date.now()}`
  );

  const syncedIds = getSyncedIds();
  if (syncedIds.has(uniqueId)) {
    return { success: false, reason: 'Giao dịch này đã được ghi nhận trước đó (Khử trùng lặp).' };
  }

  // Determine amount & type
  const transferAmount = Number(payload.transferAmount || 0);
  const amountOut = Number(payload.amount_out || 0);
  const amountIn = Number(payload.amount_in || 0);

  let amount = 0;
  let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';

  if (payload.transferType === 'out') {
    amount = transferAmount > 0 ? transferAmount : amountOut;
    type = 'EXPENSE';
  } else if (payload.transferType === 'in') {
    amount = transferAmount > 0 ? transferAmount : amountIn;
    type = 'INCOME';
  } else if (amountOut > 0) {
    amount = amountOut;
    type = 'EXPENSE';
  } else if (amountIn > 0) {
    amount = amountIn;
    type = 'INCOME';
  } else if (transferAmount > 0) {
    amount = transferAmount;
    type = 'EXPENSE';
  }

  if (amount <= 0) {
    return { success: false, reason: 'Số tiền giao dịch không hợp lệ (<= 0).' };
  }

  const bankName = payload.gateway || payload.bank_brand_name || 'SePay';
  const rawContent = payload.content || payload.transaction_content || payload.description || '';
  const cleanNote = cleanSepayContent(rawContent);

  const suggestedCategoryId = suggestCategory(cleanNote, type);
  const isConfident = Boolean(suggestedCategoryId && !suggestedCategoryId.includes('other'));

  const created = pendingRepo.create({
    bankPackage: 'vn.sepay.app',
    bankName,
    amount,
    type,
    note: cleanNote,
    suggestedCategoryId,
    isConfident,
    rawContent: `${bankName}: ${rawContent}`,
  });

  // Mark ID as synced
  syncedIds.add(uniqueId);
  saveSyncedIds(syncedIds);
  storage.set(KEY_LAST_SYNCED_AT, new Date().toISOString());

  // Trigger store & Dynamic Island Banner immediately!
  const currentList = usePendingTransactionStore.getState().pendingList;
  usePendingTransactionStore.setState({
    pendingList: [created, ...currentList],
    activeBannerItem: created, // Instantly trigger Dynamic Island banner!
  });

  // Also notify in-app notification center & smart system notification
  useNotificationStore.getState().notifyPendingTransaction(created);
  sendSystemTransactionNotifications([created]).catch(() => {});

  return { success: true, item: created };
}

/**
 * Test SePay API connection with a given token
 */
export async function testSepayConnection(token: string): Promise<{ success: boolean; message: string; count?: number }> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { success: false, message: 'Vui lòng nhập API Token của SePay.' };
  }

  try {
    const response = await fetch('https://userapi.sepay.vn/v2/transactions?limit=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmed}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'API Token không chính xác hoặc đã hết hạn.' };
    }

    if (!response.ok) {
      return { success: false, message: `Lỗi kết nối máy chủ SePay (Mã lỗi: ${response.status}).` };
    }

    const data: SepayApiResponse = await response.json();
    return {
      success: true,
      message: 'Kết nối SePay thành công! Tài khoản ngân hàng đã sẵn sàng đồng bộ.',
      count: data.data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối tới SePay: ${err?.message || 'Vui lòng kiểm tra kết nối mạng.'}`,
    };
  }
}

/**
 * Synchronize latest transactions from SePay API v2
 */
export async function syncSepayTransactions(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
  newTransactions: PendingTransaction[];
}> {
  const token = getSepayToken();
  if (!token) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Chưa cấu hình SePay API Token.',
      newTransactions: [],
    };
  }

  try {
    const response = await fetch('https://userapi.sepay.vn/v2/transactions?limit=25', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        syncedCount: 0,
        message: `Lỗi tải giao dịch từ SePay (Mã lỗi ${response.status}).`,
        newTransactions: [],
      };
    }

    const json: SepayApiResponse = await response.json();
    const items = json.data || [];

    if (!Array.isArray(items) || items.length === 0) {
      storage.set(KEY_LAST_SYNCED_AT, new Date().toISOString());
      return {
        success: true,
        syncedCount: 0,
        message: 'Tài khoản chưa có giao dịch mới nào trên SePay.',
        newTransactions: [],
      };
    }

    const syncedIds = getSyncedIds();
    const newPendingItems: PendingTransaction[] = [];

    // Process from oldest to newest so newest ends up at top
    const sortedItems = [...items].reverse();

    for (const item of sortedItems) {
      const uniqueId = String(item.id || item.reference_number || item.referenceCode || '');
      if (!uniqueId || syncedIds.has(uniqueId)) {
        continue;
      }

      // Determine amount & type
      const amountOut = Number(item.amount_out || 0);
      const amountIn = Number(item.amount_in || 0);
      const transferAmount = Number(item.transferAmount || 0);

      let amount = 0;
      let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';

      if (amountOut > 0) {
        amount = amountOut;
        type = 'EXPENSE';
      } else if (amountIn > 0) {
        amount = amountIn;
        type = 'INCOME';
      } else if (transferAmount > 0) {
        amount = transferAmount;
        type = item.transferType === 'out' ? 'EXPENSE' : 'INCOME';
      }

      if (amount <= 0) continue;

      const bankName = item.bank_brand_name || item.gateway || 'Ngân hàng';
      const rawContent = item.transaction_content || item.content || '';
      const cleanNote = cleanSepayContent(rawContent);

      const suggestedCategoryId = suggestCategory(cleanNote, type);
      const isConfident = Boolean(suggestedCategoryId && !suggestedCategoryId.includes('other'));

      const created = pendingRepo.create({
        bankPackage: 'vn.sepay.app',
        bankName,
        amount,
        type,
        note: cleanNote,
        suggestedCategoryId,
        isConfident,
        rawContent: `${bankName}: ${rawContent}`,
      });

      syncedIds.add(uniqueId);
      newPendingItems.push(created);
    }

    saveSyncedIds(syncedIds);
    storage.set(KEY_LAST_SYNCED_AT, new Date().toISOString());

    if (newPendingItems.length > 0) {
      // Reload pending store list and set the newest one on Dynamic Island Banner!
      const currentList = usePendingTransactionStore.getState().pendingList;
      usePendingTransactionStore.setState({
        pendingList: [...newPendingItems.reverse(), ...currentList],
        activeBannerItem: newPendingItems[0], // Instantly pop Dynamic Island!
      });

      // Also notify in-app notification center
      for (const item of newPendingItems) {
        useNotificationStore.getState().notifyPendingTransaction(item);
      }
      // Smart system notification: suppressed if app is active, grouped if multiple items
      sendSystemTransactionNotifications(newPendingItems).catch(() => {});
    }

    return {
      success: true,
      syncedCount: newPendingItems.length,
      message:
        newPendingItems.length > 0
          ? `Đã đồng bộ thành công ${newPendingItems.length} giao dịch mới từ SePay!`
          : 'Tất cả giao dịch trên SePay đã được ghi chép đầy đủ.',
      newTransactions: newPendingItems,
    };
  } catch (err: any) {
    console.error('[SepayService] Sync failed:', err);
    return {
      success: false,
      syncedCount: 0,
      message: `Đồng bộ thất bại: ${err?.message || 'Lỗi mạng.'}`,
      newTransactions: [],
    };
  }
}
