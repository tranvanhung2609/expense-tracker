import { suggestCategory } from './autoCategorizer';

export interface BankConfig {
  id: string;
  name: string;
  packageNames: string[];
  icon: string;
  color: string;
}

export const SUPPORTED_BANKS: BankConfig[] = [
  {
    id: 'vcb',
    name: 'Vietcombank',
    packageNames: ['com.VCB', 'com.vcb', 'com.vietcombank'],
    icon: 'bank',
    color: '#00843D',
  },
  {
    id: 'mbbank',
    name: 'MBBank',
    packageNames: ['com.mbmobile'],
    icon: 'bank-transfer',
    color: '#0033A0',
  },
  {
    id: 'techcombank',
    name: 'Techcombank',
    packageNames: ['com.techcombank.bb.app', 'vn.com.techcombank.bb.app'],
    icon: 'bank',
    color: '#EE1C25',
  },
  {
    id: 'tpbank',
    name: 'TPBank',
    packageNames: ['com.tpb.mb.gprsandroid'],
    icon: 'bank',
    color: '#8B217D',
  },
  {
    id: 'vpbank',
    name: 'VPBank',
    packageNames: ['com.vpb.vpbankneo', 'com.vpa.neo'],
    icon: 'bank',
    color: '#00B050',
  },
  {
    id: 'acb',
    name: 'ACB',
    packageNames: ['mobile.acb.com.vn'],
    icon: 'bank',
    color: '#0055A5',
  },
  {
    id: 'bidv',
    name: 'BIDV',
    packageNames: ['com.vnpay.bidv'],
    icon: 'bank',
    color: '#006666',
  },
  {
    id: 'vietinbank',
    name: 'VietinBank',
    packageNames: ['com.vietinbank.ipay'],
    icon: 'bank',
    color: '#005F9E',
  },
  {
    id: 'momo',
    name: 'MoMo',
    packageNames: ['com.mservice.momopay'],
    icon: 'wallet',
    color: '#A50064',
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    packageNames: ['vn.com.vng.zalopay'],
    icon: 'wallet',
    color: '#0068FF',
  },
];

export interface ParsedBankNotification {
  bankPackage: string;
  bankName: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  note: string;
  suggestedCategoryId: string;
  isConfident: boolean; // True nếu tìm thấy từ khóa rõ ràng, False nếu chỉ là mã QR / chuyển tiền mặc định
  rawContent: string;
}

/**
 * Identify bank from package name or text mentions
 */
export function identifyBank(packageName: string, text: string): BankConfig | null {
  const pkgLower = packageName.toLowerCase();
  for (const bank of SUPPORTED_BANKS) {
    if (bank.packageNames.some(p => pkgLower.includes(p.toLowerCase()))) {
      return bank;
    }
  }

  // Fallback: check if bank name is in title/text
  const textLower = text.toLowerCase();
  if (textLower.includes('ipay') || textLower.includes('vietinbank')) {
    return SUPPORTED_BANKS.find(b => b.id === 'vietinbank') || null;
  }

  for (const bank of SUPPORTED_BANKS) {
    if (textLower.includes(bank.name.toLowerCase()) || textLower.includes(bank.id)) {
      return bank;
    }
  }

  return null;
}

/**
 * Clean and normalize amount string to integer
 */
function cleanAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return parseInt(digits, 10) || 0;
}

/**
 * Clean up the memo/note text to strip technical codes, transaction IDs and bank suffixes
 * Examples from real notifications:
 * - "CT DI:626508379365 QR - Thanh toan hoa don; tai iPay" -> "Quét mã QR - Thanh toán"
 * - "127C609212LF4YNE 6264ICBVC2FYBVJE QR - TRAN VAN HUNG Chuyen tien; tai iPay" -> "Quét QR - Tran Van Hung"
 * - "6818358 - Tran Van Hung; tai iPay" -> "Chuyển tiền - Tran Van Hung"
 * - "CT DEN:127T2690Y1DRLPMN LUU HA PHUONG Chuyen tien" -> "Nhận từ Luu Ha Phuong"
 */
function cleanNote(raw: string, type: 'EXPENSE' | 'INCOME'): { cleanText: string; isConfident: boolean } {
  let note = raw;

  // 1. Remove balance suffixes "So du: ..." / "SD: ..."
  note = note.replace(/(?:so du hien tai|so du|sd|balance)[\s:]+[0-9.,]+\s*(?:vnd|vnđ|d|đ)?/i, '');

  // 2. Extract after "Noi dung:" or "ND:"
  const ndMatch = note.match(/(?:noi dung|nd|ly do|content)[\s:]+([^;]+)/i);
  if (ndMatch && ndMatch[1]) {
    note = ndMatch[1].trim();
  }

  // 3. Remove bank application tails like "; tai iPay", "; tai VIETINBANK", "; tai VCB"
  note = note.replace(/;\s*tai\s+[a-z0-9\s]+$/i, '');
  note = note.replace(/tai\s+(?:ipay|vietinbank|vcb|mbbank|techcombank)$/i, '');

  // 4. Remove technical prefixes like "CT DI:...", "CT DEN:...", "GD:...", "TK:..."
  note = note.replace(/^(?:ct\s+di|ct\s+den|gd|ref|ft|magd)[\s:]+[a-z0-9]+\s*/i, '');

  // 5. Remove long alphanumeric transaction/tracking codes (e.g. "127C609212LF4YNE", "6264ICBVC2FYBVJE")
  note = note.replace(/\b[0-9a-zA-Z]{10,}\b/g, '').trim();
  note = note.replace(/^[0-9]{5,}\s*-\s*/, '').trim(); // Remove leading numeric IDs like "6818358 - "

  // 6. Detect if it was a QR transaction
  const isQR = /\bqr\b/i.test(note) || /\bqr\b/i.test(raw);
  note = note.replace(/\bqr\b\s*-\s*/i, '').trim();
  note = note.replace(/\bqr\b/i, '').trim();

  // Normalize spaces
  note = note.replace(/\s+/g, ' ').trim();

  // Check if note is just default generic wording
  const isDefaultGeneric =
    !note ||
    /^(chuyen tien|chuyen khoan|thanh toan|thanh toan hoa don|transfer)$/i.test(note) ||
    /chuyen tien$/i.test(note) ||
    /transfer$/i.test(note);

  // If it's a person's name with "Chuyen tien" (e.g. "TRAN VAN HUNG Chuyen tien")
  const personMatch = note.match(/^([a-zA-Z\s]+?)\s+(?:chuyen tien|transfer)$/i);
  let cleanText = note;

  if (personMatch && personMatch[1]) {
    const personName = personMatch[1].trim();
    if (type === 'INCOME') {
      cleanText = `Nhận từ ${personName}`;
    } else {
      cleanText = isQR ? `Quét QR - ${personName}` : `Chuyển cho ${personName}`;
    }
  } else if (!cleanText || /thanh toan hoa don/i.test(cleanText)) {
    cleanText = isQR ? 'Quét mã QR thanh toán' : (type === 'INCOME' ? 'Nhận tiền chuyển khoản' : 'Chuyển khoản');
  } else if (isQR && !cleanText.toLowerCase().includes('qr')) {
    cleanText = `Quét QR - ${cleanText}`;
  }

  // Determine confidence: If it only has generic transfer text without specific store/service keywords, it's NOT confident
  const isConfident = !isDefaultGeneric && cleanText.length > 3 && !/^nhan tu|^chuyen cho|^quet ma qr/i.test(cleanText);

  return { cleanText, isConfident };
}

/**
 * Main parser function: extracts transaction info from notification title & body
 */
export function parseBankNotification(
  packageName: string,
  title: string,
  body: string
): ParsedBankNotification | null {
  const fullText = `${title || ''} ${body || ''}`.trim();
  if (!fullText) return null;

  const bank = identifyBank(packageName, fullText);
  const bankName = bank ? bank.name : 'Ngân hàng';
  const bankPackage = bank ? bank.packageNames[0] : packageName;

  let amount = 0;
  let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';

  // 1. Detect Expense Patterns:
  // "-150,000VND", "- 50.000 d", "thanh toan 50.000", "giao dich -120.000"
  const expenseMatch = fullText.match(/(?:-\s*|chi\s*|thanh toan\s*|chuyen\s*|rut\s*)([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,10})\s*(?:vnd|vnđ|d|đ)?/i);

  // 2. Detect Income Patterns:
  // "+15,000,000VND", "+ 500.000 d", "nhan 50.000", "nhan duoc 100.000"
  const incomeMatch = fullText.match(/(?:\+\s*|nhan\s*|cong\s*)([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,10})\s*(?:vnd|vnđ|d|đ)?/i);

  if (incomeMatch && !expenseMatch) {
    type = 'INCOME';
    amount = cleanAmount(incomeMatch[1]);
  } else if (expenseMatch) {
    type = 'EXPENSE';
    amount = cleanAmount(expenseMatch[1]);
  } else {
    // Generic amount match if neither +/- prefix is explicitly matched
    const genericMatch = fullText.match(/([0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:vnd|vnđ|d|đ)/i);
    if (genericMatch) {
      amount = cleanAmount(genericMatch[1]);
      // Infer type from text keywords
      if (/nhan|cong|salary|luong/i.test(fullText)) {
        type = 'INCOME';
      } else {
        type = 'EXPENSE';
      }
    }
  }

  // Must have a valid amount greater than 1,000 VND
  if (!amount || amount < 1000) {
    return null;
  }

  const { cleanText, isConfident } = cleanNote(body || title, type);
  // If not confident, suggest category 'cat_other_expense' or 'cat_other_income' to indicate user should categorize
  const suggestedCategoryId = isConfident ? suggestCategory(cleanText, type) : (type === 'INCOME' ? 'cat_other_income' : 'cat_food');

  return {
    bankPackage,
    bankName,
    amount,
    type,
    note: cleanText,
    suggestedCategoryId,
    isConfident,
    rawContent: fullText,
  };
}
