import { useSettingsStore } from '../stores/settingsStore';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'VND', name: 'Việt Nam Đồng (₫)', symbol: '₫', locale: 'vi-VN' },
  { code: 'USD', name: 'Đô la Mỹ ($)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€', locale: 'de-DE' },
  { code: 'JPY', name: 'Yên Nhật (¥)', symbol: '¥', locale: 'ja-JP' },
  { code: 'KRW', name: 'Won Hàn Quốc (₩)', symbol: '₩', locale: 'ko-KR' },
  { code: 'GBP', name: 'Bảng Anh (£)', symbol: '£', locale: 'en-GB' },
];

export function getCurrencyConfig(code?: string): CurrencyOption {
  const activeCode = code || useSettingsStore.getState().currency || 'VND';
  return (
    SUPPORTED_CURRENCIES.find(c => c.code === activeCode) || {
      code: activeCode,
      name: activeCode,
      symbol: activeCode,
      locale: 'vi-VN',
    }
  );
}

// Format integer to display string with chosen currency
export function formatCurrency(amount: number, currencyCode?: string): string {
  const config = getCurrencyConfig(currencyCode);
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: config.code === 'VND' || config.code === 'JPY' || config.code === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${config.symbol}`;
  }
}

// Alias for formatCurrency to preserve complete backward compatibility
export function formatVND(amount: number): string {
  return formatCurrency(amount);
}

// Format compact: 1250000 → "1,25M ₫"
export function formatCompact(amount: number, currencyCode?: string): string {
  const config = getCurrencyConfig(currencyCode);
  const symbol = config.symbol;

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B ${symbol}`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${symbol}`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ${symbol}`;
  }
  return `${amount} ${symbol}`;
}

// Parse display string to integer: "1.250.000" → 1250000
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// Format keypad input: "125000" → "125.000"
export function formatKeypadInput(digits: string): string {
  if (!digits) return '0';
  const num = parseInt(digits, 10);
  const config = getCurrencyConfig();
  return new Intl.NumberFormat(config.locale).format(num);
}
