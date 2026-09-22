import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TransactionWithDetails } from '../repositories/TransactionRepository';
import { format, parseISO } from 'date-fns';

function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case 'EXPENSE':
      return 'Chi tiêu';
    case 'INCOME':
      return 'Thu nhập';
    case 'TRANSFER':
      return 'Chuyển khoản';
    default:
      return type;
  }
}

export async function exportTransactionsToCSV(
  transactions: TransactionWithDetails[]
): Promise<void> {
  // CSV header
  const headers = ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ví', 'Ghi chú'];

  const rows = transactions.map(tx => {
    const date = format(parseISO(tx.date), 'dd/MM/yyyy HH:mm');
    const type = getTransactionTypeLabel(tx.type);
    const amount = tx.type === 'EXPENSE' ? -tx.amount : tx.amount;
    const note = (tx.note ?? '').replace(/"/g, '""');

    return [
      `"${date}"`,
      `"${type}"`,
      `"${tx.categoryName}"`,
      amount,
      `"${tx.walletName}"`,
      `"${note}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  // UTF-8 BOM for Excel to detect Vietnamese correctly
  const fullContent = '\uFEFF' + csvContent;

  const fileName = `expense_tracker_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  // Use the new expo-file-system v57 OOP API
  const file = new File(Paths.cache, fileName);
  await file.write(fullContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Xuất dữ liệu Expense Tracker',
    });
  }
}
