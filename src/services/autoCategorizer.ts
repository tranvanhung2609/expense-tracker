import { getDatabase } from '../db/client';
import { toISOString } from '../utils/date';

/**
 * Remove Vietnamese accents/diacritics and convert to lowercase
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

/**
 * Built-in keyword patterns mapped to default category IDs
 */
const BUILT_IN_RULES: { categoryId: string; keywords: string[] }[] = [
  // Cà phê / Trà sữa
  {
    categoryId: 'cat_coffee',
    keywords: [
      'cafe', 'ca phe', 'coffee', 'highlands', 'phuc long', 'the coffee house', 
      'starbucks', 'katinat', 'tra sua', 'gong cha', 'koi the', 'mixue', 'tocotoco', 
      'cheese coffee', 'phê la', 'phe la'
    ],
  },
  // Ăn uống
  {
    categoryId: 'cat_food',
    keywords: [
      'an uong', 'com', 'pho', 'bun', 'mi quang', 'banh mi', 'pizza', 'burger', 
      'lotteria', 'kfc', 'jollibee', 'mcdonald', 'bbq', 'haidilao', 'kichi', 'gogi', 
      'quan an', 'nha hang', 'shopeefood', 'grabfood', 'befood', 'baemin', 'bep',
      'lau', 'nuong', 'an trua', 'an toi', 'an sang', 'lau nuong', 'buffet'
    ],
  },
  // Đi lại / Vận chuyển
  {
    categoryId: 'cat_transport',
    keywords: [
      'grab', 'be', 'xanh sm', 'gojek', 'uber', 'taxi', 'mai linh', 'vina sun', 
      'xang', 'petrolimex', 'pv oil', 'do xang', 'gui xe', 've xe', 'tram thu phi', 
      'bot', 've tau', 'may bay', 'vietjet', 'bamboo', 'vietnam airlines'
    ],
  },
  // Mua sắm / Siêu thị
  {
    categoryId: 'cat_shopping',
    keywords: [
      'circle k', 'gs25', 'winmart', 'vinmart', 'coopmart', 'big c', 'tops market', 
      'lotte mart', 'aeon', 'bach hoa xanh', 'shopee', 'lazada', 'tiki', 'tiktok shop', 
      'sieu thi', 'tap hoa', 'mua sam', 'shopping', 'uniqlo', 'zara', 'h&m'
    ],
  },
  // Hóa đơn / Điện nước / Net
  {
    categoryId: 'cat_bills',
    keywords: [
      'tien dien', 'evn', 'tien nuoc', 'sawaco', 'viettel', 'vnpt', 'fpt telecom', 
      'internet', 'cuoc dien thoai', 'nap tien dt', 'truyen hinh', 'phi chung cu', 
      'phi quan ly', 'hoa don'
    ],
  },
  // Nhà ở
  {
    categoryId: 'cat_housing',
    keywords: [
      'tien phong', 'tien nha', 'thue nha', 'dat coc', 'dien nuoc phong'
    ],
  },
  // Sức khỏe / Y tế
  {
    categoryId: 'cat_health',
    keywords: [
      'nha thuoc', 'long chau', 'pharmacity', 'an khang', 'benh vien', 'kham benh', 
      'phong kham', 'bac si', 'thuoc', 'xet nghiem', 'rang ham mat'
    ],
  },
  // Thể thao / Gym
  {
    categoryId: 'cat_gym',
    keywords: [
      'gym', 'fitness', 'yoga', 'california', 'the hinh', 'cau long', 'tennis', 
      'pickleball', 'da bong', 'san bong'
    ],
  },
  // Giải trí
  {
    categoryId: 'cat_entertainment',
    keywords: [
      'cgv', 'lotte cinema', 'galaxy cinema', 'bhd', 've xem phim', 'netflix', 
      'spotify', 'youtube premium', 'game', 'steam', 'playstation', 'karaoke'
    ],
  },
  // Lương (Thu nhập)
  {
    categoryId: 'cat_salary',
    keywords: [
      'luong', 'salary', 'payroll', 'chuyen luong', 'luong t', 'tra luong'
    ],
  },
  // Thưởng
  {
    categoryId: 'cat_bonus',
    keywords: [
      'thuong', 'bonus', 'kpi', 'hoa hong', 'thuong t'
    ],
  },
];

/**
 * Suggest a category based on the transaction note/memo
 */
export function suggestCategory(note: string, type: 'EXPENSE' | 'INCOME'): string {
  const normalized = normalizeVietnamese(note);
  if (!normalized) {
    return type === 'INCOME' ? 'cat_other_income' : 'cat_other_expense';
  }

  // 1. First check user-learned keywords in SQLite
  try {
    const db = getDatabase();
    const learnedRows = db.getAllSync<{ keyword: string; category_id: string }>(
      'SELECT keyword, category_id FROM category_keywords ORDER BY usage_count DESC'
    );

    for (const row of learnedRows) {
      if (normalized.includes(row.keyword)) {
        return row.category_id;
      }
    }
  } catch {
    // ignore database errors and fallback to built-in rules
  }

  // 2. Check built-in rule sets
  for (const rule of BUILT_IN_RULES) {
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        return rule.categoryId;
      }
    }
  }

  // Default fallback
  return type === 'INCOME' ? 'cat_other_income' : 'cat_other_expense';
}

/**
 * Learn a new keyword -> category mapping when user explicitly selects or modifies a category
 */
export function learnKeywordCategory(note: string, categoryId: string): void {
  const normalized = normalizeVietnamese(note);
  if (!normalized || normalized.length < 3) return;

  // Extract candidate keywords (words with 3+ chars)
  const words = normalized
    .split(/[\s,.-]+/)
    .filter(w => w.length >= 3 && !/^\d+$/.test(w));

  if (words.length === 0) return;

  try {
    const db = getDatabase();
    const now = toISOString();

    // Use the 2-word phrase if available, otherwise 1 word
    const candidateKeyword = words.slice(0, 2).join(' ');

    db.runSync(
      `INSERT INTO category_keywords (keyword, category_id, usage_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(keyword) DO UPDATE SET
         category_id = excluded.category_id,
         usage_count = usage_count + 1,
         updated_at = excluded.updated_at`,
      [candidateKeyword, categoryId, now]
    );
  } catch (error) {
    console.warn('Failed to learn keyword category:', error);
  }
}
